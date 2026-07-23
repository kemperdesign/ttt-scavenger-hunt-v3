"use client";

import { useState, useEffect } from "react";

export type TimePeriod = "morning" | "afternoon" | "evening" | "night";
export type MapTheme = "day" | "night";

function getPeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

function getMapTheme(period: TimePeriod): MapTheme {
  return period === "night" || period === "evening" ? "night" : "day";
}

interface TimeOfDay {
  period: TimePeriod;
  mapTheme: MapTheme;
  hour: number;
  greeting: string;
}

const GREETINGS: Record<TimePeriod, string> = {
  morning: "Good morning, explorer",
  afternoon: "Good afternoon, explorer",
  evening: "Good evening, explorer",
  night: "Night exploration mode",
};

export function useTimeOfDay(): TimeOfDay {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Update every minute
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const period = getPeriod(hour);

  return {
    period,
    mapTheme: getMapTheme(period),
    hour,
    greeting: GREETINGS[period],
  };
}
