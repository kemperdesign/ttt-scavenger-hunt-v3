import React from "react";
import Link from "next/link";
import { listAdventures } from "@/lib/api";
import { AppFooter } from "@/components/player/AppFooter";
import { TimeOfDayBanner } from "@/components/player/TimeOfDayBanner";

// Fetch fresh data on every request rather than baking it in at build time —
// the Cloudflare Pages build sandbox can't reach the Linode backend anyway,
// so a static/ISR snapshot would permanently show "no adventures".
export const runtime = "edge";
export const dynamic = "force-dynamic";

async function getAdventures() {
  try {
    return await listAdventures();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const adventures = await getAdventures();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <TimeOfDayBanner />

      <header className="px-6 pt-12 pb-8 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🏰</div>
        <h1 className="text-white font-bold text-3xl leading-tight">
          St. Augustine<br />
          <span className="text-amber-400">TimeQuest</span>
        </h1>
        <p className="text-slate-400 mt-3 text-lg max-w-xs mx-auto leading-relaxed">
          Explore 450+ years of history through location-based adventures
        </p>
      </header>

      <main id="main-content" className="flex-1 px-4 pb-8">
        {/* Quick-access utility buttons — row 1 */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Link
            href="/featured"
            className="flex flex-col items-center gap-1.5 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-800/50 rounded-2xl py-4 text-center transition-colors focus-visible:outline-amber-500"
            aria-label="Featured things to do in St. Augustine"
          >
            <span className="text-2xl" aria-hidden="true">⭐</span>
            <span className="text-amber-200 text-xs font-medium leading-tight">Featured<br />Things to Do</span>
          </Link>
          <Link
            href="/map"
            className="flex flex-col items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl py-4 text-center transition-colors focus-visible:outline-amber-500"
            aria-label="Interactive map of St. Augustine"
          >
            <span className="text-2xl" aria-hidden="true">🗺️</span>
            <span className="text-white text-xs font-medium leading-tight">Map of<br />St. Augustine</span>
          </Link>
        </div>
        {/* Wine Passport — full-width */}
        <div className="mb-3">
          <Link
            href="/wine-passport"
            className="flex items-center gap-3 bg-amber-900/25 hover:bg-amber-900/40 border border-amber-800/40 rounded-2xl px-5 py-4 transition-colors focus-visible:outline-amber-500"
            aria-label="Wine Passport — collect stamps at local wine venues"
          >
            <span className="text-2xl" aria-hidden="true">🍷</span>
            <div>
              <p className="text-amber-100 text-sm font-semibold">Wine Passport</p>
              <p className="text-amber-300/70 text-xs">Visit local wine venues &amp; collect stamps</p>
            </div>
            <span className="ml-auto text-amber-700 text-lg" aria-hidden="true">›</span>
          </Link>
        </div>
        {/* Restaurants — full-width */}
        <div className="mb-3">
          <Link
            href="/restaurants"
            className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl px-5 py-4 transition-colors focus-visible:outline-amber-500"
            aria-label="Restaurants in St. Augustine"
          >
            <span className="text-2xl" aria-hidden="true">🍽️</span>
            <div>
              <p className="text-white text-sm font-semibold">Restaurants</p>
              <p className="text-slate-400 text-xs">Seafood, dive bars, fine dining & more</p>
            </div>
            <span className="ml-auto text-slate-600 text-lg" aria-hidden="true">›</span>
          </Link>
        </div>
        {/* Quick-access utility buttons — row 2 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/parking"
            className="flex flex-col items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl py-4 text-center transition-colors focus-visible:outline-amber-500"
            aria-label="Parking and shuttle information"
          >
            <span className="text-2xl" aria-hidden="true">🅿️</span>
            <span className="text-white text-xs font-medium leading-tight">Parking &amp;<br />Shuttles</span>
          </Link>
          <Link
            href="/restrooms"
            className="flex flex-col items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl py-4 text-center transition-colors focus-visible:outline-amber-500"
            aria-label="Public restroom locations"
          >
            <span className="text-2xl" aria-hidden="true">🚻</span>
            <span className="text-white text-xs font-medium leading-tight">Public<br />Restrooms</span>
          </Link>
        </div>
        {adventures.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No adventures available yet. Check back soon!</p>
          </div>
        ) : (
          <section aria-label="Available adventures">
            <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">
              Choose Your Adventure
            </h2>
            <ul className="space-y-4" role="list">
              {adventures.map((adventure) => (
                <li key={adventure.id} role="listitem">
                  <Link
                    href={`/adventure/${adventure.id}/start`}
                    className="block bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-700 rounded-2xl p-5 transition-all focus-visible:outline-amber-500"
                    aria-label={`${adventure.title} — ${adventure.difficulty} difficulty, approximately ${adventure.estimated_duration_minutes} minutes`}
                  >
                    {adventure.cover_image_url && (
                      <img
                        src={adventure.cover_image_url}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-36 object-cover rounded-xl mb-4"
                      />
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-bold text-lg leading-tight flex-1">
                        {adventure.title}
                      </h3>
                      <span
                        className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                          adventure.difficulty === "easy"
                            ? "bg-green-900/50 text-green-400"
                            : adventure.difficulty === "hard"
                            ? "bg-red-900/50 text-red-400"
                            : "bg-amber-900/50 text-amber-400"
                        }`}
                      >
                        {adventure.difficulty}
                      </span>
                    </div>
                    {adventure.short_description && (
                      <p className="text-slate-400 text-sm leading-relaxed mb-3">
                        {adventure.short_description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>⏱ ~{adventure.estimated_duration_minutes} min</span>
                      <span>⭐ {adventure.total_points} pts</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
