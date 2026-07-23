"use client";

import React, { useEffect, useState } from "react";
import { listAdventures, type Adventure } from "@/lib/api";
import Link from "next/link";

export default function AdminDashboard() {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAdventures(false).then(setAdventures).finally(() => setLoading(false));
  }, []);

  const published = adventures.filter((a) => a.is_published).length;
  const draft = adventures.length - published;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-white font-bold text-2xl">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">St. Augustine TimeQuest — Admin Portal</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Adventures", value: adventures.length, icon: "🗺" },
          { label: "Published", value: published, icon: "✅" },
          { label: "Drafts", value: draft, icon: "📝" },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5"
          >
            <p className="text-2xl mb-1" aria-hidden="true">{icon}</p>
            <p className="text-white text-2xl font-bold">{loading ? "—" : value}</p>
            <p className="text-slate-400 text-sm">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent adventures */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold">Adventures</h2>
          <Link
            href="/admin/adventures"
            className="text-amber-400 text-sm hover:underline"
          >
            View all →
          </Link>
        </div>
        {loading ? (
          <p className="text-slate-400 text-sm" role="status">Loading…</p>
        ) : (
          <div className="space-y-2">
            {adventures.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href={`/admin/adventures/${a.id}`}
                className="flex items-center justify-between bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-4 py-3 transition-colors min-h-[52px] focus-visible:outline-amber-500"
              >
                <div>
                  <p className="text-white font-medium text-sm">{a.title}</p>
                  <p className="text-slate-500 text-xs">{a.difficulty} · {a.estimated_duration_minutes} min</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    a.is_published ? "bg-green-900/40 text-green-400" : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {a.is_published ? "Published" : "Draft"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
