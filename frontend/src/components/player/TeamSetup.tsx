"use client";

import { useState } from "react";
import { createTeam, joinTeam, getToken, type Team } from "@/lib/api";

interface TeamSetupProps {
  adventureId: string;
  onDone: (teamId: string | null) => void;
}

type Mode = "choose" | "create" | "join" | "created";

export function TeamSetup({ adventureId, onDone }: TeamSetupProps) {
  const isLoggedIn = typeof window !== "undefined" && !!getToken();
  const [mode, setMode] = useState<Mode>("choose");
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!teamName.trim()) {
      setError("Enter a team name.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await createTeam(adventureId, teamName.trim());
      setTeam(created);
      setMode("created");
    } catch {
      setError("Failed to create team. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setError("Enter a valid join code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const joined = await joinTeam(code);
      onDone(joined.id);
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("404")
          ? "Invalid join code. Check with your team leader."
          : err instanceof Error && err.message.includes("409")
          ? "That team is full."
          : "Failed to join team. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {mode === "choose" && (
          <>
            <div className="text-center space-y-1">
              <p className="text-3xl" aria-hidden="true">🧭</p>
              <h1 className="text-white font-bold text-xl">How are you playing?</h1>
              <p className="text-slate-400 text-sm">
                Team up with friends or explore on your own.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onDone(null)}
                className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors min-h-[52px] text-left px-5 flex items-center gap-3"
              >
                <span className="text-xl" aria-hidden="true">🚶</span>
                <span>
                  <span className="block font-semibold">Play Solo</span>
                  <span className="block text-slate-400 text-xs">Just me, my own pace</span>
                </span>
              </button>

              {isLoggedIn && (
                <>
                  <button
                    onClick={() => { setMode("create"); setError(""); }}
                    className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors min-h-[52px] text-left px-5 flex items-center gap-3"
                  >
                    <span className="text-xl" aria-hidden="true">✨</span>
                    <span>
                      <span className="block font-semibold">Create a Team</span>
                      <span className="block text-slate-400 text-xs">Get a code to share with friends</span>
                    </span>
                  </button>

                  <button
                    onClick={() => { setMode("join"); setError(""); }}
                    className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors min-h-[52px] text-left px-5 flex items-center gap-3"
                  >
                    <span className="text-xl" aria-hidden="true">🔑</span>
                    <span>
                      <span className="block font-semibold">Join a Team</span>
                      <span className="block text-slate-400 text-xs">Enter a code someone shared</span>
                    </span>
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {mode === "create" && (
          <>
            <div className="text-center space-y-1">
              <h1 className="text-white font-bold text-xl">Name your team</h1>
            </div>
            <div className="space-y-3">
              <label htmlFor="team-name" className="sr-only">Team name</label>
              <input
                id="team-name"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="The History Buffs"
                autoFocus
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {error && (
                <p role="alert" className="text-red-400 text-sm">{error}</p>
              )}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold text-sm min-h-[48px]"
              >
                {loading ? "Creating…" : "Create Team"}
              </button>
              <button
                onClick={() => { setMode("choose"); setError(""); }}
                className="w-full py-2 text-slate-400 hover:text-white text-sm"
              >
                ← Back
              </button>
            </div>
          </>
        )}

        {mode === "join" && (
          <>
            <div className="text-center space-y-1">
              <h1 className="text-white font-bold text-xl">Enter join code</h1>
              <p className="text-slate-400 text-sm">Ask your team leader for their code.</p>
            </div>
            <div className="space-y-3">
              <label htmlFor="join-code" className="sr-only">Join code</label>
              <input
                id="join-code"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="ABC123"
                autoFocus
                maxLength={8}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {error && (
                <p role="alert" className="text-red-400 text-sm text-center">{error}</p>
              )}
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold text-sm min-h-[48px]"
              >
                {loading ? "Joining…" : "Join Team"}
              </button>
              <button
                onClick={() => { setMode("choose"); setError(""); }}
                className="w-full py-2 text-slate-400 hover:text-white text-sm"
              >
                ← Back
              </button>
            </div>
          </>
        )}

        {mode === "created" && team && (
          <>
            <div className="text-center space-y-2">
              <p className="text-3xl" aria-hidden="true">🎉</p>
              <h1 className="text-white font-bold text-xl">Team created!</h1>
              <p className="text-slate-400 text-sm">
                Share this code so friends can join {team.name}.
              </p>
            </div>
            <div
              className="bg-slate-800 border-2 border-dashed border-amber-500 rounded-xl py-6 text-center"
              role="status"
            >
              <p className="text-amber-400 text-4xl font-mono font-bold tracking-[0.3em]">
                {team.join_code}
              </p>
            </div>
            <button
              onClick={() => onDone(team.id)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm min-h-[48px]"
            >
              Start Adventure →
            </button>
          </>
        )}
      </div>
    </main>
  );
}
