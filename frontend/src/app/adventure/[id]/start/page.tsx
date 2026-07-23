"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getAdventure,
  createSession,
  listStops,
  gpsCheckin,
  submitChallenge,
  checkBadges,
  type Adventure,
  type Stop,
  type GameSession,
} from "@/lib/api";
import { usePlayerLocation } from "@/hooks/usePlayerLocation";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { useIndexedDB } from "@/hooks/useIndexedDB";
import { DistanceIndicator } from "@/components/player/DistanceIndicator";
import { HintButton } from "@/components/player/HintButton";
import { BadgeEarned } from "@/components/player/BadgeEarned";
import { TimeOfDayBanner } from "@/components/player/TimeOfDayBanner";
import { SimulatedGPS } from "@/components/debug/SimulatedGPS";
import { AppFooter } from "@/components/player/AppFooter";

interface EarnedBadge {
  id: string;
  name: string;
  description?: string;
  icon_emoji?: string;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const df = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function AdventurePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { mapTheme } = useTimeOfDay();

  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingBadge, setPendingBadge] = useState<EarnedBadge | null>(null);
  const [simulated, setSimulated] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { location, error: gpsError, simulateLocation } = usePlayerLocation(simulated);
  const { set: dbSet, get: dbGet } = useIndexedDB();

  const currentStop = stops[currentStopIndex] ?? null;

  const distance =
    location && currentStop
      ? haversine(location.lat, location.lng, currentStop.lat, currentStop.lng)
      : null;

  const isWithinRange =
    distance !== null &&
    currentStop !== null &&
    distance <= (currentStop.gps_radius_meters ?? 30);

  // Load adventure + stops, restore or create session
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [adv, stps] = await Promise.all([
          getAdventure(id),
          listStops(id),
        ]);
        setAdventure(adv);
        setStops(stps);

        // Try to restore session from IndexedDB
        const savedSessionId = await dbGet<string>(`session_${id}`);
        if (savedSessionId) {
          // Could fetch session from API here; using local state for now
          setSession({ id: savedSessionId } as GameSession);
        } else {
          const sess = await createSession(id);
          setSession(sess);
          await dbSet(`session_${id}`, sess.id);
          setCurrentStopIndex(sess.current_stop_index ?? 0);
        }
      } catch (e) {
        setError("Failed to load adventure. Check your connection.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckin = useCallback(async () => {
    if (!session || !currentStop || !location) return;
    try {
      const result = await gpsCheckin({
        stop_id: currentStop.id,
        session_id: session.id,
        lat: location.lat,
        lng: location.lng,
        simulated,
      });
      if (result.success) {
        setFeedback("✅ Location verified!");
        // Check for new badges
        const newBadges = await checkBadges(session.id);
        if (newBadges.length > 0) {
          setPendingBadge(newBadges[0]);
        }
        // Advance to next stop
        setTimeout(() => {
          setCurrentStopIndex((i) => Math.min(i + 1, stops.length - 1));
          setFeedback(null);
        }, 1500);
      } else {
        setFeedback(result.message);
      }
    } catch {
      setFeedback("Check-in failed. Try again.");
    }
  }, [session, currentStop, location, simulated, stops.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-slate-400 text-center">
          <div className="animate-spin text-4xl mb-4" aria-hidden="true">⏳</div>
          <p>Loading adventure…</p>
        </div>
      </div>
    );
  }

  if (error || !adventure) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" role="alert">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error ?? "Adventure not found"}</p>
          <button onClick={() => router.back()} className="min-h-[44px] px-4 py-2 bg-slate-700 rounded-lg text-white">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" data-map-theme={mapTheme}>
      <TimeOfDayBanner />

      {/* Header */}
      <header className="px-4 pt-6 pb-4 border-b border-slate-800">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">{adventure.title}</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Stop {currentStopIndex + 1} of {stops.length}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            aria-label="Exit adventure"
            className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(((currentStopIndex) / stops.length) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Adventure progress: ${currentStopIndex} of ${stops.length} stops complete`}
        >
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${(currentStopIndex / stops.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {currentStop ? (
          <>
            <section aria-labelledby="stop-title">
              <h2 id="stop-title" className="text-amber-400 font-bold text-xl mb-1">
                {currentStop.title}
              </h2>
              {currentStop.description && (
                <p className="text-slate-300 text-sm leading-relaxed">{currentStop.description}</p>
              )}
            </section>

            {/* GPS distance */}
            <section aria-label="Location status">
              {gpsError ? (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm" role="alert">
                  {gpsError}
                </div>
              ) : (
                <DistanceIndicator
                  distanceMeters={distance}
                  requiredRadiusMeters={currentStop.gps_radius_meters ?? 30}
                  isWithinRange={isWithinRange}
                />
              )}
            </section>

            {/* Check-in button */}
            <button
              onClick={handleCheckin}
              disabled={!isWithinRange && !simulated}
              aria-label={
                isWithinRange || simulated
                  ? "Check in at this location"
                  : "You must be at the location to check in"
              }
              className="w-full min-h-[52px] px-6 py-3 rounded-xl font-bold text-lg transition-all focus-visible:outline-amber-500 disabled:opacity-40 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-500 text-white"
            >
              {isWithinRange || simulated ? "✅ Check In Here" : "📍 Walk to Location"}
            </button>

            {feedback && (
              <p className="text-center text-sm" role="status" aria-live="polite">
                {feedback}
              </p>
            )}

            {/* Hint */}
            {currentStop.hint_text && session && (
              <HintButton
                challengeId={currentStop.id}
                sessionId={session.id}
              />
            )}

            {/* Historical content */}
            {currentStop.historical_content && (
              <section
                aria-label="Historical information"
                className="p-4 bg-slate-800/50 rounded-xl border border-slate-700"
              >
                <h3 className="text-amber-300 font-semibold text-sm mb-2">📜 Historical Note</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{currentStop.historical_content}</p>
              </section>
            )}

            {/* Simulated GPS (dev only) */}
            <SimulatedGPS onLocationSet={(lat, lng) => {
              setSimulated(true);
              simulateLocation(lat, lng);
            }} />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400">No stops available for this adventure.</p>
          </div>
        )}
      </main>

      <AppFooter />

      {/* Badge notification */}
      {pendingBadge && (
        <BadgeEarned
          name={pendingBadge.name}
          description={pendingBadge.description}
          iconEmoji={pendingBadge.icon_emoji}
          onDismiss={() => setPendingBadge(null)}
        />
      )}
    </div>
  );
}
