"use client";

import React from "react";

interface Badge {
  id: string;
  name: string;
  icon_emoji?: string;
  earned_at?: string;
}

interface BadgeTrayProps {
  badges: Badge[];
  compact?: boolean;
}

export function BadgeTray({ badges, compact = false }: BadgeTrayProps) {
  if (badges.length === 0) return null;

  return (
    <section aria-label="Badges earned">
      {!compact && (
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Badges
        </h2>
      )}
      <div className="flex flex-wrap gap-2" role="list">
        {badges.map((badge) => (
          <div
            key={badge.id}
            role="listitem"
            title={badge.name}
            aria-label={badge.name}
            className={`flex items-center gap-1.5 rounded-full border border-amber-700/50 bg-amber-900/20 ${
              compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
            }`}
          >
            <span aria-hidden="true">{badge.icon_emoji ?? "🏅"}</span>
            {!compact && <span className="text-amber-300 font-medium">{badge.name}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
