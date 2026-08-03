"use client";

import { useState, useEffect, FormEvent } from "react";
import { getMe, generateImage, User, GenerateResult } from "@/lib/api";
import Image from "next/image";

interface HistoryItem {
  id: string;
  prompt: string;
  image_url: string;
  timestamp: number;
}

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({ user }: { user: User }) {
  return (
    <div className="flex items-center justify-between bg-zinc-950/40 border border-zinc-800/60 rounded-2xl px-6 py-5 backdrop-blur-xl shadow-lg transition-all hover:border-green-500/30 hover:shadow-green-900/20">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-red-500/20 border border-white/10 flex items-center justify-center text-white font-bold text-lg shadow-inner">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-base font-semibold text-zinc-100 tracking-tight">{user.name}</p>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">ID: {user.id.slice(0, 8)}…</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Credits</p>
        <div className={`px-3 py-1 rounded-full border ${user.credits > 0 ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          <span className="text-sm font-bold">{user.credits}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Generate Form ─────────────────────────────────────────────────────────────
function GenerateForm({
  onResult,
  disabled,
}: {
  onResult: (result: GenerateResult, credits: number, prompt: string) => void;
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
      const result = await generateImage(prompt.trim());
      onResult(result, result.remaining_credits, prompt.trim());
      setPrompt("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <label htmlFor="prompt" className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Prompt
        </label>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/30 to-red-500/30 rounded-xl blur opacity-25 group-focus-within:opacity-75 transition duration-500"></div>
          <textarea
            id="prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cinematic shot of a neon-lit cyberpunk city at midnight, glowing red and green signs, 8k resolution, photorealistic..."
            disabled={disabled || loading}
            className="relative w-full rounded-xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 px-5 py-4 text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all duration-300 disabled:opacity-50 shadow-inner"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 text-sm text-red-400 bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 backdrop-blur-md">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || loading || !prompt.trim()}
        className="group relative self-start overflow-hidden rounded-xl bg-zinc-900 px-8 py-3.5 text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/50 border border-white/10"
      >
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-600/80 via-red-500/80 to-green-600/80 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-green-500 blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
        <span className="relative flex items-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Synthesizing...
            </>
          ) : (
            <>
              Generate Masterpiece
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </>
          )}
        </span>
      </button>
    </form>
  );
}

// ─── Image Result ──────────────────────────────────────────────────────────────
function ImageResult({ result }: { result: GenerateResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Latest Generation
        </h2>
        <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-zinc-400 font-mono">
          {result.product_id?.slice(0, 8) ?? "—"}
        </span>
      </div>
      <div className="group relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none duration-500"></div>
        <Image
          src={result.image_url}
          alt="Generated image"
          fill
          className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
          sizes="(max-width: 640px) 100vw, 600px"
          unoptimized
        />
      </div>
      <div className="flex items-center gap-3">
        <a
          href={result.image_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex justify-center items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          Expand
        </a>
        <a
          href={result.image_url}
          download={`generation-${result.product_id ?? Date.now()}.jpg`}
          className="flex-1 flex justify-center items-center gap-2 bg-green-950/30 hover:bg-green-900/40 border border-green-500/20 py-2.5 rounded-lg text-xs font-semibold text-green-400 hover:text-green-300 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download
        </a>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setFetchError(true))
      .finally(() => setLoadingUser(false));

    const savedHistory = localStorage.getItem("generation_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }
  }, []);

  function handleDelete(id: string) {
    setHistory((prev) => {
      const newHistory = prev.filter(item => item.id !== id);
      localStorage.setItem("generation_history", JSON.stringify(newHistory));
      return newHistory;
    });
  }

  function handleResult(res: GenerateResult, remainingCredits: number, prompt: string) {
    setResult(res);
    setUser((u) => (u ? { ...u, credits: remainingCredits } : u));
    
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      prompt,
      image_url: res.image_url,
      timestamp: Date.now(),
    };
    
    setHistory((prev) => {
      const newHistory = [newItem, ...prev];
      localStorage.setItem("generation_history", JSON.stringify(newHistory));
      return newHistory;
    });
  }

  if (loadingUser) {
    return (
      <main className="flex flex-1 items-center justify-center min-h-screen bg-zinc-950">
        <svg className="animate-spin h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </main>
    );
  }

  if (fetchError || !user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center min-h-screen p-8 text-center gap-4 bg-zinc-950">
        <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-2xl backdrop-blur-md">
          <p className="text-red-400 font-semibold mb-1">Could not connect to the server.</p>
          <p className="text-zinc-500 text-sm mb-4">Make sure the Next.js dev server is running.</p>
          <code className="text-xs bg-black/50 border border-zinc-800 px-4 py-2 rounded-lg text-zinc-300 font-mono shadow-inner">npm run dev</code>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex flex-col min-h-screen px-5 py-10 max-w-3xl mx-auto w-full gap-8 bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-green-500/30 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-green-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="relative flex items-center justify-center gap-3 mb-2 z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-red-500/20 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-red-400">
          Magni<span className="font-light text-zinc-300">fy</span>
        </h1>
      </div>

      <div className="relative z-10 flex flex-col gap-8">
        {/* User info */}
        <UserCard user={user} />

        {/* Generate section */}
        <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-7 shadow-xl shadow-black/20 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          <GenerateForm onResult={handleResult} disabled={user.credits <= 0} />
        </div>

        {/* Result */}
        {result && (
          <div className="bg-zinc-950/60 border border-green-500/20 rounded-2xl p-7 shadow-2xl shadow-green-900/10 backdrop-blur-2xl transition-all duration-700">
            <ImageResult result={result} />
          </div>
        )}

        {/* History section */}
        {history.length > 0 && (
          <div className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3 px-2">
              <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Project Archives</h2>
              <div className="h-px bg-gradient-to-r from-zinc-800 to-transparent flex-1"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {history.map((item) => (
                <div key={item.id} className="group flex flex-col gap-3 p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl hover:bg-zinc-900/80 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 backdrop-blur-sm">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/50 shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
                    <Image
                      src={item.image_url}
                      alt={item.prompt}
                      fill
                      className="object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                      sizes="(max-width: 640px) 100vw, 300px"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-zinc-300 font-medium leading-relaxed line-clamp-2 group-hover:text-white transition-colors" title={item.prompt}>{item.prompt}</p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800/50">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-1 relative z-20">
                        <a 
                          href={item.image_url} 
                          download={`history-${item.timestamp}.jpg`}
                          className="text-zinc-500 hover:text-green-400 hover:bg-green-500/10 p-1.5 rounded-md transition-all"
                          title="Download image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-md transition-all"
                          title="Delete image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
