'use client'

import { useState } from 'react'
import { UserCircle, Shield, MailCheck, Save } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert } from '@/components/ui/index'

export default function AdminProfile() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || 'Administrator')
  const [email, setEmail] = useState(user?.email || 'admin@sentradesk.gov.in')
  const [success, setSuccess] = useState<string | null>(null)

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('Profile details successfully cached.')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in text-xs font-bold">
      
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Administrative Profile settings
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Configure name settings and audit privileges.
        </p>
      </div>

      {success && <Alert type="success">{success}</Alert>}

      <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
        <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
          <UserCircle className="text-primary-600 w-4 h-4" />
          <span>Profile Specifications</span>
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Administrative Email Address"
            type="email"
            value={email}
            disabled
          />

          <div className="flex gap-6 items-center py-2">
            <span className="text-[10px] text-neutral-400 uppercase">Clearance role</span>
            <span className="flex items-center gap-1.5 text-primary-700 dark:text-primary-400">
              <Shield size={14} />
              <span>{user?.role.replace('_', ' ').toUpperCase()}</span>
            </span>
          </div>

          <Button type="submit" className="w-full">
            <Save size={14} className="mr-1.5" />
            <span>Update Profile</span>
          </Button>
        </form>
      </Card>

    </div>
  )
}
