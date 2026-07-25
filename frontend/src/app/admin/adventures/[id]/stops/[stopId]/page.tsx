"use client";

export const runtime = "edge";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getStop, updateStop, createStop, getChallenges, createChallenge, deleteChallenge } from "@/lib/api";
import type { Stop, Challenge } from "@/lib/api";

type SaveState = "idle" | "saving" | "saved" | "error";

const CHALLENGE_TYPES = [
  "gps_checkin",
  "multiple_choice",
  "text_answer",
  "photo_submission",
  "ai_conversation",
  "sequence_puzzle",
  "qr_code",
  "branching_story",
] as const;

export default function StopEditorPage() {
  const { id: adventureId, stopId } = useParams<{ id: string; stopId: string }>();
  const router = useRouter();

  const [stop, setStop] = useState<Stop | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Stop form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [historicalContent, setHistoricalContent] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState(40);
  const [points, setPoints] = useState(100);
  const [hintText, setHintText] = useState("");
  const [characterId, setCharacterId] = useState("");

  // New challenge form
  const [addingChallenge, setAddingChallenge] = useState(false);
  const [newChallengeType, setNewChallengeType] = useState<string>("multiple_choice");
  const [newChallengePoints, setNewChallengePoints] = useState(50);

  const isNewStop = stopId === "new";

  useEffect(() => {
    if (isNewStop) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [stopData, challengeData] = await Promise.all([
          getStop(stopId),
          getChallenges(stopId),
        ]);
        setStop(stopData);
        setChallenges(challengeData);
        setTitle(stopData.title);
        setDescription(stopData.description ?? "");
        setHistoricalContent(stopData.historical_content ?? "");
        setLat(String(stopData.lat));
        setLng(String(stopData.lng));
        setRadius(stopData.gps_radius_meters);
        setPoints(stopData.points);
        setHintText(stopData.hint_text ?? "");
        setCharacterId(stopData.ai_character_id ?? "");
      } catch {
        setErrorMsg("Failed to load stop.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [stopId, isNewStop]);

  const handleSave = useCallback(async () => {
    setSaveState("saving");
    setErrorMsg("");
    const payload = {
      title,
      description,
      historical_content: historicalContent,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      gps_radius_meters: radius,
      points,
      hint_text: hintText,
      ai_character_id: characterId || null,
    };

    try {
      if (isNewStop) {
        const created = await createStop(adventureId, payload);
        setSaveState("saved");
        router.push(`/admin/adventures/${adventureId}/stops/${created.id}`);
      } else {
        const updated = await updateStop(stopId, payload);
        setStop(updated);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      }
    } catch {
      setErrorMsg("Save failed. Please try again.");
      setSaveState("error");
    }
  }, [
    title, description, historicalContent, lat, lng, radius, points,
    hintText, characterId, isNewStop, stopId, adventureId, router,
  ]);

  const handleAddChallenge = useCallback(async () => {
    try {
      const created = await createChallenge({
        stop_id: stopId,
        challenge_type: newChallengeType,
        points: newChallengePoints,
        config: {},
        is_required: false,
      });
      setChallenges((prev) => [...prev, created]);
      setAddingChallenge(false);
    } catch {
      setErrorMsg("Failed to add challenge.");
    }
  }, [stopId, newChallengeType, newChallengePoints]);

  const handleDeleteChallenge = useCallback(async (challengeId: string) => {
    if (!confirm("Delete this challenge?")) return;
    try {
      await deleteChallenge(challengeId);
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
    } catch {
      setErrorMsg("Failed to delete challenge.");
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <p className="text-slate-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
          <li>
            <Link href="/admin/adventures" className="hover:text-white">Adventures</Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href={`/admin/adventures/${adventureId}`} className="hover:text-white">
              Adventure
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-white" aria-current="page">
            {isNewStop ? "New Stop" : (stop?.title ?? "Stop")}
          </li>
        </ol>
      </nav>

      <h1 className="text-xl font-bold text-white">
        {isNewStop ? "Add New Stop" : "Edit Stop"}
      </h1>

      {errorMsg && (
        <div role="alert" className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Stop form */}
      <section aria-labelledby="stop-form-heading" className="space-y-5">
        <h2 id="stop-form-heading" className="text-base font-semibold text-slate-200">
          Stop Details
        </h2>

        <div>
          <label htmlFor="stop-title" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
          <input id="stop-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>

        <div>
          <label htmlFor="stop-desc" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
          <textarea id="stop-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
        </div>

        <div>
          <label htmlFor="stop-hist" className="block text-sm font-medium text-slate-300 mb-1">
            Historical Content (shown to player)
          </label>
          <textarea id="stop-hist" rows={5} value={historicalContent} onChange={(e) => setHistoricalContent(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="stop-lat" className="block text-sm font-medium text-slate-300 mb-1">Latitude</label>
            <input id="stop-lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)}
              placeholder="29.8981"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label htmlFor="stop-lng" className="block text-sm font-medium text-slate-300 mb-1">Longitude</label>
            <input id="stop-lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)}
              placeholder="-81.3120"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="stop-radius" className="block text-sm font-medium text-slate-300 mb-1">
              GPS Radius (meters)
            </label>
            <input id="stop-radius" type="number" min={10} max={500} value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label htmlFor="stop-points" className="block text-sm font-medium text-slate-300 mb-1">Points</label>
            <input id="stop-points" type="number" min={0} value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>

        <div>
          <label htmlFor="stop-hint" className="block text-sm font-medium text-slate-300 mb-1">
            Hint Text (shown when player requests a hint)
          </label>
          <input id="stop-hint" type="text" value={hintText} onChange={(e) => setHintText(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>

        <div>
          <label htmlFor="stop-character" className="block text-sm font-medium text-slate-300 mb-1">
            AI Character ID
          </label>
          <input id="stop-character" type="text" value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
            placeholder="spanish_colonial_guide"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>

        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold text-sm transition-colors min-h-[44px]"
        >
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : isNewStop ? "Create Stop" : "Save Changes"}
        </button>
      </section>

      {/* Challenges (only for existing stops) */}
      {!isNewStop && (
        <section aria-labelledby="challenges-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="challenges-heading" className="text-base font-semibold text-slate-200">
              Challenges ({challenges.length})
            </h2>
            <button
              onClick={() => setAddingChallenge(true)}
              className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg min-h-[44px]"
            >
              + Add Challenge
            </button>
          </div>

          {addingChallenge && (
            <div className="bg-slate-800 rounded-xl p-4 mb-4 space-y-3" role="region" aria-label="New challenge form">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-ch-type" className="block text-xs text-slate-400 mb-1">Type</label>
                  <select id="new-ch-type" value={newChallengeType}
                    onChange={(e) => setNewChallengeType(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {CHALLENGE_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-ch-pts" className="block text-xs text-slate-400 mb-1">Points</label>
                  <input id="new-ch-pts" type="number" min={0} value={newChallengePoints}
                    onChange={(e) => setNewChallengePoints(Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddChallenge}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-sm rounded-lg min-h-[44px]">
                  Add
                </button>
                <button onClick={() => setAddingChallenge(false)}
                  className="flex-1 py-2 border border-slate-600 text-slate-300 text-sm rounded-lg min-h-[44px]">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {challenges.length === 0 ? (
            <p className="text-slate-400 text-sm">No challenges yet.</p>
          ) : (
            <ul className="space-y-2">
              {challenges.map((ch) => (
                <li key={ch.id} className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{ch.challenge_type.replace(/_/g, " ")}</p>
                    <p className="text-slate-400 text-xs">{ch.points} pts{ch.is_required ? " · required" : ""}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteChallenge(ch.id)}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 min-h-[44px]"
                    aria-label={`Delete ${ch.challenge_type} challenge`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
