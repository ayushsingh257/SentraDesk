'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Shield, Eye, EyeOff, CheckCircle } from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { COMMON_PASSWORDS, PASSWORD_REQUIREMENTS } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/index'
import { PasswordStrengthMeter } from '@/components/citizen/PasswordStrengthMeter'

const registerSchema = zod
  .object({
    name: zod.string().min(2, 'Name must be at least 2 characters'),
    email: zod.string().email('Please enter a valid email address'),
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

type RegisterSchema = zod.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const passwordVal = watch('password')

  const onSubmit = async (data: RegisterSchema) => {
    if (!passwordValid) {
      setError('Please choose a stronger password that meets all requirements.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      await api.post(API_ROUTES.register, {
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'citizen',
      })
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login?verified=success')
      }, 4000)
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.error?.message || 'Failed to register account'
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
              Registration Successful
            </h2>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
              We have sent a verification link to your email address. Please click the link to activate your account.
            </p>
          </div>
          <div className="card card-body max-w-sm mx-auto p-4 border-neutral-200 dark:border-neutral-700">
            <span className="spinner w-4 h-4 border-[1.5px] mr-2 text-primary-600" />
            <span className="text-xs text-neutral-500">Redirecting to Sign In page...</span>
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
          Register a Citizen Account
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in here
          </Link>
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
            <Input
              label="Full Name"
              type="text"
              placeholder="Ayush Singh"
              required
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="citizen@domain.com"
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

            {/* Password Strength Meter */}
            <PasswordStrengthMeter
              password={passwordVal}
              onChangeValidity={setPasswordValid}
            />

            <div className="relative mt-2">
              <Input
                label="Confirm Password"
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
              Register Citizen Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
