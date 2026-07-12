"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Lock, Mail, User as UserIcon, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("citizen");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [pwdMetrics, setPwdMetrics] = useState({
    length: false,
    upper: false,
    lower: false,
    digit: false,
    special: false,
    notCommon: true,
  });

  useEffect(() => {
    const commonList = [
      "password", "password123", "12345678", "123456789", "qwerty",
      "qwerty123", "admin", "admin123", "welcome", "letmein",
      "abc123", "test123", "changeme"
    ];
    setPwdMetrics({
      length: password.length >= 12 && password.length <= 128,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      digit: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      notCommon: !commonList.includes(password.toLowerCase()),
    });
  }, [password]);

  const strengthScore = Object.values(pwdMetrics).filter(Boolean).length;
  const strengthLabels = ["Weakest", "Weak", "Moderate", "Good", "Strong", "Excellent"];
  const strengthColors = [
    "bg-red-600",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-emerald-500"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check client-side validators first
    const missing = [];
    if (!pwdMetrics.length) missing.push("12 to 128 characters");
    if (!pwdMetrics.upper) missing.push("an uppercase letter");
    if (!pwdMetrics.lower) missing.push("a lowercase letter");
    if (!pwdMetrics.digit) missing.push("a number");
    if (!pwdMetrics.special) missing.push("a special symbol");
    if (!pwdMetrics.notCommon) missing.push("a secure password (not common)");

    if (missing.length > 0) {
      setError(`Password must include: ${missing.join(", ")}.`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error?.message || "Registration failed.");
      }
    } catch (err) {
      setError("Cannot contact authentication backend. Verify server connectivity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-stretch bg-[#02040a] overflow-hidden">
      
      {/* ── LEFT PANEL (Government Portal Branding) ──────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 overflow-hidden border-r border-slate-950">
        <div className="absolute inset-0 cyber-grid-dense opacity-[0.25]" />
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[100px]" />

        <div className="relative z-10 max-w-md space-y-8">
          <div className="flex items-center gap-4">
            <div className="relative h-13 w-13 rounded bg-gradient-to-br from-cyan-500 via-blue-600 to-cyan-500 flex items-center justify-center border border-cyan-400/30">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-mono font-black tracking-[0.25em] text-white uppercase">CCGP</div>
              <div className="text-[9px] font-mono font-bold tracking-[0.25em] text-cyan-400/60 uppercase mt-0.5">Registration Gateway</div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight uppercase font-mono">
              Create Portal <br />
              <span className="gradient-text-blue">Security Account</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Register to report cyber incidents, upload forensic evidence packages, monitor case updates in real-time, or respond to official investigator comments.
            </p>
          </div>

          <div className="rounded-lg border border-slate-900 bg-slate-950/40 p-5 space-y-4">
            <div className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase">
              Strict Access Requirements:
            </div>
            <ul className="space-y-2 text-[10.5px] text-slate-400 list-disc list-inside">
              <li>Requires email verification before account activation.</li>
              <li>Passwords must meet enterprise complexity criteria (Checked locally).</li>
              <li>All citizen interactions are cryptographically signed.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Registration Input Form) ──────────────────── */}
      <div className="relative flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12">
        <div className="absolute inset-0 cyber-grid-bg opacity-[0.15]" />

        <div className="relative w-full max-w-md z-10">
          <div className="glass rounded-xl p-8 md:p-10 border-slate-900">
            <div className="flex items-center gap-1.5 mb-8 pb-4 border-b border-slate-950">
              <span className="h-2 w-2 rounded-full bg-red-500/50" />
              <span className="h-2 w-2 rounded-full bg-yellow-500/50" />
              <span className="h-2 w-2 rounded-full bg-cyan-500/50" />
              <span className="ml-3 text-[9px] font-mono text-cyan-400/50 tracking-[0.25em] uppercase">
                CCGP SIGNUP GATEWAY
              </span>
            </div>

            {success ? (
              <div className="py-8 text-center space-y-6">
                <div className="mx-auto w-14 h-14 rounded bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <div className="text-white font-mono font-extrabold text-sm tracking-widest uppercase">REGISTRATION INITIATED</div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans px-2">
                    A secure verification link has been dispatched to <strong className="text-cyan-400">{email}</strong>. Please check your inbox and verify your address to activate your operations dashboard access.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-950">
                  <Link href="/login" className="btn-cyber w-full justify-center text-[10px] tracking-widest uppercase">
                    Return to Login Gateway
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 space-y-1.5">
                  <h1 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Create Account</h1>
                  <p className="text-[9.5px] font-mono text-slate-500 tracking-wider uppercase">
                    Fill out details to register in governance index
                  </p>
                </div>

                {error && (
                  <div className="mb-6 flex gap-3 rounded border border-red-500/25 bg-red-500/5 p-4">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <div className="text-[9px] font-bold font-mono text-red-400 tracking-widest uppercase mb-0.5">
                        REGISTRATION_ERROR
                      </div>
                      <p className="text-[10.5px] text-red-400/80 font-sans leading-relaxed">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-slate-500">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="John Doe"
                        className="cyber-input pl-10"
                        style={{ borderColor: focusedField === "name" ? "rgba(6,182,212,0.4)" : undefined }}
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-slate-500">
                      Identity Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="complainant@example.com"
                        className="cyber-input pl-10"
                        style={{ borderColor: focusedField === "email" ? "rgba(6,182,212,0.4)" : undefined }}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-slate-500">
                      Access Passkey
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="••••••••••••"
                        className="cyber-input pl-10"
                        style={{ borderColor: focusedField === "password" ? "rgba(6,182,212,0.4)" : undefined }}
                      />
                    </div>
                  </div>

                  {/* Password Strength Indicators */}
                  {password && (
                    <div className="space-y-2.5 p-3 rounded border border-slate-900/60 bg-slate-950/20">
                      <div className="flex justify-between items-center text-[9.5px] font-mono">
                        <span className="text-slate-500 uppercase tracking-wider">Passkey Integrity:</span>
                        <span className={strengthScore >= 4 ? "text-emerald-400" : "text-yellow-500"}>
                          {strengthLabels[strengthScore - 1] || "Empty"}
                        </span>
                      </div>
                      
                      {/* Strength bar */}
                      <div className="h-1 w-full rounded bg-slate-950 overflow-hidden flex gap-0.5">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-full flex-1 transition-colors duration-450 ${
                              i < strengthScore ? strengthColors[strengthScore - 1] : "bg-slate-900"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Validation checklist */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-950/50">
                        <div className="flex items-center gap-1.5">
                          <span className={pwdMetrics.length ? "text-emerald-500 font-bold" : "text-red-500"} >
                            {pwdMetrics.length ? "✓" : "✗"}
                          </span>
                          12-128 chars
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={pwdMetrics.upper ? "text-emerald-500 font-bold" : "text-red-500"}>
                            {pwdMetrics.upper ? "✓" : "✗"}
                          </span>
                          Uppercase [A-Z]
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={pwdMetrics.lower ? "text-emerald-500 font-bold" : "text-red-500"}>
                            {pwdMetrics.lower ? "✓" : "✗"}
                          </span>
                          Lowercase [a-z]
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={pwdMetrics.digit ? "text-emerald-500 font-bold" : "text-red-500"}>
                            {pwdMetrics.digit ? "✓" : "✗"}
                          </span>
                          Number [0-9]
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={pwdMetrics.special ? "text-emerald-500 font-bold" : "text-red-500"}>
                            {pwdMetrics.special ? "✓" : "✗"}
                          </span>
                          Symbol [@#$%!]
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={pwdMetrics.notCommon ? "text-emerald-500 font-bold" : "text-red-500"}>
                            {pwdMetrics.notCommon ? "✓" : "✗"}
                          </span>
                          Not Common password
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Register Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-cyber w-full justify-center mt-3 disabled:opacity-40 disabled:cursor-not-allowed font-mono tracking-widest text-[10px] py-3.5"
                  >
                    {loading ? "Registering identity..." : <>Register Profile <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-950 text-center flex flex-col gap-2">
                  <div className="text-[10px] font-mono text-slate-500">
                    Already have a credential set?{" "}
                    <Link href="/login" className="text-cyan-400 hover:underline">
                      Log in here
                    </Link>
                  </div>
                  <Link href="/" className="text-[9px] font-mono text-slate-600 hover:text-cyan-400 transition-colors tracking-widest uppercase">
                    &larr; Return to platform overview
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
