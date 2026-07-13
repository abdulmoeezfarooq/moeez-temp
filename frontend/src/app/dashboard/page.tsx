"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getMe, generateImage, User, GenerateResult } from "@/lib/api";
import Image from "next/image";

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold text-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-100">{user.name}</p>
          <p className="text-xs text-zinc-500">ID: {user.id.slice(0, 8)}…</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Credits</p>
          <p className={`text-lg font-semibold ${user.credits > 0 ? "text-indigo-400" : "text-red-400"}`}>
            {user.credits}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

// ─── Generate Form ─────────────────────────────────────────────────────────────
function GenerateForm({
  onResult,
  disabled,
}: {
  onResult: (result: GenerateResult, credits: number) => void;
  disabled: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const apiKey = sessionStorage.getItem("api_key") ?? "";
      const result = await generateImage(apiKey, prompt.trim());
      onResult(result, result.remaining_credits);
      setPrompt("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="prompt" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
        Prompt
      </label>
      <textarea
        id="prompt"
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="A futuristic city at sunset, cinematic lighting, 8k, photorealistic…"
        disabled={disabled || loading}
        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-50"
      />

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={disabled || loading || !prompt.trim()}
        className="self-start bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors duration-150 text-sm"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Generating…
          </span>
        ) : (
          "Generate Image"
        )}
      </button>
    </form>
  );
}

// ─── Image Result ──────────────────────────────────────────────────────────────
function ImageResult({ result }: { result: GenerateResult }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Latest Result</h2>
        <span className="text-xs text-zinc-500 font-mono">ID: {result.product_id?.slice(0, 8) ?? "—"}…</span>
      </div>

      <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
        <Image
          src={result.image_url}
          alt="Generated image"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 600px"
          unoptimized // Replicate URLs are external — skip Next.js image optimisation
        />
      </div>

      <a
        href={result.image_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        Open full resolution ↗
      </a>
    </div>
  );
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [result, setResult] = useState<GenerateResult | null>(null);

  useEffect(() => {
    const key = sessionStorage.getItem("api_key");
    if (!key) {
      router.replace("/");
      return;
    }
    getMe(key)
      .then(setUser)
      .catch(() => {
        sessionStorage.removeItem("api_key");
        router.replace("/");
      })
      .finally(() => setLoadingUser(false));
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("api_key");
    router.push("/");
  }

  function handleResult(res: GenerateResult, remainingCredits: number) {
    setResult(res);
    // Update credit balance locally without a re-fetch
    setUser((u) => (u ? { ...u, credits: remainingCredits } : u));
  }

  if (loadingUser) {
    return (
      <main className="flex flex-1 items-center justify-center min-h-screen">
        <svg className="animate-spin h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </main>
    );
  }

  if (!user) return null;

  const outOfCredits = user.credits <= 0;

  return (
    <main className="flex flex-col min-h-screen px-4 py-8 max-w-2xl mx-auto w-full gap-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </div>
        <span className="text-sm font-medium text-zinc-400">AI Image Generator</span>
      </div>

      {/* User info */}
      <UserCard user={user} onLogout={handleLogout} />

      {/* Generate section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-5">
        <h1 className="text-base font-semibold text-zinc-100">Generate an Image</h1>

        {outOfCredits ? (
          <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
            You have no credits remaining. Contact support to top up.
          </div>
        ) : (
          <GenerateForm onResult={handleResult} disabled={outOfCredits} />
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <ImageResult result={result} />
        </div>
      )}
    </main>
  );
}
