"use client";

import { useState, useEffect } from "react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already authenticated via cookie
    const hasSession = document.cookie.includes("admin_session=authenticated");
    setAuthed(hasSession);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setAuthed(true);
    } else {
      setError("Senha incorreta");
    }
  }

  if (authed === null) return null;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-sm shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Admin</h1>
          <p className="text-sm text-gray-400 mb-6">Digite a senha para acessar</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-3"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
