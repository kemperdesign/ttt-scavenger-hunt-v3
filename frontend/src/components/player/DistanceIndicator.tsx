"use client";

import React from "react";

interface DistanceIndicatorProps {
  distanceMeters: number | null;
  requiredRadiusMeters: number;
  isWithinRange: boolean;
  bearingDegrees?: number | null;
}

const COMPASS_POINTS = [
  "north", "northeast", "east", "southeast",
  "south", "southwest", "west", "northwest",
];

function bearingToCompass(deg: number): string {
  const index = Math.round(deg / 45) % 8;
  return COMPASS_POINTS[index];
}

export function DistanceIndicator({
  distanceMeters,
  requiredRadiusMeters,
  isWithinRange,
  bearingDegrees,
}: DistanceIndicatorProps) {
  if (distanceMeters === null) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-400 text-sm"
        aria-live="polite"
        aria-label="Acquiring GPS location"
      >
        <span className="animate-pulse">📍</span>
        <span>Acquiring location…</span>
      </div>
    );
  }

  const pct = Math.min(100, ((requiredRadiusMeters / Math.max(distanceMeters, 1)) * 100));
  const color = isWithinRange
    ? "bg-green-500"
    : distanceMeters < requiredRadiusMeters * 3
    ? "bg-amber-500"
    : "bg-slate-600";

  const displayDist =
    distanceMeters < 1000
      ? `${Math.round(distanceMeters)}m`
      : `${(distanceMeters / 1000).toFixed(1)}km`;

  const direction =
    !isWithinRange && bearingDegrees != null ? bearingToCompass(bearingDegrees) : null;

  const label = isWithinRange
    ? "You're at the location!"
    : direction
    ? `${displayDist} away — head ${direction}`
    : `${displayDist} away — keep moving`;

  return (
    <div
      className="space-y-1"
      aria-live="polite"
      aria-label={label}
      role="status"
    >
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          {isWithinRange ? (
            "✅ You're here!"
          ) : (
            <>
              📍 {displayDist} away
              {direction && bearingDegrees != null && (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300"
                    style={{ transform: `rotate(${bearingDegrees}deg)` }}
                  >
                    ↑
                  </span>
                  <span className="capitalize">head {direction}</span>
                </>
              )}
            </>
          )}
        </span>
        <span>{Math.round(requiredRadiusMeters)}m range</span>
      </div>
      <div
        className="w-full h-2 bg-slate-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Proximity: ${Math.round(pct)}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
