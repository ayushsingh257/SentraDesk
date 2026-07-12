import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'CCGP — Cyber Complaint Governance Platform',
    template: '%s | CCGP',
  },
  description:
    'Enterprise AI-powered cyber complaint management system. File complaints, track investigations, and get justice.',
  keywords: ['cyber complaint', 'cybercrime', 'complaint portal', 'CCGP', 'cyber cell'],
  authors: [{ name: 'CCGP Team' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'CCGP',
    title: 'CCGP — Cyber Complaint Governance Platform',
    description: 'Enterprise AI-powered cyber complaint management system.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('ccgp-theme') || 'light';
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
