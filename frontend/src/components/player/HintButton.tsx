"use client";

import React, { useState } from "react";
import { useHint } from "@/lib/api";

interface HintButtonProps {
  challengeId: string;
  sessionId: string;
  pointPenalty?: number;
  onHintUsed?: (hint: string, pointsDeducted: number) => void;
}

export function HintButton({
  challengeId,
  sessionId,
  pointPenalty = 5,
  onHintUsed,
}: HintButtonProps) {
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await useHint(challengeId, sessionId);
      setHint(result.hint_text);
      onHintUsed?.(result.hint_text, result.points_deducted);
    } catch {
      setError("Could not load hint. Try again.");
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  };

  if (hint) {
    return (
      <div
        className="p-3 rounded-lg bg-amber-900/30 border border-amber-700 text-amber-200 text-sm"
        role="alert"
        aria-label="Hint revealed"
      >
        <p className="font-semibold mb-1">💡 Hint</p>
        <p>{hint}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleRequest}
        disabled={loading}
        aria-label={
          confirmed
            ? `Confirm use hint — costs ${pointPenalty} points`
            : `Use hint — costs ${pointPenalty} points`
        }
        className={`w-full min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-amber-500 ${
          confirmed
            ? "bg-amber-600 text-white hover:bg-amber-500"
            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading
          ? "Loading hint…"
          : confirmed
          ? `Confirm (−${pointPenalty} pts)`
          : `💡 Use hint (−${pointPenalty} pts)`}
      </button>
      {confirmed && (
        <p className="text-xs text-slate-400 text-center" role="status">
          Tap again to confirm. This will deduct {pointPenalty} points.
        </p>
      )}
      {error && (
        <p className="text-xs text-red-400" role="alert">{error}</p>
      )}
    </div>
  );
}
