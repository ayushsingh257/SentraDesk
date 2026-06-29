import Link from "next/link";
import { Shield, Mail, Award, Lock, Users, LineChart, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex flex-col justify-between min-h-screen">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[600px] h-[600px] rounded-full bg-blue-950/10 blur-[130px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-cyber-bg/85 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-blue-500" />
            <span className="text-xl font-bold tracking-tight text-white uppercase">
              TechM CCGP
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/35"
            >
              Portal Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Section */}
      <main className="container mx-auto flex-1 px-6 py-12 md:py-24">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-semibold text-blue-400">
            <Award className="h-4.5 w-4.5" /> Official Tech Mahindra CSRM Project
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl">
            AI-Powered Cyber Complaint <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Governance Platform
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-cyber-muted md:text-xl">
            Modernize triage, automate workflows, and cryptographically protect the integrity of digital evidence. Engineered for state-level cyber cells.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/35"
            >
              Access Command Center <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Analytics Highlights */}
        <div className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {[
            { label: "AI Classification Accuracy", value: "98.4%" },
            { label: "Average Triage Duration", value: "< 2 Mins" },
            { label: "Active SLA Adherence", value: "99.1%" },
            { label: "Ledger Anchored Proofs", value: "100.0%" },
          ].map((stat, i) => (
            <div key={i} className="glass rounded-xl p-6 text-center">
              <div className="text-3xl font-extrabold text-white md:text-4xl">{stat.value}</div>
              <div className="mt-2 text-xs font-semibold text-cyber-muted uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Core Pillars */}
        <div className="mt-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white md:text-4xl">System Key Pillars</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-cyber-muted">
              Built secure-by-default to satisfy state-level law enforcement requirements.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Mail,
                title: "Email-to-Ticket Engine",
                desc: "IMAP/SMTP service automatically converting citizen reports into tracked tickets while keeping responders in sync.",
              },
              {
                icon: Lock,
                title: "Zero-Trust RBAC",
                desc: "Hierarchical permissions control mapped across 8 system roles ensuring secure handling of sensitive files.",
              },
              {
                icon: LineChart,
                title: "State-Machine Workflows",
                desc: "Structured status pathways requiring multi-tier L1/L2 approvals before final ticket resolution closure.",
              },
            ].map((pillar, i) => {
              const IconComponent = pillar.icon;
              return (
                <div key={i} className="glass-interactive rounded-xl p-8">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-white">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-cyber-muted">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-cyber-muted">
        <p>&copy; 2026 Tech Mahindra Cybersecurity & Risk Management. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
