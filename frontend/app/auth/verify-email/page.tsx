'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Alert, Spinner } from '@/components/ui/index'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const verifyRequestSent = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Activation token is missing. Please request a new verification email.')
      return
    }

    // Prevent React 18 strict double effects execution
    if (verifyRequestSent.current) return
    verifyRequestSent.current = true

    async function verify() {
      try {
        await api.post(API_ROUTES.verifyEmail, { token })
        setStatus('success')
        setTimeout(() => {
          router.push('/auth/login?verified=success')
        }, 4000)
      } catch (err: any) {
        console.error(err)
        const msg = err.response?.data?.error?.message || 'Verification token is invalid or has expired.'
        setStatus('error')
        setErrorMsg(msg)
      }
    }

    verify()
  }, [token, router])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 group mb-6">
          <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-neutral-900 dark:text-white text-xl tracking-tight">SentraDesk</span>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Account Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-800 py-8 px-4 shadow-card rounded-2xl sm:px-10 border border-neutral-100 dark:border-neutral-700 text-center space-y-6">
          
          {status === 'loading' && (
            <div className="space-y-4 py-4">
              <Spinner size="lg" className="text-primary-700 mx-auto" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Verifying your email address, please hold...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-2 animate-fade-in">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto text-success border border-success/30">
                <CheckCircle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Email Verified!</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                  Your citizen account is active and verified. Redirecting you to sign in...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-5 py-2 animate-fade-in">
              <div className="w-16 h-16 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto text-danger border border-danger/30">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Verification Failed</h3>
                <p className="text-sm text-danger mt-2">
                  {errorMsg}
                </p>
              </div>
              <div className="pt-2">
                <Link href="/auth/login" className="btn btn-primary w-full">
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
