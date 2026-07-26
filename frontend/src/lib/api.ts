const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

export interface User {
  id: string;
  name: string;
  credits: number;
}

export interface GenerateResult {
  status: string;
  message: string;
  image_url: string;
  local_filename: string;
  product_id: string | null;
  remaining_credits: number;
}

export interface ApiError {
  detail: string;
}

function headers(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };
}

export async function getMe(apiKey: string): Promise<User> {
  const res = await fetch(`${BASE}/me`, { headers: headers(apiKey) });
  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.detail ?? "Failed to fetch user");
  }
  return res.json();
}

export async function generateImage(
  apiKey: string,
  prompt: string,
  model: string
): Promise<GenerateResult> {
  const res = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ prompt, model }),
  });
  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.detail ?? "Generation failed");
  }
  return res.json();
}
