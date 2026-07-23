"use client";

import React, { useEffect, useState } from "react";
import { listCharacters } from "@/lib/api";

interface Character {
  id: string;
  name: string;
  display_name: string;
  era: string;
  personality: string;
  greeting: string;
}

export default function AdminCharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Character | null>(null);

  useEffect(() => {
    listCharacters().then(setCharacters).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-white font-bold text-2xl">AI Characters</h1>
        <p className="text-slate-400 text-sm mt-1">
          Historical characters available for AI Historian chats. Edit system prompts in{" "}
          <code className="bg-slate-800 px-1 rounded text-xs">app/ai/characters.py</code>.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-400" role="status">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2" role="list">
          {characters.map((c) => (
            <button
              key={c.id}
              role="listitem"
              onClick={() => setSelected(selected?.id === c.id ? null : c)}
              className="text-left bg-slate-900 border border-slate-800 hover:border-amber-700 rounded-xl p-5 transition-colors focus-visible:outline-amber-500"
              aria-expanded={selected?.id === c.id}
              aria-label={`${c.display_name} — ${c.era}. ${selected?.id === c.id ? "Click to collapse" : "Click to expand"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-white font-semibold">{c.display_name}</h2>
                  <p className="text-amber-400 text-xs mt-0.5">{c.era}</p>
                </div>
                <span className="text-slate-600 text-xs font-mono">{c.id}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{c.personality}</p>
              {selected?.id === c.id && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Greeting</p>
                    <p className="text-slate-300 text-sm italic">&ldquo;{c.greeting}&rdquo;</p>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
