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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-800">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="text-slate-500 hover:text-slate-300 text-sm mb-6 inline-flex items-center gap-1 focus-visible:outline-amber-500"
        >
          ← Back
        </button>

        {/* Icon */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏛️</div>
          <h1 className="text-xl font-bold text-amber-400">Unlock Adventure</h1>
          <p className="text-slate-400 text-sm mt-1">{adventureTitle}</p>
        </div>

        {/* Promo code — shown first and prominently */}
        <div className="mb-6">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            Have a promo or group code?
          </p>
          <form onSubmit={handlePromo} className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              maxLength={20}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-center tracking-widest text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 min-h-[44px]"
              aria-label="Promo or group code"
            />
            <button
              type="submit"
              disabled={promoLoading || !promoCode.trim()}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-medium px-4 rounded-lg text-sm transition-colors min-h-[44px] shrink-0 focus-visible:outline-amber-500"
            >
              {promoLoading ? "…" : "Apply"}
            </button>
          </form>
          {promoError && (
            <p className="mt-1.5 text-xs text-red-400">{promoError}</p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-slate-600 text-xs">or purchase</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* What you get */}
        <ul className="space-y-2 mb-6">
          {[
            "All 5 historical stops",
            "AI historian conversations",
            "Trivia challenges + bonus puzzles",
            "Achievement badges",
            "Final decode challenge",
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-amber-400 text-xs">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        {/* Price + CTA */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-xl text-lg transition-colors focus-visible:outline-amber-500 min-h-[52px]"
        >
          {loading ? "Loading…" : "Continue — $7.99"}
        </button>

        <p className="text-center text-xs text-slate-500 mt-2">
          One-time purchase · Secure checkout via Square
        </p>

        {error && (
          <p className="mt-3 text-center text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
