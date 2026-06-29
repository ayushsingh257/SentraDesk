"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import {
  Shield, ArrowRight, Lock, Mail, Database, Activity,
  Cpu, Globe, Terminal, Layers, CheckCircle2, Zap,
  Network, BarChart3, FileSearch, GitBranch, ChevronDown
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

// ── Stagger fade-in helper ───────────────────────────────────────
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8 } },
};

// ── Section wrapper with scroll reveal ──────────────────────────
function Section({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section
      id={id}
      ref={ref}
      className={`relative ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </section>
  );
}

// ── Feature Card ─────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay = 0 }: {
  icon: any; title: string; desc: string; color: string; delay?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="glass-card rounded-2xl p-6 group cursor-default"
    >
      <div
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-5"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}
      >
        <Icon className="h-5.5 w-5.5" style={{ color }} />
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
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
          whileHover={{ scale: 1.1 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-sm font-bold font-mono text-cyan-400"
          style={{ boxShadow: "0 0 20px rgba(6,182,212,0.2)" }}
        >
          {n}
        </motion.div>
        {!isLast && <div className="mt-2 w-px flex-1 bg-gradient-to-b from-cyan-500/20 to-transparent" />}
      </div>
      <div className="pb-10">
        <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function Home() {
  const [booted, setBooted] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Skip boot in dev after first load (session flag)
  useEffect(() => {
    setBooted(true);
  }, []);

  const handleBootComplete = () => {
    setBootDone(true);
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

      <div className="relative min-h-screen bg-[#060814] text-slate-100 overflow-hidden">
        {/* ── GLOBAL AMBIENT BACKGROUND ─────────────────── */}
        <div className="pointer-events-none fixed inset-0 z-0">
          {/* Cyber grid */}
          <div className="absolute inset-0 cyber-grid-bg opacity-60" />
          {/* Glow orbs */}
          <div className="glow-orb w-[600px] h-[600px] bg-blue-600/20 top-[-10%] left-[10%]" />
          <div className="glow-orb w-[500px] h-[500px] bg-cyan-600/15 bottom-[10%] right-[5%]" style={{ animationDelay: "3s" }} />
          <div className="glow-orb w-[400px] h-[400px] bg-purple-600/12 top-[40%] left-[60%]" style={{ animationDelay: "6s" }} />
        </div>

        {/* ── HEADER ────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: bootDone ? 1 : 0, y: bootDone ? 0 : -20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="sticky top-0 z-50 w-full border-b border-cyan-500/8 bg-[#060814]/85 backdrop-blur-xl"
        >
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 shadow-lg"
                style={{ boxShadow: "0 0 20px rgba(14,165,233,0.4)" }}>
                <Shield className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <span className="text-sm font-black tracking-[0.15em] text-white uppercase font-mono">CCGP</span>
                <span className="ml-2 hidden text-[9px] font-bold tracking-[0.2em] text-cyan-400/60 uppercase sm:inline">
                  Cyber Governance
                </span>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-emerald-400 tracking-wider">
                <span className="status-dot-green" />
                ALL SYSTEMS OPERATIONAL
              </div>
              <Link
                href="/login"
                className="btn-cyber text-[11px]"
              >
                Access Gateway <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </nav>
          </div>
        </motion.header>

        <main className="relative z-10">
          {/* ══════════════════════════════════════════════
              HERO SECTION
          ══════════════════════════════════════════════ */}
          <motion.div
            ref={heroRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: bootDone ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="container mx-auto px-6 pt-12 pb-0 md:pt-20 lg:pt-24">
              <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-100px)]">
                
                {/* Left: Text content */}
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate={bootDone ? "show" : "hidden"}
                  className="space-y-8"
                >
                  {/* Status badge */}
                  <motion.div variants={fadeUp}>
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-[0.15em]">
                      <span className="status-dot-green" />
                      AI-Powered Governance Operations
                    </span>
                  </motion.div>

                  {/* Headline */}
                  <motion.div variants={fadeUp} className="space-y-3">
                    <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
                      Cyber Complaint
                      <span className="block mt-1">
                        <span className="gradient-text-cyber">Governance</span>
                      </span>
                      <span className="block text-slate-300/90 font-extrabold">Platform</span>
                    </h1>
                  </motion.div>

                  {/* Subheadline */}
                  <motion.p variants={fadeUp} className="text-base text-slate-400 leading-relaxed max-w-lg md:text-lg">
                    Enterprise-grade AI command center for state cyber cells. Automated multi-channel incident intake, cryptographic evidence preservation, and intelligent SLA enforcement — all in one secure platform.
                  </motion.p>

                  {/* CTA Buttons */}
                  <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                    <Link href="/login" className="btn-cyber">
                      Access Command Center <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href="#platform"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-[12px] font-bold text-slate-300 uppercase tracking-wider hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300 transition-all duration-300"
                    >
                      Explore Platform <ChevronDown className="h-3.5 w-3.5" />
                    </a>
                  </motion.div>

                  {/* Quick stats row */}
                  <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    {[
                      { v: "98.4%", l: "AI Accuracy" },
                      { v: "< 2min", l: "Triage Time" },
                      { v: "99.1%", l: "SLA Adherence" },
                    ].map((s, i) => (
                      <div key={i} className="text-center">
                        <div className="text-lg font-black font-mono text-cyan-400">{s.v}</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-0.5">{s.l}</div>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Right: 3D Neural Network */}
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate={bootDone ? "show" : "hidden"}
                  className="relative h-[500px] lg:h-[620px]"
                >
                  {/* Outer glow ring */}
                  <div
                    className="absolute inset-8 rounded-full"
                    style={{
                      background: "radial-gradient(ellipse, rgba(14,165,233,0.08) 0%, transparent 70%)",
                    }}
                  />
                  {/* Three.js canvas */}
                  <div className="absolute inset-0">
                    <NeuralNetwork />
                  </div>

                  {/* Floating HUD panels */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-8 left-4 glass-card rounded-xl p-3 text-[10px] font-mono"
                  >
                    <div className="text-cyan-400/60 uppercase tracking-wider mb-1">Threat Level</div>
                    <div className="text-emerald-400 font-bold text-sm">LOW — NOMINAL</div>
                    <div className="mt-1 h-1 w-24 rounded-full bg-emerald-900/40">
                      <div className="h-full w-1/5 rounded-full bg-emerald-500" style={{ boxShadow: "0 0 8px #10b981" }} />
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="absolute bottom-16 right-4 glass-card rounded-xl p-3 text-[10px] font-mono"
                  >
                    <div className="text-cyan-400/60 uppercase tracking-wider mb-1">Active Tickets</div>
                    <div className="text-white font-bold text-sm">24 OPEN CASES</div>
                    <div className="text-slate-600 mt-1">3 CRITICAL · 8 HIGH</div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                    className="absolute top-[45%] right-2 glass-card rounded-xl p-3 text-[10px] font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="status-dot-green" />
                      <span className="text-emerald-400 font-bold">SECURE</span>
                    </div>
                    <div className="text-slate-600 mt-1">TLS 1.3 · AES-256</div>
                  </motion.div>
                </motion.div>
              </div>

              {/* Scroll indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: bootDone ? 1 : 0 }}
                transition={{ delay: 2 }}
                className="flex justify-center pb-12"
              >
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex flex-col items-center gap-2 text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <span className="text-[9px] font-mono tracking-[0.2em] uppercase">Scroll</span>
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              PLATFORM OVERVIEW — FEATURES
          ══════════════════════════════════════════════ */}
          <Section id="platform" className="py-28 px-6">
            <div className="container mx-auto">
              <div className="text-center mb-16 space-y-4">
                <span className="terminal-text">Platform Capabilities</span>
                <h2 className="text-4xl font-black text-white tracking-tight md:text-5xl">
                  Built for <span className="gradient-text-blue">Cyber Governance</span>
                </h2>
                <p className="mx-auto max-w-2xl text-slate-500 leading-relaxed">
                  Every module is purpose-built for state-level cyber law enforcement, with security and auditability at the core.
                </p>
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
              >
                {features.map((f, i) => (
                  <FeatureCard key={i} {...f} delay={i * 0.1} />
                ))}
              </motion.div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════
              COMPLAINT WORKFLOW
          ══════════════════════════════════════════════ */}
          <Section className="py-24 px-6 border-y border-white/5 bg-black/20">
            <div className="container mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                  <span className="terminal-text">Incident Lifecycle</span>
                  <h2 className="text-3xl font-black text-white md:text-4xl tracking-tight">
                    End-to-End <span className="gradient-text-blue">Complaint Workflow</span>
                  </h2>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    From citizen report to verified closure — every step is governed, documented, and auditable.
                  </p>
                  <Link href="/login" className="btn-cyber inline-flex">
                    View Live Dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="space-y-0 pl-4">
                  <WorkflowStep n="01" title="Intake" desc="Citizen submits via portal or email. IMAP listener auto-parses, threads replies, and creates tracked ticket." />
                  <WorkflowStep n="02" title="Triage & Classification" desc="AI engine classifies category, assesses severity, and routes to the appropriate cyber cell group." />
                  <WorkflowStep n="03" title="Investigation" desc="Officers gather evidence (presigned uploads), add internal notes, and update status through the SOC interface." />
                  <WorkflowStep n="04" title="SLA Monitoring" desc="Celery daemon monitors deadline countdown per severity. Breaches auto-escalate with supervisor alerts." />
                  <WorkflowStep n="05" title="Closure & Approval" desc="Multi-tier L1 + L2 supervisor approval workflow with documented justification before final case closure." isLast />
                </div>
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════
              STATISTICS
          ══════════════════════════════════════════════ */}
          <Section className="py-24 px-6">
            <div className="container mx-auto">
              <div className="text-center mb-16 space-y-3">
                <span className="terminal-text">Platform Metrics</span>
                <h2 className="text-4xl font-black text-white tracking-tight">
                  Performance <span className="gradient-text-cyber">At Scale</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                {stats.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.7 }}
                    viewport={{ once: true }}
                    className="glass-card rounded-2xl p-6 text-center"
                  >
                    <div className="text-4xl font-black font-mono text-cyan-400 md:text-5xl" style={{ textShadow: "0 0 30px rgba(6,182,212,0.5)" }}>
                      <AnimatedCounter target={s.value} suffix={s.suffix} prefix={s.prefix} decimals={s.suffix === "%" ? 1 : 0} />
                    </div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════
              SECURITY ARCHITECTURE
          ══════════════════════════════════════════════ */}
          <Section className="py-24 px-6 border-y border-white/5 bg-black/15">
            <div className="container mx-auto">
              <div className="text-center mb-16 space-y-3">
                <span className="terminal-text">Security Architecture</span>
                <h2 className="text-4xl font-black text-white tracking-tight">
                  Defence-in-<span className="gradient-text-blue">Depth</span>
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.02 }}
                    className="glass-card rounded-xl p-5 flex gap-4"
                  >
                    <div
                      className="shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${item.c}12`, border: `1px solid ${item.c}20` }}
                    >
                      <item.icon className="h-4.5 w-4.5" style={{ color: item.c }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">{item.t}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{item.d}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════
              TECHNOLOGY STACK
          ══════════════════════════════════════════════ */}
          <Section className="py-24 px-6">
            <div className="container mx-auto">
              <div className="text-center mb-14 space-y-3">
                <span className="terminal-text">Technology Stack</span>
                <h2 className="text-4xl font-black text-white tracking-tight">
                  Built on <span className="gradient-text-cyber">Enterprise Grade</span> Tech
                </h2>
              </div>

              <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                {techStack.map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="glass-card rounded-lg px-4 py-2.5 flex items-center gap-2.5"
                  >
                    <span className="text-sm font-bold text-white">{t.name}</span>
                    <span className="text-[9px] font-mono font-bold text-cyan-400/60 uppercase tracking-wider">{t.tag}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════
              CALL TO ACTION
          ══════════════════════════════════════════════ */}
          <Section className="py-28 px-6">
            <div className="container mx-auto">
              <div className="relative overflow-hidden rounded-3xl border border-cyan-500/15 bg-gradient-to-b from-cyan-950/30 to-blue-950/20 p-12 text-center"
                style={{ boxShadow: "0 0 60px rgba(14,165,233,0.08), inset 0 0 80px rgba(14,165,233,0.03)" }}>
                {/* Background grid */}
                <div className="pointer-events-none absolute inset-0 cyber-grid-dense opacity-40" />
                {/* Glow */}
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px]"
                  style={{ background: "radial-gradient(ellipse, rgba(14,165,233,0.15), transparent 70%)" }} />

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="relative z-10 space-y-6"
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    <Zap className="h-3 w-3" /> Ready for Operations
                  </span>
                  <h2 className="text-4xl font-black text-white tracking-tight md:text-5xl">
                    Secure Your Cyber Cell's
                    <br /><span className="gradient-text-cyber">Command Center</span>
                  </h2>
                  <p className="mx-auto max-w-lg text-slate-500">
                    Access the platform with your authorized credentials to manage incidents, track evidence, and govern your cyber complaint operations.
                  </p>
                  <div className="flex justify-center">
                    <Link href="/login" className="btn-cyber text-sm px-8 py-4">
                      Access Command Center <ArrowRight className="h-4.5 w-4.5" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </Section>
        </main>

        {/* ── FOOTER ─────────────────────────────────── */}
        <footer className="relative border-t border-white/5 bg-black/20 py-10 z-10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-black font-mono tracking-widest text-white uppercase">CCGP</span>
                <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest hidden md:block">
                  Cyber Complaint Governance Platform
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                All Systems Operational
              </div>
              <p className="text-[11px] text-slate-700">&copy; 2026 CCGP. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScrollProvider>
  );
}
