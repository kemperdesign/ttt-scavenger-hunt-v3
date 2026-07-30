"use client";

export const runtime = "edge";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getToken, getWineStamps, addWineStamp, removeWineStamp } from "@/lib/api";

const VENUES = [
  {
    id: "san_sebastian",
    name: "San Sebastian Winery",
    address: "157 King Street",
    description:
      "Florida's premier winery, producing muscadine and hybrid grape wines in a restored 1920s creosote plant. Free guided tours and tastings. The rooftop Jazz Bar opens at noon on weekends.",
    specialty: "Florida Muscadine & Sparkling",
    emoji: "🍷",
    tip: "Ask about the Blanc du Bois — the most food-friendly white they make.",
  },
  {
    id: "café_del_hidalgo",
    name: "Café del Hidalgo",
    address: "35 Hypolita Street",
    description:
      "A wine bar tucked into a historic building steps from the Cathedral. Long list of Spanish and South American wines, charcuterie, and cheese boards. One of the quieter spots in the historic district.",
    specialty: "Spanish & Argentine Wines",
    emoji: "🥂",
    tip: "Try a Malbec or a Spanish Tempranillo with the cheese plate.",
  },
  {
    id: "preserved",
    name: "Preserved Restaurant & Bar",
    address: "102 Bridge Street",
    description:
      "Preserved's wine program focuses on natural, biodynamic, and small-producer bottles — the kind of list that rewards exploration. Ask your server for a recommendation based on what you're eating.",
    specialty: "Natural & Biodynamic Wines",
    emoji: "🌿",
    tip: "The sommelier picks are always worth it — ask what's drinking well right now.",
  },
  {
    id: "collage",
    name: "Collage Restaurant",
    address: "60 Hypolita Street",
    description:
      "One of the deepest wine lists in St. Augustine. Collage has been curating its cellar for decades — old-world French and Italian bottles sit alongside Florida-grown selections.",
    specialty: "Classic French & Italian",
    emoji: "🎭",
    tip: "If you're celebrating, ask about their cellar selections — bottles that aren't on the printed list.",
  },
  {
    id: "casa_monica",
    name: "Casa Monica Hotel — Cobalt Lounge",
    address: "95 Cordova Street",
    description:
      "The bar inside the 1888 Casa Monica Hotel maintains a curated by-the-glass wine list alongside its famous cocktail and whiskey programs. The Moorish Revival setting is worth the visit on its own.",
    specialty: "Curated By-the-Glass",
    emoji: "🏨",
    tip: "Pair a glass of Cava with the charcuterie board for a perfect Spanish-colonial moment.",
  },
  {
    id: "white_lion",
    name: "White Lion Pub",
    address: "20 Cuna Street",
    description:
      "Florida's oldest public house (est. 1829) isn't a wine bar — but they keep a solid list of house pours, and there's something fun about drinking wine in a building that's been serving guests since before Florida was a state.",
    specialty: "House Pours & Pub Character",
    emoji: "🦁",
    tip: "Order a glass of red and ask the bartender how long they've worked here. Stories abound.",
  },
];

const LOCAL_KEY = "wine_passport_stamps";

type StampMap = Record<string, string>; // venue_id → date string

function loadLocal(): StampMap {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocal(stamps: StampMap) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(stamps));
  } catch {}
}

export default function WinePassportPage() {
  const [stamps, setStamps] = useState<StampMap>({});
  const [synced, setSynced] = useState(false); // true when loaded from server
  const [justStamped, setJustStamped] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = typeof window !== "undefined" && !!getToken();

  // Load stamps — from server if logged in, localStorage otherwise
  const loadStamps = useCallback(async () => {
    if (isLoggedIn) {
      try {
        const serverStamps = await getWineStamps();
        const map: StampMap = {};
        for (const s of serverStamps) {
          map[s.venue_id] = new Date(s.stamped_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          });
        }
        setStamps(map);
        setSynced(true);
      } catch {
        // Fall back to local if server fails
        setStamps(loadLocal());
      }
    } else {
      setStamps(loadLocal());
    }
    setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => { loadStamps(); }, [loadStamps]);

  const stamp = async (id: string) => {
    const now = new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
    const updated = { ...stamps, [id]: now };
    setStamps(updated);
    setJustStamped(id);
    setTimeout(() => setJustStamped(null), 1500);

    if (isLoggedIn) {
      try { await addWineStamp(id); } catch {}
    } else {
      saveLocal(updated);
    }
  };

  const unstamp = async (id: string) => {
    const updated = { ...stamps };
    delete updated[id];
    setStamps(updated);

    if (isLoggedIn) {
      try { await removeWineStamp(id); } catch {}
    } else {
      saveLocal(updated);
    }
  };

  const count = Object.keys(stamps).length;
  const total = VENUES.length;

  const badgeLevel =
    count === total ? { label: "Master Sommelier", emoji: "🏆", color: "text-amber-300" } :
    count >= 4      ? { label: "Wine Enthusiast",  emoji: "🥇", color: "text-yellow-400" } :
    count >= 2      ? { label: "Casual Sipper",    emoji: "🥈", color: "text-slate-300"  } :
                      null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="px-6 pt-10 pb-6">
        <Link
          href="/"
          className="text-amber-400 text-sm inline-flex items-center gap-1 mb-6 hover:text-amber-300 focus-visible:outline-amber-500"
        >
          ← Back
        </Link>

        {/* Passport cover */}
        <div className="bg-gradient-to-br from-amber-900/60 to-rose-900/40 border border-amber-800/50 rounded-2xl p-5 text-center">
          <div className="text-5xl mb-2" aria-hidden="true">🍷</div>
          <h1 className="text-2xl font-bold text-amber-100">Wine Passport</h1>
          <p className="text-amber-300/80 text-sm mt-1">St. Augustine, Florida</p>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-amber-300/60 mb-1.5">
              <span>Venues visited</span>
              <span>{count} / {total}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(count / total) * 100}%` }}
                role="progressbar"
                aria-valuenow={count}
                aria-valuemax={total}
              />
            </div>
          </div>

          {badgeLevel && (
            <div className={`mt-3 text-sm font-semibold ${badgeLevel.color}`}>
              {badgeLevel.emoji} {badgeLevel.label}
            </div>
          )}

          {/* Sync status */}
          <p className="text-xs mt-2 text-amber-300/40">
            {synced ? "✓ Synced to your account" : isLoggedIn ? "Syncing…" : "Saved on this device · Sign in to sync"}
          </p>
        </div>
      </header>

      <main className="px-4 pb-12 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading your passport…</div>
        ) : (
          <>
            {VENUES.map((v) => {
              const stamped = !!stamps[v.id];
              const isNew = justStamped === v.id;

              return (
                <article
                  key={v.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    stamped
                      ? "bg-amber-900/20 border-amber-700/50"
                      : "bg-slate-800 border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl leading-none" aria-hidden="true">{v.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-white font-bold text-base leading-snug">{v.name}</h2>
                        {stamped && (
                          <span className="text-amber-400 text-lg shrink-0" aria-label="Stamped">✦</span>
                        )}
                      </div>
                      <p className="text-amber-300/70 text-xs mt-0.5">{v.specialty}</p>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed mb-2">{v.description}</p>
                  <p className="text-slate-400 text-xs mb-3">
                    <span className="text-slate-500">📍</span> {v.address}
                  </p>
                  <div className="bg-slate-700/50 rounded-lg px-3 py-2 mb-4 text-xs text-slate-300 italic">
                    💡 {v.tip}
                  </div>

                  {stamped ? (
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 text-xs font-medium">
                        ✦ Visited {stamps[v.id]}
                      </span>
                      <button
                        onClick={() => unstamp(v.id)}
                        className="text-xs text-slate-500 hover:text-slate-300 underline focus-visible:outline-amber-500"
                      >
                        Remove stamp
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => stamp(v.id)}
                      className={`w-full min-h-[44px] rounded-xl text-sm font-semibold transition-all focus-visible:outline-amber-500 ${
                        isNew
                          ? "bg-amber-500 text-white scale-95"
                          : "bg-slate-700 hover:bg-amber-800/60 text-white border border-slate-600 hover:border-amber-700"
                      }`}
                    >
                      {isNew ? "✦ Stamped!" : "Stamp my passport"}
                    </button>
                  )}
                </article>
              );
            })}

            {count === total && (
              <div className="bg-amber-900/30 border border-amber-700 rounded-2xl p-5 text-center">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-amber-300 font-bold text-lg">Passport Complete!</p>
                <p className="text-amber-300/70 text-sm mt-1">
                  You've visited every wine venue in St. Augustine. Master Sommelier status earned.
                </p>
              </div>
            )}

            {!isLoggedIn && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-sm">
                  <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 underline focus-visible:outline-amber-500">
                    Sign in
                  </Link>
                  {" "}to sync your passport across devices.
                </p>
              </div>
            )}

            <p className="text-slate-600 text-xs text-center pt-2">
              Hours and menus may vary — always confirm before visiting.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
