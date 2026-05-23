const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export interface UploadResult {
  collection_id: string;
  chunks_indexed: number;
}

export interface AskResult {
  answer: string;
  pages_cited: number[];
}

export async function uploadDocument(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/upload`, { method: "POST", body: form });
  } catch {
    throw new Error(`Cannot reach backend at ${BASE_URL}. Is the server running?`);
  }
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}

export async function askQuestion(
  collection_id: string,
  question: string
): Promise<AskResult> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection_id, question }),
    });
  } catch {
    throw new Error(`Cannot reach backend at ${BASE_URL}. Is the server running?`);
  }
  if (!res.ok) throw new Error(`Ask failed: ${res.statusText}`);
  return res.json();
}
