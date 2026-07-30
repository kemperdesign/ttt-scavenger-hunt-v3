"use client";

import React, { useState } from "react";
import { createCheckout, activateCorporateCode } from "@/lib/api";

interface PaymentWallProps {
  sessionId: string;
  adventureTitle: string;
  onUnlocked: () => void;
}

export function PaymentWall({ sessionId, adventureTitle, onUnlocked }: PaymentWallProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCorpForm, setShowCorpForm] = useState(false);
  const [corpCode, setCorpCode] = useState("");

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

  async function handleCorporate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await activateCorporateCode(sessionId, corpCode.trim().toUpperCase());
      onUnlocked();
    } catch {
      setError("Invalid corporate code. Check with your group organizer.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-800">
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏛️</div>
          <h1 className="text-xl font-bold text-amber-400">Unlock Full Adventure</h1>
          <p className="text-slate-400 text-sm mt-1">{adventureTitle}</p>
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
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-xl text-lg transition-colors"
        >
          {loading ? "Loading…" : "Continue — $7.99"}
        </button>

        <p className="text-center text-xs text-slate-500 mt-2">
          One-time purchase · Secure checkout via Square
        </p>

        {error && (
          <p className="mt-3 text-center text-sm text-red-400">{error}</p>
        )}

        {/* Corporate code */}
        {!showCorpForm ? (
          <button
            onClick={() => setShowCorpForm(true)}
            className="mt-6 w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Have a group or corporate code?
          </button>
        ) : (
          <form onSubmit={handleCorporate} className="mt-5 space-y-2">
            <input
              type="text"
              value={corpCode}
              onChange={(e) => setCorpCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              maxLength={20}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-center tracking-widest text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !corpCode.trim()}
              className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-medium py-2 rounded-lg text-sm transition-colors"
            >
              {loading ? "Checking…" : "Activate"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
