'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { isOfficer } from '@/lib/auth'
import { Spinner } from '@/components/ui/index'

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
      } else if (!user || !isOfficer(user.role)) {
        router.push('/auth/login?unauthorized=true')
      }
    }
  }, [user, isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated || !user || !isOfficer(user.role)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  return <>{children}</>
}
