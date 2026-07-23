"use client";

import React, { useEffect, useRef } from "react";

interface BadgeEarnedProps {
  name: string;
  description?: string;
  iconEmoji?: string;
  onDismiss: () => void;
}

export function BadgeEarned({ name, description, iconEmoji = "🏅", onDismiss }: BadgeEarnedProps) {
  const dismissRef = useRef<HTMLButtonElement>(null);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Focus the dismiss button on mount
  useEffect(() => {
    dismissRef.current?.focus();
  }, []);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={`Badge earned: ${name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onDismiss}
    >
      <div
        className="bg-slate-900 border border-amber-600 rounded-2xl p-8 max-w-sm mx-4 text-center animate-bounce-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="text-7xl mb-4 animate-spin-slow"
          aria-hidden="true"
        >
          {iconEmoji}
        </div>
        <p className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-1" aria-hidden="true">
          Badge Earned!
        </p>
        <h2 className="text-white text-2xl font-bold mb-2">{name}</h2>
        {description && (
          <p className="text-slate-400 text-sm mb-6">{description}</p>
        )}
        <button
          ref={dismissRef}
          onClick={onDismiss}
          className="min-h-[44px] px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-colors focus-visible:outline-amber-300"
          aria-label="Dismiss badge notification"
        >
          Awesome!
        </button>
      </div>
      {/* Live region for screen readers */}
      <div aria-live="assertive" className="sr-only">
        {`Congratulations! You earned the ${name} badge.`}
      </div>
    </div>
  );
}
