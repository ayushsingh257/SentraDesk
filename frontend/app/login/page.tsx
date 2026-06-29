"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, Mail, AlertTriangle, Cpu } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        // Store session tokens
        localStorage.setItem("access_token", result.data.access_token);
        localStorage.setItem("refresh_token", result.data.refresh_token);
        localStorage.setItem("role", result.data.role);
        localStorage.setItem("name", result.data.name);
        localStorage.setItem("user_id", result.data.user_id);
        
        router.push("/dashboard");
      } else {
        setError(result.error?.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Failed to connect to backend server. Is Docker running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#060814] px-4 py-12 overflow-hidden selection:bg-blue-600/30 selection:text-blue-300">
      {/* Decorative Interactive Grid and glow backgrounds */}
      <div className="absolute inset-0 cyber-grid opacity-60 pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/10 blur-[130px] pointer-events-none z-0 animate-glow-pulse" />

      <div className="relative glass w-full max-w-md rounded-2xl p-8 shadow-2xl md:p-10 bg-slate-950/40 border border-white/10 z-10 animate-float">
        
        {/* Terminal Header */}
        <div className="flex items-center gap-1.5 absolute top-4 left-5 text-[8px] font-mono text-gray-500 uppercase tracking-widest">
          <Cpu className="h-3 w-3 text-blue-500" /> SECURE CONSOLE // AUTHENTICATION_GATEWAY
        </div>

        <div className="flex flex-col items-center text-center mt-4">
          <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:scale-105 transition-all">
            <Shield className="h-6 w-6" />
          </Link>
          <h2 className="mt-6 text-xl font-bold text-white tracking-wider font-sans uppercase">Access Control Portal</h2>
          <p className="mt-1.5 text-[9px] font-bold uppercase tracking-widest text-blue-400">
            CCGP Operations Hub
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-bold font-mono">ACCESS_DENIED</p>
              <p className="mt-0.5 text-red-400/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-mono">
              Identity Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@ccgp.gov.in"
                className="w-full rounded-lg border border-white/5 bg-black/40 py-3.5 pl-11 pr-4 text-xs text-white placeholder-gray-600 transition-all focus:border-blue-500/50 focus:bg-black/60 outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-mono">
              Security Keycode
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-white/5 bg-black/40 py-3.5 pl-11 pr-4 text-xs text-white placeholder-gray-600 transition-all focus:border-blue-500/50 focus:bg-black/60 outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3.5 text-xs font-bold font-mono tracking-wider uppercase text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/35 active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? "Decrypting Session..." : "Authorize Credentials"}
          </button>
        </form>
      </div>
    </div>
  );
}
