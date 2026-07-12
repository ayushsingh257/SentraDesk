'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Shield, Eye, EyeOff } from 'lucide-react'

import { useAuth } from '@/components/providers/AuthProvider'
import { getHomePath } from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, Spinner } from '@/components/ui/index'

const loginSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(1, 'Password is required'),
})

type LoginSchema = zod.infer<typeof loginSchema>

function LoginContent() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Notifications or messages from recovery flows
  const sessionExpired = searchParams.get('session') === 'expired'
  const resetSuccess = searchParams.get('reset') === 'success'
  const verifiedSuccess = searchParams.get('verified') === 'success'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginSchema) => {
    setError(null)
    setLoading(true)
    try {
      const userRole = await login(data.email, data.password)
      const targetPath = getHomePath(userRole)
      router.push(targetPath)
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.error?.message || 'Invalid credentials or inactive account'
      setError(msg)
    } finally {
      setLoading(false)
    }
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
          Sign In to Your Account
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Or{' '}
          <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
            register a new citizen account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-800 py-8 px-4 shadow-card rounded-2xl sm:px-10 border border-neutral-100 dark:border-neutral-700">
          
          {sessionExpired && (
            <Alert type="warning" className="mb-6">
              Your session has expired. Please sign in again.
            </Alert>
          )}

          {resetSuccess && (
            <Alert type="success" className="mb-6">
              Password reset successfully. You can now log in with your new password.
            </Alert>
          )}

          {verifiedSuccess && (
            <Alert type="success" className="mb-6">
              Email verified successfully! Please sign in.
            </Alert>
          )}

          {error && (
            <Alert type="danger" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@agency.gov.in"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
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

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
