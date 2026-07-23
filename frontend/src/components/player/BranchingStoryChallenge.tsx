"use client";

import { useState, useEffect, useRef } from "react";

interface StoryNode {
  id: string;
  text: string;
  choices?: StoryChoice[];
  is_ending?: boolean;
  points_awarded?: number;
}

interface StoryChoice {
  label: string;
  next_node_id: string;
}

interface BranchingStoryChallengeProps {
  nodes: Record<string, StoryNode>;
  startNodeId: string;
  characterName: string;
  onComplete: (pointsEarned: number) => void;
  points: number;
}

export default function BranchingStoryChallenge({
  nodes,
  startNodeId,
  characterName,
  onComplete,
  points,
}: BranchingStoryChallengeProps) {
  const [currentNodeId, setCurrentNodeId] = useState(startNodeId);
  const [history, setHistory] = useState<string[]>([startNodeId]);
  const [isComplete, setIsComplete] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);

  const currentNode = nodes[currentNodeId];

  // Announce new story text to screen readers
  useEffect(() => {
    if (liveRegionRef.current && currentNode) {
      liveRegionRef.current.textContent = currentNode.text;
    }
  }, [currentNodeId, currentNode]);

  // Focus first choice after node changes
  useEffect(() => {
    if (choiceMade) {
      firstChoiceRef.current?.focus();
      setChoiceMade(false);
    }
  }, [currentNodeId, choiceMade]);

  const handleChoice = (nextNodeId: string) => {
    const nextNode = nodes[nextNodeId];
    if (!nextNode) return;

    setHistory((h) => [...h, nextNodeId]);
    setCurrentNodeId(nextNodeId);
    setChoiceMade(true);

    if (nextNode.is_ending) {
      setIsComplete(true);
      const earned = nextNode.points_awarded ?? points;
      onComplete(earned);
    }
  };

  const handleRestart = () => {
    setCurrentNodeId(startNodeId);
    setHistory([startNodeId]);
    setIsComplete(false);
    setChoiceMade(false);
  };

  if (!currentNode) {
    return (
      <div role="alert" className="text-red-400 text-sm p-4 bg-red-900/30 rounded-xl">
        Story data error — node &quot;{currentNodeId}&quot; not found.
      </div>
    );
  }

  return (
    <section
      aria-labelledby="story-heading"
      className="bg-slate-800 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-slate-700 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">📖</span>
        <div>
          <h3 id="story-heading" className="font-semibold text-white text-sm">
            {characterName}&apos;s Story
          </h3>
          <p className="text-slate-400 text-xs">
            Step {history.length} of your journey
          </p>
        </div>
      </div>

      {/* Live region for SR */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Story text */}
      <div className="p-5">
        <p className="text-slate-100 leading-relaxed text-sm">
          {currentNode.text}
        </p>
      </div>

      {/* Choices */}
      {!currentNode.is_ending && currentNode.choices && currentNode.choices.length > 0 && (
        <div
          className="px-5 pb-5 space-y-2"
          role="group"
          aria-label="Your choices"
        >
          <p className="text-slate-400 text-xs mb-3 font-medium uppercase tracking-wide">
            What do you do?
          </p>
          {currentNode.choices.map((choice, idx) => (
            <button
              key={choice.next_node_id}
              ref={idx === 0 ? firstChoiceRef : undefined}
              onClick={() => handleChoice(choice.next_node_id)}
              className="w-full text-left bg-slate-700 hover:bg-amber-900/40 border border-slate-600 hover:border-amber-600 text-white rounded-xl px-4 py-3 text-sm transition-colors min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
              aria-label={`Choose: ${choice.label}`}
            >
              <span className="text-amber-400 mr-2" aria-hidden="true">›</span>
              {choice.label}
            </button>
          ))}
        </div>
      )}

      {/* Ending */}
      {currentNode.is_ending && (
        <div className="px-5 pb-5 space-y-4">
          <div
            role="status"
            aria-live="assertive"
            className="bg-green-900/40 border border-green-700 rounded-xl px-4 py-3 text-center"
          >
            <p className="text-2xl mb-1" aria-hidden="true">✨</p>
            <p className="text-green-300 font-semibold text-sm">
              Story complete — +{currentNode.points_awarded ?? points} points!
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-2 text-slate-400 hover:text-white text-sm border border-slate-600 hover:border-slate-400 rounded-xl transition-colors min-h-[44px]"
            aria-label="Restart story from the beginning"
          >
            ↩ Replay story
          </button>
        </div>
      )}

      {/* Progress dots */}
      <div
        className="px-5 pb-4 flex gap-1.5"
        role="img"
        aria-label={`${history.length} decisions made`}
      >
        {history.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all ${
              idx === history.length - 1
                ? "w-4 bg-amber-400"
                : "w-1.5 bg-slate-600"
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    </section>
  );
}
