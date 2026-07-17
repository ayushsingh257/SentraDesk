import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Responsible Disclosure — SentraDesk' }

export default function DisclosurePage() {
  return (
    <div className="page-container py-16 max-w-3xl">
      <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Responsible Disclosure Policy</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-8">Last updated: July 2026</p>
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Our Commitment</h2>
          <p>We are committed to the security of the SentraDesk platform and the data of all users. We welcome responsible disclosure of security vulnerabilities by security researchers.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">How to Report</h2>
          <p>Email <strong>security@sentradesk.gov.in</strong> with: a description of the vulnerability, reproduction steps, the potential impact, and any suggested mitigations. Do not disclose publicly until we have had an opportunity to investigate and remediate.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Our Response</h2>
          <ul className="space-y-2 list-disc ml-5">
            <li>Acknowledgement within 24 hours</li>
            <li>Triage and severity assessment within 72 hours</li>
            <li>Critical/High vulnerabilities patched within 5 business days</li>
            <li>We will keep you informed throughout the remediation process</li>
            <li>Credit will be given in our security changelog (unless you prefer anonymity)</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">In Scope</h2>
          <ul className="space-y-2 list-disc ml-5">
            <li>Authentication and session management vulnerabilities</li>
            <li>Authorization and RBAC bypass</li>
            <li>Injection vulnerabilities (SQL, command, etc.)</li>
            <li>Data exposure or privacy violations</li>
            <li>Evidence integrity compromise</li>
            <li>Audit trail tampering</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Out of Scope</h2>
          <ul className="space-y-2 list-disc ml-5">
            <li>Social engineering attacks</li>
            <li>Physical access attacks</li>
            <li>Denial of service attacks</li>
            <li>Vulnerabilities in third-party services</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
