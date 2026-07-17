import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Terms of Service — SentraDesk' }
export default function TermsPage() {
  return (
    <div className="page-container py-16 max-w-3xl">
      <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Terms of Service</h1>
      <p className="text-neutral-500 mb-8">Last updated: July 2026</p>
      <div className="space-y-8 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Acceptance of Terms</h2><p>By using SentraDesk, you agree to these terms. SentraDesk is a platform for filing and tracking cyber complaints. Use of the platform is subject to applicable Indian law, including the IT Act 2000/2008.</p></section>
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Acceptable Use</h2><p>You agree to: file only genuine complaints, provide accurate information, not attempt to circumvent security controls, not submit false or frivolous complaints, and not use the platform for any unlawful purpose.</p></section>
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">False Complaints</h2><p>Filing a knowingly false complaint is a criminal offense under Section 182 of the Indian Penal Code. SentraDesk maintains complete audit trails of all submissions that may be used as evidence in legal proceedings.</p></section>
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Account Security</h2><p>You are responsible for maintaining the security of your account credentials. You must notify us immediately at security@sentradesk.gov.in if you suspect unauthorized access to your account.</p></section>
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Platform Availability</h2><p>SentraDesk is provided on an as-available basis. We do not guarantee uninterrupted access and are not liable for any disruption to service.</p></section>
      </div>
    </div>
  )
}
