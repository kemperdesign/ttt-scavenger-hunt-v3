"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createCheckout, activateCorporateCode } from "@/lib/api";

interface PaymentWallProps {
  sessionId: string;
  adventureTitle: string;
  onUnlocked: () => void;
}

export function PaymentWall({ sessionId, adventureTitle, onUnlocked }: PaymentWallProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const redirectUrl = `${window.location.origin}/adventure/${window.location.pathname.split("/")[2]}/start?paid=1`;
      const { payment_link_url } = await createCheckout(sessionId, redirectUrl);
      window.location.href = payment_link_url;
    } catch {
      setError("Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  async function handlePromo(e: React.FormEvent) {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      await activateCorporateCode(sessionId, code);
      onUnlocked();
    } catch {
      setPromoError("Invalid promo code. Check the code and try again.");
      setPromoLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--color-bg)" }}>
      <div
        className="max-w-sm w-full rounded-2xl p-8 shadow-lg border"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm mb-6 inline-flex items-center gap-1"
          style={{ color: "var(--color-muted)" }}
        >
          ← Back
        </button>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏛️</div>
          <h1 className="font-display text-xl font-bold" style={{ color: "var(--color-terra)" }}>Unlock Adventure</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-body)" }}>{adventureTitle}</p>
        </div>

        {/* Promo code */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted)" }}>
            Have a promo or group code?
          </p>
          <form onSubmit={handlePromo} className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              maxLength={20}
              className="flex-1 rounded-lg px-3 py-2 text-sm text-center tracking-widest border focus:outline-none min-h-[44px]"
              style={{
                background: "var(--color-bg)",
                borderColor: "var(--color-border2)",
                color: "var(--color-terra)",
              }}
              aria-label="Promo or group code"
            />
            <button
              type="submit"
              disabled={promoLoading || !promoCode.trim()}
              className="font-semibold px-4 rounded-lg text-sm transition-colors min-h-[44px] shrink-0 border disabled:opacity-50"
              style={{
                background: "var(--color-bg)",
                borderColor: "var(--color-border2)",
                color: "var(--color-teal)",
              }}
            >
              {promoLoading ? "…" : "Apply"}
            </button>
          </form>
          {promoError && (
            <p className="mt-1.5 text-xs" style={{ color: "var(--color-terra)" }}>{promoError}</p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          <span className="text-xs" style={{ color: "var(--color-muted)" }}>or purchase</span>
          <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {[
            "All 5 historical stops",
            "AI historian conversations",
            "Trivia challenges + bonus puzzles",
            "Achievement badges",
            "Final decode challenge",
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-body)" }}>
              <span style={{ color: "var(--color-terra)" }} className="text-xs">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full font-bold py-3 rounded-xl text-lg transition-colors min-h-[52px] text-white disabled:opacity-50"
          style={{ background: "var(--color-terra)" }}
        >
          {loading ? "Loading…" : "Continue — $7.99"}
        </button>

        <p className="text-center text-xs mt-2" style={{ color: "var(--color-muted)" }}>
          One-time purchase · Secure checkout via Square
        </p>

        {error && (
          <p className="mt-3 text-center text-sm" style={{ color: "var(--color-terra)" }}>{error}</p>
        )}
      </div>
    </div>
  );
}
