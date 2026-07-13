export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">AI Image Generation API</h1>
      <p className="text-zinc-400 text-lg max-w-md text-center">
        A FastAPI + Supabase powered backend for generating AI images via Replicate.
        Use your API key with the <code className="text-indigo-400">/generate</code> endpoint to get started.
      </p>
    </main>
  );
}
