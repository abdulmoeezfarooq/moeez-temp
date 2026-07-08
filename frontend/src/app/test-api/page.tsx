"use client";

import { useState } from "react";

export default function TestApiPage() {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const fetchProducts = async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/products");
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
        setStatus("success");
      } else {
        setData({ error: "Failed to fetch from API" });
        setStatus("error");
      }
    } catch (error: any) {
      setData({ error: error.message });
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8 border-b pb-4">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">API Testing Dashboard</h1>
            
            {/* Status Badge */}
            {status !== "idle" && (
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${
                status === "loading" ? "bg-blue-100 text-blue-800" :
                status === "success" ? "bg-green-100 text-green-800" :
                "bg-red-100 text-red-800"
              }`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            )}
          </div>

          <div className="mb-8">
            <button
              onClick={fetchProducts}
              disabled={status === "loading"}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition duration-200 ease-in-out transform hover:-translate-y-0.5"
            >
              {status === "loading" ? "Fetching..." : "GET Products"}
            </button>
            <p className="mt-3 text-sm text-gray-500">
              Click to fetch data from <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">/api/products</code>
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 overflow-auto border border-gray-700 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">JSON Response</span>
            </div>
            {data ? (
              <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap break-words">
                {JSON.stringify(data, null, 2)}
              </pre>
            ) : (
              <div className="text-gray-500 italic text-sm text-center py-8">
                No data fetched yet. Click the button above to test the endpoint.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
