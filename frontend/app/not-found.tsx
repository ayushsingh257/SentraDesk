import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield size={36} className="text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-6xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Page Not Found</h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn btn-primary">
            <ArrowLeft size={16} />
            Go to Homepage
          </Link>
          <Link href="/auth/login" className="btn btn-outline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
