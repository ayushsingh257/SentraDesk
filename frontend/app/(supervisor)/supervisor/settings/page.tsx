'use client'

import { useState } from 'react'
import { Key, AlertTriangle, CheckSquare } from 'lucide-react'
import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SupervisorSettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(null)
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      setLoading(false)
      return
    }

    try {
      const res = await api.put(API_ROUTES.changePassword, {
        current_password: currentPassword,
        new_password: newPassword
      })
      if (res.data?.success) {
        setSuccess('Password updated successfully. Active sessions have been secured.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      console.error('Password change failed:', err)
      setError(err.response?.data?.error?.message || 'Password update failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Security Settings
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Configure authentication credentials and reset password.
        </p>
      </div>

      <Card className="p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-card">
        <form onSubmit={handleChangePassword} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              leftAddon={<Key size={14} />}
              className="w-full text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              leftAddon={<Key size={14} />}
              className="w-full text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              leftAddon={<Key size={14} />}
              className="w-full text-xs"
            />
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
            {loading ? 'Securing credentials...' : 'Reset Password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
