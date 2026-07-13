'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { Spinner } from '@/components/ui/index'

import { AdminSidebar } from '@/components/layout/AdminSidebar'

const adminRoles = new Set(['security_auditor', 'state_administrator', 'system_administrator'])

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
      } else if (!user || !adminRoles.has(user.role)) {
        router.push('/auth/login?unauthorized=true')
      }
    }
  }, [user, isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated || !user || !adminRoles.has(user.role)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <main className="flex-1 py-10 px-6 sm:px-8 lg:px-12 mt-16 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
