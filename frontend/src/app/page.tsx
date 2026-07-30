import React from "react";
import Link from "next/link";
import { listAdventures } from "@/lib/api";
import { AppFooter } from "@/components/player/AppFooter";
import { TimeOfDayBanner } from "@/components/player/TimeOfDayBanner";

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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      <TimeOfDayBanner />

      {/* Header */}
      <header className="px-6 pt-12 pb-8 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🏰</div>
        <h1 className="font-display font-bold text-3xl leading-tight" style={{ color: "var(--color-text)" }}>
          St. Augustine<br />
          <span style={{ color: "var(--color-terra)" }}>TimeQuest</span>
        </h1>
        <p className="mt-3 text-base max-w-xs mx-auto leading-relaxed" style={{ color: "var(--color-body)" }}>
          Explore 450+ years of history through location-based adventures
        </p>
      </header>

      <main id="main-content" className="flex-1 px-4 pb-8">
        {/* Quick-access row 1 */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Link
            href="/featured"
            className="flex flex-col items-center gap-1.5 rounded-2xl py-4 text-center transition-colors border"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            aria-label="Featured things to do in St. Augustine"
          >
            <span className="text-2xl" aria-hidden="true">⭐</span>
            <span className="text-xs font-semibold leading-tight" style={{ color: "var(--color-teal)" }}>Featured<br />Things to Do</span>
          </Link>
          <Link
            href="/map"
            className="flex flex-col items-center gap-1.5 rounded-2xl py-4 text-center transition-colors border"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            aria-label="Interactive map of St. Augustine"
          >
            <span className="text-2xl" aria-hidden="true">🗺️</span>
            <span className="text-xs font-semibold leading-tight" style={{ color: "var(--color-teal)" }}>Map of<br />St. Augustine</span>
          </Link>
        </div>

        {/* Wine Passport */}
        <div className="mb-3">
          <Link
            href="/wine-passport"
            className="flex items-center gap-3 rounded-2xl px-5 py-4 transition-colors border"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            aria-label="Wine Passport — collect stamps at local wine venues"
          >
            <span className="text-2xl" aria-hidden="true">🍷</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Wine Passport</p>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>Visit local wine venues &amp; collect stamps</p>
            </div>
            <span className="ml-auto text-lg" style={{ color: "var(--color-muted)" }} aria-hidden="true">›</span>
          </Link>
        </div>

        {/* Restaurants */}
        <div className="mb-3">
          <Link
            href="/restaurants"
            className="flex items-center gap-3 rounded-2xl px-5 py-4 transition-colors border"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            aria-label="Restaurants in St. Augustine"
          >
            <span className="text-2xl" aria-hidden="true">🍽️</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Restaurants</p>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>Seafood, dive bars, fine dining &amp; more</p>
            </div>
            <span className="ml-auto text-lg" style={{ color: "var(--color-muted)" }} aria-hidden="true">›</span>
          </Link>
        </div>

        {/* Quick-access row 2 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/parking"
            className="flex flex-col items-center gap-1.5 rounded-2xl py-4 text-center transition-colors border"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            aria-label="Parking and shuttle information"
          >
            <span className="text-2xl" aria-hidden="true">🅿️</span>
            <span className="text-xs font-semibold leading-tight" style={{ color: "var(--color-teal)" }}>Parking &amp;<br />Shuttles</span>
          </Link>
          <Link
            href="/restrooms"
            className="flex flex-col items-center gap-1.5 rounded-2xl py-4 text-center transition-colors border"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            aria-label="Public restroom locations"
          >
            <span className="text-2xl" aria-hidden="true">🚻</span>
            <span className="text-xs font-semibold leading-tight" style={{ color: "var(--color-teal)" }}>Public<br />Restrooms</span>
          </Link>
        </div>

        {adventures.length === 0 ? (
          <div className="text-center py-12" style={{ color: "var(--color-muted)" }}>
            <p>No adventures available yet. Check back soon!</p>
          </div>
        ) : (() => {
          const featured = adventures.filter((a) => a.is_featured);
          const rest = adventures.filter((a) => !a.is_featured);

          const AdventureCard = ({ adventure }: { adventure: typeof adventures[0] }) => (
            <Link
              href={`/adventure/${adventure.id}/start`}
              className="block rounded-2xl p-5 transition-all border"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
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
                <h3 className="font-display font-bold text-lg leading-tight flex-1" style={{ color: "var(--color-text)" }}>
                  {adventure.title}
                </h3>
                <span
                  className="ml-2 px-2 py-0.5 rounded text-xs font-semibold"
                  style={{
                    background: "var(--color-terra-tint)",
                    color: "var(--color-terra-dark, #8A3512)",
                  }}
                >
                  {adventure.difficulty}
                </span>
              </div>
              {adventure.short_description && (
                <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--color-body)" }}>
                  {adventure.short_description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-muted)" }}>
                <span>⏱ ~{adventure.estimated_duration_minutes} min</span>
                <span>⭐ {adventure.total_points} pts</span>
              </div>
            </Link>
          );

          return (
            <>
              {featured.length > 0 && (
                <section aria-label="Featured adventures" className="mb-8">
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--color-terra)" }}>
                    ⭐ Featured Adventures
                  </h2>
                  <ul className="space-y-4" role="list">
                    {featured.map((adventure) => (
                      <li key={adventure.id} role="listitem">
                        <div className="relative">
                          <div className="absolute -inset-0.5 rounded-2xl" style={{ background: "linear-gradient(135deg, #C1531A33, #1B4A4A22)" }} aria-hidden="true" />
                          <div className="relative">
                            <AdventureCard adventure={adventure} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {rest.length > 0 && (
                <section aria-label="All adventures">
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-muted)" }}>
                    All Adventures
                  </h2>
                  <ul className="space-y-4" role="list">
                    {rest.map((adventure) => (
                      <li key={adventure.id} role="listitem">
                        <AdventureCard adventure={adventure} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          );
        })()}
      </main>

      <AppFooter />
    </div>
  );
}
