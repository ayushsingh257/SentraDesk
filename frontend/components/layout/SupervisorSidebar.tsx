'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare,
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Shield,
  Menu,
  X,
  Users,
  AlertTriangle
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

export function SupervisorSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/supervisor/dashboard', icon: LayoutDashboard },
    { name: 'Pending Approvals', href: '/supervisor/approvals', icon: CheckSquare },
    { name: 'All Tickets', href: '/supervisor/tickets', icon: FileText },
    { name: 'Team Performance', href: '/supervisor/performance', icon: Users },
    { name: 'SLA Escalations', href: '/supervisor/sla', icon: AlertTriangle },
    { name: 'My Profile', href: '/supervisor/profile', icon: User },
    { name: 'Settings', href: '/supervisor/settings', icon: Settings },
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
        <div className="w-9 h-9 bg-amber-700 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-neutral-900 dark:text-white tracking-tight">SentraDesk Workspace</span>
          <span className="block text-[10px] text-neutral-450 uppercase font-black tracking-widest mt-0.5">Supervisor portal</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          const hasBadge = item.badgeKey === 'unread' && unreadCount > 0

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-l-4 border-amber-600'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-amber-700 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-500'} />
                <span>{item.name}</span>
              </div>
              {hasBadge && (
                <span className="px-2 py-0.5 text-[10px] font-black text-white bg-red-600 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Profile info & Sign-out */}
      <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
        <div className="flex items-center justify-between px-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold text-neutral-450 hover:text-red-650 dark:text-neutral-500 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-850/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
            <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-300">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                {user.name}
              </p>
              <p className="text-[10px] font-black text-amber-700 dark:text-amber-450 uppercase tracking-wider mt-0.5">
                Supervisor
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop view */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-50">
        <SidebarContent />
      </div>

      {/* Mobile view toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-700" />
          <span className="font-extrabold text-neutral-900 dark:text-white text-sm">SentraDesk Supervisor</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 cursor-pointer"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex flex-col flex-1 max-w-xs w-full bg-white dark:bg-neutral-900 focus:outline-none">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
