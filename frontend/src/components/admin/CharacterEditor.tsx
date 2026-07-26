"use client";

import { useState } from "react";
import type { AiCharacterDetail, AiCharacterInput } from "@/lib/api";

interface CharacterEditorProps {
  character: AiCharacterDetail | null; // null = creating a new character
  onSave: (data: AiCharacterInput) => Promise<void>;
  onClose: () => void;
}

const SLUG_PATTERN = /^[a-z][a-z0-9_]{2,49}$/;

export function CharacterEditor({ character, onSave, onClose }: CharacterEditorProps) {
  const isNew = character === null;

  const [id, setId] = useState(character?.id ?? "");
  const [name, setName] = useState(character?.name ?? "");
  const [displayName, setDisplayName] = useState(character?.display_name ?? "");
  const [era, setEra] = useState(character?.era ?? "");
  const [personality, setPersonality] = useState(character?.personality ?? "");
  const [systemPrompt, setSystemPrompt] = useState(character?.system_prompt ?? "");
  const [uncertaintyPhrase, setUncertaintyPhrase] = useState(character?.uncertainty_phrase ?? "");
  const [greeting, setGreeting] = useState(character?.greeting ?? "");
  const [sourceTopics, setSourceTopics] = useState(
    (character?.source_topics ?? []).join(", ")
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");

    if (isNew && !SLUG_PATTERN.test(id)) {
      setError(
        "Character ID must be lowercase letters, numbers, and underscores (3-50 chars), starting with a letter — e.g. 'town_crier'"
      );
      return;
    }
    if (!name.trim() || !displayName.trim() || !era.trim() || !personality.trim() || !systemPrompt.trim() || !uncertaintyPhrase.trim() || !greeting.trim()) {
      setError("All fields except source topics are required.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id,
        name: name.trim(),
        display_name: displayName.trim(),
        era: era.trim(),
        personality: personality.trim(),
        system_prompt: systemPrompt.trim(),
        uncertainty_phrase: uncertaintyPhrase.trim(),
        greeting: greeting.trim(),
        source_topics: sourceTopics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onClose();
    } catch {
      setError("Failed to save character. The ID may already be in use.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-editor-title"
    >
      <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <h2 id="character-editor-title" className="text-lg font-bold text-white mb-4">
          {isNew ? "New AI Character" : `Edit ${character.display_name}`}
        </h2>

        {error && (
          <div role="alert" className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="char-id" className="block text-sm font-medium text-slate-300 mb-1">
              Character ID (slug)
            </label>
            <input
              id="char-id"
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value.toLowerCase())}
              disabled={!isNew}
              placeholder="town_crier"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono disabled:opacity-60"
            />
            {!isNew && (
              <p className="text-xs text-slate-500 mt-1">
                ID can&apos;t be changed after creation (challenges reference it directly).
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="char-name" className="block text-sm font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                id="char-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Josiah the Town Crier"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label htmlFor="char-display-name" className="block text-sm font-medium text-slate-300 mb-1">
                Display Name
              </label>
              <input
                id="char-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Josiah"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="char-era" className="block text-sm font-medium text-slate-300 mb-1">
              Era
            </label>
            <input
              id="char-era"
              type="text"
              value={era}
              onChange={(e) => setEra(e.target.value)}
              placeholder="Spanish Colonial (c. 1750)"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label htmlFor="char-personality" className="block text-sm font-medium text-slate-300 mb-1">
              Personality (short description shown in admin/player UI)
            </label>
            <textarea
              id="char-personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
            />
          </div>

          <div>
            <label htmlFor="char-system-prompt" className="block text-sm font-medium text-slate-300 mb-1">
              System Prompt (defines the character&apos;s knowledge, voice, and boundaries)
            </label>
            <textarea
              id="char-system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={10}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono resize-y"
            />
          </div>

          <div>
            <label htmlFor="char-uncertainty" className="block text-sm font-medium text-slate-300 mb-1">
              Uncertainty Phrase (used when the character isn&apos;t sure of an answer)
            </label>
            <input
              id="char-uncertainty"
              type="text"
              value={uncertaintyPhrase}
              onChange={(e) => setUncertaintyPhrase(e.target.value)}
              placeholder="I cannot say for certain, but..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label htmlFor="char-greeting" className="block text-sm font-medium text-slate-300 mb-1">
              Greeting (first message players see)
            </label>
            <textarea
              id="char-greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
            />
          </div>

          <div>
            <label htmlFor="char-topics" className="block text-sm font-medium text-slate-300 mb-1">
              Knowledge Source Topics (comma-separated — used to pull relevant historical context for this character)
            </label>
            <input
              id="char-topics"
              type="text"
              value={sourceTopics}
              onChange={(e) => setSourceTopics(e.target.value)}
              placeholder="castillo_de_san_marcos, colonial_daily_life, spanish_florida"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-medium text-sm rounded-lg min-h-[44px]"
          >
            {saving ? "Saving…" : isNew ? "Create Character" : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-600 text-slate-300 text-sm rounded-lg min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
