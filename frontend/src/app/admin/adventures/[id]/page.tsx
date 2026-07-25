"use client";

export const runtime = "edge";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdventure,
  updateAdventure,
  createAdventure,
  getStops,
  deleteStop,
  publishAdventure,
  unpublishAdventure,
} from "@/lib/api";
import type { Adventure, Stop } from "@/lib/api";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function AdminAdventureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [difficulty, setDifficulty] = useState("moderate");
  const [duration, setDuration] = useState(60);
  const [tags, setTags] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        if (id === "new") {
          setAdventure({ id: "new", title: "", tags: [] } as any);
          setLoading(false);
          return;
        }
        const [adv, stopsData] = await Promise.all([
          getAdventure(id),
          getStops(id),
        ]);
        setAdventure(adv);
        setStops(stopsData);
        // Populate form
        setTitle(adv.title);
        setDescription(adv.description ?? "");
        setShortDesc(adv.short_description ?? "");
        setDifficulty(adv.difficulty);
        setDuration(adv.estimated_duration_minutes);
        setTags((adv.tags ?? []).join(", "));
        setIsFeatured(adv.is_featured);
      } catch {
        setErrorMsg("Failed to load adventure.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSave = useCallback(async () => {
    if (!adventure) return;
    setSaveState("saving");
    setErrorMsg("");
    const payload = {
      title,
      description,
      short_description: shortDesc,
      difficulty,
      estimated_duration_minutes: duration,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      is_featured: isFeatured,
    };
    try {
      if (id === "new") {
        const created = await createAdventure(payload);
        setSaveState("saved");
        router.push(`/admin/adventures/${created.id}`);
      } else {
        const updated = await updateAdventure(id, payload);
        setAdventure(updated);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      }
    } catch {
      setErrorMsg("Save failed. Please try again.");
      setSaveState("error");
    }
  }, [
    adventure,
    id,
    title,
    description,
    shortDesc,
    difficulty,
    duration,
    tags,
    isFeatured,
    router,
  ]);

  const handleTogglePublish = useCallback(async () => {
    if (!adventure) return;
    try {
      if (adventure.is_published) {
        const updated = await unpublishAdventure(id);
        setAdventure(updated);
      } else {
        const updated = await publishAdventure(id);
        setAdventure(updated);
      }
    } catch {
      setErrorMsg("Failed to update publish state.");
    }
  }, [adventure, id]);

  const handleDeleteStop = useCallback(
    async (stopId: string, stopTitle: string) => {
      if (!confirm(`Delete stop "${stopTitle}"? This cannot be undone.`)) return;
      try {
        await deleteStop(stopId);
        setStops((prev) => prev.filter((s) => s.id !== stopId));
      } catch {
        setErrorMsg("Failed to delete stop.");
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <p className="text-slate-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!adventure) {
    return (
      <div role="alert" className="p-6 text-red-400">
        {errorMsg || "Adventure not found."}
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-slate-400">
          <li>
            <Link href="/admin/adventures" className="hover:text-white">
              Adventures
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-white truncate max-w-xs" aria-current="page">
            {adventure.title}
          </li>
        </ol>
      </nav>

      {/* Error banner */}
      {errorMsg && (
        <div role="alert" className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Publish status */}
      <section aria-labelledby="publish-heading" className="flex items-center justify-between">
        <div>
          <h1 id="publish-heading" className="text-xl font-bold text-white">
            {adventure.title}
          </h1>
          <span
            className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              adventure.is_published
                ? "bg-green-900 text-green-300"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {adventure.is_published ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex gap-2">
          {id !== "new" && stops.length > 0 && (
            <Link
              href={`/adventure/${id}/start?preview=1`}
              target="_blank"
              className="px-4 py-2 rounded-lg text-sm font-medium border border-amber-600 text-amber-400 hover:bg-amber-900/30 transition-colors min-h-[44px] inline-flex items-center"
              aria-label="Preview this adventure as a player in a new tab"
            >
              ▶ Preview as Player
            </Link>
          )}
          <button
            onClick={handleTogglePublish}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
              adventure.is_published
                ? "border border-slate-600 text-slate-300 hover:bg-slate-700"
                : "bg-green-700 hover:bg-green-600 text-white"
            }`}
            aria-label={
              adventure.is_published ? "Unpublish this adventure" : "Publish this adventure"
            }
          >
            {adventure.is_published ? "Unpublish" : "Publish"}
          </button>
        </div>
      </section>

      {/* Edit form */}
      <section aria-labelledby="edit-heading">
        <h2 id="edit-heading" className="text-lg font-semibold text-white mb-5">
          Adventure Details
        </h2>
        <div className="space-y-5">
          <div>
            <label htmlFor="adv-title" className="block text-sm font-medium text-slate-300 mb-1">
              Title
            </label>
            <input
              id="adv-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="adv-short-desc" className="block text-sm font-medium text-slate-300 mb-1">
              Short Description
            </label>
            <input
              id="adv-short-desc"
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="adv-desc" className="block text-sm font-medium text-slate-300 mb-1">
              Full Description
            </label>
            <textarea
              id="adv-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="adv-difficulty" className="block text-sm font-medium text-slate-300 mb-1">
                Difficulty
              </label>
              <select
                id="adv-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label htmlFor="adv-duration" className="block text-sm font-medium text-slate-300 mb-1">
                Duration (minutes)
              </label>
              <input
                id="adv-duration"
                type="number"
                min={15}
                max={480}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="adv-tags" className="block text-sm font-medium text-slate-300 mb-1">
              Tags (comma-separated)
            </label>
            <input
              id="adv-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="history, colonial, spanish"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500"
              aria-label="Feature this adventure on the home page"
            />
            <span className="text-sm text-slate-300">Featured on home page</span>
          </label>

          <button
            onClick={handleSave}
            disabled={saveState === "saving"}
            className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold text-sm transition-colors min-h-[44px]"
            aria-live="polite"
            aria-label={
              saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                ? "Saved!"
                : "Save changes"
            }
          >
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
              ? "✓ Saved"
              : "Save Changes"}
          </button>
        </div>
      </section>

      {/* Stops */}
      <section aria-labelledby="stops-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="stops-heading" className="text-lg font-semibold text-white">
            Stops ({stops.length})
          </h2>
          <Link
            href={`/admin/adventures/${id}/stops/new`}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors min-h-[44px] inline-flex items-center"
          >
            + Add Stop
          </Link>
        </div>

        {stops.length === 0 ? (
          <p className="text-slate-400 text-sm">No stops yet. Add the first one.</p>
        ) : (
          <ol className="space-y-2" aria-label="Adventure stops">
            {stops
              .sort((a, b) => a.order_index - b.order_index)
              .map((stop, idx) => (
                <li
                  key={stop.id}
                  className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-3"
                >
                  <span
                    className="w-6 h-6 rounded-full bg-slate-600 text-white text-xs flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {stop.title}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {stop.points} pts · {stop.gps_radius_meters}m radius
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/admin/adventures/${id}/stops/${stop.id}`}
                      className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 min-h-[44px] inline-flex items-center"
                      aria-label={`Edit stop ${stop.title}`}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteStop(stop.id, stop.title)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 min-h-[44px]"
                      aria-label={`Delete stop ${stop.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
          </ol>
        )}
      </section>
    </main>
  );
}
