"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { chatWithCharacter } from "@/lib/api";

interface Message {
  role: "user" | "character";
  content: string;
}

interface AIChatChallengeProps {
  characterId: string;
  characterName: string;
  greeting: string;
  minExchanges?: number;
  onComplete: (pointsEarned: number) => void;
  points: number;
}

export default function AIChatChallenge({
  characterId,
  characterName,
  greeting,
  minExchanges = 3,
  onComplete,
  points,
}: AIChatChallengeProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "character", content: greeting },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Announce new character messages to screen readers
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "character" && liveRegionRef.current) {
      liveRegionRef.current.textContent = `${characterName} says: ${last.content}`;
    }
  }, [messages, characterName]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || isComplete) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    try {
      const response = await chatWithCharacter(characterId, text);
      setMessages((prev) => [
        ...prev,
        { role: "character", content: response.response },
      ]);

      const newCount = exchangeCount + 1;
      setExchangeCount(newCount);

      if (newCount >= minExchanges) {
        setIsComplete(true);
        onComplete(points);
      }
    } catch {
      setError("The connection was lost. Please try again.");
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [
    input,
    isLoading,
    isComplete,
    characterId,
    exchangeCount,
    minExchanges,
    onComplete,
    points,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const remaining = Math.max(0, minExchanges - exchangeCount);

  return (
    <section
      aria-labelledby="ai-chat-heading"
      className="flex flex-col bg-slate-800 rounded-xl overflow-hidden"
      style={{ height: "480px" }}
    >
      {/* Header */}
      <div className="bg-slate-700 px-4 py-3 flex items-center gap-3 shrink-0">
        <span className="text-2xl" aria-hidden="true">
          🎭
        </span>
        <div>
          <h3 id="ai-chat-heading" className="font-semibold text-white text-sm">
            Conversation with {characterName}
          </h3>
          {!isComplete && (
            <p className="text-slate-400 text-xs">
              {remaining > 0
                ? `${remaining} more exchange${remaining !== 1 ? "s" : ""} to complete`
                : "Complete the conversation to earn points"}
            </p>
          )}
        </div>
      </div>

      {/* Screen reader live region */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        role="log"
        aria-label={`Conversation with ${characterName}`}
        aria-live="off"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-amber-600 text-white rounded-br-sm"
                  : "bg-slate-700 text-slate-100 rounded-bl-sm"
              }`}
              aria-label={
                msg.role === "user"
                  ? `You: ${msg.content}`
                  : `${characterName}: ${msg.content}`
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start" role="status" aria-label={`${characterName} is typing`}>
            <div className="bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="mx-4 mb-2 text-red-400 text-xs bg-red-900/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Completion */}
      {isComplete && (
        <div
          role="status"
          aria-live="assertive"
          className="mx-4 mb-3 bg-green-900/40 border border-green-700 rounded-xl px-4 py-3 text-center"
        >
          <p className="text-green-300 font-semibold text-sm">
            ✅ Conversation complete — +{points} points earned!
          </p>
        </div>
      )}

      {/* Input */}
      {!isComplete && (
        <div className="px-4 pb-4 pt-2 shrink-0 flex gap-2 items-end">
          <label htmlFor="chat-input" className="sr-only">
            Your message to {characterName}
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${characterName} something…`}
            rows={2}
            disabled={isLoading}
            className="flex-1 bg-slate-700 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
            aria-describedby="chat-hint"
          />
          <p id="chat-hint" className="sr-only">
            Press Enter to send, Shift+Enter for a new line
          </p>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl px-4 py-2 text-sm transition-colors min-h-[44px]"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      )}
    </section>
  );
}
