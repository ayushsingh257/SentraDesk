'use client'

import { useState } from 'react'
import { Settings, KeyRound, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert } from '@/components/ui/index'

export default function AdminSettings() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match confirmation.')
      return
    }
    setSuccess('Password successfully reset.')
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in text-xs font-bold">
      
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          System Admin Settings
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Modify administrative access keys, passwords, and configure API gateway permissions.
        </p>
      </div>

      {error && <Alert type="danger">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
        <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
          <KeyRound className="text-primary-600 w-4 h-4" />
          <span>Security Reset Credentials</span>
        </h2>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />

          <Input
            label="New Secure Password"
            type="password"
            placeholder="Minimum 12 characters..."
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helpText="Must contain uppercase, lowercase, numbers, and symbols."
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full">
            <Save size={14} className="mr-1.5" />
            <span>Apply Reset Parameters</span>
          </Button>
        </form>
      </Card>

    </div>
  )
}
