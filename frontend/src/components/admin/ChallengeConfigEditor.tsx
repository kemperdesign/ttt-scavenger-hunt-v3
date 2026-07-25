"use client";

import { useCallback, useState } from "react";
import type { Challenge } from "@/lib/api";

interface ChallengeConfigEditorProps {
  challenge: Challenge;
  onSave: (config: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

export function ChallengeConfigEditor({
  challenge,
  onSave,
  onClose,
}: ChallengeConfigEditorProps) {
  const [config, setConfig] = useState(challenge.config || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(config);
      onClose();
    } catch {
      setError("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }, [config, onSave, onClose]);

  const updateConfig = (updates: Record<string, unknown>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-title"
    >
      <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <h2 id="config-title" className="text-lg font-bold text-white mb-4">
          Configure {challenge.challenge_type.replace(/_/g, " ")}
        </h2>

        {error && (
          <div
            role="alert"
            className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm mb-4"
          >
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {/* Update challenge title and prompt */}
          <div>
            <label htmlFor="ch-title" className="block text-sm font-medium text-slate-300 mb-1">
              Challenge Title
            </label>
            <input
              id="ch-title"
              type="text"
              value={challenge.title}
              disabled
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm opacity-60"
            />
          </div>

          <div>
            <label htmlFor="ch-prompt" className="block text-sm font-medium text-slate-300 mb-1">
              Challenge Prompt/Question
            </label>
            <textarea
              id="ch-prompt"
              value={challenge.prompt}
              disabled
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm opacity-60 resize-none"
            />
          </div>

          {/* Type-specific config forms */}
          {challenge.challenge_type === "multiple_choice" && (
            <MultipleChoiceConfig config={config} onUpdate={updateConfig} />
          )}
          {challenge.challenge_type === "text_answer" && (
            <TextAnswerConfig config={config} onUpdate={updateConfig} />
          )}
          {challenge.challenge_type === "sequence_puzzle" && (
            <SequencePuzzleConfig config={config} onUpdate={updateConfig} />
          )}
          {challenge.challenge_type === "qr_code" && (
            <QRCodeConfig config={config} onUpdate={updateConfig} />
          )}
          {challenge.challenge_type === "ai_conversation" && (
            <AIConversationConfig config={config} onUpdate={updateConfig} />
          )}
          {challenge.challenge_type === "branching_story" && (
            <BranchingStoryConfig config={config} onUpdate={updateConfig} />
          )}
          {challenge.challenge_type === "photo_submission" && (
            <PhotoSubmissionConfig config={config} onUpdate={updateConfig} />
          )}
          {challenge.challenge_type === "gps_checkin" && (
            <GPSCheckinConfig config={config} onUpdate={updateConfig} />
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-medium text-sm rounded-lg min-h-[44px]"
          >
            {saving ? "Saving…" : "Save Configuration"}
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

// ── Type-specific config components ────────────────────────────────────

function MultipleChoiceConfig({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const options = (config.options as string[]) || [""];
  const correctIndex = config.correct_index as number | undefined;
  const explanation = (config.explanation as string) || "";

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Answer Options</label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="radio"
                name="correct-index"
                checked={correctIndex === i}
                onChange={() => onUpdate({ correct_index: i })}
                className="mt-2.5"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[i] = e.target.value;
                  onUpdate({ options: newOptions });
                }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              />
              {options.length > 1 && (
                <button
                  onClick={() => {
                    const newOptions = options.filter((_, idx) => idx !== i);
                    onUpdate({
                      options: newOptions,
                      correct_index: correctIndex === i ? 0 : correctIndex,
                    });
                  }}
                  className="text-red-400 hover:text-red-300 text-sm px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => onUpdate({ options: [...options, ""] })}
          className="mt-2 text-sm text-amber-400 hover:text-amber-300"
        >
          + Add Option
        </button>
      </div>

      <div>
        <label htmlFor="explanation" className="block text-sm font-medium text-slate-300 mb-1">
          Explanation (shown when correct)
        </label>
        <textarea
          id="explanation"
          value={explanation}
          onChange={(e) => onUpdate({ explanation: e.target.value })}
          rows={2}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
        />
      </div>
    </>
  );
}

function TextAnswerConfig({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const answers = (config.accepted_answers as string[]) || [""];
  const caseSensitive = (config.case_sensitive as boolean) || false;

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Accepted Answers (any match succeeds)
        </label>
        <div className="space-y-2">
          {answers.map((ans, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={ans}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[i] = e.target.value;
                  onUpdate({ accepted_answers: newAnswers });
                }}
                placeholder={`Answer ${i + 1}`}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              />
              {answers.length > 1 && (
                <button
                  onClick={() => onUpdate({ accepted_answers: answers.filter((_, idx) => idx !== i) })}
                  className="text-red-400 hover:text-red-300 text-sm px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => onUpdate({ accepted_answers: [...answers, ""] })}
          className="mt-2 text-sm text-amber-400 hover:text-amber-300"
        >
          + Add Answer
        </button>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => onUpdate({ case_sensitive: e.target.checked })}
          className="w-4 h-4"
        />
        <span className="text-sm text-slate-300">Case sensitive matching</span>
      </label>
    </>
  );
}

function SequencePuzzleConfig({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const items = (config.items as string[]) || [""];
  const correctOrder = (config.correct_order as string[]) || [];

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Items to Order</label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[i] = e.target.value;
                  onUpdate({ items: newItems });
                }}
                placeholder={`Item ${i + 1}`}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              />
              {items.length > 1 && (
                <button
                  onClick={() => onUpdate({ items: items.filter((_, idx) => idx !== i) })}
                  className="text-red-400 hover:text-red-300 text-sm px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => onUpdate({ items: [...items, ""] })}
          className="mt-2 text-sm text-amber-400 hover:text-amber-300"
        >
          + Add Item
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Correct order is the current order of items above. Reorder the items above to set the sequence.
      </p>
    </>
  );
}

function QRCodeConfig({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const expectedCode = (config.expected_code as string) || "";
  const locationHint = (config.location_hint as string) || "";

  return (
    <>
      <div>
        <label htmlFor="expected-code" className="block text-sm font-medium text-slate-300 mb-1">
          Expected QR Code Value
        </label>
        <input
          id="expected-code"
          type="text"
          value={expectedCode}
          onChange={(e) => onUpdate({ expected_code: e.target.value })}
          placeholder="e.g., https://example.com or HISTORIC-MARKER-001"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
        />
      </div>

      <div>
        <label htmlFor="location-hint" className="block text-sm font-medium text-slate-300 mb-1">
          Location Hint (shown if scan fails)
        </label>
        <textarea
          id="location-hint"
          value={locationHint}
          onChange={(e) => onUpdate({ location_hint: e.target.value })}
          rows={2}
          placeholder="e.g., Look for a QR code on the east wall..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
        />
      </div>
    </>
  );
}

function AIConversationConfig({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const characterId = (config.character_id as string) || "spanish_colonial_guide";
  const minExchanges = (config.min_exchanges as number) || 3;
  const topic = (config.topic as string) || "";

  const characters = [
    "spanish_colonial_guide",
    "pedro_menendez",
    "henry_flagler",
    "pirate_captain",
    "victorian_tourist",
    "colonial_shopkeeper",
    "civil_rights_guide",
  ];

  return (
    <>
      <div>
        <label htmlFor="character-id" className="block text-sm font-medium text-slate-300 mb-1">
          AI Character
        </label>
        <select
          id="character-id"
          value={characterId}
          onChange={(e) => onUpdate({ character_id: e.target.value })}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
        >
          {characters.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="min-exchanges" className="block text-sm font-medium text-slate-300 mb-1">
          Minimum Message Exchanges
        </label>
        <input
          id="min-exchanges"
          type="number"
          min="1"
          max="20"
          value={minExchanges}
          onChange={(e) => onUpdate({ min_exchanges: parseInt(e.target.value) })}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
        />
      </div>

      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-1">
          Conversation Topic (optional)
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => onUpdate({ topic: e.target.value })}
          placeholder="e.g., Ask about the colonial era"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
        />
      </div>
    </>
  );
}

function BranchingStoryConfig({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  return (
    <div className="p-3 bg-slate-700/50 rounded border border-slate-600 text-sm text-slate-300">
      <p className="mb-2">
        <strong>Note:</strong> Branching story config is complex. It requires defining choice nodes and
        transitions. For now, the story will auto-complete after a player reads it.
      </p>
      <p>Full story branching editor coming soon.</p>
    </div>
  );
}

function PhotoSubmissionConfig({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const requiresReview = (config.requires_review as boolean) !== false;
  const subjectHint = (config.subject_hint as string) || "";

  return (
    <>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={requiresReview}
          onChange={(e) => onUpdate({ requires_review: e.target.checked })}
          className="w-4 h-4"
        />
        <span className="text-sm text-slate-300">Requires admin review before points awarded</span>
      </label>

      <div>
        <label htmlFor="subject-hint" className="block text-sm font-medium text-slate-300 mb-1">
          What to Photograph (hint for player)
        </label>
        <textarea
          id="subject-hint"
          value={subjectHint}
          onChange={(e) => onUpdate({ subject_hint: e.target.value })}
          rows={2}
          placeholder="e.g., Take a photo of the historic marker showing the year 1565"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
        />
      </div>
    </>
  );
}

function GPSCheckinConfig({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const radiusOverride = (config.radius_override as number | null) || null;

  return (
    <div>
      <label htmlFor="radius-override" className="block text-sm font-medium text-slate-300 mb-1">
        GPS Radius Override (meters, optional)
      </label>
      <input
        id="radius-override"
        type="number"
        min="10"
        max="500"
        value={radiusOverride || ""}
        onChange={(e) =>
          onUpdate({
            radius_override: e.target.value ? parseInt(e.target.value) : null,
          })
        }
        placeholder="Leave empty to use stop's radius"
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
      />
      <p className="text-xs text-slate-400 mt-1">
        If set, this overrides the stop's GPS radius just for this challenge.
      </p>
    </div>
  );
}
