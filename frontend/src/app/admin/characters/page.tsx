"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  listCharacters,
  getCharacterDetail,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  type AiCharacter,
  type AiCharacterDetail,
  type AiCharacterInput,
} from "@/lib/api";
import { CharacterEditor } from "@/components/admin/CharacterEditor";

export default function AdminCharactersPage() {
  const [characters, setCharacters] = useState<AiCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AiCharacterDetail | null | "new">(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await listCharacters();
      setCharacters(data);
    } catch {
      setErrorMsg("Failed to load characters.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEdit = async (id: string) => {
    setErrorMsg("");
    try {
      const detail = await getCharacterDetail(id);
      setEditing(detail);
    } catch {
      setErrorMsg("Failed to load character details.");
    }
  };

  const handleDelete = async (id: string, displayName: string) => {
    if (!confirm(`Delete "${displayName}"? Any challenges or stops referencing this character will break.`)) return;
    try {
      await deleteCharacter(id);
      setCharacters((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setErrorMsg("Failed to delete character.");
    }
  };

  const handleSave = async (data: AiCharacterInput) => {
    if (editing === "new") {
      await createCharacter(data);
    } else {
      const { id, ...updates } = data;
      await updateCharacter(id, updates);
    }
    await load();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">AI Characters</h1>
          <p className="text-slate-400 text-sm mt-1">
            Historical characters available for AI Historian chats — create, edit, and manage system prompts here.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium px-4 py-2 rounded-lg min-h-[44px]"
        >
          + New Character
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400" role="status">Loading…</p>
      ) : characters.length === 0 ? (
        <p className="text-slate-500 text-sm">No characters yet. Create the first one.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2" role="list">
          {characters.map((c) => (
            <div
              key={c.id}
              role="listitem"
              className="bg-slate-900 border border-slate-800 hover:border-amber-700 rounded-xl p-5 transition-colors"
            >
              <button
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                className="text-left w-full focus-visible:outline-amber-500"
                aria-expanded={expandedId === c.id}
                aria-label={`${c.display_name} — ${c.era}. ${expandedId === c.id ? "Click to collapse" : "Click to expand"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-white font-semibold">{c.display_name}</h2>
                    <p className="text-amber-400 text-xs mt-0.5">{c.era}</p>
                  </div>
                  <span className="text-slate-600 text-xs font-mono">{c.id}</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{c.personality}</p>
                {expandedId === c.id && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Greeting</p>
                      <p className="text-slate-300 text-sm italic">&ldquo;{c.greeting}&rdquo;</p>
                    </div>
                  </div>
                )}
              </button>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleEdit(c.id)}
                  className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg min-h-[36px]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.display_name)}
                  className="flex-1 text-xs bg-red-900/40 hover:bg-red-900/60 text-red-300 px-3 py-1.5 rounded-lg min-h-[36px]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <CharacterEditor
          character={editing === "new" ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
