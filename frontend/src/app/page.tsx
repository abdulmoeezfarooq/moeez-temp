"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // Validate the key by hitting /me — if it works, key is good
      await getMe(apiKey.trim());
      sessionStorage.setItem("api_key", apiKey.trim());
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid API key. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-4">
      {/* Logo / title area */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
          <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          AI Image Generator
        </h1>
        <p className="mt-2 text-zinc-400 text-sm max-w-xs mx-auto">
          Enter your API key to start generating images with Stable Diffusion XL.
        </p>
      </div>

      {/* Key entry card */}
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="api-key" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            API Key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key…"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-150"
          >
            {loading ? "Verifying…" : "Continue →"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-zinc-600">
        Your key is stored in session only — never sent to a third party.
      </p>
    </main>
  );
}
