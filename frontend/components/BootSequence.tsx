"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface BootSequenceProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  { text: "CCGP SECURE KERNEL v4.2.1 — INITIALIZING", delay: 0, color: "#0ea5e9" },
  { text: "Loading cryptographic modules...", delay: 0.15, color: "#64748b" },
  { text: "✔ AES-256-GCM cipher: LOADED", delay: 0.3, color: "#10b981" },
  { text: "✔ RSA-4096 key exchange: LOADED", delay: 0.42, color: "#10b981" },
  { text: "Establishing secure channel to backend...", delay: 0.55, color: "#64748b" },
  { text: "✔ TLS 1.3 handshake: COMPLETE", delay: 0.70, color: "#10b981" },
  { text: "✔ Zero-trust authentication layer: ACTIVE", delay: 0.82, color: "#10b981" },
  { text: "Loading threat intelligence modules...", delay: 0.95, color: "#64748b" },
  { text: "✔ RBAC policy engine: INITIALIZED", delay: 1.08, color: "#10b981" },
  { text: "✔ Evidence chain-of-custody: VERIFIED", delay: 1.20, color: "#10b981" },
  { text: "✔ SLA monitoring daemon: RUNNING", delay: 1.32, color: "#10b981" },
  { text: "System integrity check: PASSED", delay: 1.44, color: "#0ea5e9" },
  { text: "CCGP COMMAND CENTER — READY", delay: 1.58, color: "#38bdf8" },
];

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        // Fade out the whole boot screen
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete,
        });
      },
    });

    // Reveal each line
    BOOT_LINES.forEach((_, i) => {
      tl.call(() => setVisibleLines((prev) => [...prev, i]), [], BOOT_LINES[i].delay);
    });

    // Animate the progress bar
    tl.to(
      progressRef.current,
      { width: "100%", duration: 1.5, ease: "power1.inOut" },
      0
    );

    // Hold 0.4s then let onComplete fire
    tl.to({}, { duration: 0.4 });

    return () => { tl.kill(); };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020408]"
      style={{ fontFamily: "var(--font-mono, monospace)" }}
    >
      {/* Scan line overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40" />
      <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40" />

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-xs text-cyan-400/60 tracking-[0.3em] uppercase mb-2">
          SECURE BOOT SEQUENCE
        </div>
        <div className="text-2xl font-bold text-white tracking-widest uppercase">
          CCGP
        </div>
        <div className="text-xs text-slate-500 tracking-widest mt-1 uppercase">
          Cyber Complaint Governance Platform
        </div>
      </div>

      {/* Terminal output */}
      <div className="w-full max-w-lg px-6">
        <div className="rounded-lg border border-cyan-500/10 bg-black/60 p-5 space-y-1 min-h-[260px]">
          {BOOT_LINES.map((line, i) => (
            <div
              key={i}
              className="text-[11px] tracking-wide transition-opacity duration-100"
              style={{
                color: line.color,
                opacity: visibleLines.includes(i) ? 1 : 0,
                fontFamily: "inherit",
              }}
            >
              <span className="text-cyan-500/40 mr-3 text-[9px]">
                [{String(i + 1).padStart(2, "0")}]
              </span>
              {line.text}
              {i === visibleLines[visibleLines.length - 1] && (
                <span className="cursor-blink ml-1 text-cyan-400">█</span>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-[9px] text-slate-600 mb-2 tracking-wider uppercase">
            <span>System Ready</span>
            <span>Loading...</span>
          </div>
          <div className="h-[2px] w-full bg-cyan-950/40 rounded-full overflow-hidden">
            <div
              ref={progressRef}
              className="h-full w-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, #0ea5e9, #06b6d4, #8b5cf6)",
                boxShadow: "0 0 8px rgba(14,165,233,0.8)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
