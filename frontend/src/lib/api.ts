const BASE = "/api";

export interface User {
  id: string;
  name: string;
  credits: number;
}

export interface GenerateResult {
  status: string;
  message: string;
  image_url: string;
  product_id: string | null;
  remaining_credits: number;
}

export interface ApiError {
  detail: string;
}

export async function getMe(): Promise<User> {
  const res = await fetch(`${BASE}/me`);
  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.detail ?? "Failed to fetch user");
  }
  return res.json();
}

export async function generateImage(
  prompt: string
): Promise<GenerateResult> {
  const res = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.detail ?? "Generation failed");
  }
  return res.json();
}
