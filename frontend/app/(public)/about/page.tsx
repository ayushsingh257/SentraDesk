import type { Metadata } from 'next'
import { Shield, Users, Brain, Lock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About SentraDesk',
  description: 'About the SentraDesk — enterprise AI Complaint Management & Intelligent Case Assignment Platform.',
}

export default function AboutPage() {
  return (
    <div className="page-container py-16 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">About SentraDesk</h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400">
          The SentraDesk is an enterprise AI-powered system designed for cyber crime departments.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Our Mission</h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            SentraDesk exists to modernize cyber complaint handling in law enforcement agencies. Traditional complaint management systems
            were not built for the volume, complexity, and speed required by cyber crime investigations. SentraDesk closes that gap
            by combining AI-powered processing, enterprise security, and full governance controls in a single integrated platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Core Principles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Brain, title: 'AI-First Investigation', desc: 'Every complaint is analyzed by 7 AI modules before an officer ever opens the case.' },
              { icon: Lock, title: 'Security Without Compromise', desc: 'Zero-trust architecture, cryptographic audit trails, and role-based access control at every layer.' },
              { icon: Users, title: 'Citizen-Centric', desc: 'Citizens deserve transparency. Real-time status, notifications, and direct officer communication.' },
              { icon: Shield, title: 'Governance & Accountability', desc: 'Two-tier approval, SLA management, and immutable audit logs ensure every case is handled correctly.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card card-body">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-primary-700 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{title}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">About the Platform</h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
            SentraDesk is a secure complaint governance platform designed to help citizens report cyber incidents, communicate with investigating officers, and track investigations transparently while enabling law enforcement agencies to manage complaints efficiently.
          </p>
        </section>
      </div>
    </div>
  )
}
