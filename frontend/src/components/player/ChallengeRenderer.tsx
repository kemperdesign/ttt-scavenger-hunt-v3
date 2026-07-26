"use client";

import { useState, useEffect } from "react";
import { submitChallenge, getCharacterDetail, type Challenge } from "@/lib/api";
import PhotoChallengeCapture from "./PhotoChallengeCapture";
import AIConversationChallenge from "./AIConversationChallenge";
import BranchingStoryChallenge from "./BranchingStoryChallenge";

interface ChallengeRendererProps {
  challenge: Challenge;
  sessionId: string;
  isComplete: boolean;
  onComplete: (pointsEarned: number) => void;
  /** Admin preview mode — surfaces debug info (e.g. AI retrieval sources) not shown to real players. */
  isPreview?: boolean;
}

export function ChallengeRenderer({ challenge, sessionId, isComplete, onComplete, isPreview = false }: ChallengeRendererProps) {
  if (isComplete) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm">
        <span aria-hidden="true">✓</span>
        <span>{challenge.title} — complete</span>
      </div>
    );
  }

  switch (challenge.challenge_type) {
    case "multiple_choice":
      return <MultipleChoiceChallenge challenge={challenge} sessionId={sessionId} onComplete={onComplete} />;
    case "text_answer":
      return <TextAnswerChallenge challenge={challenge} sessionId={sessionId} onComplete={onComplete} />;
    case "sequence_puzzle":
      return <SequencePuzzleChallenge challenge={challenge} sessionId={sessionId} onComplete={onComplete} />;
    case "qr_code":
      return <QRCodeChallenge challenge={challenge} sessionId={sessionId} onComplete={onComplete} />;
    case "photo_submission":
      return (
        <PhotoChallengeCapture
          challengeId={challenge.id}
          sessionId={sessionId}
          prompt={challenge.prompt || challenge.title}
          onSuccess={onComplete}
        />
      );
    case "ai_conversation":
      return (
        <AIConversationWrapper
          challenge={challenge}
          sessionId={sessionId}
          onComplete={onComplete}
          isPreview={isPreview}
        />
      );
    case "branching_story":
      return (
        <BranchingStoryChallenge
          config={challenge.config}
          characterName={challenge.title || "Story"}
          points={challenge.points}
          onComplete={() => {
            submitChallenge(challenge.id, { completed: true }, sessionId).catch(() => {});
            onComplete(challenge.points);
          }}
        />
      );
    default:
      return null;
  }
}

function AIConversationWrapper({
  challenge,
  sessionId,
  onComplete,
  isPreview,
}: {
  challenge: Challenge;
  sessionId: string;
  onComplete: (points: number) => void;
  isPreview: boolean;
}) {
  const [characterName, setCharacterName] = useState<string>("");
  const characterId = (challenge.config.character_id as string) || "";

  useEffect(() => {
    if (!characterId) return;
    getCharacterDetail(characterId)
      .then((c) => setCharacterName(c.display_name))
      .catch(() => setCharacterName(characterId));
  }, [characterId]);

  if (!characterId || !characterName) {
    return <p className="text-slate-400 text-sm">Loading conversation…</p>;
  }

  return (
    <AIConversationChallenge
      challengeId={challenge.id}
      sessionId={sessionId}
      characterName={characterName}
      minExchanges={(challenge.config.min_exchanges as number) || 3}
      topic={challenge.config.topic as string | undefined}
      points={challenge.points}
      onComplete={() => onComplete(challenge.points)}
      showDebugPanel={isPreview}
    />
  );
}

function ChallengeShell({
  challenge,
  children,
}: {
  challenge: Challenge;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3">
      <div>
        <h3 className="text-white font-semibold text-sm">{challenge.title}</h3>
        {challenge.prompt && <p className="text-slate-300 text-sm mt-1">{challenge.prompt}</p>}
      </div>
      {children}
    </div>
  );
}

function MultipleChoiceChallenge({
  challenge,
  sessionId,
  onComplete,
}: {
  challenge: Challenge;
  sessionId: string;
  onComplete: (points: number) => void;
}) {
  const options = (challenge.config.options as string[]) || [];
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  const handleSubmit = async () => {
    if (selected === null) return;
    setSubmitting(true);
    try {
      const result = await submitChallenge(challenge.id, { selected_index: selected }, sessionId);
      setFeedback({ correct: result.is_correct, message: result.feedback });
      if (result.is_correct) {
        onComplete(result.points_earned);
      }
    } catch {
      setFeedback({ correct: false, message: "Submission failed. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ChallengeShell challenge={challenge}>
      <div className="space-y-2" role="radiogroup" aria-label={challenge.prompt || challenge.title}>
        {options.map((opt, i) => (
          <button
            key={i}
            role="radio"
            aria-checked={selected === i}
            onClick={() => setSelected(i)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-colors min-h-[44px] ${
              selected === i
                ? "bg-amber-900/40 border-amber-500 text-amber-200"
                : "bg-slate-700 border-slate-600 text-slate-200 hover:border-slate-500"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {feedback && (
        <p role="status" className={`text-sm ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
          {feedback.message}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={selected === null || submitting}
        className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-medium text-sm rounded-lg min-h-[44px]"
      >
        {submitting ? "Checking…" : "Submit Answer"}
      </button>
    </ChallengeShell>
  );
}

function TextAnswerChallenge({
  challenge,
  sessionId,
  onComplete,
}: {
  challenge: Challenge;
  sessionId: string;
  onComplete: (points: number) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const result = await submitChallenge(challenge.id, { answer: answer.trim() }, sessionId);
      setFeedback({ correct: result.is_correct, message: result.feedback });
      if (result.is_correct) {
        onComplete(result.points_earned);
      }
    } catch {
      setFeedback({ correct: false, message: "Submission failed. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ChallengeShell challenge={challenge}>
      <label htmlFor={`answer-${challenge.id}`} className="sr-only">Your answer</label>
      <input
        id={`answer-${challenge.id}`}
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Type your answer…"
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      {feedback && (
        <p role="status" className={`text-sm ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
          {feedback.message}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || submitting}
        className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-medium text-sm rounded-lg min-h-[44px]"
      >
        {submitting ? "Checking…" : "Submit Answer"}
      </button>
    </ChallengeShell>
  );
}

function SequencePuzzleChallenge({
  challenge,
  sessionId,
  onComplete,
}: {
  challenge: Challenge;
  sessionId: string;
  onComplete: (points: number) => void;
}) {
  const initialItems = (challenge.config.items as string[]) || [];
  const [order, setOrder] = useState(initialItems);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await submitChallenge(challenge.id, { order }, sessionId);
      setFeedback({ correct: result.is_correct, message: result.feedback });
      if (result.is_correct) {
        onComplete(result.points_earned);
      }
    } catch {
      setFeedback({ correct: false, message: "Submission failed. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ChallengeShell challenge={challenge}>
      <ol className="space-y-2" aria-label="Reorder these items into the correct sequence">
        {order.map((item, i) => (
          <li key={item} className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
            <span className="text-slate-400 text-xs w-4 shrink-0">{i + 1}</span>
            <span className="flex-1 text-sm text-white">{item}</span>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move "${item}" up`}
                className="min-h-[32px] min-w-[32px] text-slate-300 hover:text-white disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                aria-label={`Move "${item}" down`}
                className="min-h-[32px] min-w-[32px] text-slate-300 hover:text-white disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ol>
      {feedback && (
        <p role="status" className={`text-sm ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
          {feedback.message}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-medium text-sm rounded-lg min-h-[44px]"
      >
        {submitting ? "Checking…" : "Submit Order"}
      </button>
    </ChallengeShell>
  );
}

function QRCodeChallenge({
  challenge,
  sessionId,
  onComplete,
}: {
  challenge: Challenge;
  sessionId: string;
  onComplete: (points: number) => void;
}) {
  const locationHint = challenge.config.location_hint as string | undefined;
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const result = await submitChallenge(challenge.id, { code: code.trim() }, sessionId);
      setFeedback({ correct: result.is_correct, message: result.feedback });
      if (result.is_correct) {
        onComplete(result.points_earned);
      }
    } catch {
      setFeedback({ correct: false, message: "Submission failed. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ChallengeShell challenge={challenge}>
      {locationHint && <p className="text-slate-400 text-xs">{locationHint}</p>}
      <label htmlFor={`qr-${challenge.id}`} className="sr-only">Scanned code</label>
      <input
        id={`qr-${challenge.id}`}
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Enter the code from the QR label…"
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      {feedback && (
        <p role="status" className={`text-sm ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
          {feedback.message}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!code.trim() || submitting}
        className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-medium text-sm rounded-lg min-h-[44px]"
      >
        {submitting ? "Checking…" : "Verify Code"}
      </button>
    </ChallengeShell>
  );
}
