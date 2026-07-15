'use client'

import { useState } from 'react'
import { User, ShieldCheck, Mail, Key } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SupervisorProfile() {
  const { user, setStoredUser } = useAuth()
  
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(null)
    setError(null)

    try {
      const res = await api.put(API_ROUTES.updateProfile, { name, email })
      if (res.data?.success) {
        setSuccess('Profile updated successfully.')
        if (user) {
          setStoredUser({
            ...user,
            name: res.data.data.name,
            email: res.data.data.email
          })
        }
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err)
      setError(err.response?.data?.error?.message || 'Update failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          My Supervisor Profile
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          View and configure your security cell credentials and operations parameters.
        </p>
      </div>

      <Card className="p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-card">
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              leftAddon={<User size={14} />}
              className="w-full text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftAddon={<Mail size={14} />}
              className="w-full text-xs"
            />
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-850/50 rounded-xl border border-neutral-100 dark:border-neutral-800/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <ShieldCheck size={14} />
              <span>Assigned Security Credentials</span>
            </div>
            <p className="text-neutral-500">
              Role: <span className="font-bold uppercase text-neutral-600 dark:text-neutral-350">{user?.role.replace('_', ' ')}</span>
            </p>
            <p className="text-neutral-500">
              Unique ID: <span className="font-mono text-[10px] text-neutral-600 dark:text-neutral-350">{user?.id}</span>
            </p>
          </div>

          {success && (
            <p className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100/50">
              {success}
            </p>
          )}

          {error && (
            <p className="text-xs text-danger font-bold bg-danger/5 p-3 rounded-lg border border-danger/10">
              {error}
            </p>
          )}

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-amber-700 hover:bg-amber-850 text-white font-bold text-xs"
          >
            {loading ? 'Saving updates...' : 'Save Profile Changes'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
