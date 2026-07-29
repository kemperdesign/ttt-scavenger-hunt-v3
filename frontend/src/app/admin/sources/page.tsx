"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  listSources,
  createSource,
  updateSource,
  deleteSource,
  type SourceDocument,
} from "@/lib/api";

const RIGHTS_OPTIONS = ["unknown", "public_domain", "cc_licensed", "fair_use", "permission_granted"];
const RELIABILITY_OPTIONS = ["unreviewed", "primary", "peer_reviewed", "secondary", "popular"];
const REVIEW_OPTIONS = ["pending", "approved", "rejected"];

const REVIEW_COLORS: Record<string, string> = {
  approved: "bg-green-900/40 text-green-400",
  rejected: "bg-red-900/40 text-red-400",
  pending: "bg-amber-900/40 text-amber-400",
};

const BLANK: Partial<SourceDocument> = {
  title: "",
  author: "",
  publication_date: "",
  url: "",
  local_filename: "",
  rights_status: "unknown",
  reliability: "unreviewed",
  locations_covered: [],
  periods_covered: [],
  review_status: "pending",
  reviewer: "",
  notes: "",
};

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editing, setEditing] = useState<Partial<SourceDocument> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null); // null = new
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listSources(filterStatus || undefined);
      setSources(data);
    } catch {
      setError("Failed to load sources.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditingId(null); setEditing({ ...BLANK }); };
  const openEdit = (s: SourceDocument) => { setEditingId(s.id); setEditing({ ...s }); };
  const closeForm = () => { setEditing(null); setEditingId(null); };

  const handleSave = async () => {
    if (!editing || !editing.title?.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (editingId === null) {
        const created = await createSource(editing);
        setSources((prev) => [...prev, created].sort((a, b) => a.title.localeCompare(b.title)));
      } else {
        const updated = await updateSource(editingId, editing);
        setSources((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      }
      closeForm();
    } catch {
      setError("Failed to save source.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: SourceDocument) => {
    if (!confirm(`Delete "${s.title}"?`)) return;
    setError("");
    try {
      await deleteSource(s.id);
      setSources((prev) => prev.filter((x) => x.id !== s.id));
    } catch {
      setError("Failed to delete source.");
    }
  };

  const handleReviewToggle = async (s: SourceDocument) => {
    const next = s.review_status === "approved" ? "pending" : "approved";
    setError("");
    try {
      const updated = await updateSource(s.id, { review_status: next });
      setSources((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
    } catch {
      setError("Failed to update review status.");
    }
  };

  const field = (key: keyof SourceDocument) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setEditing((prev) => prev ? { ...prev, [key]: e.target.value } : prev);

  const listField = (key: "locations_covered" | "periods_covered") => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
    setEditing((prev) => prev ? { ...prev, [key]: val } : prev);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-bold text-2xl">Source Register</h1>
          <p className="text-slate-400 text-sm mt-1">
            Provenance and review tracking for St. Augustine historical sources.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700"
          >
            <option value="">All statuses</option>
            {REVIEW_OPTIONS.map((r) => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={openNew}
            className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + Add Source
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Edit / Create form */}
      {editing && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-lg">
            {editingId === null ? "New Source" : "Edit Source"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-slate-400 text-xs block mb-1">Title *</label>
              <input
                value={editing.title ?? ""}
                onChange={field("title")}
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Author</label>
              <input value={editing.author ?? ""} onChange={field("author")}
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Publication Date</label>
              <input value={editing.publication_date ?? ""} onChange={field("publication_date")} placeholder="e.g. 1998, 1998-04"
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">URL</label>
              <input value={editing.url ?? ""} onChange={field("url")}
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Local Filename (data/sources/)</label>
              <input value={editing.local_filename ?? ""} onChange={field("local_filename")}
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Rights Status</label>
              <select value={editing.rights_status ?? "unknown"} onChange={field("rights_status")}
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none">
                {RIGHTS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Reliability</label>
              <select value={editing.reliability ?? "unreviewed"} onChange={field("reliability")}
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none">
                {RELIABILITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Review Status</label>
              <select value={editing.review_status ?? "pending"} onChange={field("review_status")}
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none">
                {REVIEW_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Reviewer</label>
              <input value={editing.reviewer ?? ""} onChange={field("reviewer")}
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Locations Covered (comma-separated)</label>
              <input
                value={(editing.locations_covered ?? []).join(", ")}
                onChange={listField("locations_covered")}
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Periods Covered (comma-separated)</label>
              <input
                value={(editing.periods_covered ?? []).join(", ")}
                onChange={listField("periods_covered")}
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-slate-400 text-xs block mb-1">Notes</label>
              <textarea value={editing.notes ?? ""} onChange={field("notes")} rows={3}
                className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !editing.title?.trim()}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={closeForm} className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-4 py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400" role="status">Loading…</p>
      ) : sources.length === 0 ? (
        <p className="text-slate-500 text-sm">No sources found. Add the first one above.</p>
      ) : (
        <div className="space-y-3">
          {sources.map((s) => (
            <div key={s.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{s.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REVIEW_COLORS[s.review_status] ?? "bg-slate-700 text-slate-400"}`}>
                      {s.review_status}
                    </span>
                    {s.ingested && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 font-medium">ingested</span>
                    )}
                  </div>
                  <div className="text-slate-400 text-xs mt-1 space-x-3">
                    {s.author && <span>{s.author}</span>}
                    {s.publication_date && <span>{s.publication_date}</span>}
                    <span className="capitalize">{s.reliability}</span>
                    <span className="capitalize">{s.rights_status.replace("_", " ")}</span>
                  </div>
                  {(s.locations_covered.length > 0 || s.periods_covered.length > 0) && (
                    <div className="text-slate-500 text-xs mt-1">
                      {[...s.locations_covered, ...s.periods_covered].join(" · ")}
                    </div>
                  )}
                  {s.notes && <div className="text-slate-500 text-xs mt-1 italic">{s.notes}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleReviewToggle(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg min-h-[36px] ${
                      s.review_status === "approved"
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        : "bg-green-900/40 hover:bg-green-900/60 text-green-300"
                    }`}
                  >
                    {s.review_status === "approved" ? "Unapprove" : "Approve"}
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg min-h-[36px]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-300 px-3 py-1.5 rounded-lg min-h-[36px]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
