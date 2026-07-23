"use client";

import React, { useRef, useEffect } from "react";
import { useAccessibility, FontSize, Contrast } from "@/context/AccessibilityContext";

interface AccessibilityPanelProps {
  onClose: () => void;
}

export function AccessibilityPanel({ onClose }: AccessibilityPanelProps) {
  const { fontSize, highContrast, reduceMotion, setFontSize, setHighContrast, setReduceMotion } =
    useAccessibility();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Accessibility settings"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl w-full max-w-md p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">Accessibility</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close accessibility panel"
            className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white p-2 rounded-lg focus-visible:outline-amber-500"
          >
            ✕
          </button>
        </div>

        {/* Font size */}
        <fieldset>
          <legend className="text-sm font-semibold text-slate-300 mb-3">Text size</legend>
          <div className="flex gap-2">
            {(["normal", "large", "x-large"] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                aria-pressed={fontSize === size}
                className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium transition-colors focus-visible:outline-amber-500 ${
                  fontSize === size
                    ? "bg-amber-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
              </button>
            ))}
          </div>
        </fieldset>

        {/* High contrast */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">High contrast</span>
          <button
            role="switch"
            aria-checked={highContrast === "high"}
            onClick={() => setHighContrast(highContrast === "high" ? "normal" : "high")}
            className={`relative min-h-[44px] w-14 rounded-full transition-colors focus-visible:outline-amber-500 ${
              highContrast === "high" ? "bg-amber-600" : "bg-slate-700"
            }`}
          >
            <span className="sr-only">
              High contrast {highContrast === "high" ? "on" : "off"}
            </span>
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                highContrast === "high" ? "translate-x-7" : "translate-x-1"
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Reduce motion */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">Reduce motion</span>
          <button
            role="switch"
            aria-checked={reduceMotion}
            onClick={() => setReduceMotion(!reduceMotion)}
            className={`relative min-h-[44px] w-14 rounded-full transition-colors focus-visible:outline-amber-500 ${
              reduceMotion ? "bg-amber-600" : "bg-slate-700"
            }`}
          >
            <span className="sr-only">
              Reduce motion {reduceMotion ? "on" : "off"}
            </span>
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                reduceMotion ? "translate-x-7" : "translate-x-1"
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
