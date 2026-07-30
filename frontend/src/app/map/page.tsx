"use client";

export const runtime = "edge";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const StAugMap = dynamic(
  () => import("@/components/player/StAugMap").then((m) => m.StAugMap),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-slate-500 text-sm">Loading map…</div> }
);

const LEGEND = [
  { label: "Forts", color: "#ef4444" },
  { label: "Landmarks", color: "#f59e0b" },
  { label: "Museums", color: "#8b5cf6" },
  { label: "Food & Drink", color: "#10b981" },
  { label: "Attractions", color: "#3b82f6" },
];

export default function MapPage() {
  const [showLegend, setShowLegend] = useState(true);

  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <Link
          href="/"
          className="text-amber-400 text-sm inline-flex items-center gap-1 hover:text-amber-300 focus-visible:outline-amber-500"
        >
          ← Back
        </Link>
        <h1 className="text-white font-bold text-base">🗺️ St. Augustine</h1>
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="text-slate-400 text-xs hover:text-white focus-visible:outline-amber-500"
          aria-label={showLegend ? "Hide legend" : "Show legend"}
        >
          {showLegend ? "Hide key" : "Show key"}
        </button>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex gap-3 px-4 py-2 overflow-x-auto shrink-0 border-b border-slate-800">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 shrink-0">
              <div
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ background: l.color }}
                aria-hidden="true"
              />
              <span className="text-slate-400 text-xs whitespace-nowrap">{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Map fills remaining space */}
      <div className="flex-1 min-h-0">
        <StAugMap />
      </div>
    </div>
  );
}
