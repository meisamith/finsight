"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument, type UploadResult } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      setError("Only PDF files are accepted.");
      return;
    }
    setError(null);
    setUploading(true);
    setFilename(file.name);
    try {
      const data = await uploadDocument(file);
      localStorage.setItem("finsight_collection_id", data.collection_id);
      localStorage.setItem("finsight_filename", file.name);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="px-8 pt-7 pb-6">
        <div className="flex items-center gap-2">
          <span className="w-[7px] h-[7px] rounded-full bg-amber-500 shrink-0" />
          <span className="text-[13px] font-semibold tracking-tight text-white font-mono">
            FinSight
          </span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[500px]">
          {!result ? (
            <>
              <div className="mb-10">
                <h1 className="text-[2.1rem] font-semibold tracking-[-0.02em] text-white leading-[1.2] mb-4">
                  Ask anything about your<br />financial documents.
                </h1>
                <p className="text-[15px] text-zinc-500 leading-relaxed">
                  Upload a PDF. Get cited answers in seconds.
                </p>
              </div>

              <div
                onClick={() => !uploading && inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={[
                  "border border-dashed cursor-pointer select-none",
                  "px-10 py-16 flex flex-col items-center justify-center gap-4",
                  "transition-all duration-200",
                  dragging
                    ? "border-amber-500 bg-amber-500/[0.04]"
                    : "border-amber-500/30 hover:border-amber-500/70 hover:bg-amber-500/[0.02]",
                  uploading ? "pointer-events-none opacity-50" : "",
                ].join(" ")}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={onInputChange}
                />

                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-[1.5px] border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-zinc-500 font-mono">
                      Indexing document…
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      className={`w-7 h-7 transition-colors duration-200 ${dragging ? "text-amber-500" : "text-zinc-600"}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    <div className="text-center">
                      <p className="text-[14px] text-zinc-300">
                        Drop PDF here, or{" "}
                        <span className="text-amber-500">browse files</span>
                      </p>
                      <p className="mt-1.5 text-xs text-zinc-600 font-mono">
                        .pdf only
                      </p>
                    </div>
                  </>
                )}
              </div>

              {error && (
                <p className="mt-3 text-xs text-red-400 font-mono">{error}</p>
              )}
            </>
          ) : (
            <div className="border border-zinc-800 bg-zinc-950">
              <div className="px-7 py-5 border-b border-zinc-800 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs text-amber-500 font-mono tracking-widest uppercase">
                  Document indexed
                </span>
              </div>

              <div className="px-7 py-6 space-y-5">
                <div>
                  <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.15em] mb-1.5">
                    Filename
                  </p>
                  <p className="text-sm text-zinc-200 font-mono break-all leading-relaxed">
                    {filename}
                  </p>
                </div>

                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.15em] mb-1.5">
                      Chunks indexed
                    </p>
                    <p className="text-3xl font-semibold font-mono text-amber-500">
                      {result.chunks_indexed}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.15em] mb-1.5">
                    Collection ID
                  </p>
                  <p className="text-xs text-zinc-500 font-mono break-all leading-relaxed">
                    {result.collection_id}
                  </p>
                </div>
              </div>

              <div className="px-7 py-5 border-t border-zinc-800 flex gap-3">
                <button
                  onClick={() => router.push("/chat")}
                  className="flex-1 h-10 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors duration-150 cursor-pointer"
                >
                  Start Analysis →
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setError(null);
                    setFilename("");
                  }}
                  className="h-10 px-5 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 text-sm transition-colors duration-150 cursor-pointer"
                >
                  Upload another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
