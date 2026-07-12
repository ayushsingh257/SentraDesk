"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

    if (!token) {
      setError("Reset token is missing. Please initiate a new recovery request.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const missing = [];
    if (!pwdMetrics.length) missing.push("12 to 128 characters");
    if (!pwdMetrics.upper) missing.push("an uppercase letter");
    if (!pwdMetrics.lower) missing.push("a lowercase letter");
    if (!pwdMetrics.digit) missing.push("a number");
    if (!pwdMetrics.special) missing.push("a special symbol");
    if (!pwdMetrics.notCommon) missing.push("a secure password");

    if (missing.length > 0) {
      setError(`Password must include: ${missing.join(", ")}.`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(result.error?.message || "Failed to reset password.");
      }
    } catch (err) {
      setError("Cannot connect to security backend. Verify connection status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-xl p-8 md:p-10 border-slate-900 w-full max-w-md">
      <div className="flex items-center gap-1.5 mb-8 pb-4 border-b border-slate-950">
        <span className="h-2 w-2 rounded-full bg-red-500/50" />
        <span className="h-2 w-2 rounded-full bg-yellow-500/50" />
        <span className="h-2 w-2 rounded-full bg-cyan-500/50" />
        <span className="ml-3 text-[9px] font-mono text-cyan-400/50 tracking-[0.25em] uppercase">
          CCGP PASSKEY RESET
        </span>
      </div>

      {success ? (
        <div className="py-8 text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <div className="text-white font-mono font-extrabold text-sm tracking-widest uppercase">PASSKEY COMMITTED</div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans px-2">
              Your password has been successfully updated. All other active sessions have been invalidated. Redirecting to login gateway...
            </p>
          </div>
          <div className="pt-6 border-t border-slate-950">
            <Link href="/login" className="btn-cyber w-full justify-center text-[10px] tracking-widest uppercase">
              Redirecting...
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6 space-y-1.5">
            <h1 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Reset Passkey</h1>
            <p className="text-[9.5px] font-mono text-slate-500 tracking-wider uppercase">
              Provide new password credentials
            </p>
          </div>

          {error && (
            <div className="mb-6 flex gap-3 rounded border border-red-500/25 bg-red-500/5 p-4">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-400 mt-0.5" />
              <div>
                <div className="text-[9px] font-bold font-mono text-red-400 tracking-widest uppercase mb-0.5">
                  RESET_ERROR
                </div>
                <p className="text-[10.5px] text-red-400/80 font-sans leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-slate-500">
                New Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="cyber-input pl-10"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-slate-500">
                Confirm Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="cyber-input pl-10"
                />
              </div>
            </div>

            {/* Strength indicator */}
            {password && (
              <div className="space-y-2.5 p-3 rounded border border-slate-900/60 bg-slate-950/20">
                <div className="flex justify-between items-center text-[9.5px] font-mono">
                  <span className="text-slate-500 uppercase tracking-wider">Passkey Strength:</span>
                  <span className={strengthScore >= 4 ? "text-emerald-400" : "text-yellow-500"}>
                    {strengthLabels[strengthScore - 1] || "Empty"}
                  </span>
                </div>
                
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

            <button
              type="submit"
              disabled={loading}
              className="btn-cyber w-full justify-center mt-3 disabled:opacity-40 disabled:cursor-not-allowed font-mono tracking-widest text-[10px] py-3.5"
            >
              {loading ? "Committing credentials..." : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-950 text-center">
            <Link href="/login" className="text-[9px] font-mono text-slate-600 hover:text-cyan-400 transition-colors tracking-widest uppercase">
              &larr; Return to login gateway
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#02040a] px-6 py-12 overflow-hidden">
      <div className="absolute inset-0 cyber-grid-bg opacity-[0.15]" />
      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        <Suspense fallback={
          <div className="glass rounded-xl p-8 border-slate-900 w-full max-w-md text-center">
            <div className="text-white font-mono text-xs animate-pulse">Loading recovery context...</div>
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
