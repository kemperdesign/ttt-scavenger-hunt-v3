"""
Admin audit log viewer.
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.auth.deps import get_current_admin

router = APIRouter()


class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: dict
    ip_address: Optional[str]
    created_at: datetime


@router.get("", response_model=List[AuditLogOut])
async def list_audit_logs(
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    q = select(AuditLog).order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
    if action:
        q = q.where(AuditLog.action == action)
    result = await db.execute(q)
    logs = result.scalars().all()
    return [
        AuditLogOut(
            id=str(log.id),
            user_id=str(log.user_id) if log.user_id else None,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            details=log.details or {},
            ip_address=log.ip_address,
            created_at=log.created_at,
        )
        for log in logs
    ]
