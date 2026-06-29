import Link from "next/link";
import { 
  Shield, 
  Lock, 
  Users, 
  LineChart, 
  ChevronRight, 
  ArrowRight,
  Database,
  Mail,
  FolderLock,
  Cpu,
  Globe,
  Terminal,
  Activity,
  Layers,
  Clock
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#060814] text-gray-100 overflow-hidden font-sans selection:bg-blue-600/30 selection:text-blue-300">
      {/* Decorative Interactive/Cyber Grid & Glowing Canvas Elements */}
      <div className="absolute inset-0 cyber-grid opacity-70 pointer-events-none z-0" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none z-0 animate-glow-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] rounded-full bg-indigo-950/15 blur-[160px] pointer-events-none z-0 animate-glow-pulse" style={{ animationDelay: "2s" }} />

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#060814]/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
              <Shield className="h-5.5 w-5.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-wider text-white font-mono uppercase">
                CCGP
              </span>
              <span className="text-[9px] font-bold text-blue-400 tracking-widest uppercase">
                Cyber Governance
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-semibold text-white rounded-lg group bg-gradient-to-br from-blue-600 to-indigo-500 hover:text-white dark:text-white focus:ring-2 focus:outline-none focus:ring-blue-800 transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-[#070919] rounded-md group-hover:bg-opacity-0">
                Access Gateway
              </span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Section */}
      <main className="relative flex-1 z-10">
        
        {/* HERO SECTION */}
        <section className="container mx-auto px-6 pt-16 pb-24 md:pt-28 md:pb-36 flex flex-col items-center justify-center">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4.5 py-1.5 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider animate-pulse">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              Secured State-Level Operations Hub
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl font-sans">
              AI-Powered Cyber Complaint <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
                Governance Platform
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-gray-400 leading-relaxed md:text-lg">
              Automated multi-channel incident intake, dynamic SLA-based escalation routing, and cryptographic evidence preservation. Engineered for modern cyber cells.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link
                href="/login"
                className="group flex items-center gap-2 rounded-lg bg-blue-600 px-6.5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/35 transition-all duration-300"
              >
                Access Command Center
                <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
            </div>
          </div>

          {/* Interactive Hero Graphic (Command Console Mockup) */}
          <div className="mt-16 w-full max-w-5xl animate-float">
            <div className="glass rounded-2xl border border-white/10 shadow-2xl shadow-blue-950/20 overflow-hidden bg-slate-950/45">
              {/* Header tab window bars */}
              <div className="flex items-center justify-between px-4 py-3 bg-black/45 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/40" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/40" />
                  <span className="h-3 w-3 rounded-full bg-green-500/40" />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400/80 bg-blue-950/25 px-3 py-0.5 rounded border border-blue-500/10">
                  <Terminal className="h-3 w-3" /> SECURE GATEWAY // STATUS: OPERATIONAL
                </div>
                <div className="h-3 w-3" />
              </div>
              
              {/* Body Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[11px] text-gray-400">
                <div className="space-y-3 p-4.5 bg-black/30 rounded-xl border border-white/5">
                  <span className="text-white font-bold text-xs flex items-center gap-2"><Cpu className="h-4 w-4 text-blue-400" /> SYSTEM ENGINE</span>
                  <div className="space-y-1">
                    <p className="text-gray-500">SYSTEM ARCHITECTURE: CLEAN CORE</p>
                    <p className="text-gray-500">API LAYER: FASTAPI ROUTER</p>
                    <p className="text-gray-500">DATABASE: POSTGRESQL + ORM</p>
                    <p className="text-green-400 flex items-center gap-1">✔ REDIS_CACHE: OK</p>
                    <p className="text-green-400 flex items-center gap-1">✔ COMPRESS_ZIP: READY</p>
                  </div>
                </div>
                <div className="space-y-3 p-4.5 bg-black/30 rounded-xl border border-white/5">
                  <span className="text-white font-bold text-xs flex items-center gap-2"><Globe className="h-4 w-4 text-indigo-400" /> ACTIVE INTAKE</span>
                  <div className="space-y-1">
                    <p className="text-gray-500">IMAP LISTENER STATE: ACTIVE</p>
                    <p className="text-gray-500">SLA MONITORS DEADLINES: CALCULATED</p>
                    <p className="text-indigo-400 flex items-center gap-1">⚡ AUTO_TRIAGE_CLASSIFICATION</p>
                    <p className="text-green-400 flex items-center gap-1">✔ MAIL_SMTP: RETRY_QUEUE_OK</p>
                    <p className="text-green-400 flex items-center gap-1">✔ EMAIL_THREADING: RUNNING</p>
                  </div>
                </div>
                <div className="space-y-3 p-4.5 bg-black/30 rounded-xl border border-white/5">
                  <span className="text-white font-bold text-xs flex items-center gap-2"><FolderLock className="h-4 w-4 text-purple-400" /> EVIDENCE VAULT</span>
                  <div className="space-y-1">
                    <p className="text-gray-500">STORAGE INTERFACE: MINIO CLIENT</p>
                    <p className="text-gray-500">PRESIGNED LINK: SHA-256 SIGNED</p>
                    <p className="text-purple-400 flex items-center gap-1">🔒 METADATA_CRYPT_INTEGRITY</p>
                    <p className="text-green-400 flex items-center gap-1">✔ BUCKET: ACTIVE</p>
                    <p className="text-green-400 flex items-center gap-1">✔ VERSIONING: VERSION_CONTROL_ON</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS OVERVIEW SECTION */}
        <section className="border-y border-white/5 bg-black/20 py-12">
          <div className="container mx-auto px-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { label: "Triage Classification", value: "98.4%" },
              { label: "Incident Triage Duration", value: "< 2 Mins" },
              { label: "Active SLA Adherence", value: "99.1%" },
              { label: "Evidence Proofs Anchored", value: "100%" },
            ].map((stat, i) => (
              <div key={i} className="glass rounded-xl p-5 text-center border-white/5 bg-slate-900/10">
                <div className="text-3xl font-extrabold text-blue-500 font-mono tracking-tight md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PILLARS / FEATURES SECTION */}
        <section className="container mx-auto px-6 py-24 space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl font-sans">Core System Pillars</h2>
            <p className="mx-auto max-w-lg text-sm text-gray-400 leading-relaxed">
              Designed from the ground up to support law enforcement investigation lifecycles securely.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Mail,
                title: "Email-to-Ticket Automation",
                desc: "IMAP connections automatically ingest citizen reports, while parsed threading index values link replies to active parent cases.",
                color: "text-blue-500"
              },
              {
                icon: Lock,
                title: "Zero-Trust RBAC Control",
                desc: "Granular authorization mapped across 8 core tiers (from Citizen to Administrator) verifying session signatures for secure API routing.",
                color: "text-indigo-500"
              },
              {
                icon: LineChart,
                title: "Escalation & SLA Trackers",
                desc: "Calculates countdown deadlines based on severity, checking breaches periodically to auto-escalate priorities and alert supervisors.",
                color: "text-purple-500"
              },
            ].map((pillar, i) => {
              const IconComponent = pillar.icon;
              return (
                <div key={i} className="glass-interactive rounded-xl p-8 bg-slate-950/20 border-white/5 space-y-5">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 ${pillar.color}`}>
                    <IconComponent className="h-5.5 w-5.5" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">{pillar.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400 font-sans">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* SYSTEM WORKFLOW ARCHITECTURE VISUALIZATION */}
        <section className="container mx-auto px-6 pb-24 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl font-sans">Architecture Workflow</h2>
            <p className="mx-auto max-w-lg text-sm text-gray-400 leading-relaxed">
              FastAPI backend router orchestrating databases, caches, queues, and object storage.
            </p>
          </div>

          {/* Workflow Steps Cards */}
          <div className="grid gap-6 md:grid-cols-4 font-mono text-[11px]">
            {[
              { step: "01", name: "INTAKE PROCESS", desc: "Citizen portal submissions or IMAP listener email flows convert complaints to active tickets.", icon: Activity },
              { step: "02", name: "ROUTING RULES", desc: "Automatic ticket classification, severity assignments, and routing to specialized cell groups.", icon: Layers },
              { step: "03", name: "SLA MONITORS", desc: "Celery beats run monitors, checking countdown status levels to dispatch warning email logs.", icon: Clock },
              { step: "04", name: "EVIDENCE STORAGE", desc: "Secure Presigned URLs link file chunks directly to MinIO storage vaults checking SHA-256 hashes.", icon: Database },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="glass rounded-xl p-6 border-white/5 bg-slate-900/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-blue-500 font-bold text-sm tracking-wider">{card.name}</span>
                    <span className="text-gray-600 font-bold text-xs">{card.step}</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-gray-400 font-sans">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-8 text-center text-xs text-gray-500 z-10 bg-black/10">
        <p>&copy; 2026 CCGP. Governance Operations Platform. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
