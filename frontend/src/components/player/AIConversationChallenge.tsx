"use client";

import { useState, useEffect, useRef } from "react";
import { chatWithCharacter } from "@/lib/api";

interface AIConversationChallengeProps {
  challengeId: string;
  sessionId: string;
  characterName: string;
  minExchanges: number;
  topic?: string;
  points: number;
  onComplete?: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIConversationChallenge({
  challengeId,
  sessionId,
  characterName,
  minExchanges,
  topic,
  points,
  onComplete,
}: AIConversationChallengeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || isComplete) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);
    setError("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const data = await chatWithCharacter(challengeId, sessionId, userMessage);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      if (data.completion) {
        setIsComplete(true);
        onComplete?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const userExchanges = Math.ceil(messages.length / 2);

  return (
    <section
      aria-labelledby="conversation-heading"
      className="bg-slate-800 rounded-xl overflow-hidden flex flex-col h-96"
    >
      {/* Header */}
      <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
        <h3 id="conversation-heading" className="font-semibold text-white text-sm">
          💬 Chat with {characterName}
        </h3>
        <p className="text-slate-400 text-xs mt-1">
          {minExchanges - userExchanges > 0
            ? `${minExchanges - userExchanges} message${minExchanges - userExchanges === 1 ? "" : "s"} to go`
            : "Ready to complete!"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !isComplete && (
          <div className="text-center text-slate-400 text-sm py-6">
            <p className="mb-2">Start a conversation to learn more.</p>
            {topic && (
              <p className="text-xs text-slate-500">
                💡 Suggested topic: {topic}
              </p>
            )}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-700 text-slate-100"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isComplete && (
          <div className="text-center py-4">
            <p className="text-2xl mb-2" aria-hidden="true">✨</p>
            <p className="text-green-300 font-semibold text-sm">
              Conversation complete — +{points} points!
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isComplete && (
        <div className="p-4 bg-slate-700/50 border-t border-slate-600">
          {error && (
            <p className="text-red-400 text-xs mb-2">{error}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message…"
              disabled={loading}
              className="flex-1 bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 disabled:opacity-50"
              aria-label="Send message"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-medium px-4 py-2 rounded-lg text-sm min-h-[44px] transition-colors"
              aria-label="Send message"
            >
              {loading ? "…" : "Send"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
