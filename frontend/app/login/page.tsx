"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Mail, AlertTriangle, Cpu, CheckCircle2, ArrowRight, Activity, Terminal, Radio, Fingerprint } from "lucide-react";

const SYSTEM_CHECKS = [
  "Securing communication channel...",
  "Loading node RBAC policies...",
  "Syncing immutable ledger anchors...",
  "Redirecting to Operations Console...",
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
    }, 280);
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
        setTimeout(() => router.push("/dashboard"), 1400);
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
    <div className="relative flex min-h-screen items-stretch bg-[#02040a] overflow-hidden">
      
      {/* ── LEFT PANEL (Government Command Center Spec) ──────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 overflow-hidden border-r border-slate-950">
        
        {/* Background Grids & Ambient Glow */}
        <div className="absolute inset-0 cyber-grid-dense opacity-[0.25]" />
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-950/10 blur-[90px]" />

        <div className="relative z-10 max-w-md space-y-10">
          
          {/* Platform Console Logo */}
          <div className="flex items-center gap-4">
            <div className="relative h-13 w-13 rounded bg-gradient-to-br from-cyan-500 via-blue-600 to-cyan-500 flex items-center justify-center border border-cyan-400/30"
              style={{ boxShadow: "0 0 20px rgba(6,182,212,0.3)" }}>
              <Shield className="h-6 w-6 text-white" />
              {/* Animated HUD outer target ring */}
              <div className="absolute inset-[-6px] rounded border border-cyan-500/10 orbit-ring pointer-events-none" />
            </div>
            <div>
              <div className="text-xl font-black tracking-[0.25em] text-white font-mono uppercase">CCGP</div>
              <div className="text-[9px] font-bold tracking-[0.25em] text-cyan-400/60 uppercase font-mono mt-0.5">Operations Center</div>
            </div>
          </div>

          {/* Title description */}
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight uppercase font-mono">
              Operational <br />
              <span className="gradient-text-blue">Security Gateway</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Access the secure diagnostic operations interface. Authenticate with your credentials to audit incident queues, compile signed case summaries, or monitor threat indicators.
            </p>
          </div>

          {/* Secure gateway status indicators */}
          <div className="space-y-3">
            {[
              { icon: Lock, label: "Cryptographic TLS 1.3 Active", color: "#0ea5e9" },
              { icon: Fingerprint, label: "Zero-Trust RBAC Gateways Active", color: "#8b5cf6" },
              { icon: Cpu, label: "AI & Vector Search Engines Online", color: "#06b6d4" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3.5 text-[10px] font-mono text-slate-500"
              >
                <div className="h-6 w-6 rounded border border-slate-900 bg-slate-950 flex items-center justify-center">
                  <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                </div>
                {item.label}
                <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />
              </motion.div>
            ))}
          </div>

          {/* Floating operational alert panel */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="glass rounded-lg p-4 inline-block border-slate-900"
          >
            <div className="flex items-center gap-3.5 text-[9px] font-mono select-none cursor-default">
              <span className="status-dot-green" />
              <div>
                <div className="text-emerald-400 font-bold uppercase tracking-wider">ALL CORE SERVICES SECURE</div>
                <div className="text-slate-600 mt-0.5 font-sans">PostgreSQL · Redis · Qdrant · MinIO</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Access Gateway Form) ──────────────────── */}
      <div className="relative flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12">
        <div className="absolute inset-0 cyber-grid-bg opacity-[0.15]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md z-10"
        >
          {/* Glass login panel */}
          <div className="glass rounded-xl p-8 md:p-10 border-slate-900 scanline-active"
            style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.8)" }}>

            {/* Simulated terminal bar */}
            <div className="flex items-center gap-1.5 mb-8 pb-4 border-b border-slate-950">
              <span className="h-2 w-2 rounded-full bg-red-500/50" />
              <span className="h-2 w-2 rounded-full bg-yellow-500/50" />
              <span className="h-2 w-2 rounded-full bg-cyan-500/50 animate-pulse" />
              <span className="ml-3 text-[9px] font-mono text-cyan-400/50 tracking-[0.25em] uppercase">
                CCGP SECURE ACCESS GATEWAY
              </span>
            </div>

            <AnimatePresence mode="wait">
              {success ? (
                /* ── Access Granted Animation Seq ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 180, damping: 12 }}
                    className="mx-auto w-14 h-14 rounded bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center"
                    style={{ boxShadow: "0 0 25px rgba(16,185,129,0.2)" }}
                  >
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </motion.div>
                  
                  <div className="space-y-1">
                    <div className="text-white font-extrabold text-sm font-mono tracking-widest uppercase">AUTHORIZATION GRANTED</div>
                    <div className="text-[10px] text-slate-500 font-mono tracking-wide">Retrieving system operational nodes...</div>
                  </div>
                  
                  <div className="space-y-2.5 text-left max-w-xs mx-auto pt-2 border-t border-slate-950">
                    {SYSTEM_CHECKS.slice(0, bootCheckIdx + 1).map((line, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-[10px] font-mono text-emerald-400"
                      >
                        <Terminal className="h-3 w-3 shrink-0 text-emerald-500" />
                        {line}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* ── Input Form ── */
                <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  
                  {/* Console label */}
                  <div className="mb-8 space-y-1.5">
                    <h1 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Verify Credentials</h1>
                    <p className="text-[9.5px] font-mono text-slate-500 tracking-wider uppercase">
                      SECURE OPERATIONS GATEWAY &mdash; AUDITED ENTRY
                    </p>
                  </div>

                  {/* Errors */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-6 flex gap-3 rounded border border-red-500/25 bg-red-500/5 p-4"
                      >
                        <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-400 mt-0.5" />
                        <div>
                          <div className="text-[9px] font-bold font-mono text-red-400 tracking-widest uppercase mb-0.5">
                            GATEWAY_AUTH_FAILURE
                          </div>
                          <p className="text-[10.5px] text-red-400/80 font-sans leading-relaxed">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login Inputs */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Identity Mail */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-slate-500">
                        Personnel Identity (Email)
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
                            borderColor: focusedField === "email" ? "rgba(6,182,212,0.4)" : undefined,
                          }}
                        />
                        {focusedField === "email" && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left bg-gradient-to-r from-cyan-500 to-blue-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* Cryptographic Keycode */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-slate-500">
                        Operational Passkey (Password)
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
                            borderColor: focusedField === "password" ? "rgba(6,182,212,0.4)" : undefined,
                          }}
                        />
                        {focusedField === "password" && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left bg-gradient-to-r from-cyan-500 to-blue-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* Authorize */}
                    <button
                      id="login-btn"
                      type="submit"
                      disabled={loading}
                      className="btn-cyber w-full justify-center mt-3 disabled:opacity-40 disabled:cursor-not-allowed font-mono tracking-widest text-[10px] py-3.5"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Verifying identity...
                        </>
                      ) : (
                        <>
                          Request Console Entry <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Return options */}
                  <div className="mt-8 pt-6 border-t border-slate-950 text-center">
                    <Link href="/" className="text-[9px] font-mono text-slate-600 hover:text-cyan-400 transition-colors tracking-widest uppercase">
                      &larr; Return to platform overview
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-6 text-center text-[9px] font-mono text-slate-700 uppercase tracking-widest">
            Audit logs are collected for all access authorizations.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
