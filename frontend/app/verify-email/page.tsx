"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the request URL.");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const result = await response.json();
        if (result.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(result.error?.message || "Invalid or expired email verification link.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Cannot contact security backend. Please verify link source.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="glass rounded-xl p-8 md:p-10 border-slate-900 w-full max-w-md text-center">
      <div className="flex items-center gap-1.5 mb-8 pb-4 border-b border-slate-950">
        <span className="h-2 w-2 rounded-full bg-red-500/50" />
        <span className="h-2 w-2 rounded-full bg-yellow-500/50" />
        <span className="h-2 w-2 rounded-full bg-cyan-500/50" />
        <span className="ml-3 text-[9px] font-mono text-cyan-400/50 tracking-[0.25em] uppercase">
          CCGP VERIFICATION GATE
        </span>
      </div>

      {status === "loading" && (
        <div className="py-8 space-y-6">
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mx-auto" />
          <div className="space-y-1">
            <div className="text-white font-mono font-extrabold text-xs tracking-widest uppercase">
              VALIDATING CODE
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Connecting with governance schema log...
            </p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="py-8 space-y-6">
          <div className="mx-auto w-14 h-14 rounded bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <div className="text-white font-mono font-extrabold text-sm tracking-widest uppercase">
              VERIFICATION COMPLETE
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans px-2">
              Your email address has been successfully verified. Your account registration is active.
            </p>
          </div>
          <div className="pt-6 border-t border-slate-950">
            <Link href="/login" className="btn-cyber w-full justify-center text-[10px] tracking-widest uppercase">
              Proceed to Login
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="py-8 space-y-6">
          <div className="mx-auto w-14 h-14 rounded bg-red-500/10 border border-red-500/35 flex items-center justify-center">
            <XCircle className="h-7 w-7 text-red-400" />
          </div>
          <div className="space-y-2">
            <div className="text-white font-mono font-extrabold text-sm tracking-widest uppercase text-red-400">
              VALIDATION FAILED
            </div>
            <p className="text-xs text-red-400/80 leading-relaxed font-sans px-2">
              {message}
            </p>
          </div>
          <div className="pt-6 border-t border-slate-950 flex flex-col gap-3">
            <Link href="/register" className="btn-cyber w-full justify-center text-[10px] tracking-widest uppercase">
              Request New Account Link
            </Link>
            <Link href="/login" className="text-[9.5px] font-mono text-slate-500 hover:text-cyan-400">
              Return to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#02040a] px-6 py-12 overflow-hidden">
      <div className="absolute inset-0 cyber-grid-bg opacity-[0.15]" />
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/5 blur-[100px]" />
      
      <div className="relative z-10 flex flex-col items-center max-w-md w-full space-y-6">
        <div className="flex items-center gap-3.5 mb-2">
          <Shield className="h-6 w-6 text-cyan-400" />
          <span className="text-sm font-mono font-extrabold tracking-widest text-white">CCGP SYSTEM</span>
        </div>
        <Suspense fallback={
          <div className="glass rounded-xl p-8 border-slate-900 w-full max-w-md text-center">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto" />
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
