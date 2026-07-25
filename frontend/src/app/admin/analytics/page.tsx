"use client";

import React, { useEffect, useState } from "react";
import { listAdventures, getLeaderboard, type Adventure } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [selectedAdventure, setSelectedAdventure] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAdventures(false).then((data) => {
      setAdventures(data);
      if (data.length > 0) setSelectedAdventure(data[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAdventure) return;
    getLeaderboard(selectedAdventure, { limit: 20 }).then(setLeaderboard);
  }, [selectedAdventure]);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-white font-bold text-2xl">Analytics</h1>

      {loading ? (
        <p className="text-slate-400" role="status">Loading…</p>
      ) : (
        <>
          {/* Adventure selector */}
          <div>
            <label htmlFor="adventure-select" className="block text-sm font-medium text-slate-300 mb-2">
              Adventure
            </label>
            <select
              id="adventure-select"
              value={selectedAdventure}
              onChange={(e) => setSelectedAdventure(e.target.value)}
              className="min-h-[44px] px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
            >
              {adventures.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          {/* Leaderboard */}
          <section aria-label="Leaderboard">
            <h2 className="text-white font-semibold mb-4">Top Players</h2>
            {leaderboard.length === 0 ? (
              <p className="text-slate-500 text-sm">No completions yet.</p>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm" aria-label="Leaderboard rankings">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th scope="col" className="px-4 py-3 text-left text-slate-400 font-medium">Rank</th>
                      <th scope="col" className="px-4 py-3 text-left text-slate-400 font-medium">Player</th>
                      <th scope="col" className="px-4 py-3 text-right text-slate-400 font-medium">Points</th>
                      <th scope="col" className="px-4 py-3 text-right text-slate-400 font-medium">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, i) => (
                      <tr key={i} className="border-b border-slate-800/50 last:border-0">
                        <td className="px-4 py-3 text-slate-500">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">{entry.username}</td>
                        <td className="px-4 py-3 text-right text-amber-400 font-bold">{entry.total_points}</td>
                        <td className="px-4 py-3 text-right text-slate-500 text-xs">
                          {entry.completed_at
                            ? new Date(entry.completed_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
