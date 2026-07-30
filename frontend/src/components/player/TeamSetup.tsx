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
    if (!teamName.trim()) { setError("Enter a team name."); return; }
    setLoading(true); setError("");
    try {
      const created = await createTeam(adventureId, teamName.trim());
      setTeam(created); setMode("created");
    } catch {
      setError("Failed to create team. Try again.");
    } finally { setLoading(false); }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) { setError("Enter a valid join code."); return; }
    setLoading(true); setError("");
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
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm space-y-6">
        {mode === "choose" && (
          <>
            <div className="text-center space-y-1">
              <p className="text-3xl" aria-hidden="true">🧭</p>
              <h1 className="font-display font-bold text-xl" style={{ color: "var(--color-text)" }}>How are you playing?</h1>
              <p className="text-sm" style={{ color: "var(--color-body)" }}>Team up with friends or explore on your own.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onDone(null)}
                className="w-full py-4 rounded-xl text-sm transition-colors min-h-[52px] text-left px-5 flex items-center gap-3 border"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                <span className="text-xl" aria-hidden="true">🚶</span>
                <span>
                  <span className="block font-semibold">Play Solo</span>
                  <span className="block text-xs" style={{ color: "var(--color-muted)" }}>Just me, my own pace</span>
                </span>
              </button>

              {isLoggedIn && (
                <>
                  <button
                    onClick={() => { setMode("create"); setError(""); }}
                    className="w-full py-4 rounded-xl text-sm transition-colors min-h-[52px] text-left px-5 flex items-center gap-3 border"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    <span className="text-xl" aria-hidden="true">✨</span>
                    <span>
                      <span className="block font-semibold">Create a Team</span>
                      <span className="block text-xs" style={{ color: "var(--color-muted)" }}>Get a code to share with friends</span>
                    </span>
                  </button>

                  <button
                    onClick={() => { setMode("join"); setError(""); }}
                    className="w-full py-4 rounded-xl text-sm transition-colors min-h-[52px] text-left px-5 flex items-center gap-3 border"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    <span className="text-xl" aria-hidden="true">🔑</span>
                    <span>
                      <span className="block font-semibold">Join a Team</span>
                      <span className="block text-xs" style={{ color: "var(--color-muted)" }}>Enter a code someone shared</span>
                    </span>
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {mode === "create" && (
          <>
            <div className="text-center">
              <h1 className="font-display font-bold text-xl" style={{ color: "var(--color-text)" }}>Name your team</h1>
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
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none border"
                style={{ background: "var(--color-bg)", borderColor: "var(--color-border2)", color: "var(--color-text)" }}
              />
              {error && <p role="alert" className="text-sm" style={{ color: "var(--color-terra)" }}>{error}</p>}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm min-h-[48px] text-white disabled:opacity-50"
                style={{ background: "var(--color-terra)" }}
              >
                {loading ? "Creating…" : "Create Team"}
              </button>
              <button onClick={() => { setMode("choose"); setError(""); }} className="w-full py-2 text-sm" style={{ color: "var(--color-muted)" }}>
                ← Back
              </button>
            </div>
          </>
        )}

        {mode === "join" && (
          <>
            <div className="text-center space-y-1">
              <h1 className="font-display font-bold text-xl" style={{ color: "var(--color-text)" }}>Enter join code</h1>
              <p className="text-sm" style={{ color: "var(--color-body)" }}>Ask your team leader for their code.</p>
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
                className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono focus:outline-none border"
                style={{ background: "var(--color-bg)", borderColor: "var(--color-border2)", color: "var(--color-text)" }}
              />
              {error && <p role="alert" className="text-sm text-center" style={{ color: "var(--color-terra)" }}>{error}</p>}
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm min-h-[48px] text-white disabled:opacity-50"
                style={{ background: "var(--color-terra)" }}
              >
                {loading ? "Joining…" : "Join Team"}
              </button>
              <button onClick={() => { setMode("choose"); setError(""); }} className="w-full py-2 text-sm" style={{ color: "var(--color-muted)" }}>
                ← Back
              </button>
            </div>
          </>
        )}

        {mode === "created" && team && (
          <>
            <div className="text-center space-y-2">
              <p className="text-3xl" aria-hidden="true">🎉</p>
              <h1 className="font-display font-bold text-xl" style={{ color: "var(--color-text)" }}>Team created!</h1>
              <p className="text-sm" style={{ color: "var(--color-body)" }}>Share this code so friends can join {team.name}.</p>
            </div>
            <div
              className="rounded-xl py-6 text-center border-2 border-dashed"
              style={{ borderColor: "var(--color-terra)" }}
              role="status"
            >
              <p className="text-4xl font-mono font-bold tracking-[0.3em]" style={{ color: "var(--color-terra)" }}>
                {team.join_code}
              </p>
            </div>
            <button
              onClick={() => onDone(team.id)}
              className="w-full py-3 rounded-xl font-bold text-sm min-h-[48px] text-white"
              style={{ background: "var(--color-terra)" }}
            >
              Start Adventure →
            </button>
          </>
        )}
      </div>
    </main>
  );
}
