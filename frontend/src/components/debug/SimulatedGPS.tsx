"use client";

import React, { useState } from "react";

const ST_AUG_STOPS = [
  { label: "Castillo de San Marcos", lat: 29.8981, lng: -81.3120 },
  { label: "Flagler College / Ponce de León", lat: 29.8898, lng: -81.3135 },
  { label: "St. Augustine City Gates", lat: 29.8937, lng: -81.3131 },
  { label: "Fort Mose Historic Site", lat: 29.9160, lng: -81.3208 },
  { label: "Lightner Museum / Alcazar", lat: 29.8902, lng: -81.3143 },
  { label: "St. Augustine Beach", lat: 29.8575, lng: -81.2656 },
  { label: "Oldest Wooden School House", lat: 29.8914, lng: -81.3113 },
  { label: "Fountain of Youth Park", lat: 29.9028, lng: -81.3169 },
];

interface SimulatedGPSProps {
  onLocationSet: (lat: number, lng: number) => void;
}

export function SimulatedGPS({ onLocationSet }: SimulatedGPSProps) {
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");

  if (process.env.NEXT_PUBLIC_ENABLE_DEBUG_TOOLS !== "true") return null;

  return (
    <details className="bg-amber-900/20 border border-amber-700 rounded-lg p-3 text-xs">
      <summary className="cursor-pointer font-semibold text-amber-400 select-none">
        🧭 Simulated GPS (dev mode)
      </summary>
      <div className="mt-3 space-y-2">
        <p className="text-slate-400">Teleport to a stop:</p>
        <div className="grid grid-cols-2 gap-1">
          {ST_AUG_STOPS.map((stop) => (
            <button
              key={stop.label}
              onClick={() => onLocationSet(stop.lat, stop.lng)}
              className="min-h-[36px] px-2 py-1 text-left rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              {stop.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            placeholder="Lat"
            value={customLat}
            onChange={(e) => setCustomLat(e.target.value)}
            className="flex-1 min-h-[36px] px-2 bg-slate-800 border border-slate-600 rounded text-slate-300 text-xs"
            aria-label="Custom latitude"
          />
          <input
            type="number"
            placeholder="Lng"
            value={customLng}
            onChange={(e) => setCustomLng(e.target.value)}
            className="flex-1 min-h-[36px] px-2 bg-slate-800 border border-slate-600 rounded text-slate-300 text-xs"
            aria-label="Custom longitude"
          />
          <button
            onClick={() => {
              const lat = parseFloat(customLat);
              const lng = parseFloat(customLng);
              if (!isNaN(lat) && !isNaN(lng)) onLocationSet(lat, lng);
            }}
            className="min-h-[36px] px-3 bg-amber-700 hover:bg-amber-600 text-white rounded text-xs"
          >
            Go
          </button>
        </div>
      </div>
    </details>
  );
}
