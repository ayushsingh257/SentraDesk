'use client'

import { useEffect, useState } from 'react'
import { User, Mail, Award, Edit2, Shield, Briefcase, Clock, CheckCircle, Activity, Star, BadgeCheck } from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert, Spinner } from '@/components/ui/index'
import { formatDate } from '@/lib/utils'

interface ProfileStats {
  assigned: number
  open: number
  under_investigation: number
  pending: number
  closed: number
  avg_resolution: number
  sla_breached: number
  new_assignments: number
  sla_approaching: number
}

const DEPARTMENT_MAP: Record<string, string> = {
  cyber_cell_officer: 'Cyber Crime Investigation Division',
  investigator: 'Special Investigation Unit',
  supervisor: 'Supervisory Control Division',
  system_administrator: 'SentraDesk Platform Administration',
}

const DESIGNATION_MAP: Record<string, string> = {
  cyber_cell_officer: 'Investigating Officer',
  investigator: 'Senior Investigating Officer',
  supervisor: 'Supervisory Inspector',
  system_administrator: 'System Administrator',
}

const CLEARANCE_MAP: Record<string, string> = {
  cyber_cell_officer: 'SECRET — Level 3',
  investigator: 'SECRET — Level 4',
  supervisor: 'TOP SECRET — Level 5',
  system_administrator: 'TOP SECRET — Level 6',
}

export default function OfficerProfile() {
  const { user, reloadSession } = useAuth()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [nameInput, setNameInput] = useState(user?.name || '')
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [joinDate] = useState(() => {
    // Deterministic join date based on user email for demo
    return new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  })

  useEffect(() => {
    async function loadProfileData() {
      try {
        const statsRes = await api.get('/api/v1/officer/dashboard')
        if (statsRes.data?.success) {
          setStats(statsRes.data.data.stats)
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'cyber_cell_officer': return 'Cyber Cell Officer'
      case 'investigator': return 'Investigator'
      case 'supervisor': return 'Supervisor'
      case 'system_administrator': return 'Administrator'
      default: return 'Officer'
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  const role = user?.role || ''
  const department = DEPARTMENT_MAP[role] || 'Cyber Crime Division'
  const designation = DESIGNATION_MAP[role] || 'Investigating Officer'
  const clearanceLevel = CLEARANCE_MAP[role] || 'SECRET — Level 3'

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Officer Identity & Profile
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Official investigator profile — SentraDesk
        </p>
      </div>

      {/* Hero Profile Banner */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-800 to-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-primary-600/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur border-2 border-white/30 flex items-center justify-center text-white text-3xl font-black shadow-xl flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-xl font-extrabold text-white">{user?.name}</h2>
              <span className="flex items-center gap-1 px-2.5 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-white/90 font-bold">
                <BadgeCheck size={12} />
                Verified Officer
              </span>
            </div>
            <p className="text-primary-200 text-sm font-semibold">{designation}</p>
            <p className="text-primary-300 text-xs mt-0.5">{department}</p>
          </div>
          <div className="text-right space-y-1 flex-shrink-0">
            <div className="text-xs text-primary-300 font-semibold uppercase tracking-wider">Security Clearance</div>
            <div className="flex items-center gap-1.5 justify-end">
              <Shield size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-300">{clearanceLevel}</span>
            </div>
            <div className="text-xs text-primary-400 mt-1">Active since: {joinDate}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Identity Info + Stats */}
        <div className="space-y-6">

          {/* Identity Card */}
          <Card className="p-6 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-4">
              Officer Identity
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Mail size={13} className="text-neutral-400 flex-shrink-0" />
                <div>
                  <p className="text-neutral-400">Email Address</p>
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 break-all">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Briefcase size={13} className="text-neutral-400 flex-shrink-0" />
                <div>
                  <p className="text-neutral-400">Designation</p>
                  <p className="font-bold text-neutral-800 dark:text-neutral-200">{designation}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Award size={13} className="text-neutral-400 flex-shrink-0" />
                <div>
                  <p className="text-neutral-400">Department</p>
                  <p className="font-bold text-neutral-800 dark:text-neutral-200">{department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Shield size={13} className="text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-neutral-400">Clearance Level</p>
                  <p className="font-bold text-amber-700 dark:text-amber-400">{clearanceLevel}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Assignment Stats */}
          {stats && (
            <Card className="p-6 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-4">
                Case Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Assigned', value: stats.assigned, icon: <Activity size={12} />, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/30' },
                  { label: 'Active Cases', value: stats.open, icon: <Clock size={12} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                  { label: 'Resolved', value: stats.closed, icon: <CheckCircle size={12} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { label: 'SLA Breached', value: stats.sla_breached, icon: <Star size={12} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
                ].map((stat) => (
                  <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center`}>
                    <div className={`flex justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
                    <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between text-xs">
                <span className="text-neutral-400">Avg. Resolution Time</span>
                <span className="font-black text-teal-600 dark:text-teal-400">{stats.avg_resolution}h</span>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Update Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
            <div className="flex items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <Edit2 size={16} className="text-neutral-400" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">Update Officer Profile</h3>
            </div>

            {error && <Alert type="danger">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <Input
                label="Registered Email Address"
                type="email"
                value={user?.email || ''}
                disabled
                leftAddon={<Mail size={16} />}
                helpText="Your email identifier cannot be modified."
              />

              <Input
                label="Full Name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                leftAddon={<User size={16} />}
                required
              />

              <Input
                label="Designation (Read Only)"
                value={designation}
                disabled
                leftAddon={<Briefcase size={16} />}
                helpText="Contact system administrator to modify designation."
              />

              <Input
                label="Department / Division (Read Only)"
                value={department}
                disabled
                leftAddon={<Award size={16} />}
              />

              <Button type="submit" isLoading={saveLoading} disabled={nameInput === user?.name}>
                Save Changes
              </Button>
            </form>
          </Card>

          {/* Summary Performance Panel */}
          {stats && (
            <Card className="p-6 sm:p-8 space-y-4 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
              <div className="flex items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <Activity size={16} className="text-neutral-400" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">Operational Performance Summary</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <p className="text-2xl font-black text-primary-700 dark:text-primary-400">{stats.under_investigation}</p>
                  <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">Under Invest.</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.pending}</p>
                  <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">Pending</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{stats.new_assignments}</p>
                  <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">New (48h)</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <p className="text-2xl font-black text-orange-700 dark:text-orange-400">{stats.sla_approaching}</p>
                  <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">SLA Soon</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
