"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { askQuestion, type AskResult } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  pages_cited?: number[];
}

const SUGGESTED = [
  "What are the key financial highlights in this document?",
  "Summarize the revenue and profit trends.",
  "What risks or uncertainties are mentioned?",
];

export default function ChatPage() {
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCollectionId(localStorage.getItem("finsight_collection_id"));
    setFilename(localStorage.getItem("finsight_filename"));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || !collectionId || loading) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const data: AskResult = await askQuestion(collectionId, q);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, pages_cited: data.pages_cited },
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

  const messageCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="h-screen flex overflow-hidden bg-[#0a0a0a] bg-dot-grid">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-zinc-900 flex flex-col bg-[#0a0a0a]">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="w-[7px] h-[7px] rounded-full bg-amber-500 shrink-0" />
            <span className="text-[13px] font-semibold tracking-tight text-white font-mono">
              FinSight
            </span>
          </div>
        </div>

        {/* Document */}
        <div className="px-5 py-5 border-b border-zinc-900">
          <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.15em] mb-2">
            Document
          </p>
          {filename ? (
            <p className="text-xs text-zinc-300 break-all leading-relaxed">{filename}</p>
          ) : (
            <p className="text-xs text-zinc-600 font-mono">—</p>
          )}
        </div>

        {/* Collection */}
        <div className="px-5 py-5 border-b border-zinc-900">
          <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.15em] mb-2">
            Collection
          </p>
          {collectionId ? (
            <p className="text-[11px] text-zinc-600 font-mono break-all leading-relaxed">
              {collectionId.slice(0, 16)}…
            </p>
          ) : (
            <p className="text-xs text-red-400 font-mono">No collection loaded.</p>
          )}
        </div>

        {/* Query count */}
        <div className="px-5 py-5 border-b border-zinc-900">
          <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.15em] mb-2">
            Queries
          </p>
          <p className="text-2xl font-semibold font-mono text-amber-500">
            {messageCount}
          </p>
        </div>

        <div className="flex-1" />

        {/* Back link */}
        <div className="px-5 py-5 border-t border-zinc-900">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-300 font-mono transition-colors duration-150"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            New document
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-[52px] border-b border-zinc-900 flex items-center px-7 shrink-0 bg-[#0a0a0a]">
          <span className="text-[11px] text-zinc-600 font-mono uppercase tracking-[0.15em]">
            Analysis session
          </span>
          {collectionId && (
            <span className="ml-auto text-[11px] text-zinc-700 font-mono">
              {collectionId.slice(0, 8)}…
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-7 py-7 space-y-7">
          {messages.length === 0 && !loading && (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-md space-y-2">
                <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.15em] mb-5">
                  Suggested questions
                </p>
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    disabled={!collectionId}
                    className="w-full text-left px-4 py-3 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 text-sm text-zinc-400 hover:text-zinc-200 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[65%] bg-zinc-800/80 border border-zinc-700/50 px-4 py-3 text-[14px] text-zinc-100 leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[78%] space-y-3">
                  <div className="border-l-[3px] border-amber-500 pl-4 pr-1 py-0.5">
                    <div className="md text-[14px]">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  {msg.pages_cited && msg.pages_cited.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-5">
                      {msg.pages_cited.map((page) => (
                        <span
                          key={page}
                          className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-amber-500 border border-amber-500/30 bg-amber-500/5"
                        >
                          p.{page}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="border-l-[3px] border-amber-500/40 pl-4 flex items-center gap-2.5 py-1">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-1 bg-amber-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-zinc-600 font-mono">Analyzing…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-zinc-800 px-7 py-5 shrink-0 bg-[#0a0a0a]">
          {!collectionId && (
            <p className="text-xs text-red-400 font-mono mb-3">
              No document loaded.{" "}
              <Link href="/" className="underline underline-offset-2 hover:text-red-300">
                Upload one first.
              </Link>
            </p>
          )}
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a question about the document…"
              disabled={!collectionId || loading}
              rows={1}
              className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-amber-500/50 outline-none text-[14px] text-zinc-200 placeholder-zinc-600 px-4 py-3 resize-none transition-colors duration-150 font-sans disabled:opacity-30"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={() => send()}
              disabled={!collectionId || loading || !input.trim()}
              className="h-11 px-5 bg-amber-500 hover:bg-amber-400 disabled:opacity-25 disabled:cursor-not-allowed text-black text-sm font-semibold transition-colors duration-150 shrink-0 cursor-pointer"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-[11px] text-zinc-700 font-mono">
            ↵ Send · ⇧↵ New line
          </p>
        </div>
      </div>
    </div>
  );
}
