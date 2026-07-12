import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Shield, Brain, Search, FileCheck, Users, Lock,
  ClipboardList, AlertTriangle, ArrowRight, ChevronRight,
  CheckCircle, Clock, UserCheck, MessageSquare, FileText
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'CCGP — Cyber Complaint Governance Platform',
  description: 'File cyber complaints online. Track your case in real-time. AI-powered investigation. Enterprise-grade security.',
}

// ============================================================
// Section 1 — Hero
// ============================================================
function HeroSection() {
  return (
    <section className="relative bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Subtle background grid */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(#1D4ED8 1px, transparent 1px), linear-gradient(90deg, #1D4ED8 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="page-container relative">
        <div className="py-20 sm:py-28 lg:py-32 max-w-4xl">
          {/* Brand & Version */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl sm:text-5xl font-black tracking-wider text-primary-700 dark:text-primary-400">CCGP</span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-xs font-semibold">
              Version 1.0
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-none mb-4">
            Cyber Complaint Governance Platform
          </h1>

          <p className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-300 font-semibold leading-relaxed mb-6">
            Secure AI-Powered Cyber Complaint & Investigation System
          </p>

          <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed mb-8">
            File cyber complaints online. Automated classification instantly routes files to specialized cyber divisions. Track every phase of the investigation journey securely and transparently.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/auth/register"
              id="hero-register-btn"
              className="btn btn-primary btn-lg group"
            >
              File a Complaint
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/login"
              id="hero-track-btn"
              className="btn btn-outline btn-lg"
            >
              Track Your Case
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap gap-6">
            {[
              { icon: '🔒', text: 'Secure Complaint Handling' },
              { icon: '🤖', text: 'AI-Assisted Investigation' },
              { icon: '⚡', text: 'Transparent Status Tracking' },
              { icon: '🛡️', text: 'Enterprise-Grade Governance' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// Section 2 — What is CCGP
// ============================================================
function WhatIsCCGP() {
  const pillars = [
    {
      icon: ClipboardList,
      title: 'Multi-Channel Intake',
      description: 'Accept complaints via web portal, email, mobile app, helpline, and police stations. Every channel creates a unified tracked ticket.',
    },
    {
      icon: Brain,
      title: 'AI-Powered Processing',
      description: 'Every complaint is automatically classified, severity-scored, and routed to the appropriate investigation unit in seconds.',
    },
    {
      icon: Shield,
      title: 'Secure Investigation',
      description: 'Officers get AI-assisted investigation tools, threat intelligence access, and full evidence chain-of-custody management.',
    },
    {
      icon: FileCheck,
      title: 'Governed Resolution',
      description: 'Two-tier supervisor approval before case closure ensures quality control and accountability on every investigation.',
    },
  ]

  return (
    <section className="page-section bg-neutral-50 dark:bg-neutral-950">
      <div className="page-container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="section-label">What is CCGP</p>
          <h2 className="section-title">Enterprise Cyber Complaint Management</h2>
          <p className="section-subtitle mx-auto">
            CCGP is an AI-powered platform purpose-built for cyber crime departments.
            It transforms how complaints are filed, investigated, and resolved.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div key={pillar.title} className="card card-body text-center group hover:shadow-card-hover transition-shadow duration-200">
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-200">
                  <Icon size={22} className="text-primary-700 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base mb-2">{pillar.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{pillar.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// Section 3 — How CCGP Works (lifecycle)
// ============================================================
function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: ClipboardList,
      title: 'Citizen Files Complaint',
      description: 'Citizen creates an account and submits a detailed cyber complaint through the secure portal. All relevant fraud details, evidence files, and contact information collected in one form.',
      role: 'Citizen',
      color: 'blue',
    },
    {
      step: '02',
      icon: Brain,
      title: 'AI Pipeline Processes',
      description: 'Within seconds, 7 AI modules run: complaint classification, entity extraction (UPI IDs, phone numbers, URLs), severity scoring, duplicate detection, and risk assessment.',
      role: 'System',
      color: 'violet',
    },
    {
      step: '03',
      icon: UserCheck,
      title: 'Officer Assigned',
      description: 'Ticket is automatically assigned to the appropriate investigation unit based on category, severity, and availability. Officer is notified immediately.',
      role: 'System',
      color: 'blue',
    },
    {
      step: '04',
      icon: Search,
      title: 'Investigation Begins',
      description: 'Officer uses AI assistant, threat intelligence tools, evidence management, and secure communication to conduct a thorough investigation with full audit trail.',
      role: 'Officer',
      color: 'violet',
    },
    {
      step: '05',
      icon: MessageSquare,
      title: 'Citizen Collaboration',
      description: 'Officer communicates with the citizen through a secure messaging thread. Citizen receives notifications for every update, can upload additional evidence, and ask follow-up questions.',
      role: 'Citizen + Officer',
      color: 'green',
    },
    {
      step: '06',
      icon: CheckCircle,
      title: 'Supervised Closure',
      description: 'Officer requests closure. Supervisor (L1) reviews. Senior Supervisor (L2) approves. Only then is the case marked resolved. PDF report generated automatically.',
      role: 'Supervisor',
      color: 'amber',
    },
    {
      step: '07',
      icon: FileText,
      title: 'Resolution & Feedback',
      description: 'Citizen receives the closure notification, PDF report, and is invited to submit feedback and rate the investigation. Full case history preserved permanently.',
      role: 'Citizen',
      color: 'green',
    },
  ]

  return (
    <section className="page-section bg-white dark:bg-neutral-900">
      <div className="page-container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="section-label">How CCGP Works</p>
          <h2 className="section-title">The Complete Complaint Lifecycle</h2>
          <p className="section-subtitle mx-auto">
            Every complaint follows a structured, auditable journey from the moment it is filed to final resolution.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700 -translate-x-1/2 hidden sm:block" />

          <div className="space-y-10">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isRight = index % 2 === 1

              return (
                <div
                  key={step.step}
                  className={`relative flex flex-col sm:flex-row gap-6 items-start sm:items-center ${isRight ? 'sm:flex-row-reverse' : ''}`}
                >
                  {/* Content card */}
                  <div className="flex-1 sm:max-w-[45%]">
                    <div className="card card-body">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
                          <Icon size={20} className="text-primary-700 dark:text-primary-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{step.title}</h3>
                            <span className="badge badge-neutral text-xs">{step.role}</span>
                          </div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center step number */}
                  <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex-shrink-0 w-12 h-12 rounded-full bg-primary-700 dark:bg-primary-600 text-white font-bold text-sm flex items-center justify-center shadow-md z-10">
                    {step.step}
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden sm:block flex-1 sm:max-w-[45%]" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// Section 4 — Enterprise Features
// ============================================================
function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Investigation',
      description: 'Seven AI modules classify complaints, extract entities (UPI IDs, phone numbers, URLs, bank accounts), score severity, and provide investigation recommendations to officers.',
    },
    {
      icon: AlertTriangle,
      title: 'Threat Intelligence',
      description: 'Built-in threat intel scanning for IP addresses, domains, URLs, and file hashes using industry-standard threat databases. Automated IOC enrichment.',
    },
    {
      icon: Search,
      title: 'Duplicate Detection',
      description: 'Semantic vector similarity search detects duplicate or related complaints before they become separate investigations. Officers are alerted to potential case merges.',
    },
    {
      icon: FileCheck,
      title: 'Evidence Management',
      description: 'SHA-256 integrity hashing, MinIO secure storage, presigned upload/download URLs, version control, and full chain of custody for every piece of evidence.',
    },
    {
      icon: Lock,
      title: 'Enterprise Security',
      description: 'Zero-trust architecture, JWT with Redis denylist, bcrypt password hashing, rate limiting, TLS in production, and cryptographic audit chain with tamper detection.',
    },
    {
      icon: Users,
      title: 'Role-Based Access Control',
      description: 'Eight-tier role hierarchy from citizen to system administrator. Every API endpoint enforces minimum role requirements server-side. No security by obscurity.',
    },
    {
      icon: FileText,
      title: 'Audit Trails',
      description: 'Every action creates an immutable audit log. SHA-256 hash chain connects all records. Integrity verification detects tampering. PDF export for compliance.',
    },
    {
      icon: Clock,
      title: 'SLA Management',
      description: 'Automatic SLA deadlines by severity (Critical: 24hr, High: 72hr, Medium: 7 days, Low: 15 days). Breach detection, automatic escalation, supervisor alerts.',
    },
  ]

  return (
    <section className="page-section bg-neutral-50 dark:bg-neutral-950">
      <div className="page-container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="section-label">Platform Capabilities</p>
          <h2 className="section-title">Built for Enterprise Operations</h2>
          <p className="section-subtitle mx-auto">
            Every feature maps directly to a real operational need in a cyber crime department.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="card card-body group hover:shadow-card-hover transition-shadow duration-200">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                  <Icon size={20} className="text-primary-700 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2 text-sm">{feature.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function WhyCCGP() {
  const points = [
    'Faster Cyber Complaint Resolution: Automated triage routes cases to specialized units, reducing response and investigation times.',
    'Secure Handling of Complaints: Comprehensive data access controls and encryption protect sensitive personal and financial details.',
    'AI-Assisted Investigation: Machine intelligence helps officers analyze complex fraud patterns and retrieve relevant facts quickly.',
    'Transparent Ticket Tracking: Citizens monitor real-time progress on case milestones with clear communication at every step.',
    'Enterprise-Grade Security: Compliance with national cyber governance guidelines ensures secure, reliable, and auditable case management.',
  ]

  return (
    <section className="page-section bg-white dark:bg-neutral-900">
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="section-label">Trust & Value</p>
            <h2 className="section-title">A Secure Ecosystem for Cyber Governance</h2>
            <p className="section-subtitle">
              CCGP provides a secure, structured, and auditable platform that ensures cyber complaints are resolved rapidly and tracked transparently, giving both citizens and authorities peace of mind.
            </p>

            <ul className="mt-8 space-y-4">
              {points.map((point) => {
                const [title, desc] = point.split(': ')
                return (
                  <li key={title} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      <strong className="text-neutral-950 dark:text-neutral-100">{title}:</strong> {desc}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Value Highlights Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'Verified', label: 'Case Security', sublabel: 'Every case evidence file is cryptographically locked to ensure absolute integrity.' },
              { value: 'Real-Time', label: 'Citizen Tracking', sublabel: 'Receive instant notifications and timeline updates on your complaint status.' },
              { value: 'Multi-Tier', label: 'Case Oversight', sublabel: 'Two-tier supervisor sign-off guarantees quality and correctness for closed tickets.' },
              { value: 'Instant', label: 'Triage & Routing', sublabel: 'AI-assisted analysis routes complaints immediately to specialized divisions.' },
            ].map((stat) => (
              <div key={stat.label} className="card card-body text-center flex flex-col items-center justify-center p-6">
                <div className="text-xl font-bold text-primary-700 dark:text-primary-400 mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">{stat.label}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// Section 6 — CTA
// ============================================================
function CTASection() {
  return (
    <section className="py-20 bg-primary-700 dark:bg-primary-900">
      <div className="page-container text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to File a Cyber Complaint?
        </h2>
        <p className="text-primary-200 text-lg mb-8 max-w-xl mx-auto">
          Create a free account and file your complaint in minutes.
          Your case will be assigned to an officer and tracked through to resolution.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/auth/register"
            id="cta-register-btn"
            className="btn btn-lg bg-white text-primary-800 hover:bg-primary-50 font-semibold"
          >
            Create Account & File Complaint
            <ChevronRight size={18} />
          </Link>
          <Link
            href="/auth/login"
            id="cta-signin-btn"
            className="btn btn-lg border border-primary-500 text-white hover:bg-primary-600"
          >
            Sign In to Track Your Case
          </Link>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// Page
// ============================================================
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WhatIsCCGP />
      <HowItWorksSection />
      <FeaturesSection />
      <WhyCCGP />
      <CTASection />
    </>
  )
}
