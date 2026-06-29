"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Mail, AlertTriangle, Cpu, CheckCircle2, ArrowRight } from "lucide-react";

const SYSTEM_CHECKS = [
  "Verifying secure channel...",
  "Loading RBAC policy engine...",
  "Establishing session context...",
  "Redirecting to command center...",
];

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [bootCheckIdx, setBootCheckIdx] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Success animation sequence
  useEffect(() => {
    if (!success) return;
    const iv = setInterval(() => {
      setBootCheckIdx((i) => {
        if (i < SYSTEM_CHECKS.length - 1) return i + 1;
        clearInterval(iv);
        return i;
      });
    }, 380);
    return () => clearInterval(iv);
  }, [success]);

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
        localStorage.setItem("access_token", result.data.access_token);
        localStorage.setItem("refresh_token", result.data.refresh_token);
        localStorage.setItem("role", result.data.role);
        localStorage.setItem("name", result.data.name);
        localStorage.setItem("user_id", result.data.user_id);

        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1800);
      } else {
        setError(result.error?.message || "Authentication failed. Invalid credentials.");
        setLoading(false);
      }
    } catch (err) {
      setError("Cannot connect to backend. Ensure Docker services are running.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-stretch bg-[#060814] overflow-hidden">
      {/* ── LEFT PANEL (decorative) ──────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 cyber-grid-bg opacity-40" />
        <div className="glow-orb w-[500px] h-[500px] bg-blue-600/15 top-[-15%] left-[-10%]" />
        <div className="glow-orb w-[400px] h-[400px] bg-cyan-600/12 bottom-[-10%] right-[-10%]" style={{ animationDelay: "4s" }} />

        <div className="relative z-10 max-w-md space-y-10">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center"
              style={{ boxShadow: "0 0 40px rgba(14,165,233,0.5)" }}>
              <Shield className="h-7 w-7 text-white" />
              {/* Orbit ring */}
              <div className="absolute inset-[-8px] rounded-full border border-cyan-500/20 orbit-ring" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-[0.15em] text-white uppercase font-mono">CCGP</div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-cyan-400/60 uppercase font-mono">Cyber Governance</div>
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
              Secure Operations <br />
              <span className="gradient-text-cyber">Command Center</span>
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Authenticate with your authorized credentials to access incident management, evidence workflows, and SLA monitoring.
            </p>
          </div>

          {/* Security indicators */}
          <div className="space-y-3">
            {[
              { icon: Lock, label: "TLS 1.3 encrypted session", ok: true },
              { icon: Shield, label: "Zero-trust RBAC enforced", ok: true },
              { icon: Cpu, label: "AES-256 data protection", ok: true },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.12 }}
                className="flex items-center gap-3 text-[11px] font-mono text-slate-500"
              >
                <div className="h-6 w-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <item.icon className="h-3 w-3 text-emerald-400" />
                </div>
                {item.label}
                <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />
              </motion.div>
            ))}
          </div>

          {/* Floating status card */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card rounded-xl p-4 inline-block"
          >
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="status-dot-green" />
              <div>
                <div className="text-emerald-400 font-bold">SYSTEM OPERATIONAL</div>
                <div className="text-slate-600 mt-0.5">Backend · Database · Cache · Storage</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL (auth form) ──────────────────── */}
      <div className="relative flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12">
        {/* Background */}
        <div className="absolute inset-0 cyber-grid-dense opacity-20" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md z-10"
        >
          {/* Card */}
          <div className="glass-card rounded-2xl p-8 md:p-10"
            style={{ boxShadow: "0 0 0 1px rgba(14,165,233,0.1), 0 30px 80px rgba(0,0,0,0.7)" }}>

            {/* Terminal header bar */}
            <div className="flex items-center gap-1.5 mb-8 pb-4 border-b border-white/5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
              <span className="ml-3 text-[9px] font-mono text-cyan-400/50 tracking-[0.2em] uppercase">
                CCGP // AUTHENTICATION GATEWAY
              </span>
            </div>

            <AnimatePresence mode="wait">
              {success ? (
                /* ── Success State ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center"
                    style={{ boxShadow: "0 0 30px rgba(16,185,129,0.3)" }}
                  >
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </motion.div>
                  <div>
                    <div className="text-white font-bold text-base">ACCESS GRANTED</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">Initializing command center...</div>
                  </div>
                  <div className="space-y-2 text-left">
                    {SYSTEM_CHECKS.slice(0, bootCheckIdx + 1).map((line, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-[11px] font-mono text-emerald-400"
                      >
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        {line}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* ── Login Form ── */
                <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Heading */}
                  <div className="mb-8 space-y-1">
                    <h1 className="text-xl font-black text-white tracking-tight">Access Control Portal</h1>
                    <p className="text-[11px] font-mono text-slate-500 tracking-wider uppercase">
                      CCGP Operations Hub — Authorized Personnel Only
                    </p>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="mb-6 flex gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4"
                      >
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                        <div>
                          <div className="text-[10px] font-bold font-mono text-red-400 tracking-wider uppercase mb-0.5">
                            ACCESS_DENIED
                          </div>
                          <p className="text-[11px] text-red-400/80 leading-relaxed">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold font-mono uppercase tracking-[0.15em] text-slate-500">
                        Identity Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                        <input
                          id="email-input"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="officer@ccgp.gov.in"
                          className="cyber-input pl-10"
                          style={{
                            borderColor: focusedField === "email" ? "rgba(14,165,233,0.4)" : undefined,
                          }}
                        />
                        {/* Animated scan line on focus */}
                        {focusedField === "email" && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            className="absolute bottom-0 left-0 h-[1px] w-full origin-left"
                            style={{ background: "linear-gradient(90deg, #0ea5e9, #06b6d4)" }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold font-mono uppercase tracking-[0.15em] text-slate-500">
                        Security Keycode
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                        <input
                          id="password-input"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="••••••••••••"
                          className="cyber-input pl-10"
                          style={{
                            borderColor: focusedField === "password" ? "rgba(14,165,233,0.4)" : undefined,
                          }}
                        />
                        {focusedField === "password" && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            className="absolute bottom-0 left-0 h-[1px] w-full origin-left"
                            style={{ background: "linear-gradient(90deg, #0ea5e9, #06b6d4)" }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      id="login-btn"
                      type="submit"
                      disabled={loading}
                      className="btn-cyber w-full justify-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Authenticating...
                        </>
                      ) : (
                        <>
                          Authorize Credentials <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <Link href="/" className="text-[10px] font-mono text-slate-600 hover:text-cyan-400 transition-colors tracking-widest uppercase">
                      ← Return to Platform Overview
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Below card */}
          <p className="mt-6 text-center text-[10px] font-mono text-slate-700 uppercase tracking-widest">
            CCGP &mdash; Cyber Complaint Governance Platform
          </p>
        </motion.div>
      </div>
    </div>
  );
}
