'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/index'

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/disclosure', label: 'Disclosure' },
]

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 backdrop-blur-md">
      <div className="page-container">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center group-hover:bg-primary-800 transition-colors">
              <Shield className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-white text-sm tracking-tight">CCGP</span>
              <span className="hidden sm:inline text-neutral-400 dark:text-neutral-500 text-xs ml-1 font-normal">
                Cyber Complaint Governance
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                  pathname === link.href
                    ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="btn btn-primary btn-sm hidden sm:inline-flex"
              id="navbar-signin-btn"
            >
              Sign In
            </Link>
            <button
              className="md:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 animate-slide-down">
          <div className="page-container py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link w-full"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <Link
                href="/auth/login"
                className="btn btn-primary w-full"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
