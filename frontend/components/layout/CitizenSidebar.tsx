'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Shield,
  Menu,
  X
} from 'lucide-react'

import { useAuth } from '@/components/providers/AuthProvider'
import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface NavItem {
  name: string
  href: string
  icon: any
  badgeKey?: string
}

export function CitizenSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/citizen/dashboard', icon: LayoutDashboard },
    { name: 'File a Complaint', href: '/citizen/complaints/new', icon: PlusCircle },
    { name: 'My Tickets', href: '/citizen/tickets', icon: FileText },
    { name: 'Notifications', href: '/citizen/notifications', icon: Bell, badgeKey: 'unread' },
    { name: 'My Profile', href: '/citizen/profile', icon: User },
    { name: 'Settings', href: '/citizen/settings', icon: Settings },
  ]

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const res = await api.get(API_ROUTES.notificationUnreadCount)
        if (res.data?.success) {
          setUnreadCount(res.data.data.unread_count)
        }
      } catch (err) {
        console.error('Failed to fetch unread notification count:', err)
      }
    }

    fetchUnreadCount()
    // Poll unread notification count every 20 seconds
    const interval = setInterval(fetchUnreadCount, 20000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      {/* Brand logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
        <div className="w-9 h-9 bg-primary-700 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-neutral-900 dark:text-white leading-none">CCGP</span>
          <span className="text-[10px] text-neutral-400 font-semibold mt-0.5 tracking-wider uppercase">Citizen Portal</span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          const showBadge = item.badgeKey === 'unread' && unreadCount > 0

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 group-hover:text-neutral-500'
                }`} />
                <span>{item.name}</span>
              </div>
              {showBadge && (
                <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-white dark:ring-neutral-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold border border-primary-200 dark:border-primary-800">
            {user?.name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              {user?.name || 'Citizen'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {user?.email || ''}
            </p>
          </div>
          <ThemeToggle />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 dark:hover:bg-danger/20 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        <SidebarContent />
      </div>

      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 fixed top-0 w-full z-20">
        <Link href="/citizen/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-neutral-900 dark:text-white text-base">CCGP</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1 rounded-lg text-neutral-500 hover:text-neutral-950 dark:hover:text-white focus:outline-none"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-neutral-950/50 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Navigation */}
      <div className={`lg:hidden fixed inset-y-0 left-0 w-72 z-40 transform transition-transform duration-300 ease-in-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>
    </>
  )
}
