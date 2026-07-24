"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Stop } from "@/lib/api";

interface AdventureMapProps {
  stops: Stop[];
  currentStopIndex: number;
  playerLat?: number;
  playerLng?: number;
  mapTheme?: "day" | "night";
  completedStopIds?: string[];
  className?: string;
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";

// MapTiler style URLs
const MAP_STYLES = {
  day: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`,
  night: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`,
};

export default function AdventureMap({
  stops,
  currentStopIndex,
  playerLat,
  playerLng,
  mapTheme = "day",
  completedStopIds = [],
  className = "",
}: AdventureMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerMarkerRef = useRef<any>(null);

  const currentStop = stops[currentStopIndex];

  const initMap = useCallback(async () => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!MAPTILER_KEY) {
      console.warn("NEXT_PUBLIC_MAPTILER_KEY is not set — map will not load");
      return;
    }

    const maplibregl = (await import("maplibre-gl")).default;
    await import("maplibre-gl/dist/maplibre-gl.css");

    const centerLng = currentStop?.lng ?? stops[0]?.lng ?? -81.312;
    const centerLat = currentStop?.lat ?? stops[0]?.lat ?? 29.898;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[mapTheme],
      center: [centerLng, centerLat],
      zoom: 15,
      attributionControl: {},
    });

    mapRef.current = map;

    map.on("load", () => {
      // Add stop markers
      stops.forEach((stop, idx) => {
        const isCompleted = completedStopIds.includes(stop.id);
        const isCurrent = idx === currentStopIndex;

        const el = document.createElement("div");
        el.className = "stop-marker";
        el.setAttribute("aria-label", `Stop ${idx + 1}: ${stop.title}`);
        el.setAttribute("role", "img");
        el.style.cssText = `
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          background-color: ${isCompleted ? "#22c55e" : isCurrent ? "#f59e0b" : "#64748b"};
          color: white;
          transition: transform 0.2s;
        `;
        el.textContent = isCompleted ? "✓" : String(idx + 1);

        if (isCurrent) {
          el.style.transform = "scale(1.2)";
          el.style.zIndex = "10";
        }

        // Tooltip on click
        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: true,
          maxWidth: "200px",
        }).setHTML(`
          <div style="font-family: sans-serif; padding: 4px;">
            <strong style="font-size: 13px;">${stop.title}</strong>
            ${isCompleted ? '<br><span style="color:#22c55e; font-size:12px;">✓ Completed</span>' : ""}
            ${isCurrent ? '<br><span style="color:#f59e0b; font-size:12px;">← Current stop</span>' : ""}
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Draw route line through stops
      if (stops.length > 1) {
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: stops.map((s) => [s.lng, s.lat]),
            },
          },
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#f59e0b",
            "line-width": 2,
            "line-dasharray": [2, 2],
            "line-opacity": 0.6,
          },
        });
      }
    });

    return map;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Init map once
  useEffect(() => {
    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
        playerMarkerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update map style when theme changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(MAP_STYLES[mapTheme]);
  }, [mapTheme]);

  // Update player location marker
  useEffect(() => {
    if (!mapRef.current || playerLat === undefined || playerLng === undefined)
      return;

    const updatePlayerMarker = async () => {
      const maplibregl = (await import("maplibre-gl")).default;

      if (playerMarkerRef.current) {
        playerMarkerRef.current.setLngLat([playerLng, playerLat]);
      } else {
        const el = document.createElement("div");
        el.setAttribute("aria-label", "Your location");
        el.setAttribute("role", "img");
        el.style.cssText = `
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
        `;

        playerMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([playerLng, playerLat])
          .addTo(mapRef.current);
      }
    };

    updatePlayerMarker();
  }, [playerLat, playerLng]);

  // Pan to current stop when it changes
  useEffect(() => {
    if (!mapRef.current || !currentStop) return;
    mapRef.current.easeTo({
      center: [currentStop.lng, currentStop.lat],
      zoom: 15.5,
      duration: 800,
    });
  }, [currentStopIndex, currentStop]);

  if (!MAPTILER_KEY) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-800 rounded-lg ${className}`}
        role="img"
        aria-label="Map unavailable — MapTiler API key not configured"
      >
        <div className="text-center text-slate-400 p-6">
          <p className="text-2xl mb-2">🗺️</p>
          <p className="text-sm">
            Map requires{" "}
            <code className="text-amber-400">NEXT_PUBLIC_MAPTILER_KEY</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={`rounded-lg overflow-hidden ${className}`}
      data-map-theme={mapTheme}
      aria-label={`Adventure map showing ${stops.length} stops`}
      role="application"
    />
  );
}
