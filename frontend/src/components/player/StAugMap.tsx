"use client";

import React, { useEffect, useRef, useState } from "react";

const LANDMARKS = [
  { name: "Castillo de San Marcos", lat: 29.8981, lng: -81.3125, emoji: "🏰", category: "fort" },
  { name: "St. Augustine Lighthouse", lat: 29.8819, lng: -81.2966, emoji: "🗼", category: "landmark" },
  { name: "Flagler College (Ponce de León Hotel)", lat: 29.8943, lng: -81.3140, emoji: "🎨", category: "landmark" },
  { name: "Lightner Museum (Alcazar Hotel)", lat: 29.8950, lng: -81.3133, emoji: "🏺", category: "museum" },
  { name: "San Sebastian Winery", lat: 29.8972, lng: -81.3158, emoji: "🍷", category: "food_drink" },
  { name: "Fountain of Youth", lat: 29.9060, lng: -81.3103, emoji: "⛲", category: "landmark" },
  { name: "Fort Matanzas", lat: 29.7127, lng: -81.2362, emoji: "⚓", category: "fort" },
  { name: "St. Augustine Alligator Farm", lat: 29.8771, lng: -81.2948, emoji: "🐊", category: "attraction" },
  { name: "Mission Nombre de Dios", lat: 29.9038, lng: -81.3083, emoji: "✝️", category: "landmark" },
  { name: "Zorayda Castle", lat: 29.8953, lng: -81.3132, emoji: "🕌", category: "landmark" },
  { name: "Cathedral Basilica", lat: 29.8958, lng: -81.3118, emoji: "⛪", category: "landmark" },
  { name: "St. Augustine Distillery", lat: 29.8967, lng: -81.3148, emoji: "🥃", category: "food_drink" },
  { name: "Casa Monica Hotel", lat: 29.8975, lng: -81.3142, emoji: "🏨", category: "landmark" },
  { name: "Bridge of Lions", lat: 29.8941, lng: -81.3087, emoji: "🦁", category: "landmark" },
  { name: "City Gate", lat: 29.8995, lng: -81.3128, emoji: "🚪", category: "landmark" },
  { name: "Ripley's Believe It or Not (Warden Castle)", lat: 29.8961, lng: -81.3138, emoji: "🎪", category: "attraction" },
  { name: "Milltop Tavern", lat: 29.8990, lng: -81.3134, emoji: "🍺", category: "food_drink" },
  { name: "Ice Plant Bar", lat: 29.8958, lng: -81.3148, emoji: "🧊", category: "food_drink" },
  { name: "Visitors Information Center", lat: 29.8996, lng: -81.3122, emoji: "ℹ️", category: "info" },
];

const CATEGORY_COLORS: Record<string, string> = {
  fort: "#ef4444",
  landmark: "#f59e0b",
  museum: "#8b5cf6",
  food_drink: "#10b981",
  attraction: "#3b82f6",
  info: "#6b7280",
};

export function StAugMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [selected, setSelected] = useState<(typeof LANDMARKS)[0] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("maplibre-gl").then((ml) => {
      const maplibre = ml.default ?? ml;

      // Inject maplibre CSS once
      if (!document.getElementById("maplibre-css")) {
        const link = document.createElement("link");
        link.id = "maplibre-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css";
        document.head.appendChild(link);
      }

      const map = new (maplibre as typeof import("maplibre-gl")).Map({
        container: containerRef.current!,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center: [-81.3145, 29.8960],
        zoom: 14,
      });

      mapRef.current = map;

      map.on("load", () => {
        LANDMARKS.forEach((lm) => {
          const el = document.createElement("div");
          el.style.cssText = `
            width: 32px; height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            background: ${CATEGORY_COLORS[lm.category] ?? "#f59e0b"};
            border: 2px solid white;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          `;
          const inner = document.createElement("div");
          inner.style.cssText = "transform: rotate(45deg); font-size: 14px; line-height: 1;";
          inner.textContent = lm.emoji;
          el.appendChild(inner);

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelected(lm);
          });

          new (maplibre as typeof import("maplibre-gl")).Marker({ element: el })
            .setLngLat([lm.lng, lm.lat])
            .addTo(map);
        });
      });

      map.on("error", () => setError(true));
    }).catch(() => setError(true));

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove(): void }).remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm text-center p-4">
        Map failed to load. Check your connection and try again.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Selected landmark card */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-700 rounded-xl p-4 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white font-semibold text-sm leading-snug">
                {selected.emoji} {selected.name}
              </p>
              <p className="text-slate-400 text-xs mt-0.5 capitalize">
                {selected.category.replace("_", " & ")}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-slate-500 hover:text-white text-lg leading-none shrink-0 focus-visible:outline-amber-500"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
