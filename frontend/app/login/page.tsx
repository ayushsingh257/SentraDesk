"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, Mail, AlertTriangle } from "lucide-react";

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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/10 blur-[130px] pointer-events-none" />

      <div className="glass w-full max-w-md rounded-2xl p-8 shadow-2xl md:p-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Shield className="h-6 w-6" />
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-white tracking-tight">Access Control Portal</h2>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-cyber-muted">
            Tech Mahindra CSRM Command Center
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Security Alert</p>
              <p className="mt-1 text-xs text-red-400/90">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-cyber-muted">
              Security Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-cyber-muted">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@ccgp.gov.in"
                className="w-full rounded-lg border border-white/5 bg-black/40 py-3.5 pl-11 pr-4 text-sm text-white placeholder-cyber-muted/70 transition-all focus:border-blue-500/50 focus:bg-black/60 focus:ring-1 focus:ring-blue-500/50 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-cyber-muted">
              Security Keycode
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-cyber-muted">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-white/5 bg-black/40 py-3.5 pl-11 pr-4 text-sm text-white placeholder-cyber-muted/70 transition-all focus:border-blue-500/50 focus:bg-black/60 focus:ring-1 focus:ring-blue-500/50 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/35 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Decrypting Session..." : "Authorize Credentials"}
          </button>
        </form>
      </div>
    </div>
  );
}
