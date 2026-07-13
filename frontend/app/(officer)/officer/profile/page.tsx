'use client'

import { useEffect, useState } from 'react'
import { User, Mail, Award, Edit2, Shield } from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert, Spinner } from '@/components/ui/index'

interface ProfileStats {
  assigned: number
  open: number
  closed: number
}

export default function OfficerProfile() {
  const { user, reloadSession } = useAuth()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [nameInput, setNameInput] = useState(user?.name || '')
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfileData() {
      try {
        const statsRes = await api.get('/api/v1/officer/dashboard')
        if (statsRes.data?.success) {
          const dashboardStats = statsRes.data.data.stats
          setStats({
            assigned: dashboardStats.assigned,
            open: dashboardStats.open,
            closed: dashboardStats.closed
          })
        }
      } catch (err) {
        console.error('Failed to load profile stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) return

    setSaveLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await api.put(API_ROUTES.updateProfile, { name: nameInput })
      if (res.data?.success) {
        setSuccess('Profile details successfully updated.')
        await reloadSession()
      }
    } catch (err: any) {
      console.error('Profile update error:', err)
      setError(err.response?.data?.error?.message || 'Failed to update profile.')
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'cyber_cell_officer': return 'Cyber Cell Officer'
      case 'investigator': return 'Investigator'
      case 'supervisor': return 'Supervisor'
      case 'system_administrator': return 'Administrator'
      default: return 'Officer'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Officer Account Details
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Manage your personal details and view assignment stats.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Meta */}
        <div className="space-y-6">
          
          {/* Identity Card */}
          <Card className="text-center p-6 space-y-4 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
            <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400 text-3xl font-black mx-auto border border-primary-200 dark:border-primary-800">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">{user?.name}</h2>
              <p className="text-xs text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider mt-1.5">
                {user ? getRoleLabel(user.role) : 'Officer'}
              </p>
            </div>
          </Card>

          {/* Assignment Stats */}
          <Card className="p-6 space-y-4 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-50 dark:border-neutral-850 pb-2">
              Assignment Overview
            </h3>
            
            <div className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between items-center">
                <span>Active Cases:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{stats?.open ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Resolved Cases:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{stats?.closed ?? 0}</span>
              </div>
              <div className="flex justify-between items-center border-t border-neutral-50 dark:border-neutral-850 pt-2.5">
                <span className="font-semibold text-neutral-700 dark:text-neutral-350">Total Assigned:</span>
                <span className="font-black text-primary-700 dark:text-primary-400 text-sm">{stats?.assigned ?? 0}</span>
              </div>
            </div>
          </Card>

        </div>

        {/* Right Column: Update Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
            <div className="flex items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <Edit2 size={16} className="text-neutral-400" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">Update Profile Details</h3>
            </div>

            {error && <Alert type="danger">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-1 gap-5">
                <Input
                  label="Registered Email Address"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  leftAddon={<Mail size={16} />}
                  helpText="Your email identifier cannot be changed."
                />

                <Input
                  label="Full Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  leftAddon={<User size={16} />}
                  required
                />
              </div>

              <Button type="submit" isLoading={saveLoading} disabled={nameInput === user?.name}>
                Save Changes
              </Button>
            </form>
          </Card>
        </div>

      </div>

    </div>
  )
}
