import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Privacy Policy — SentraDesk' }
export default function PrivacyPage() {
  return (
    <div className="page-container py-16 max-w-3xl">
      <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Privacy Policy</h1>
      <p className="text-neutral-500 mb-8">Last updated: July 2026</p>
      <div className="space-y-8 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Data We Collect</h2><p>We collect information you provide when filing a complaint (name, email, phone, complaint details) and usage data (login timestamps, IP addresses for security purposes). Evidence files are stored encrypted in secure object storage.</p></section>
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">How We Use Your Data</h2><p>Your data is used solely for the purpose of processing, investigating, and resolving your cyber complaint. We do not sell, share, or use your data for advertising. Complaint data may be used in aggregated, anonymized form for platform analytics.</p></section>
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Data Security</h2><p>All data is encrypted in transit (TLS) and at rest. Passwords are hashed using bcrypt. Evidence files are protected with SHA-256 integrity hashing. Access is strictly controlled via role-based permissions.</p></section>
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Data Retention</h2><p>Complaint and investigation records are retained permanently as required for legal and evidentiary purposes. You may request access to your own data by contacting support@sentradesk.gov.in.</p></section>
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Contact</h2><p>For privacy concerns: privacy@sentradesk.gov.in</p></section>
      </div>
    </div>
  )
}
