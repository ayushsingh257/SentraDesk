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
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
    </div>
  ),
});

// Dynamic import for BootSequence
const BootSequence = dynamic(() => import("@/components/BootSequence"), {
  ssr: false,
});

// ── Web Audio Synthesizer for Ambient hum ───────────────────────
class CyberAudioEngine {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  start() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.osc1 = this.ctx.createOscillator();
      this.osc2 = this.ctx.createOscillator();
      this.filter = this.ctx.createBiquadFilter();
      this.lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      this.gainNode = this.ctx.createGain();

      // Detuned dual oscillators (sine and low sawtooth)
      this.osc1.type = "sine";
      this.osc1.frequency.setValueAtTime(58.27, this.ctx.currentTime); // detuned hum A#1
      
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(116.54, this.ctx.currentTime); // triangle sub

      // Lowpass server room resonance filter
      this.filter.type = "lowpass";
      this.filter.frequency.setValueAtTime(130, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      // Low frequency modulation to simulate shifting room pressure
      this.lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(40, this.ctx.currentTime);

      this.lfo.connect(lfoGain);
      lfoGain.connect(this.filter.frequency);
      
      this.osc1.connect(this.filter);
      this.osc2.connect(this.filter);
      
      this.filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      // Soft start ramp
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 1.8);

      this.osc1.start();
      this.osc2.start();
      this.lfo.start();
    } catch (e) {
      console.warn("Web Audio not supported:", e);
    }
  }

  stop() {
    if (!this.ctx) return;
    try {
      const current = this.ctx.currentTime;
      this.gainNode?.gain.linearRampToValueAtTime(0, current + 0.8);
      setTimeout(() => {
        this.osc1?.stop();
        this.osc2?.stop();
        this.lfo?.stop();
        this.ctx?.close();
        this.ctx = null;
      }, 900);
    } catch (e) {}
  }
}

// ── Animation helpers ───────────────────────────────────────────
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8 } },
};

// ── Section wrapper with reveal ───────────────────────────────
function Section({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section id={id} ref={ref} className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 35 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </section>
  );
}

// ── Feature Card ─────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color }: {
  icon: any; title: string; desc: string; color: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -5, scale: 1.01 }}
      className="glass-card rounded-xl p-6 group cursor-default scanline-active border-slate-800"
    >
      <div
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg mb-5 transition-transform group-hover:rotate-6"
        style={{ background: `${color}12`, border: `1px solid ${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <h3 className="text-sm font-bold text-white mb-2 tracking-wide uppercase font-mono">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed font-sans">{desc}</p>
    </motion.div>
  );
}

// ── Workflow Step ────────────────────────────────────────────────
function WorkflowStep({ n, title, desc, isLast = false }: {
  n: string; title: string; desc: string; isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-5">
      <div className="flex flex-col items-center">
        <motion.div
          whileHover={{ scale: 1.08 }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/5 text-xs font-mono text-cyan-400"
          style={{ boxShadow: "0 0 15px rgba(6,182,212,0.15)" }}
        >
          {n}
        </motion.div>
        {!isLast && <div className="mt-2 w-px flex-1 bg-gradient-to-b from-cyan-500/20 to-transparent" />}
      </div>
      <div className="pb-8">
        <h4 className="text-xs font-bold text-white uppercase tracking-wide font-mono mb-1">{title}</h4>
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{desc}</p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
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

  const toggleAudio = () => {
    if (!audioEngineRef.current) return;
    if (audioOn) {
      audioEngineRef.current.stop();
      setAudioOn(false);
    } else {
      audioEngineRef.current.start();
      setAudioOn(true);
    }
  };

  const features = [
    { icon: Mail, title: "Email Intake Automation", desc: "IMAP/SMTP bridge converts citizen reports into tracked incident tickets with intelligent threading and auto-triage classification.", color: "#0ea5e9" },
    { icon: Lock, title: "Zero-Trust RBAC", desc: "8-tier role hierarchy with JWT session tokens, middleware-enforced permissions, and audit trail logging for every action.", color: "#8b5cf6" },
    { icon: Activity, title: "SLA Enforcement Engine", desc: "Real-time deadline calculation per severity tier. Celery beats monitor breach proximity and auto-escalate to supervisors.", color: "#06b6d4" },
    { icon: Database, title: "Evidence Vault", desc: "Presigned MinIO uploads with SHA-256 integrity checks, versioned chain of custody, and bulk ZIP export for court submissions.", color: "#10b981" },
    { icon: GitBranch, title: "Multi-Tier Closure Workflow", desc: "L1 and L2 supervisor approval gates with comment trails ensure no case closes without documented authorization.", color: "#f59e0b" },
    { icon: FileSearch, title: "AI Intelligence Core", desc: "MLflow-backed classification pipeline with language detection, category inference, and Qdrant vector similarity search.", color: "#ec4899" },
  ];

  const stats = [
    { label: "Classification Accuracy", value: 98.4, suffix: "%" },
    { label: "Average Triage Time", value: 2, suffix: " min", prefix: "< " },
    { label: "SLA Adherence Rate", value: 99.1, suffix: "%" },
    { label: "Evidence Proofs Anchored", value: 100, suffix: "%" },
  ];

  const techStack = [
    { name: "FastAPI", tag: "Backend" },
    { name: "PostgreSQL", tag: "Database" },
    { name: "Redis", tag: "Cache" },
    { name: "MinIO", tag: "Storage" },
    { name: "Celery", tag: "Workers" },
    { name: "Next.js 15", tag: "Frontend" },
    { name: "Qdrant", tag: "Vector DB" },
    { name: "MLflow", tag: "ML Ops" },
    { name: "Docker", tag: "Deploy" },
    { name: "JWT + RBAC", tag: "Auth" },
  ];

  return (
    <SmoothScrollProvider>
      <CursorGlow />

      {/* ── BOOT SEQUENCE ─────────────────────────────────── */}
      <AnimatePresence>
        {booted && !bootDone && (
          <BootSequence onComplete={handleBootComplete} />
        )}
      </AnimatePresence>

      <div className="relative min-h-screen bg-[#02040a] text-slate-100 overflow-hidden font-sans">
        
        {/* ── IMMERSIVE COMMAND BACKGROUND ─────────────────── */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 cyber-grid-dense opacity-[0.25] sm:opacity-[0.35]" />
          {/* Shifting radial ambient glows (NASA Control vibe) */}
          <motion.div 
            animate={{ 
              x: [0, 80, -40, 0],
              y: [0, -60, 40, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-blue-900/10 blur-[130px]" 
          />
          <motion.div 
            animate={{ 
              x: [0, -90, 50, 0],
              y: [0, 80, -30, 0],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-15%] right-[-5%] w-[700px] h-[700px] rounded-full bg-cyan-950/15 blur-[120px]" 
          />
        </div>

        {/* ── HEADER ────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : -15 }}
          transition={{ duration: 0.6 }}
          className="sticky top-0 z-50 w-full border-b border-cyan-500/10 bg-[#02040a]/80 backdrop-blur-md"
        >
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-8.5 w-8.5 items-center justify-center rounded bg-gradient-to-br from-cyan-500 via-blue-600 to-cyan-500 border border-cyan-400/25"
                style={{ boxShadow: "0 0 15px rgba(6,182,212,0.3)" }}>
                <Shield className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <span className="text-sm font-black tracking-[0.2em] text-white font-mono uppercase">CCGP</span>
                <span className="ml-2.5 hidden text-[9px] font-bold tracking-[0.25em] text-cyan-400/60 uppercase sm:inline font-mono">
                  Cyber Operations Center
                </span>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              {/* Optional Ambient audio switch */}
              <button
                onClick={toggleAudio}
                className="flex items-center gap-2 px-3 py-1.5 rounded border border-cyan-500/15 bg-cyan-500/5 hover:bg-cyan-500/10 text-[10px] font-mono text-cyan-400 uppercase tracking-wider transition-colors"
                title="Toggle ambient command hum"
              >
                {audioOn ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
                <span className="hidden xs:inline">Console Hum: {audioOn ? "ON" : "OFF"}</span>
              </button>

              <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-emerald-400 tracking-wider">
                <span className="status-dot-green" />
                GATEWAY SECURED
              </div>
              <Link
                href="/login"
                className="btn-cyber text-[10px] py-2 px-6"
              >
                Secure Login <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </nav>
          </div>
        </motion.header>

        <main className="relative z-10">
          
          {/* ══════════════════════════════════════════════
              HERO COMMAND INTEL SCENE
          ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: bootDone ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="relative pt-6 md:pt-12"
          >
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-12 gap-12 items-center min-h-[calc(100vh-120px)] pb-12">
                
                {/* Left Area: Title Content */}
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate={bootDone ? "show" : "hidden"}
                  className="space-y-6 lg:col-span-6"
                >
                  <motion.div variants={fadeUp} className="flex items-center gap-2.5">
                    <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-cyan-400 uppercase bg-cyan-950/20 px-3 py-1 rounded border border-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                      Federal Security Ops Command
                    </span>
                  </motion.div>

                  <motion.div variants={fadeUp} className="space-y-2">
                    <h1 className="text-4xl xs:text-5xl font-black leading-[1.08] tracking-tight text-white md:text-6xl font-mono">
                      CYBER COMPLAINT
                      <span className="block mt-1 font-sans font-extrabold gradient-text-blue">
                        GOVERNANCE
                      </span>
                      <span className="block text-slate-400 text-2xl xs:text-3xl font-light uppercase tracking-[0.18em] font-mono mt-2">
                        Platform Console
                      </span>
                    </h1>
                  </motion.div>

                  <motion.p variants={fadeUp} className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg font-sans">
                    Secure AI-powered operations center engineered for state cyber cells. Features multi-source intake parsing, cryptographic hash-chained audit trails, automated SLA tracking, and semantic duplicate detection.
                  </motion.p>

                  {/* Actions */}
                  <motion.div variants={fadeUp} className="flex flex-wrap gap-4 pt-2">
                    <Link href="/login" className="btn-cyber font-mono tracking-widest text-[11px] py-3.5 px-8 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                      Initialize Gateway <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href="#platform"
                      className="inline-flex items-center gap-2 rounded border border-slate-800 bg-slate-900/50 hover:bg-slate-900 px-6 py-3.5 text-[10px] font-mono text-slate-400 uppercase tracking-widest hover:border-cyan-500/20 hover:text-cyan-400 transition-all"
                    >
                      Audit Schema <ChevronDown className="h-3.5 w-3.5" />
                    </a>
                  </motion.div>

                  {/* System statistics widgets in HUD style */}
                  <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-900 max-w-md">
                    {[
                      { val: "98.4%", label: "Classification", desc: "Model accuracy" },
                      { val: "< 2m", label: "Auto-Triage", desc: "Triage rate" },
                      { val: "100%", label: "Tamper-Proof", desc: "Chain integrity" },
                    ].map((s, i) => (
                      <div key={i} className="glass rounded-lg p-3 border-slate-900 select-none cursor-default hover:border-cyan-500/10 transition-colors">
                        <div className="text-cyan-400 font-bold font-mono text-base tracking-wide">{s.val}</div>
                        <div className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-500 mt-1">{s.label}</div>
                        <div className="text-[7.5px] text-slate-600 font-mono mt-0.5">{s.desc}</div>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>
                
                {/* Right Area: Holographic Interactive Center */}
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate={bootDone ? "show" : "hidden"}
                  className="relative h-[480px] lg:h-[580px] lg:col-span-6"
                >
                  {/* Digital World Radar Background Grid Overlay */}
                  <div className="absolute inset-0 border border-cyan-500/5 rounded-full pointer-events-none scale-[0.85] orbit-ring opacity-[0.25]"
                    style={{ background: "radial-gradient(circle, transparent 40%, rgba(6,182,212,0.02) 100%)" }} />

                  {/* Three.js canvas network */}
                  <div className="absolute inset-0">
                    <NeuralNetwork />
                  </div>

                  {/* Futuristic holographic HUD cards float-animating */}
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[10%] left-0 glass rounded-lg p-3 text-[9px] font-mono border-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.06)]"
                  >
                    <div className="flex items-center gap-2 text-cyan-400/60 uppercase tracking-widest font-bold">
                      <CpuIcon className="h-3 w-3" /> System Diagnostics
                    </div>
                    <div className="text-white mt-1.5 font-bold">Uptime: 247:18:04</div>
                    <div className="text-slate-500 mt-0.5">CPU Node: 14% usage</div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[10%] right-0 glass rounded-lg p-3 text-[9px] font-mono border-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.06)]"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 uppercase tracking-widest font-bold">
                      <Binary className="h-3 w-3" /> Blockchain Ledger
                    </div>
                    <div className="text-white mt-1.5 font-bold">Merkle Roots: 48 Anchored</div>
                    <div className="text-slate-500 mt-0.5">Chain state: verified</div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-[45%] right-[-5%] glass rounded-lg p-3 text-[9px] font-mono border-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.06)]"
                  >
                    <div className="flex items-center gap-1.5 text-red-400 uppercase tracking-widest font-bold">
                      <Fingerprint className="h-3 w-3" /> Integrity State
                    </div>
                    <div className="text-emerald-400 font-bold mt-1">SECURE (NOMINAL)</div>
                    <div className="text-slate-500 mt-0.5">SHA-256 chaining active</div>
                  </motion.div>
                </motion.div>

              </div>

              {/* Scroll anchor */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: bootDone ? 1 : 0 }}
                transition={{ delay: 1.5 }}
                className="flex justify-center pb-6"
              >
                <div
                  className="flex flex-col items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <span className="text-[8px] font-mono tracking-[0.25em] uppercase">SYSTEM SCHEMA</span>
                  <ChevronDown className="h-4.5 w-4.5" />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              PLATFORM FEATURES SECTION
          ══════════════════════════════════════════════ */}
          <Section id="platform" className="py-24 px-6 border-t border-slate-950">
            <div className="container mx-auto">
              <div className="text-center mb-16 space-y-3">
                <span className="text-[10px] font-mono text-cyan-400 tracking-[0.25em] uppercase">System Specifications</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono sm:text-4xl">
                  Platform <span className="gradient-text-blue">Architectures</span>
                </h2>
                <p className="mx-auto max-w-xl text-xs text-slate-500 font-sans leading-relaxed">
                  Enterprise-grade governance framework engineered for law enforcement cells, incorporating security protocols at every execution layer.
                </p>
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
              >
                {features.map((f, i) => (
                  <FeatureCard key={i} {...f} />
                ))}
              </motion.div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════
              COMPLAINT WORKFLOW DIAGRAMS
          ══════════════════════════════════════════════ */}
          <Section className="py-24 px-6 border-t border-slate-950 bg-slate-950/20">
            <div className="container mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-5">
                  <span className="text-[10px] font-mono text-cyan-400 tracking-[0.25em] uppercase">Operation Lifecycle</span>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono sm:text-4xl">
                    Complaint <span className="gradient-text-blue">State Machine</span>
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md font-sans">
                    Governed, automated incident triage processing from submission to validated investigator closure checks.
                  </p>
                  <Link href="/login" className="btn-cyber font-mono tracking-widest text-[10px] inline-flex">
                    Console Gateway <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="space-y-0 pl-2">
                  <WorkflowStep n="01" title="Intake" desc="Citizen submits via portal or email. IMAP listener auto-parses, threads replies, and creates tracked ticket." />
                  <WorkflowStep n="02" title="Triage & Classification" desc="AI engine classifies category, assesses severity, and routes to the appropriate cyber cell group." />
                  <WorkflowStep n="03" title="Investigation" desc="Officers gather evidence (presigned uploads), add internal notes, and update status through the SOC interface." />
                  <WorkflowStep n="04" title="SLA Monitoring" desc="Celery daemon monitors deadline countdown per severity. Breaches auto-escalate with supervisor alerts." />
                  <WorkflowStep n="05" title="Closure & Approval" desc="Multi-tier L1 + L2 supervisor approval gates with comment trails ensure no case closes without documented authorization." isLast />
                </div>
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════
              DASHBOARD STATISTICS METRICS
          ══════════════════════════════════════════════ */}
          <Section className="py-24 px-6 border-t border-slate-950">
            <div className="container mx-auto">
              <div className="text-center mb-16 space-y-3">
                <span className="text-[10px] font-mono text-cyan-400 tracking-[0.25em] uppercase">Security Telemetry</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono sm:text-4xl">
                  Diagnostics <span className="gradient-text-blue">Throughput</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {stats.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.6 }}
                    viewport={{ once: true }}
                    className="glass rounded-lg p-6 text-center border-slate-900 scanline-active"
                  >
                    <div className="text-3xl font-black font-mono text-cyan-400 md:text-4xl" style={{ textShadow: "0 0 20px rgba(6,182,212,0.3)" }}>
                      <AnimatedCounter target={s.value} suffix={s.suffix} prefix={s.prefix} decimals={s.suffix === "%" ? 1 : 0} />
                    </div>
                    <div className="mt-3 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════
              ARCHITECTURE MATRIX
          ══════════════════════════════════════════════ */}
          <Section className="py-24 px-6 border-t border-slate-950 bg-slate-950/20">
            <div className="container mx-auto">
              <div className="text-center mb-16 space-y-3">
                <span className="text-[10px] font-mono text-cyan-400 tracking-[0.25em] uppercase">Platform Controls</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono sm:text-4xl">
                  Defense-in-<span className="gradient-text-blue">Depth</span>
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                {[
                  { icon: Lock, t: "Zero-Trust Auth", d: "JWT RS256 token validation on every request. No implicit trust.", c: "#0ea5e9" },
                  { icon: Shield, t: "Cryptographic Storage", d: "bcrypt passwords. SHA-256 evidence integrity. AES-256 at rest.", c: "#8b5cf6" },
                  { icon: Network, t: "RBAC Policy Engine", d: "8-tier role hierarchy with middleware-enforced access gates.", c: "#06b6d4" },
                  { icon: Cpu, t: "Rate Limiting", d: "Redis-backed request pooling protects against brute force vectors.", c: "#10b981" },
                  { icon: BarChart3, t: "Full Audit Trail", d: "Immutable event timeline for every action across the platform.", c: "#f59e0b" },
                  { icon: Terminal, t: "CORS Hardening", d: "Starlette middleware locks origins. Preflight validated.", c: "#ec4899" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.01 }}
                    className="glass rounded-lg p-5 flex gap-4 border-slate-900"
                  >
                    <div
                      className="shrink-0 h-9.5 w-9.5 rounded flex items-center justify-center border"
                      style={{ background: `${item.c}08`, borderColor: `${item.c}15` }}
                    >
                      <item.icon className="h-4.5 w-4.5" style={{ color: item.c }} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-1">{item.t}</h4>
                      <p className="text-[11px] text-slate-500 font-sans leading-relaxed">{item.d}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════
              INTELLIGENCE STACK SPEC
          ══════════════════════════════════════════════ */}
          <Section className="py-24 px-6 border-t border-slate-950">
            <div className="container mx-auto">
              <div className="text-center mb-12 space-y-3">
                <span className="text-[10px] font-mono text-cyan-400 tracking-[0.25em] uppercase">Platform Stack</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono sm:text-4xl">
                  Enterprise-Grade <span className="gradient-text-blue">Registry</span>
                </h2>
              </div>

              <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                {techStack.map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.03, y: -1 }}
                    className="glass rounded-lg px-4 py-2 flex items-center gap-2.5 border-slate-900"
                  >
                    <span className="text-xs font-bold text-white font-mono">{t.name}</span>
                    <span className="text-[8.5px] font-mono font-bold text-cyan-400/60 uppercase tracking-widest">{t.tag}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════
              SECURE CONSOLE GATEWAY
          ══════════════════════════════════════════════ */}
          <Section className="py-24 px-6 border-t border-slate-950 bg-slate-950/10">
            <div className="container mx-auto">
              <div className="relative overflow-hidden rounded-xl border border-cyan-500/10 bg-[#02040a] p-10 text-center"
                style={{ boxShadow: "0 0 40px rgba(6,182,212,0.05)" }}>
                
                {/* Visual grid in frame */}
                <div className="pointer-events-none absolute inset-0 cyber-grid-bg opacity-[0.15]" />
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[150px] rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)" }} />

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative z-10 space-y-5"
                >
                  <span className="inline-flex items-center gap-2 rounded border border-cyan-500/15 bg-cyan-500/5 px-4 py-1 text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                    <Zap className="h-3 w-3 animate-pulse" /> Command Authorized Gateway
                  </span>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono sm:text-4xl">
                    Initialize Operations
                    <br /><span className="gradient-text-blue">Terminal</span>
                  </h2>
                  <p className="mx-auto max-w-sm text-xs text-slate-500 font-sans">
                    Log in with authorized state credentials to access governance databases and oversee incident triage workflows.
                  </p>
                  <div className="flex justify-center pt-2">
                    <Link href="/login" className="btn-cyber font-mono tracking-widest text-[11px] px-8 py-3.5">
                      Access Console Gateway <ArrowRight className="h-4.5 w-4.5" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </Section>
        </main>

        {/* ── FOOTER ─────────────────────────────────── */}
        <footer className="relative border-t border-slate-950 bg-black/45 py-8 z-10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-500/20">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-black font-mono tracking-widest text-white uppercase">CCGP</span>
                <span className="text-[9px] text-slate-600 font-mono uppercase tracking-[0.2em] hidden md:block">
                  Cyber Complaint Governance Platform
                </span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ALL NODES SECURE
              </div>
              <p className="text-[10px] text-slate-600 font-mono">&copy; 2026 CCGP Console. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScrollProvider>
  );
}
