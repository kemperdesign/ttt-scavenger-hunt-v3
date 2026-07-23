"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type FontSize = "normal" | "large" | "x-large";
export type Contrast = "normal" | "high";

interface A11yState {
  fontSize: FontSize;
  highContrast: Contrast;
  reduceMotion: boolean;
  setFontSize: (s: FontSize) => void;
  setHighContrast: (c: Contrast) => void;
  setReduceMotion: (v: boolean) => void;
}

const STORAGE_KEY = "tq_a11y";

const defaults: Pick<A11yState, "fontSize" | "highContrast" | "reduceMotion"> = {
  fontSize: "normal",
  highContrast: "normal",
  reduceMotion: false,
};

const AccessibilityContext = createContext<A11yState | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>(defaults.fontSize);
  const [highContrast, setHighContrastState] = useState<Contrast>(defaults.highContrast);
  const [reduceMotion, setReduceMotionState] = useState<boolean>(defaults.reduceMotion);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.fontSize) setFontSizeState(parsed.fontSize);
        if (parsed.highContrast) setHighContrastState(parsed.highContrast);
        if (typeof parsed.reduceMotion === "boolean") setReduceMotionState(parsed.reduceMotion);
      }
    } catch {}

    // Respect OS-level prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setReduceMotionState(true);
    const handler = (e: MediaQueryListEvent) => setReduceMotionState(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Persist and apply to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-size", fontSize);
    root.setAttribute("data-contrast", highContrast);
    root.setAttribute("data-reduce-motion", reduceMotion ? "true" : "false");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontSize, highContrast, reduceMotion }));
    } catch {}
  }, [fontSize, highContrast, reduceMotion]);

  const setFontSize = useCallback((s: FontSize) => setFontSizeState(s), []);
  const setHighContrast = useCallback((c: Contrast) => setHighContrastState(c), []);
  const setReduceMotion = useCallback((v: boolean) => setReduceMotionState(v), []);

  return (
    <AccessibilityContext.Provider
      value={{ fontSize, highContrast, reduceMotion, setFontSize, setHighContrast, setReduceMotion }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): A11yState {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
