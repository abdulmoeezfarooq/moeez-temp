"use client";

import { useState, useEffect, FormEvent } from "react";
import { getMe, generateImage, User, GenerateResult } from "@/lib/api";
import Image from "next/image";

const HARDCODED_API_KEY = "test-api-key-123";

const MODELS = [
  { value: "dev",     label: "Flux Dev",             desc: "Open weights (Default)" },
  { value: "flux1.1", label: "Flux 1.1 Pro",         desc: "High quality (Backup)" },
];

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({ user }: { user: User }) {
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
      <div className="text-right">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">Credits</p>
        <p className={`text-lg font-semibold ${user.credits > 0 ? "text-indigo-400" : "text-red-400"}`}>
          {user.credits}
        </p>
      </div>
    </div>
  );
}

// ─── Model Selector ───────────────────────────────────────────────────────────
function ModelSelector({ selected, onChange, disabled }: { selected: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Model / API</label>
      <div className="grid grid-cols-2 gap-2">
        {MODELS.map((m) => (
          <button
            key={m.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m.value)}
            className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all
              ${selected === m.value
                ? "bg-indigo-500/20 border-indigo-500/60 text-indigo-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <p className="font-semibold leading-tight">{m.label}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{m.desc}</p>
          </button>
        ))}
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
  const [model, setModel] = useState("dev");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await generateImage(HARDCODED_API_KEY, prompt.trim(), model);
      onResult(result, result.remaining_credits);
      setPrompt("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Model selector */}
      <ModelSelector selected={model} onChange={setModel} disabled={disabled || loading} />

      {/* Prompt */}
      <div className="flex flex-col gap-2">
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
      </div>

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
          `Generate with ${MODELS.find(m => m.value === model)?.label ?? model}`
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
        <span className="text-xs text-zinc-500 font-mono">ID: {result.product_id?.slice(0, 8) ?? "—"}</span>
      </div>
      <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
        <Image
          src={result.image_url}
          alt="Generated image"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 600px"
          unoptimized
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    getMe(HARDCODED_API_KEY)
      .then(setUser)
      .catch(() => setFetchError(true))
      .finally(() => setLoadingUser(false));
  }, []);

  function handleResult(res: GenerateResult, remainingCredits: number) {
    setResult(res);
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

  if (fetchError || !user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center min-h-screen p-8 text-center gap-4">
        <p className="text-red-400 font-semibold">Could not connect to the backend.</p>
        <p className="text-zinc-500 text-sm">Make sure the backend server is running on port 8000.</p>
        <code className="text-xs bg-zinc-800 px-3 py-1 rounded text-zinc-300">py main.py</code>
      </main>
    );
  }

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
      <UserCard user={user} />

      {/* Generate section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-5">
        <h1 className="text-base font-semibold text-zinc-100">Generate an Image</h1>
        <GenerateForm onResult={handleResult} disabled={user.credits <= 0} />
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
