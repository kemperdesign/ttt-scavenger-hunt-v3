"use client";

import React, { useState } from "react";
import Link from "next/link";

type Adventure = {
  id: string;
  title: string;
  short_description?: string;
  difficulty?: string;
  estimated_duration_minutes?: number;
  total_points?: number;
  cover_image_url?: string;
  is_featured?: boolean;
  tags?: string[];
};

const FILTERS = ["All", "Scavenger Hunts", "Bar Crawls", "Art Walks", "History"];

export function HomeClient({ adventures }: { adventures: Adventure[] }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = adventures.filter((a) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Scavenger Hunts") return !a.tags?.includes("bar") && !a.tags?.includes("art");
    if (activeFilter === "Bar Crawls") return a.tags?.some(t => t.toLowerCase().includes("bar") || t.toLowerCase().includes("beer") || t.toLowerCase().includes("bourbon"));
    if (activeFilter === "Art Walks") return a.tags?.some(t => t.toLowerCase().includes("art"));
    if (activeFilter === "History") return a.tags?.some(t => t.toLowerCase().includes("history") || t.toLowerCase().includes("historic"));
    return true;
  });

  const featured = adventures.filter((a) => a.is_featured);
  const display = filtered.length > 0 ? filtered : adventures;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)", paddingBottom: "80px" }}>

      {/* ── Search bar header ── */}
      <div className="px-4 pt-12 pb-3 flex items-center gap-3">
        <div
          className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--color-muted)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <span className="text-sm" style={{ color: "var(--color-muted)" }}>Find a scavenger hunt</span>
        </div>
        <Link
          href="/wine-passport"
          className="flex items-center justify-center w-11 h-11 rounded-2xl"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          aria-label="Wine Passport"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--color-teal)" }}>
            <path d="M20 7H4l1 10h14l1-10z"/><path d="M12 17v4"/><path d="M8 21h8"/>
          </svg>
        </Link>
      </div>

      {/* ── Hero banner ── */}
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden relative" style={{ minHeight: "200px" }}>
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #1B4A4A 0%, #2A6E6E 40%, #C1531A 100%)",
          }}
        />
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20" style={{ background: "#F4EEE1" }} />
          <div className="absolute bottom-4 -left-6 w-28 h-28 rounded-full opacity-10" style={{ background: "#F4EEE1" }} />
        </div>
        <div className="relative p-6 flex flex-col justify-between" style={{ minHeight: "200px" }}>
          <div>
            <div className="text-3xl mb-2">🏰</div>
            <h2 className="font-display text-white font-bold text-xl leading-tight mb-1">
              Start Your Adventure
            </h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>
              Have a group or promo code? Redeem it to unlock any tour instantly.
            </p>
          </div>
          <Link
            href={adventures[0] ? `/adventure/${adventures[0].id}/start` : "/"}
            className="self-start px-6 py-3 rounded-2xl font-semibold text-sm min-h-[44px] flex items-center"
            style={{ background: "var(--color-surface)", color: "var(--color-terra)" }}
          >
            Join / Redeem Code
          </Link>
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors min-h-[36px]"
              style={
                activeFilter === f
                  ? { background: "var(--color-terra)", color: "#fff", border: "2px solid var(--color-terra)" }
                  : { background: "transparent", color: "var(--color-teal)", border: "2px solid var(--color-teal)" }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured Activities ── */}
      {featured.length > 0 && activeFilter === "All" && (
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-xl" style={{ color: "var(--color-text)" }}>
              Featured Activities
            </h2>
          </div>
          <p className="text-xs mb-3 flex items-center gap-1" style={{ color: "var(--color-muted)" }}>
            <span>📍</span> St. Augustine, FL
          </p>
          <div className="space-y-3">
            {featured.map((a) => (
              <AdventureCard key={a.id} adventure={a} featured />
            ))}
          </div>
        </section>
      )}

      {/* ── All adventures ── */}
      <section className="px-4">
        <h2 className="font-display font-bold text-xl mb-3" style={{ color: "var(--color-text)" }}>
          {activeFilter === "All" ? "All Adventures" : activeFilter}
        </h2>
        {display.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: "var(--color-muted)" }}>No adventures available yet.</p>
        ) : (
          <div className="space-y-3">
            {display.filter(a => activeFilter !== "All" || !a.is_featured).map((a) => (
              <AdventureCard key={a.id} adventure={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AdventureCard({ adventure, featured }: { adventure: Adventure; featured?: boolean }) {
  const difficultyColor =
    adventure.difficulty === "easy" ? "#1A6B42" :
    adventure.difficulty === "hard" ? "#8B1A1A" :
    "var(--color-terra-dark, #8A3512)";

  return (
    <Link
      href={`/adventure/${adventure.id}/start`}
      className="block rounded-3xl overflow-hidden border"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      aria-label={adventure.title}
    >
      {/* Photo / gradient hero */}
      <div className="relative" style={{ height: "160px" }}>
        {adventure.cover_image_url ? (
          <img src={adventure.cover_image_url} alt="" aria-hidden className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: featured
                ? "linear-gradient(135deg, #1B4A4A, #2A6E6E)"
                : "linear-gradient(135deg, #5B5044, #8A7D6B)",
            }}
          />
        )}
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {featured && (
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: "var(--color-terra)" }}>
              ⭐ Top Rated
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "rgba(0,0,0,0.45)" }}>
            🧭 Scavenger Hunt
          </span>
        </div>
        {/* Distance / duration pill */}
        {adventure.estimated_duration_minutes && (
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "rgba(0,0,0,0.5)" }}>
              ~{adventure.estimated_duration_minutes} min
            </span>
          </div>
        )}
        {/* View Map pill */}
        <div className="absolute bottom-3 right-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: "var(--color-terra)", color: "#fff" }}>
            🗺 View Map
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-base leading-tight flex-1" style={{ color: "var(--color-text)" }}>
            {adventure.title}
          </h3>
          {adventure.difficulty && (
            <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--color-terra-tint)", color: difficultyColor }}>
              {adventure.difficulty}
            </span>
          )}
        </div>
        {adventure.short_description && (
          <p className="text-sm mt-1 leading-relaxed line-clamp-2" style={{ color: "var(--color-body)" }}>
            {adventure.short_description}
          </p>
        )}
        {adventure.total_points && (
          <p className="text-xs mt-2" style={{ color: "var(--color-muted)" }}>
            ⭐ {adventure.total_points} pts
          </p>
        )}
      </div>
    </Link>
  );
}
