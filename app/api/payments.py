"""
Square payment integration.

Flow:
  1. Player completes stop 1.
  2. Frontend calls POST /payments/checkout with session_id.
  3. Backend creates a Square payment link and returns the URL.
  4. Player completes Square checkout (redirected back to the app).
  5. Square calls POST /payments/square-webhook with payment confirmation.
  6. Backend flips session.payment_status = "paid".
  7. Player is now unblocked for stop 2+.

Corporate bypass:
  POST /payments/corporate-activate with a pre-issued corporate_code
  (created by admin in the DB) flips payment_status = "corporate" without
  touching Square.
"""

import hashlib
import hmac
import uuid
import httpx
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.session import GameSession
from app.models.adventure import Adventure
from app.models.user import User
from app.auth.deps import get_optional_user
from app.core.config import settings

router = APIRouter()

# ── Square API base URLs ───────────────────────────────────────────────────────

def _square_base() -> str:
    if settings.SQUARE_ENVIRONMENT == "production":
        return "https://connect.squareup.com"
    return "https://connect.squareupsandbox.com"


def _square_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.SQUARE_ACCESS_TOKEN}",
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
    }


# ── Checkout ───────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    session_id: str
    redirect_url: str  # where Square sends the player after payment


class CheckoutResponse(BaseModel):
    payment_link_url: str
    order_id: str


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    body: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    if not settings.SQUARE_ACCESS_TOKEN:
        raise HTTPException(status_code=503, detail="Payment processing is not configured")

    sess_result = await db.execute(
        select(GameSession).where(GameSession.id == uuid.UUID(body.session_id))
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.payment_status in ("paid", "corporate"):
        raise HTTPException(status_code=400, detail="Session is already unlocked")

    # Load adventure name for the line item description
    adv_result = await db.execute(select(Adventure).where(Adventure.id == session.adventure_id))
    adventure = adv_result.scalar_one_or_none()
    adventure_name = adventure.title if adventure else "TimeQuest Adventure"

    idempotency_key = str(uuid.uuid4())

    payload = {
        "idempotency_key": idempotency_key,
        "order": {
            "order": {
                "location_id": settings.SQUARE_LOCATION_ID,
                "line_items": [
                    {
                        "name": adventure_name,
                        "quantity": "1",
                        "base_price_money": {
                            "amount": settings.ADVENTURE_PRICE_CENTS,
                            "currency": "USD",
                        },
                        "note": f"session:{session.id}",
                    }
                ],
                "metadata": {
                    "session_id": str(session.id),
                    "user_id": str(current_user.id),
                },
            }
        },
        "checkout_options": {
            "redirect_url": body.redirect_url,
            "ask_for_shipping_address": False,
        },
        "pre_populated_data": {
            "buyer_email": current_user.email if current_user else "",
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_square_base()}/v2/online-checkout/payment-links",
            json=payload,
            headers=_square_headers(),
            timeout=10.0,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Square error: {resp.text}")

    data = resp.json()
    link = data.get("payment_link", {})
    return CheckoutResponse(
        payment_link_url=link.get("url", ""),
        order_id=link.get("order_id", ""),
    )


# ── Square webhook ─────────────────────────────────────────────────────────────

def _verify_square_signature(body_bytes: bytes, signature: str, url: str) -> bool:
    """Square HMAC-SHA256 signature verification."""
    key = settings.SQUARE_WEBHOOK_SIGNATURE_KEY.encode()
    message = (url + body_bytes.decode()).encode()
    expected = hmac.new(key, message, hashlib.sha256).digest()
    import base64
    expected_b64 = base64.b64encode(expected).decode()
    return hmac.compare_digest(expected_b64, signature)


@router.post("/square-webhook", include_in_schema=False)
async def square_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_square_hmacsha256_signature: str = Header(None),
):
    body_bytes = await request.body()

    # Verify signature in production
    if settings.SQUARE_ENVIRONMENT == "production" and settings.SQUARE_WEBHOOK_SIGNATURE_KEY:
        url = str(request.url)
        if not _verify_square_signature(body_bytes, x_square_hmacsha256_signature or "", url):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

    import json
    try:
        event = json.loads(body_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = event.get("type", "")

    # We care about completed payments only
    if event_type not in ("payment.completed", "payment.updated"):
        return {"received": True}

    payment = event.get("data", {}).get("object", {}).get("payment", {})
    if payment.get("status") != "COMPLETED":
        return {"received": True}

    # Extract session_id from order metadata
    order_id = payment.get("order_id")
    if not order_id:
        return {"received": True}

    # Fetch order from Square to get metadata
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_square_base()}/v2/orders/{order_id}",
            headers=_square_headers(),
            timeout=10.0,
        )

    if resp.status_code != 200:
        return {"received": True}

    order_data = resp.json().get("order", {})
    session_id_str = order_data.get("metadata", {}).get("session_id")
    if not session_id_str:
        # Fall back to line item note
        for item in order_data.get("line_items", []):
            note = item.get("note", "")
            if note.startswith("session:"):
                session_id_str = note.split(":", 1)[1]
                break

    if not session_id_str:
        return {"received": True}

    try:
        session_id = uuid.UUID(session_id_str)
    except ValueError:
        return {"received": True}

    sess_result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = sess_result.scalar_one_or_none()
    if session and session.payment_status == "free":
        session.payment_status = "paid"
        session.square_payment_id = payment.get("id")
        await db.flush()

    return {"received": True}


# ── Corporate bypass ───────────────────────────────────────────────────────────

class CorporateActivateRequest(BaseModel):
    session_id: str
    corporate_code: str


@router.post("/corporate-activate")
async def corporate_activate(
    body: CorporateActivateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Activate a session using a pre-issued corporate or promo code.
    No auth required — the session_id is the secret.
    Codes live in CORPORATE_CODES env var as a comma-separated list.
    """
    valid_codes = [c.strip() for c in settings.CORPORATE_CODES.split(",") if c.strip()]
    if body.corporate_code not in valid_codes:
        raise HTTPException(status_code=403, detail="Invalid corporate code")

    sess_result = await db.execute(
        select(GameSession).where(GameSession.id == uuid.UUID(body.session_id))
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.payment_status = "corporate"
    await db.flush()
    return {"status": "activated"}
