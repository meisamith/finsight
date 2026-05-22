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
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      setError("Only PDF files are accepted.");
      return;
    }
    setError(null);
    setUploading(true);
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
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-[family-name:var(--font-mono)]">
              FinSight
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Financial Document Analyzer
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Upload a PDF to begin RAG-powered analysis.
          </p>
        </div>

        {/* Upload zone */}
        {!result && (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`relative border border-dashed rounded-sm cursor-pointer transition-colors duration-150 p-12 flex flex-col items-center justify-center gap-4 select-none
              ${dragging
                ? "border-amber-500 bg-amber-500/5"
                : "border-zinc-800 hover:border-zinc-600 bg-zinc-950"
              }
              ${uploading ? "pointer-events-none opacity-60" : ""}
            `}
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
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-zinc-400 font-[family-name:var(--font-mono)]">
                  Indexing document…
                </span>
              </>
            ) : (
              <>
                <svg
                  className={`w-8 h-8 ${dragging ? "text-amber-500" : "text-zinc-600"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-sm text-zinc-300">
                    Drop a PDF here, or{" "}
                    <span className="text-amber-500 underline underline-offset-2">
                      browse
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 font-[family-name:var(--font-mono)]">
                    .pdf only
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-3 text-xs text-red-400 font-[family-name:var(--font-mono)]">
            {error}
          </p>
        )}

        {/* Success state */}
        {result && (
          <div className="border border-zinc-800 rounded-sm bg-zinc-950 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <span className="text-xs text-amber-500 tracking-widest uppercase font-[family-name:var(--font-mono)]">
                Document indexed
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-600 uppercase tracking-wider font-[family-name:var(--font-mono)] mb-1">
                  Collection ID
                </p>
                <p className="text-sm font-[family-name:var(--font-mono)] text-zinc-200 break-all">
                  {result.collection_id}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-600 uppercase tracking-wider font-[family-name:var(--font-mono)] mb-1">
                  Chunks indexed
                </p>
                <p className="text-2xl font-[family-name:var(--font-mono)] text-amber-500 font-semibold">
                  {result.chunks_indexed}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push("/chat")}
                className="flex-1 h-10 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-sm transition-colors"
              >
                Start Analysis →
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className="h-10 px-4 border border-zinc-800 hover:border-zinc-600 text-zinc-400 text-sm rounded-sm transition-colors"
              >
                Upload another
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
