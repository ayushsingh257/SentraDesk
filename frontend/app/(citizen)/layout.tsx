'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { Spinner } from '@/components/ui/index'

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
      } else if (user?.role !== 'citizen') {
        router.push('/auth/login?unauthorized=true')
      }
    }
  }, [user, isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated || user?.role !== 'citizen') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  return <>{children}</>
}
