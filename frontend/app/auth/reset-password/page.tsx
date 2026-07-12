'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Shield, Eye, EyeOff } from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { COMMON_PASSWORDS, PASSWORD_REQUIREMENTS } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, Spinner } from '@/components/ui/index'
import { PasswordStrengthMeter } from '@/components/citizen/PasswordStrengthMeter'

const resetSchema = zod
  .object({
    password: zod
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
    confirmPassword: zod.string().min(1, 'Confirm Password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetSchema = zod.infer<typeof resetSchema>

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetSchema>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordVal = watch('password')

  const onSubmit = async (data: ResetSchema) => {
    if (!token) {
      setError('Reset token is missing. Please request a new recovery link.')
      return
    }

    if (!passwordValid) {
      setError('Please choose a stronger password that meets all requirements.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      await api.post(API_ROUTES.resetPassword, {
        token,
        new_password: data.password,
      })
      router.push('/auth/login?reset=success')
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.error?.message || 'Failed to reset password. The link may have expired.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-neutral-800 py-8 px-4 shadow-card rounded-2xl sm:px-10 border border-neutral-100 dark:border-neutral-700 text-center space-y-4">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Invalid Reset Token</h3>
            <Alert type="danger">
              Reset token is missing or has expired. Please request a new password recovery link.
            </Alert>
            <div className="pt-2">
              <Link href="/auth/forgot-password" className="btn btn-primary w-full">
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 group mb-6">
          <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-neutral-900 dark:text-white text-xl tracking-tight">CCGP</span>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Choose a strong, complex password to secure your account credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-800 py-8 px-4 shadow-card rounded-2xl sm:px-10 border border-neutral-100 dark:border-neutral-700 animate-slide-up">
          {error && (
            <Alert type="danger" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                required
                error={errors.password?.message}
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...register('password')}
              />
            </div>

            {/* Password Strength Meter */}
            <PasswordStrengthMeter
              password={passwordVal}
              onChangeValidity={setPasswordValid}
            />

            <div className="relative mt-2">
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                required
                error={errors.confirmPassword?.message}
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...register('confirmPassword')}
              />
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={loading} disabled={!passwordValid}>
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
