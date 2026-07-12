import Link from 'next/link'
import { Shield } from 'lucide-react'

const footerLinks = {
  Platform: [
    { href: '/about', label: 'About CCGP' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/auth/login', label: 'Sign In' },
    { href: '/auth/register', label: 'Create Account' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/disclosure', label: 'Responsible Disclosure' },
    { href: '/cookie', label: 'Cookie Policy' },
  ],
  Resources: [
    { href: 'https://cybercrime.gov.in', label: 'Cybercrime.gov.in', external: true },
    { href: 'https://cert-in.org.in', label: 'CERT-In', external: true },
    { href: '/contact', label: 'Support' },
  ],
}

export function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-neutral-400 border-t border-neutral-800">
      <div className="page-container py-12">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-white" size={18} />
              </div>
              <span className="font-bold text-white text-sm">CCGP</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs text-neutral-500">
              An enterprise AI-powered cyber complaint governance platform for government cyber crime departments.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-300 mb-4">
                {group}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-neutral-200 transition-colors duration-150"
                      >
                        {link.label} ↗
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm hover:text-neutral-200 transition-colors duration-150"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-600">
            © {year} Cyber Complaint Governance Platform. Built for enterprise use.
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-600">
            <span>🔒 Secured with JWT + bcrypt</span>
            <span>🛡️ Cryptographic Audit Trail</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
