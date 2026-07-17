import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'SentraDesk — SentraDesk',
    template: '%s | SentraDesk',
  },
  description:
    'Enterprise AI Complaint Management & Intelligent Case Assignment Platform system. File complaints, track investigations, and get justice.',
  keywords: ['cyber complaint', 'cybercrime', 'complaint portal', 'SentraDesk', 'cyber cell'],
  authors: [{ name: 'SentraDesk Team' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'SentraDesk',
    title: 'SentraDesk — SentraDesk',
    description: 'Enterprise AI Complaint Management & Intelligent Case Assignment Platform system.',
  },
}

import { AuthProvider } from '@/components/providers/AuthProvider'

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
                  var theme = localStorage.getItem('sentradesk-theme') || 'light';
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
