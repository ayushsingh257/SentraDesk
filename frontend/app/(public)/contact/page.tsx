import type { Metadata } from 'next'
import { Mail, Phone, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact — SentraDesk',
  description: 'Contact the SentraDesk team for technical support, security reports, or general inquiries.',
}

export default function ContactPage() {
  return (
    <div className="page-container py-16 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Contact Us</h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400">
          Reach out to the SentraDesk team for technical support or inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="card card-body">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-primary-700 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">General Inquiries</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">support@sentradesk.gov.in</p>
              </div>
            </div>
          </div>

          <div className="card card-body">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-primary-700 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Security Reports</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">security@sentradesk.gov.in</p>
                <p className="text-xs text-neutral-400 mt-1">See our responsible disclosure policy</p>
              </div>
            </div>
          </div>

          <div className="card card-body">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-primary-700 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Helpline</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">1930 (National Cyber Crime Helpline)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">File a Complaint Online</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            The fastest way to file a cyber complaint is through our portal. Create an account and your complaint will be processed by our AI system immediately.
          </p>
          <div className="space-y-3">
            <a href="/auth/register" className="btn btn-primary w-full">
              Create Account & File Complaint
            </a>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">
              Visit Cybercrime.gov.in ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
