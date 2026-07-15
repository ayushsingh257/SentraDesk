'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { hasRole } from '@/lib/auth'
import { Spinner } from '@/components/ui/index'
import { SupervisorSidebar } from '@/components/layout/SupervisorSidebar'

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
      } else if (!user || !hasRole(user.role, 'supervisor')) {
        router.push('/auth/login?unauthorized=true')
      }
    }
  }, [user, isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated || !user || !hasRole(user.role, 'supervisor')) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <SupervisorSidebar />
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-16 lg:mt-0 w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
