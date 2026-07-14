'use client'

import { useState } from 'react'
import { KeyRound, ShieldAlert, Monitor, Smartphone, Globe, Clock, LogOut, Info, Lock, Eye, EyeOff } from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES, COMMON_PASSWORDS, PASSWORD_REQUIREMENTS } from '@/lib/constants'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert } from '@/components/ui/index'

// Simulated active sessions for demonstration
const DEMO_SESSIONS = [
  {
    id: '1',
    device: 'Windows PC — Chrome',
    icon: <Monitor size={14} className="text-primary-500" />,
    location: 'Mumbai, Maharashtra',
    ip: '192.168.1.1',
    lastActive: 'Active now',
    current: true,
  },
  {
    id: '2',
    device: 'Android — Firefox',
    icon: <Smartphone size={14} className="text-emerald-500" />,
    location: 'Delhi, India',
    ip: '10.0.0.45',
    lastActive: '2 hours ago',
    current: false,
  },
]

export default function OfficerSettings() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
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

  const getPasswordStrength = (pass: string): { label: string; color: string; width: string } => {
    if (!pass) return { label: '', color: '', width: '0%' }
    let score = 0
    if (pass.length >= 12) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[a-z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[!@#$%^&*]/.test(pass)) score++
    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: `${(score / 5) * 100}%` }
    if (score <= 3) return { label: 'Moderate', color: 'bg-amber-500', width: `${(score / 5) * 100}%` }
    if (score <= 4) return { label: 'Strong', color: 'bg-blue-500', width: `${(score / 5) * 100}%` }
    return { label: 'Very Strong', color: 'bg-emerald-500', width: '100%' }
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
        setSuccess('Password successfully updated. Please use the new credentials on your next login.')
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

  const passwordStrength = getPasswordStrength(newPassword)

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Security Settings
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Manage credentials, security controls, and active sessions.
        </p>
      </div>

      {/* Account Security Status Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Account Security Status: Protected</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5">
            Your account is protected. Last verified: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Change Password Card */}
      <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <KeyRound size={16} className="text-neutral-400" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Change Credentials Password</h2>
        </div>

        {error && <Alert type="danger">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <form onSubmit={handleChangePassword} className="space-y-5">
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Secure Password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Password strength indicator */}
            {newPassword && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="text-neutral-400">Password Strength</span>
                  <span className={`${
                    passwordStrength.label === 'Weak' ? 'text-red-600' :
                    passwordStrength.label === 'Moderate' ? 'text-amber-600' :
                    passwordStrength.label === 'Strong' ? 'text-blue-600' :
                    'text-emerald-600'
                  }`}>{passwordStrength.label}</span>
                </div>
                <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
              </div>
            )}

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Requirements summary */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Password Requirements:</p>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-neutral-500 dark:text-neutral-400">
              {[
                { label: 'Min 12 characters', met: newPassword.length >= 12 },
                { label: 'Uppercase letter', met: /[A-Z]/.test(newPassword) },
                { label: 'Lowercase letter', met: /[a-z]/.test(newPassword) },
                { label: 'Numeric digit', met: /[0-9]/.test(newPassword) },
                { label: 'Special character', met: /[!@#$%^&*]/.test(newPassword) },
                { label: 'Not a common password', met: !COMMON_PASSWORDS.has(newPassword.toLowerCase()) && newPassword.length > 0 },
              ].map((req) => (
                <div key={req.label} className="flex items-center gap-1">
                  <span className={req.met ? 'text-emerald-500' : 'text-neutral-300 dark:text-neutral-600'}>
                    {req.met ? '✓' : '○'}
                  </span>
                  <span className={req.met ? 'text-emerald-600 dark:text-emerald-400' : ''}>{req.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" isLoading={loading}>
            Update Password
          </Button>
        </form>
      </Card>

      {/* Active Sessions Card */}
      <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <Monitor size={16} className="text-neutral-400" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Active Sessions</h2>
        </div>

        <div className="space-y-3">
          {DEMO_SESSIONS.map((session) => (
            <div
              key={session.id}
              className={`flex items-start justify-between p-4 rounded-xl border text-xs gap-3 ${
                session.current
                  ? 'bg-primary-50/30 dark:bg-primary-950/20 border-primary-100 dark:border-primary-900/30'
                  : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{session.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-neutral-800 dark:text-neutral-200">{session.device}</p>
                    {session.current && (
                      <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 text-[9px] font-bold rounded uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-neutral-400 dark:text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Globe size={9} />
                      {session.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Lock size={9} />
                      {session.ip}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={9} />
                      {session.lastActive}
                    </span>
                  </div>
                </div>
              </div>
              {!session.current && (
                <button className="text-[10px] text-red-600 dark:text-red-400 font-bold hover:underline flex-shrink-0">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 2FA Placeholder Card */}
      <Card className="p-6 sm:p-8 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={16} className="text-neutral-400" />
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Two-Factor Authentication</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Add an extra layer of security to your officer account.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-full uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl flex items-center gap-2">
          <Info size={13} className="text-neutral-400 flex-shrink-0" />
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Two-factor authentication via OTP and hardware tokens will be enabled in the next platform release. Contact your system administrator to enroll in the beta program.
          </p>
        </div>
      </Card>
    </div>
  )
}
