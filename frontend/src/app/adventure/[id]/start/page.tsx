"use client";

export const runtime = "edge";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  getAdventure,
  createSession,
  getSession,
  listStops,
  gpsCheckin,
  getChallenges,
  checkBadges,
  completeSession,
  resetSession,
  awardTestPoints,
  type Adventure,
  type Stop,
  type GameSession,
  type Challenge,
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
import { TeamSetup } from "@/components/player/TeamSetup";
import { ChallengeRenderer } from "@/components/player/ChallengeRenderer";
import { PaymentWall } from "@/components/player/PaymentWall";

const AdventureMap = dynamic(() => import("@/components/map/AdventureMap"), { ssr: false });

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

// Initial compass bearing from point 1 to point 2, in degrees (0 = north, clockwise).
function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export default function AdventurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center" role="status" aria-live="polite">
          <div className="text-slate-400 text-center">
            <div className="animate-spin text-4xl mb-4" aria-hidden="true">⏳</div>
            <p>Loading adventure…</p>
          </div>
        </div>
      }
    >
      <AdventurePageInner />
    </Suspense>
  );
}

function AdventurePageInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const returnedFromPayment = searchParams.get("paid") === "1";
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
  const [needsTeamSetup, setNeedsTeamSetup] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [stopChallenges, setStopChallenges] = useState<Challenge[]>([]);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(new Set());
  const [paymentStatus, setPaymentStatus] = useState<"free" | "paid" | "corporate">("free");

  const { location, error: gpsError, simulateLocation, startTracking } = usePlayerLocation(simulated, false);
  const { set: dbSet, get: dbGet } = useIndexedDB();

  const currentStop = stops[currentStopIndex] ?? null;

  const distance =
    location && currentStop
      ? haversine(location.lat, location.lng, currentStop.lat, currentStop.lng)
      : null;

  const bearingDegrees =
    location && currentStop
      ? bearing(location.lat, location.lng, currentStop.lat, currentStop.lng)
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

        if (isPreview) {
          // Preview mode always starts a fresh, non-persisted session — never
          // touches IndexedDB, so it can't collide with the admin's own
          // real player progress on this adventure.
          const sess = await createSession(id, undefined, true);
          setSession(sess);
          setPaymentStatus("paid"); // preview bypasses payment
          setSimulated(true);
        } else {
          // Try to restore session from IndexedDB
          const savedSessionId = await dbGet<string>(`session_${id}`);
          if (savedSessionId) {
            // Could fetch session from API here; using local state for now
            setSession({ id: savedSessionId } as GameSession);
          } else {
            // New session: ask solo/create-team/join-team before starting
            setNeedsTeamSetup(true);
          }
        }
      } catch (e) {
        setError("Failed to load adventure. Check your connection.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isPreview]); // eslint-disable-line react-hooks/exhaustive-deps

  // When Square redirects back with ?paid=1, re-fetch the session to pick up
  // the updated payment_status that the webhook already set server-side.
  useEffect(() => {
    if (!returnedFromPayment || !session) return;
    getSession(session.id)
      .then((s) => setPaymentStatus(s.payment_status ?? "free"))
      .catch(() => {});
  }, [returnedFromPayment, session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preview mode: auto-teleport simulated GPS to whatever stop is current,
  // so an admin can walk through the whole adventure without leaving their desk.
  useEffect(() => {
    if (isPreview && currentStop) {
      simulateLocation(currentStop.lat, currentStop.lng);
    }
  }, [isPreview, currentStop, simulateLocation]);

  // Reset per-stop challenge state whenever the current stop changes.
  useEffect(() => {
    setCheckedIn(false);
    setStopChallenges([]);
    setCompletedChallengeIds(new Set());
  }, [currentStopIndex]);

  const handleTeamSetupDone = useCallback(async (teamId: string | null) => {
    setNeedsTeamSetup(false);
    try {
      const sess = await createSession(id, teamId ?? undefined);
      setSession(sess);
      setPaymentStatus(sess.payment_status ?? "free");
      await dbSet(`session_${id}`, sess.id);
      setCurrentStopIndex(sess.current_stop_index ?? 0);
    } catch {
      setError("Failed to start adventure. Check your connection.");
    }
  }, [id, dbSet]);

  const handleSkipStop = useCallback(() => {
    if (!session) return;
    const isLastStop = currentStopIndex >= stops.length - 1;
    if (isLastStop) {
      (async () => {
        try {
          await completeSession(session.id);
        } finally {
          router.push(`/adventure/${id}/complete`);
        }
      })();
    } else {
      setCurrentStopIndex((i) => Math.min(i + 1, stops.length - 1));
      setFeedback(null);
    }
  }, [session, currentStopIndex, stops.length, id, router]);

  const advanceOrComplete = useCallback(() => {
    if (!session) return;
    const isLastStop = currentStopIndex >= stops.length - 1;
    if (isLastStop) {
      (async () => {
        try {
          await completeSession(session.id);
        } finally {
          router.push(`/adventure/${id}/complete`);
        }
      })();
    } else {
      setCurrentStopIndex((i) => Math.min(i + 1, stops.length - 1));
      setFeedback(null);
    }
  }, [session, currentStopIndex, stops.length, id, router]);

  const handleChallengeComplete = useCallback((challengeId: string) => {
    setCompletedChallengeIds((prev) => new Set(prev).add(challengeId));
  }, []);

  const handleResetProgress = useCallback(async () => {
    if (!session) return;
    if (!confirm("Restart this adventure from the beginning? All progress on this run will be lost.")) return;
    try {
      await resetSession(session.id);
      setCurrentStopIndex(0);
      setCheckedIn(false);
      setStopChallenges([]);
      setCompletedChallengeIds(new Set());
      setFeedback(null);
    } catch {
      setFeedback("Failed to reset progress. Try again.");
    }
  }, [session]);

  const handleAwardTestPoints = useCallback(async () => {
    if (!session) return;
    try {
      await awardTestPoints(session.id, 50);
      setFeedback("+50 test points awarded");
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback("Failed to award test points.");
    }
  }, [session]);

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
        setCheckedIn(true);

        // Check for new badges
        const newBadges = await checkBadges(session.id);
        if (newBadges.length > 0) {
          setPendingBadge(newBadges[0]);
        }

        // Load this stop's challenges (gps_checkin type is already satisfied
        // by the check-in itself, so it doesn't need its own UI)
        let challenges: Challenge[] = [];
        try {
          challenges = (await getChallenges(currentStop.id)).filter(
            (c) => c.challenge_type !== "gps_checkin"
          );
        } catch {
          // If challenges fail to load, don't block progression on it
        }
        setStopChallenges(challenges);

        if (challenges.length === 0) {
          setTimeout(() => {
            advanceOrComplete();
          }, 1500);
        } else {
          setTimeout(() => setFeedback(null), 1500);
        }
      } else {
        setFeedback(result.message);
      }
    } catch {
      setFeedback("Check-in failed. Try again.");
    }
  }, [session, currentStop, location, simulated, advanceOrComplete]);

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

  if (needsTeamSetup) {
    return <TeamSetup adventureId={id} onDone={handleTeamSetupDone} />;
  }

  // Payment wall: show as soon as a session exists and payment hasn't been made.
  // Preview sessions and already-paid/corporate sessions bypass this entirely.
  const needsPayment =
    !isPreview &&
    paymentStatus === "free" &&
    session !== null;

  if (needsPayment) {
    return (
      <PaymentWall
        sessionId={session!.id}
        adventureTitle={adventure?.title ?? "TimeQuest Adventure"}
        onUnlocked={() => setPaymentStatus("corporate")}
      />
    );
  }

  if (error || !adventure) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" role="alert">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error ?? "Adventure not found"}</p>
          <button onClick={() => router.push("/")} className="min-h-[44px] px-4 py-2 bg-slate-700 rounded-lg text-white">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" data-map-theme={mapTheme}>
      {isPreview && (
        <div
          role="status"
          className="bg-amber-500 text-slate-900 px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium"
        >
          <span>🔍 Preview Mode — this run won&apos;t appear on the leaderboard</span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleAwardTestPoints}
              className="bg-slate-900 text-amber-400 px-3 py-1 rounded-lg text-xs font-semibold min-h-[32px]"
            >
              +50 Test Points
            </button>
            <button
              onClick={handleSkipStop}
              disabled={currentStopIndex >= stops.length - 1}
              className="bg-slate-900 text-amber-400 px-3 py-1 rounded-lg text-xs font-semibold disabled:opacity-40 min-h-[32px]"
            >
              Skip Stop →
            </button>
          </div>
        </div>
      )}

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
            onClick={() => {
              if (confirm("Exit this adventure? Your progress is saved and you can resume later.")) {
                router.push("/");
              }
            }}
            aria-label="Exit adventure and return home"
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

        {!isPreview && (
          <button
            onClick={handleResetProgress}
            className="mt-2 text-slate-500 hover:text-slate-300 text-xs underline"
          >
            Restart adventure from the beginning
          </button>
        )}
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

            {currentStop.safety_warning && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 bg-amber-900/30 border border-amber-700 rounded-lg"
              >
                <span className="text-lg shrink-0" aria-hidden="true">⚠️</span>
                <p className="text-amber-200 text-sm leading-relaxed">{currentStop.safety_warning}</p>
              </div>
            )}

            <AdventureMap
              stops={stops}
              currentStopIndex={currentStopIndex}
              playerLat={location?.lat}
              playerLng={location?.lng}
              mapTheme={mapTheme}
              completedStopIds={
                session && "completed_stop_ids" in session
                  ? (session as unknown as { completed_stop_ids?: string[] }).completed_stop_ids ?? []
                  : []
              }
              className="h-56 w-full"
            />

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
                  bearingDegrees={bearingDegrees}
                />
              )}
            </section>

            {/* Check-in button */}
            {!checkedIn && (
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
            )}

            {!checkedIn && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleSkipStop}
                  className="text-slate-500 hover:text-slate-300 text-sm font-medium underline underline-offset-4"
                >
                  Skip Stop (No Points)
                </button>
              </div>
            )}

            {feedback && (
              <p className="text-center text-sm" role="status" aria-live="polite">
                {feedback}
              </p>
            )}

            {/* Challenges for this stop, shown after check-in */}
            {checkedIn && stopChallenges.length > 0 && session && (
              <section aria-label="Stop challenges" className="space-y-3">
                <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">
                  Complete to continue
                </h3>
                {stopChallenges.map((challenge) => (
                  <ChallengeRenderer
                    key={challenge.id}
                    challenge={challenge}
                    sessionId={session.id}
                    isComplete={completedChallengeIds.has(challenge.id)}
                    onComplete={() => handleChallengeComplete(challenge.id)}
                    isPreview={isPreview}
                  />
                ))}

                {stopChallenges
                  .filter((c) => c.is_required)
                  .every((c) => completedChallengeIds.has(c.id)) && (
                  <button
                    onClick={advanceOrComplete}
                    className="w-full min-h-[52px] px-6 py-3 rounded-xl font-bold text-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                  >
                    {currentStopIndex >= stops.length - 1 ? "🏁 Finish Adventure" : "Continue to Next Stop →"}
                  </button>
                )}
              </section>
            )}

            {/* Hint */}
            {currentStop.hint_text && session && (
              <HintButton
                hintText={currentStop.hint_text}
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
