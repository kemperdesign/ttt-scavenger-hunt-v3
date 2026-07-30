"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HamburgerMenu } from "@/components/player/HamburgerMenu";

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

const FILTERS = [
  { id: "All", label: "All", icon: null },
  { id: "Scavenger Hunts", label: "Scaveng\ner Hunts", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M16 8l-3.5 8.5L9 16l3.5-8.5 3.5-8.5z"/></svg> },
  { id: "Bar Crawls", label: "Bar\nCrawls", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M8 22h8"/><path d="M12 18v4"/><path d="M2.2 4.1L12 18l9.8-13.9a2 2 0 0 0-.2-2.7l-1.5-1.3a2 2 0 0 0-2.6.2L12 5.5 6.3.3a2 2 0 0 0-2.6-.2l-1.5 1.3a2 2 0 0 0-.2 2.7z"/></svg> },
  { id: "Art Walks", label: "Art\nWalks", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.76 0 5-2.24 5-5 0-1.25-.45-2.4-1.21-3.29-.16-.18-.29-.44-.29-.71 0-.55.45-1 1-1h1.5C20.76 12 23 9.76 23 7c0-2.76-2.24-5-5-5h-6z"/><circle cx="6.5" cy="11.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="12.5" cy="5.5" r="1.5"/><circle cx="16.5" cy="8.5" r="1.5"/></svg> },
  { id: "Ghost Tours", label: "Ghost\nTours", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg> },
  { id: "Zoo Hunts", label: "Zoo\nHunts", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="9" r="1.5"/><path d="M12 16c2.5 0 4-1.5 4-1.5v-2h-8v2s1.5 1.5 4 1.5z"/></svg> },
  { id: "Outdoor Escape Room", label: "Outdoor\nEscape Room", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { id: "Audio Tours", label: "Audio\nTours", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg> },
  { id: "In-Home", label: "In-Home", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> }
];

export function HomeClient({ adventures }: { adventures: Adventure[] }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = adventures.filter((a) => {
    if (activeFilter === "All") return true;
    
    const tgs = (a.tags || []).map(t => t.toLowerCase());
    const hasTag = (tag: string) => tgs.some(t => t.includes(tag));

    switch (activeFilter) {
      case "Scavenger Hunts":
        return hasTag("scavenger") || (!hasTag("bar") && !hasTag("art") && !hasTag("ghost") && !hasTag("zoo") && !hasTag("escape") && !hasTag("audio") && !hasTag("home"));
      case "Bar Crawls":
        return hasTag("bar") || hasTag("beer") || hasTag("pub") || hasTag("drink") || hasTag("wine");
      case "Art Walks":
        return hasTag("art");
      case "Ghost Tours":
        return hasTag("ghost") || hasTag("haunt") || hasTag("spooky");
      case "Zoo Hunts":
        return hasTag("zoo") || hasTag("animal");
      case "Outdoor Escape Room":
        return hasTag("escape");
      case "Audio Tours":
        return hasTag("audio") || hasTag("podcast");
      case "In-Home":
        return hasTag("home") || hasTag("indoor") || hasTag("virtual");
      default:
        return false;
    }
  });

  const featured = adventures.filter((a) => a.is_featured);
  const display = filtered.length > 0 ? filtered : adventures;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F3ED] text-[#2c3327]" style={{ paddingBottom: "100px" }}>
      
      {/* ── Top Hero Banner (Full Bleed) ── */}
      <div className="relative h-[340px] w-full shrink-0">
        <Image
          src="/images/onboarding_bg.jpg"
          alt="Hero"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />
        
        {/* Top Navbar */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex items-center gap-3 z-10">
          <div className="flex-1 bg-white/20 backdrop-blur-md border border-white/40 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span className="text-sm font-medium opacity-90">Find an adventure</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-white font-bold text-xl drop-shadow-md pr-1">
            <span>0</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="opacity-90 mt-0.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          </div>

          <HamburgerMenu />
        </div>

        {/* Hero Card */}
        <div className="absolute bottom-6 left-4 right-4 bg-white/30 backdrop-blur-lg border border-white/40 rounded-3xl p-5 shadow-lg text-white">
          <div className="flex items-start gap-3">
            <div className="text-5xl -mt-1 drop-shadow-lg">🦊</div>
            <div>
              <h2 className="font-extrabold text-[22px] leading-tight mb-1 text-white shadow-sm drop-shadow-md">
                Redeem a Code or Join a Hunt
              </h2>
              <p className="text-[13px] leading-snug mb-4 drop-shadow-md font-semibold text-white/95">
                Scan a QR code or redeem your code to join a hunt and begin your adventure!
              </p>
            </div>
          </div>
          <Link
            href={adventures[0] ? `/adventure/${adventures[0].id}/start` : "/"}
            className="block w-full text-center bg-[#FDFBF7] text-[#2c3327] font-bold py-3.5 rounded-xl text-sm shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-white transition-colors"
          >
            Join/Redeem
          </Link>
          
          {/* Pagination dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d2753b] shadow-sm" />
            <div className="w-1.5 h-1.5 rounded-full border border-white/60" />
            <div className="w-1.5 h-1.5 rounded-full border border-white/60" />
            <div className="w-1.5 h-1.5 rounded-full border border-white/60" />
          </div>
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div className="px-4 py-6">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`shrink-0 flex flex-col ${f.id === "All" ? "items-center justify-center p-3" : "items-start p-3"} min-w-[80px] rounded-xl border-[1.5px] transition-colors`}
                style={{
                  background: isActive ? "#FDFBF7" : "transparent",
                  borderColor: "#11263c",
                  color: "#11263c",
                  opacity: isActive ? 1 : 0.8,
                }}
              >
                {f.icon && <div className="mb-1">{f.icon}</div>}
                <span className="text-[13px] font-bold leading-tight whitespace-pre-wrap text-left">
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Featured Activities ── */}
      {featured.length > 0 && activeFilter === "All" && (
        <section className="px-4 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-[22px] tracking-tight text-[#11263c]">
              Featured Activities
            </h2>
            <div className="flex items-center gap-1 text-[13px] font-bold text-[#11263c]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
              </svg>
              • 25 Miles
            </div>
          </div>
          <div className="space-y-8">
            {featured.map((a) => (
              <AdventureCard key={a.id} adventure={a} />
            ))}
          </div>
        </section>
      )}

      {/* ── All adventures ── */}
      <section className="px-4 pb-10">
        <h2 className="font-extrabold text-[22px] tracking-tight text-[#11263c] mb-4">
          {activeFilter === "All" ? "All Adventures" : activeFilter}
        </h2>
        {display.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-500 font-medium">No adventures available yet.</p>
        ) : (
          <div className="space-y-8">
            {display.filter(a => activeFilter !== "All" || !a.is_featured).map((a) => (
              <AdventureCard key={a.id} adventure={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AdventureCard({ adventure }: { adventure: Adventure }) {
  // Determine fallback image based on tags
  const tags = (adventure.tags || []).map(t => t.toLowerCase());
  let fallbackImage = "/images/onboarding_bg.jpg"; // Default
  
  if (tags.some(t => t.includes("bar") || t.includes("beer"))) {
    fallbackImage = "/images/onboarding_bg_3.jpg";
  } else if (tags.some(t => t.includes("scavenger"))) {
    fallbackImage = "/images/onboarding_bg_2.jpg";
  } else if (tags.some(t => t.includes("art") || t.includes("history"))) {
    fallbackImage = "/images/onboarding_bg.jpg"; // Art/history looks good with bg 1
  }

  const coverImage = adventure.cover_image_url || fallbackImage;

  return (
    <div className="relative pb-4">
      <Link
        href={`/adventure/${adventure.id}/start`}
        className="block relative rounded-2xl overflow-hidden shadow-sm h-[200px] mb-3"
        style={{ background: "#E5E0DA" }}
      >
        {/* Background Image */}
        <img src={coverImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Top right heart icon */}
        <div className="absolute top-4 right-4 z-10 text-white/90 hover:text-white drop-shadow-lg">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>

        {/* Image Pagination Dots (mockup placeholder) */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm" />
        </div>
      </Link>

      {/* View Map Pill Overlay (overlapping the bottom of the image) */}
      <div className="absolute top-[182px] left-1/2 -translate-x-1/2 z-20">
        <Link href={`/map?adventure=${adventure.id}`}>
          <span className="flex items-center justify-center w-12 h-12 rounded-full font-bold text-sm shadow-[0_4px_12px_rgba(210,117,59,0.4)] transition-transform hover:scale-105" style={{ background: "#d2753b", color: "#fff" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
            </svg>
          </span>
        </Link>
      </div>

      {/* Details text below the image */}
      <div className="px-1 mt-3">
        <h3 className="font-extrabold text-[#11263c] text-xl leading-tight mb-1">
          {adventure.title}
        </h3>
        <p className="text-[#1B4A4A] text-xs font-bold mb-2">
          3.7 miles away
        </p>
        {adventure.short_description && (
          <p className="text-[#2c3327] text-[13px] leading-snug mb-3">
            {adventure.short_description}
          </p>
        )}
        
        {/* Metadata row */}
        <div className="flex items-center justify-between text-[#11263c] text-sm font-bold">
          <div className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
              <path d="M4 10v11h6v-6h4v6h6V10l-8-6-8 6z"/>
            </svg>
            <span>Saint Augustine</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-90">
              <circle cx="12" cy="12" r="10"/><path d="M16 8l-3.5 8.5L9 16l3.5-8.5 3.5-8.5z"/>
            </svg>
            <span>Scavenger Hunt</span>
          </div>
          <div className="flex items-center gap-1 text-[#d2753b]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="text-[#11263c]">5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
