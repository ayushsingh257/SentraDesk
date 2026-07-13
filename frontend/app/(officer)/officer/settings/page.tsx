'use client'

import { useState } from 'react'
import { KeyRound, ShieldAlert } from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES, COMMON_PASSWORDS, PASSWORD_REQUIREMENTS } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert } from '@/components/ui/index'

export default function OfficerSettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const validatePassword = (pass: string): string | null => {
    if (pass.length < PASSWORD_REQUIREMENTS.minLength) {
      return `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long.`
    }
    if (pass.length > PASSWORD_REQUIREMENTS.maxLength) {
      return `Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters.`
    }
    if (!PASSWORD_REQUIREMENTS.hasUppercase.test(pass)) {
      return 'Password must contain at least one uppercase letter.'
    }
    if (!PASSWORD_REQUIREMENTS.hasLowercase.test(pass)) {
      return 'Password must contain at least one lowercase letter.'
    }
    if (!PASSWORD_REQUIREMENTS.hasDigit.test(pass)) {
      return 'Password must contain at least one numeric digit.'
    }
    if (!PASSWORD_REQUIREMENTS.hasSpecial.test(pass)) {
      return 'Password must contain at least one special character.'
    }
    if (COMMON_PASSWORDS.has(pass.toLowerCase())) {
      return 'This is a commonly used password. Please choose a more secure password.'
    }
    return null
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    const strengthErr = validatePassword(newPassword)
    if (strengthErr) {
      setError(strengthErr)
      return
    }

    setLoading(true)
    try {
      const res = await api.put(API_ROUTES.changePassword, {
        current_password: currentPassword,
        new_password: newPassword,
      })
      if (res.data?.success) {
        setSuccess('Password successfully updated.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      console.error('Password change error:', err)
      setError(err.response?.data?.error?.message || 'Failed to change password. Ensure current password is correct.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Security Settings
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Manage your account password and authentication credentials.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <KeyRound size={18} className="text-neutral-400" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Change Credentials Password</h2>
        </div>

        {error && <Alert type="danger">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <form onSubmit={handleChangePassword} className="space-y-5">
          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label="New Secure Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helpText="Requires minimum 12 characters, uppercase, lowercase, numbers, and special characters."
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" isLoading={loading}>
            Update Password
          </Button>
        </form>
      </Card>

    </div>
  )
}
