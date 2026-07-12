"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Mail, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error?.message || "Failed to trigger recovery flow.");
      }
    } catch (err) {
      setError("Cannot connect to security backend. Verify network status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#02040a] px-6 py-12 overflow-hidden">
      <div className="absolute inset-0 cyber-grid-bg opacity-[0.15]" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-xl p-8 md:p-10 border-slate-900">
          
          <div className="flex items-center gap-1.5 mb-8 pb-4 border-b border-slate-950">
            <span className="h-2 w-2 rounded-full bg-red-500/50" />
            <span className="h-2 w-2 rounded-full bg-yellow-500/50" />
            <span className="h-2 w-2 rounded-full bg-cyan-500/50" />
            <span className="ml-3 text-[9px] font-mono text-cyan-400/50 tracking-[0.25em] uppercase">
              CCGP ACCESS RECOVERY
            </span>
          </div>

          {success ? (
            <div className="py-8 text-center space-y-6">
              <div className="mx-auto w-14 h-14 rounded bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <div className="text-white font-mono font-extrabold text-sm tracking-widest uppercase">DISPATCH CONFIRMED</div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans px-2">
                  If the email address <strong className="text-cyan-400">{email}</strong> exists in our index, password reset instructions have been dispatched. Please audit your inbox.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-950">
                <Link href="/login" className="btn-cyber w-full justify-center text-[10px] tracking-widest uppercase">
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6 space-y-1.5">
                <h1 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Recover Access</h1>
                <p className="text-[9.5px] font-mono text-slate-500 tracking-wider uppercase">
                  Submit email to receive cryptographic password reset link
                </p>
              </div>

              {error && (
                <div className="mb-6 flex gap-3 rounded border border-red-500/25 bg-red-500/5 p-4">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-400 mt-0.5" />
                  <div>
                    <div className="text-[9px] font-bold font-mono text-red-400 tracking-widest uppercase mb-0.5">
                      RECOVERY_ERROR
                    </div>
                    <p className="text-[10.5px] text-red-400/80 font-sans leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-slate-500">
                    Personnel Identity (Email)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@ccgp.gov.in"
                      className="cyber-input pl-10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-cyber w-full justify-center mt-3 disabled:opacity-40 disabled:cursor-not-allowed font-mono tracking-widest text-[10px] py-3.5"
                >
                  {loading ? "Generating gateway links..." : <>Request Recovery link <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-950 text-center">
                <Link href="/login" className="text-[9px] font-mono text-slate-600 hover:text-cyan-400 transition-colors tracking-widest uppercase">
                  &larr; Back to login gateway
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
