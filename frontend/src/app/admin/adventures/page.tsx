"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  listAdventures,
  publishAdventure,
  unpublishAdventure,
  deleteAdventure,
  type Adventure,
} from "@/lib/api";

export default function AdminAdventuresPage() {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await listAdventures(false);
    setAdventures(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleTogglePublish = async (a: Adventure) => {
    if (a.is_published) {
      await unpublishAdventure(a.id);
    } else {
      await publishAdventure(a.id);
    }
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this adventure? This cannot be undone.")) return;
    await deleteAdventure(id);
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-white font-bold text-2xl">Adventures</h1>
        <Link
          href="/admin/adventures/new"
          className="min-h-[44px] px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold transition-colors focus-visible:outline-amber-300"
        >
          + New Adventure
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-400" role="status">Loading…</p>
      ) : (
        <div className="space-y-3" role="list" aria-label="Adventures list">
          {adventures.map((a) => (
            <div
              key={a.id}
              role="listitem"
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex gap-4 items-start"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/adventures/${a.id}`}
                  className="text-white font-semibold hover:text-amber-400 transition-colors text-sm focus-visible:outline-amber-500"
                >
                  {a.title}
                </Link>
                <p className="text-slate-500 text-xs mt-0.5">{a.slug} · {a.difficulty}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    a.is_published ? "bg-green-900/40 text-green-400" : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {a.is_published ? "Live" : "Draft"}
                </span>
                <button
                  onClick={() => handleTogglePublish(a)}
                  className="min-h-[36px] px-3 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors focus-visible:outline-amber-500"
                  aria-label={a.is_published ? `Unpublish ${a.title}` : `Publish ${a.title}`}
                >
                  {a.is_published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="min-h-[36px] px-3 rounded bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs transition-colors focus-visible:outline-red-500"
                  aria-label={`Delete ${a.title}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
