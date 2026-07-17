import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Cookie Policy — SentraDesk' }
export default function CookiePage() {
  return (
    <div className="page-container py-16 max-w-3xl">
      <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Cookie Policy</h1>
      <p className="text-neutral-500 mb-8">Last updated: July 2026</p>
      <div className="space-y-8 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">What We Store</h2><p>SentraDesk uses browser localStorage (not cookies) to store your authentication tokens and theme preference. No third-party analytics or advertising trackers are used.</p></section>
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Authentication Tokens</h2><p>JWT access tokens (30 min expiry) and refresh tokens (7 day expiry) are stored in localStorage to maintain your session. These are cryptographically signed and cannot be forged. They are cleared on logout.</p></section>
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Theme Preference</h2><p>Your light/dark mode preference is stored locally and never transmitted to our servers.</p></section>
        <section><h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">No Tracking</h2><p>SentraDesk does not use Google Analytics, Facebook Pixel, or any third-party tracking services. We do not share your data with advertisers.</p></section>
      </div>
    </div>
  )
}
