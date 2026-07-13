'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Key, Eye, EyeOff } from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES, COMMON_PASSWORDS, PASSWORD_REQUIREMENTS } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert } from '@/components/ui/index'
import { PasswordStrengthMeter } from '@/components/citizen/PasswordStrengthMeter'

const passwordSchema = zod
  .object({
    old_password: zod.string().min(1, 'Current password is required'),
    new_password: zod
      .string()
      .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
      .max(PASSWORD_REQUIREMENTS.maxLength, `Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`)
      .refine(
        (val) => PASSWORD_REQUIREMENTS.hasUppercase.test(val),
        'Must contain at least one uppercase letter'
      )
      .refine(
        (val) => PASSWORD_REQUIREMENTS.hasLowercase.test(val),
        'Must contain at least one lowercase letter'
      )
      .refine(
        (val) => PASSWORD_REQUIREMENTS.hasDigit.test(val),
        'Must contain at least one digit'
      )
      .refine(
        (val) => PASSWORD_REQUIREMENTS.hasSpecial.test(val),
        'Must contain at least one special character'
      )
      .refine(
        (val) => !COMMON_PASSWORDS.has(val.toLowerCase()),
        'This password is too common and is blacklisted for security'
      ),
    confirm_password: zod.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'New passwords do not match',
    path: ['confirm_password'],
  })

type PasswordSchema = zod.infer<typeof passwordSchema>

export default function CitizenSettings() {
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPasswordValid, setNewPasswordValid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordSchema>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const newPasswordVal = watch('new_password')

  const onSubmit = async (data: PasswordSchema) => {
    if (!newPasswordValid) {
      setError('Please choose a stronger password that meets all requirements.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await api.put(API_ROUTES.changePassword, {
        old_password: data.old_password,
        new_password: data.new_password
      })
      
      if (res.data?.success) {
        setSuccess('Password changed successfully.')
        reset()
      }
    } catch (err: any) {
      console.error('Password change error:', err)
      setError(err.response?.data?.error?.message || 'Failed to change password. Current password may be incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Account Settings
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Enforce credential modifications and configurations.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <Key size={18} className="text-neutral-400" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Change Password</h2>
        </div>

        {error && <Alert type="danger">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Current Password */}
          <div className="relative">
            <Input
              label="Current Password"
              type={showOldPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              required
              error={errors.old_password?.message}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              {...register('old_password')}
            />
          </div>

          {/* New Password */}
          <div className="relative">
            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              required
              error={errors.new_password?.message}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              {...register('new_password')}
            />
          </div>

          {/* Password Strength Meter */}
          <PasswordStrengthMeter
            password={newPasswordVal}
            onChangeValidity={setNewPasswordValid}
          />

          {/* Confirm New Password */}
          <div className="relative mt-2">
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              required
              error={errors.confirm_password?.message}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              {...register('confirm_password')}
            />
          </div>

          <Button 
            type="submit" 
            isLoading={loading} 
            disabled={!newPasswordValid}
            className="w-full sm:w-auto"
          >
            Change Password
          </Button>
        </form>
      </Card>

    </div>
  )
}
