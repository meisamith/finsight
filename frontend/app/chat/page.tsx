"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { askQuestion, type AskResult } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  pages_cited?: number[];
}

export default function ChatPage() {
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCollectionId(localStorage.getItem("finsight_collection_id"));
    setFilename(localStorage.getItem("finsight_filename"));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const question = input.trim();
    if (!question || !collectionId || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const data: AskResult = await askQuestion(collectionId, question);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          pages_cited: data.pages_cited,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${e instanceof Error ? e.message : "Request failed."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="h-screen flex bg-[#0a0a0a] overflow-hidden">
      {/* Left panel */}
      <aside className="w-64 shrink-0 border-r border-zinc-900 flex flex-col">
        <div className="p-5 border-b border-zinc-900">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            <span className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-[family-name:var(--font-mono)]">
              FinSight
            </span>
          </div>
          <h2 className="text-sm font-semibold text-white">Document Info</h2>
        </div>

        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
          {filename && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider font-[family-name:var(--font-mono)] mb-1.5">
                File
              </p>
              <p className="text-xs text-zinc-300 break-all leading-relaxed">
                {filename}
              </p>
            </div>
          )}

          {collectionId ? (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider font-[family-name:var(--font-mono)] mb-1.5">
                Collection ID
              </p>
              <p className="text-xs text-zinc-500 font-[family-name:var(--font-mono)] break-all leading-relaxed">
                {collectionId}
              </p>
            </div>
          ) : (
            <div className="text-xs text-red-400 font-[family-name:var(--font-mono)]">
              No collection loaded.
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-600 uppercase tracking-wider font-[family-name:var(--font-mono)] mb-1.5">
              Messages
            </p>
            <p className="text-xl font-[family-name:var(--font-mono)] text-amber-500 font-semibold">
              {messages.length}
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-zinc-900">
          <Link
            href="/"
            className="block text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-[family-name:var(--font-mono)] py-2 border border-zinc-800 hover:border-zinc-700 rounded-sm"
          >
            ← Upload new document
          </Link>
        </div>
      </aside>

      {/* Right panel: chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 border-b border-zinc-900 flex items-center px-6">
          <span className="text-xs text-zinc-500 font-[family-name:var(--font-mono)] tracking-wider uppercase">
            Analysis session
          </span>
          {collectionId && (
            <span className="ml-auto text-xs text-zinc-700 font-[family-name:var(--font-mono)]">
              {collectionId.slice(0, 8)}…
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-zinc-600 text-sm">
                  Ask a question about the document.
                </p>
                <p className="text-zinc-700 text-xs font-[family-name:var(--font-mono)]">
                  Press Enter to send
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[70%] space-y-1.5 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className={`px-4 py-3 rounded-sm text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
                      : "bg-transparent text-zinc-200 border border-zinc-800"
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === "assistant" && msg.pages_cited && msg.pages_cited.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.pages_cited.map((page) => (
                      <span
                        key={page}
                        className="inline-flex items-center px-2 py-0.5 text-xs font-[family-name:var(--font-mono)] text-amber-500 border border-amber-500/30 bg-amber-500/5 rounded-sm"
                      >
                        Sources: Page {page}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-4 py-3 border border-zinc-800 rounded-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-1 bg-amber-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-zinc-500 font-[family-name:var(--font-mono)]">
                  Analyzing…
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-zinc-900 px-6 py-4">
          {!collectionId && (
            <p className="text-xs text-red-400 font-[family-name:var(--font-mono)] mb-2">
              No document loaded.{" "}
              <Link href="/" className="underline">
                Upload one first.
              </Link>
            </p>
          )}
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a question about the document…"
              disabled={!collectionId || loading}
              rows={1}
              className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none text-sm text-zinc-200 placeholder-zinc-700 px-4 py-3 rounded-sm resize-none transition-colors font-[family-name:var(--font-mono)] disabled:opacity-40"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={send}
              disabled={!collectionId || loading || !input.trim()}
              className="h-11 px-5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-black text-sm font-semibold rounded-sm transition-colors shrink-0"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-700 font-[family-name:var(--font-mono)]">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
