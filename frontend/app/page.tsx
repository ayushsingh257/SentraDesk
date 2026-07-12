"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import {
  Shield, ArrowRight, Lock, Mail, Database, Activity,
  Cpu, Globe, Terminal, Layers, CheckCircle2, Zap,
  Network, BarChart3, FileSearch, GitBranch, ChevronDown,
  Volume2, VolumeX, Radio, CpuIcon, Binary, Fingerprint
} from "lucide-react";
import SmoothScrollProvider from "@/components/SmoothScroll";
import CursorGlow from "@/components/CursorGlow";
import AnimatedCounter from "@/components/AnimatedCounter";

// Dynamic import: Three.js never runs during SSR / Docker build
const NeuralNetwork = dynamic(() => import("@/components/NeuralNetwork"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#020308]">
      <div className="w-12 h-12 rounded-full border border-cyan-500/20 border-t-cyan-500 animate-spin" />
    </div>
  ),
});

// Dynamic import for BootSequence
const BootSequence = dynamic(() => import("@/components/BootSequence"), {
  ssr: false,
});

// ── HTML5 Audio Engine for Ambient Background Track ──
class CyberAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private fadeInterval: any = null;
  private targetVolume: number = 0.18; // Volume around 15–20%

  constructor() {
    if (typeof window !== "undefined") {
      this.audio = new Audio("/audio/ambient.mp3");
      this.audio.loop = true;
      this.audio.volume = 0;
    }
  }

  async start() {
    if (!this.audio) return;
    try {
      clearInterval(this.fadeInterval);
      if (this.audio.paused) {
        await this.audio.play();
      }

      // Smooth fade-in over approximately 2 seconds
      const steps = 20;
      const stepDuration = 2000 / steps; // 100ms per step
      const volumeStep = this.targetVolume / steps;

      this.fadeInterval = setInterval(() => {
        if (this.audio) {
          if (this.audio.volume < this.targetVolume) {
            this.audio.volume = Math.min(this.targetVolume, this.audio.volume + volumeStep);
          } else {
            clearInterval(this.fadeInterval);
          }
        }
      }, stepDuration);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  stop() {
    if (!this.audio) return;
    clearInterval(this.fadeInterval);

    // Smooth fade-out over approximately 1.5 seconds
    const steps = 20;
    const stepDuration = 1500 / steps; // 75ms per step
    const volumeStep = this.audio.volume / steps;

    this.fadeInterval = setInterval(() => {
      if (this.audio) {
        if (this.audio.volume > 0) {
          this.audio.volume = Math.max(0, this.audio.volume - volumeStep);
        } else {
          clearInterval(this.fadeInterval);
          this.audio.pause();
        }
      }
    }, stepDuration);
  }
}

// ── Cinematic fade in configurations ──────────────────────────
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};

// ── Viewport scroll reveal blocks ─────────────────────────────
function RevealSection({ children, id = "", className = "" }: { children: React.ReactNode; id?: string; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  return (
    <section id={id} ref={ref} className={`min-h-screen flex items-center justify-center py-28 px-6 relative z-10 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        {children}
      </motion.div>
    </section>
  );
}

// ── Landing Page Redesign ──────────────────────────────────────
export default function Home() {
  const [booted, setBooted] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const audioEngineRef = useRef<CyberAudioEngine | null>(null);

  useEffect(() => {
    setBooted(true);
    audioEngineRef.current = new CyberAudioEngine();
    return () => {
      audioEngineRef.current?.stop();
    };
  }, []);

  const handleBootComplete = () => {
    setBootDone(true);
  };

  const toggleAudio = async () => {
    if (!audioEngineRef.current) return;
    if (audioOn) {
      audioEngineRef.current.stop();
      setAudioOn(false);
    } else {
      await audioEngineRef.current.start();
      setAudioOn(true);
    }
  };

  // Auto-resume trigger on first scroll/click if context gets locked
  useEffect(() => {
    const handleAutoplay = async () => {
      if (audioOn && audioEngineRef.current) {
        await audioEngineRef.current.start();
      }
    };
    window.addEventListener("click", handleAutoplay, { once: true });
    window.addEventListener("scroll", handleAutoplay, { once: true });
    return () => {
      window.removeEventListener("click", handleAutoplay);
      window.removeEventListener("scroll", handleAutoplay);
    };
  }, [audioOn]);

  const features = [
    { icon: Mail, title: "Intake Automation", desc: "IMAP bridge parses incoming threat reports into incident ticket states with zero supervisor routing delays.", color: "#0ea5e9" },
    { icon: Lock, title: "Zero-Trust RBAC", desc: "8-tier permissions validate token scopes, audit files, and authorize secure gateway endpoints.", color: "#8b5cf6" },
    { icon: Activity, title: "SLA Control Engine", desc: "Real-time deadline enforcement triggers escalations when breach thresholds are violated.", color: "#06b6d4" },
    { icon: Database, title: "Evidence Preservation", desc: "Signed MinIO storage uploads anchor document integrity using SHA-256 chain indexes.", color: "#10b981" },
    { icon: GitBranch, title: "Approval Workflows", desc: "L1 and L2 validation loops verify resolution criteria before case closures are committed.", color: "#f59e0b" },
    { icon: FileSearch, title: "AI Intelligence Core", desc: "Similarity index searches vector categories using MLflow regression structures.", color: "#ec4899" },
  ];

  const stats = [
    { label: "Classification", value: 98.4, suffix: "%" },
    { label: "Average Triage", value: 2, suffix: " min", prefix: "< " },
    { label: "SLA Adherence", value: 99.1, suffix: "%" },
    { label: "Ledger Integrity", value: 100, suffix: "%" },
  ];

  const techStack = [
    { name: "FastAPI", tag: "REST API" },
    { name: "PostgreSQL", tag: "RDBMS" },
    { name: "Redis", tag: "Broker" },
    { name: "MinIO", tag: "S3 Vault" },
    { name: "Celery", tag: "Schedules" },
    { name: "Next.js 15", tag: "Console" },
    { name: "Qdrant", tag: "Vector Index" },
    { name: "MLflow", tag: "Models" },
    { name: "Docker", tag: "Deploy" },
  ];

  return (
    <SmoothScrollProvider>
      <CursorGlow />

      {/* Boot terminal sequences */}
      <AnimatePresence>
        {booted && !bootDone && (
          <BootSequence onComplete={handleBootComplete} />
        )}
      </AnimatePresence>

      <div className="relative min-h-screen bg-[#010206] text-slate-100 overflow-hidden font-sans select-none">
        
        {/* ── FIXED WebGL 3D VIEWPORT CANVAS ── */}
        <div className="fixed inset-0 z-0 pointer-events-none w-full h-screen">
          <NeuralNetwork />
        </div>

        {/* ── CINEMATIC SPACE NEBULA GRID OVERLAY ── */}
        <div className="pointer-events-none fixed inset-0 z-1">
          <div className="absolute inset-0 cyber-grid-dense opacity-[0.22]" />
          
          {/* Deep space color gradient shading */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#010206] via-transparent to-[#010206]/40" />
          
          {/* Ambient volumetric navy glows */}
          <div className="absolute top-[20%] left-[25%] w-[700px] h-[700px] rounded-full bg-blue-950/15 blur-[130px] opacity-70" />
          <div className="absolute bottom-[25%] right-[15%] w-[600px] h-[600px] rounded-full bg-indigo-950/10 blur-[110px] opacity-60" />
        </div>

        {/* ── NAV HEADER ── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : -10 }}
          transition={{ duration: 0.8 }}
          className="fixed top-0 left-0 z-50 w-full border-b border-white/5 bg-[#010206]/40 backdrop-blur-md"
        >
          <div className="container mx-auto flex items-center justify-between px-8 py-4.5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded bg-cyan-500/10 border border-cyan-500/25">
                <Shield className="h-4.5 w-4.5 text-cyan-400" />
              </div>
              <div>
                <span className="text-xs font-black tracking-[0.25em] text-white font-mono uppercase">CCGP CONSOLE</span>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              {/* Mute/Unmute Audio Hum controller */}
              <button
                onClick={toggleAudio}
                className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/5 bg-white/5 hover:bg-white/10 text-[9px] font-mono text-slate-400 uppercase tracking-widest transition-all"
                title="Toggle ambient track"
              >
                {audioOn ? <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-600" />}
                <span className="hidden xs:inline">{audioOn ? "AMBIENT: ACTIVE" : "AMBIENT: STANDBY"}</span>
              </button>

              <Link
                href="/login"
                className="btn-cyber text-[9px] tracking-widest font-mono py-2 px-6"
              >
                ACCESS GATEWAY <ArrowRight className="h-3 w-3" />
              </Link>
            </nav>
          </div>
        </motion.header>

        {/* ── CINEMATIC SCROLL LAYER ── */}
        <main className="relative z-10">

          {/* ══════════════════════════════════════════════
              SECTION 1: HERO
          ══════════════════════════════════════════════ */}
          <section className="min-h-screen flex flex-col items-center justify-center relative px-6 text-center select-none pt-20">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate={bootDone ? "show" : "hidden"}
              className="max-w-4xl space-y-8 relative z-20"
            >
              <motion.div variants={fadeUp} className="flex justify-center">
                <span className="inline-flex items-center gap-2.5 rounded border border-cyan-500/20 bg-cyan-950/25 px-4.5 py-1 text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-[0.25em] shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
                  India National Cyber Operations Command
                </span>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl md:text-7xl font-mono font-extrabold tracking-tight text-white leading-[1.08]">
                CYBER GOVERNANCE
                <span className="block text-slate-500 text-lg sm:text-2xl font-light uppercase tracking-[0.3em] mt-3">
                  OPERATIONS & INCIDENT CONTROL
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="max-w-xl mx-auto text-xs sm:text-sm text-slate-400 leading-relaxed font-sans font-medium">
                Cryptographic case registry, automated Intake Triages, and multi-tier supervisor approvals, anchored in real-time SLA verification.
              </motion.p>

              <motion.div variants={fadeUp} className="flex justify-center gap-4 pt-4">
                <Link href="/login" className="btn-cyber text-[10px] tracking-widest font-mono py-3.5 px-8">
                  INITIALIZE GATEWAY <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#capabilities"
                  className="inline-flex items-center gap-2 rounded border border-slate-900 bg-slate-950/50 hover:bg-slate-950 px-6 py-3.5 text-[9px] font-mono text-slate-400 uppercase tracking-widest transition-all"
                >
                  SYSTEM SCHEMA <ChevronDown className="h-3.5 w-3.5" />
                </a>
              </motion.div>
            </motion.div>

            <div className="absolute bottom-10 left-0 w-full flex justify-center pointer-events-none">
              <div className="flex gap-10 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                <div>SYSTEM NODE: <span className="text-cyan-400 font-bold">ONLINE</span></div>
                <div className="hidden xs:block">SECTOR STATE: <span className="text-emerald-400 font-bold">SECURED</span></div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════
              SECTION 2: CAPABILITIES
          ══════════════════════════════════════════════ */}
          <RevealSection id="capabilities">
            <div className="container mx-auto max-w-5xl">
              <div className="grid lg:grid-cols-12 gap-12 items-center">
                
                {/* Spacer left: visual focus */}
                <div className="lg:col-span-6 hidden lg:block" />

                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] uppercase">SYSTEM CAPABILITIES</span>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono sm:text-4xl">
                      Operations <span className="gradient-text-blue font-sans">Matrix</span>
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Every transaction and ticket routing pathway is automated through standard server rules and secured using cryptographic signatures.
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
                    {features.map((f, i) => (
                      <div key={i} className="glass rounded-lg p-4 border-slate-900 hover:border-cyan-500/15 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          <f.icon className="h-4 w-4 text-cyan-400" />
                          <h4 className="text-[10.5px] font-mono font-bold text-white uppercase tracking-wider">{f.title}</h4>
                        </div>
                        <p className="text-[9.5px] text-slate-500 leading-relaxed font-sans">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </RevealSection>

          {/* ══════════════════════════════════════════════
              SECTION 3: WORKFLOW
          ══════════════════════════════════════════════ */}
          <RevealSection>
            <div className="container mx-auto max-w-5xl">
              <div className="grid lg:grid-cols-12 gap-12 items-center">
                
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] uppercase">TRIAGE MACHINE</span>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono sm:text-4xl">
                      Incident <span className="gradient-text-blue font-sans">Lifecycles</span>
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Citizens submit case details via structured queues. The incident state transitions smoothly through acknowledge, route, and approval stages.
                  </p>

                  <div className="space-y-4 pt-2">
                    {[
                      { step: "01", name: "Intake Triage", desc: "Incident profiles automatically indexed via SMTP listening protocols." },
                      { step: "02", name: "Semantic Similarity Check", desc: "Qdrant registers check duplicates and assign threat severity scores." },
                      { step: "03", name: "Investigate Ledger", desc: "Officers anchor document evidence parameters with cryptographic hash chains." },
                    ].map((step, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded border border-cyan-500/30 bg-cyan-950/20 text-[10px] font-mono text-cyan-400">
                          {step.step}
                        </div>
                        <div>
                          <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">{step.name}</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spacer right */}
                <div className="lg:col-span-6 hidden lg:block" />

              </div>
            </div>
          </RevealSection>

          {/* ══════════════════════════════════════════════
              SECTION 4: STATISTICS
          ══════════════════════════════════════════════ */}
          <RevealSection>
            <div className="container mx-auto max-w-5xl text-center space-y-12">
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] uppercase">TELEMETRY SYSTEM</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono sm:text-4xl">
                  Operations <span className="gradient-text-blue font-sans">Throughput</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {stats.map((s, i) => (
                  <div key={i} className="glass rounded-lg p-6 border-slate-900 hover:border-cyan-500/10 transition-all select-none">
                    <div className="text-3xl font-black font-mono text-cyan-400" style={{ textShadow: "0 0 20px rgba(6,182,212,0.3)" }}>
                      <AnimatedCounter target={s.value} suffix={s.suffix} prefix={s.prefix} decimals={s.suffix === "%" ? 1 : 0} />
                    </div>
                    <div className="mt-2 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>

          {/* ══════════════════════════════════════════════
              SECTION 5: REGISTRY TECH
          ══════════════════════════════════════════════ */}
          <RevealSection>
            <div className="container mx-auto max-w-4xl text-center space-y-10">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] uppercase">TECHNOLOGY MATRIX</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono sm:text-4xl">
                  Registry <span className="gradient-text-blue font-sans">Abstractions</span>
                </h2>
              </div>

              <div className="flex flex-wrap justify-center gap-3.5">
                {techStack.map((tech, i) => (
                  <div key={i} className="glass rounded-lg px-4 py-2 border-slate-900 hover:border-cyan-500/10 transition-all">
                    <span className="text-xs font-bold text-white font-mono">{tech.name}</span>
                    <span className="text-[8.5px] font-mono font-bold text-cyan-400/60 uppercase tracking-widest ml-2">{tech.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>

          {/* ══════════════════════════════════════════════
              SECTION 6: ACCESS GATEWAY
          ══════════════════════════════════════════════ */}
          <RevealSection>
            <div className="container mx-auto max-w-4xl">
              <div className="relative overflow-hidden rounded-xl border border-slate-900 bg-[#010206]/60 p-12 text-center"
                style={{ boxShadow: "0 25px 65px rgba(0,0,0,0.8)" }}>
                
                <div className="pointer-events-none absolute inset-0 cyber-grid-bg opacity-[0.12]" />

                <div className="relative z-10 space-y-6 max-w-xl mx-auto">
                  <span className="inline-flex items-center gap-2 rounded border border-cyan-500/15 bg-cyan-500/5 px-4 py-1 text-[8.5px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                    <Zap className="h-3 w-3 animate-pulse text-cyan-400" /> Authorized access only
                  </span>
                  
                  <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono sm:text-4xl">
                    Initialize Operations
                    <br /><span className="gradient-text-blue font-sans">Gateway Link</span>
                  </h2>
                  
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Log in with federal cyber cell coordinates to command incident tracking pipelines and check signed ledger logs.
                  </p>
                  
                  <div className="flex justify-center pt-2">
                    <Link href="/login" className="btn-cyber font-mono tracking-widest text-[10px] px-8 py-3.5">
                      INITIALIZE CONSOLE LINK <ArrowRight className="h-4.5 w-4.5" />
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </RevealSection>

        </main>

        {/* ── FOOTER ── */}
        <footer className="relative border-t border-slate-950 bg-black/40 py-8 z-10">
          <div className="container mx-auto px-8">
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-500/20">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-black font-mono tracking-widest text-white uppercase">CCGP</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ALL OPERATIONS SECURED
              </div>
              <p className="text-[9.5px] text-slate-600 font-mono">&copy; 2026 CCGP Command. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScrollProvider>
  );
}
