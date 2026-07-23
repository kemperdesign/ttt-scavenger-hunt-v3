"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { checkBadges, getLeaderboard, type Badge } from "@/lib/api";
import { BadgeTray } from "@/components/player/BadgeTray";
import { AppFooter } from "@/components/player/AppFooter";

export default function AdventureCompletePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const sessionId = typeof window !== "undefined"
    ? localStorage.getItem(`session_${id}`) ?? ""
    : "";

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const earned = await checkBadges(sessionId);
        setBadges(earned);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center space-y-8">
        <div aria-hidden="true" className="text-8xl animate-bounce">🎉</div>

        <div>
          <h1 className="text-white font-bold text-3xl mb-2">Adventure Complete!</h1>
          <p className="text-slate-400 text-lg">
            You've explored all the stops. Well done, historian!
          </p>
        </div>

        {/* Badges */}
        {!loading && badges.length > 0 && (
          <section aria-label="Badges earned this adventure" className="w-full max-w-sm">
            <h2 className="text-amber-400 font-semibold mb-3">Badges Earned</h2>
            <BadgeTray badges={badges} />
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href={`/adventure/${id}/leaderboard`}
            className="min-h-[52px] flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors focus-visible:outline-amber-300"
          >
            🏆 View Leaderboard
          </Link>
          <Link
            href="/"
            className="min-h-[52px] flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors focus-visible:outline-amber-500"
          >
            Explore More Adventures
          </Link>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
