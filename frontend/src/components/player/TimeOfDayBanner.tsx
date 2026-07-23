"use client";

import React from "react";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";

const PERIOD_ICONS: Record<string, string> = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌆",
  night: "🌙",
};

export function TimeOfDayBanner() {
  const { period, greeting } = useTimeOfDay();

  return (
    <>
      {/* Decorative color bar at top of screen */}
      <div
        className="tod-banner"
        data-period={period}
        aria-hidden="true"
      />
      {/* Screen-reader announcement */}
      <span className="sr-only">{greeting}</span>
    </>
  );
}

export function TimeOfDayIndicator() {
  const { period, greeting } = useTimeOfDay();

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-slate-400"
      aria-label={greeting}
    >
      <span aria-hidden="true">{PERIOD_ICONS[period]}</span>
      <span className="capitalize">{period}</span>
    </div>
  );
}
