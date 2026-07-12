'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Shield, Mail, CheckCircle } from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/index'

const forgotSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
})

type ForgotSchema = zod.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotSchema>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotSchema) => {
    setError(null)
    setLoading(true)
    try {
      await api.post(API_ROUTES.forgotPassword, { email: data.email })
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.error?.message || 'Failed to request password reset link'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto text-success border border-success/30">
            <CheckCircle size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Recovery Link Sent
            </h2>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
              If an account exists for that email address, we have sent a secure password reset link. Please check your inbox.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/auth/login" className="btn btn-primary max-w-xs mx-auto">
              Return to Sign In
            </Link>
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
          Recover Password
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Enter your registered email address and we will email you a password reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-800 py-8 px-4 shadow-card rounded-2xl sm:px-10 border border-neutral-100 dark:border-neutral-700 animate-slide-up">
          {error && (
            <Alert type="danger" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@domain.com"
              required
              leftAddon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" className="w-full" isLoading={loading}>
              Send Recovery Link
            </Button>

            <div className="text-center">
              <Link href="/auth/login" className="text-sm font-semibold text-primary-600 hover:text-primary-500">
                Cancel and return to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
