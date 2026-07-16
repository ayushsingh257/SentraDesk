'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { 
  ShieldAlert, 
  User, 
  HelpCircle, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  FileText,
  DollarSign,
  Calendar,
  AlertTriangle
} from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES, COMPLAINT_CATEGORIES } from '@/lib/constants'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, Alert, Spinner } from '@/components/ui/index'

const complaintSchema = zod.object({
  title: zod
    .string()
    .min(5, 'Title must be at least 5 characters long')
    .max(255, 'Title must not exceed 255 characters'),
  description: zod
    .string()
    .min(10, 'Description must explain the incident in at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  category: zod.string().min(1, 'Please select a fraud category'),
  fraud_amount: zod
    .preprocess((val) => (val === '' ? undefined : Number(val)), zod.number().min(0, 'Amount must be positive').optional()),
  incident_date: zod.string().optional(),
  reporter_name: zod.string().min(2, 'Reporter name is required'),
  reporter_email: zod.string().email('Please enter a valid email address').optional().or(zod.literal('')),
  reporter_phone: zod.string().optional(),
  suspect_name: zod.string().optional(),
  suspect_phone: zod.string().optional(),
  upi_id: zod.string().optional(),
  bank_account: zod.string().optional(),
  wallet_address: zod.string().optional(),
  url: zod.string().optional(),
  email: zod.string().optional(),
})

type ComplaintSchema = zod.infer<typeof complaintSchema>

interface AttachedFile {
  file: File
  id: string
  progress: 'pending' | 'uploading' | 'success' | 'failed'
}

export default function NewComplaint() {
  const { user } = useAuth()
  const router = useRouter()
  const [files, setFiles] = useState<AttachedFile[]>([])
  const [submitState, setSubmitState] = useState<'idle' | 'submitting_complaint' | 'uploading_files' | 'success'>('idle')
  const [createdTicket, setCreatedTicket] = useState<{ id: string; ticket_number: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ComplaintSchema>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      reporter_name: user?.name || '',
      reporter_email: user?.email || '',
      reporter_phone: '',
      suspect_name: '',
      suspect_phone: '',
      upi_id: '',
      bank_account: '',
      wallet_address: '',
      url: '',
      email: '',
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).map((f) => ({
        file: f,
        id: Math.random().toString(36).substring(7),
        progress: 'pending' as const
      }))
      setFiles((prev) => [...prev, ...selected])
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // SHA-256 integrity calculation helper
  const calculateSHA256 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  const onSubmit = async (data: ComplaintSchema) => {
    setError(null)
    setSubmitState('submitting_complaint')

    try {
      // 1. Submit complaint and spawn ticket
      const payload = {
        ...data,
        source: 'portal'
      }

      const res = await api.post(API_ROUTES.tickets, payload)
      if (!res.data?.success) {
        throw new Error(res.data?.error?.message || 'Failed to file complaint.')
      }

      const ticket = res.data.data
      setCreatedTicket({ id: ticket.id, ticket_number: ticket.ticket_number })

      // 2. Upload attached files if present
      if (files.length > 0) {
        setSubmitState('uploading_files')

        for (let i = 0; i < files.length; i++) {
          const current = files[i]
          
          // Mark file status as uploading
          setFiles((prev) => prev.map((f) => f.id === current.id ? { ...f, progress: 'uploading' } : f))

          try {
            // A. Fetch presigned link
            const urlPayload = { filename: current.file.name }
            const linkRes = await api.post(API_ROUTES.evidenceUploadLink(ticket.id), urlPayload)
            if (!linkRes.data?.success) throw new Error('Link fetch failed')

            const { upload_url, file_path } = linkRes.data.data

            // B. Upload file directly to object store
            const uploadHeaders = { 'Content-Type': current.file.type }
            await api.put(upload_url, current.file, { headers: uploadHeaders })

            // C. Compute SHA-256 hash
            const sha256 = await calculateSHA256(current.file)

            // D. Save evidence metadata
            const savePayload = {
              filename: current.file.name,
              file_path: file_path,
              mime_type: current.file.type || 'application/octet-stream',
              file_size: current.file.size,
              sha256_hash: sha256
            }
            const saveRes = await api.post(API_ROUTES.evidenceSave(ticket.id), savePayload)
            if (!saveRes.data?.success) throw new Error('Save metadata failed')

            // Mark file status as success
            setFiles((prev) => prev.map((f) => f.id === current.id ? { ...f, progress: 'success' } : f))
          } catch (fileErr) {
            console.error(`Failed uploading file ${current.file.name}:`, fileErr)
            setFiles((prev) => prev.map((f) => f.id === current.id ? { ...f, progress: 'failed' } : f))
          }
        }
      }

      setSubmitState('success')
    } catch (err: any) {
      console.error('Submit complaint error:', err)
      setError(err.response?.data?.error?.message || err.message || 'An error occurred during submission.')
      setSubmitState('idle')
    }
  }

  if (submitState === 'success' && createdTicket) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-8 animate-fade-in">
        <div className="w-20 h-20 bg-success/10 rounded-3xl flex items-center justify-center mx-auto text-success border border-success/20 shadow-sm">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Complaint Filed Successfully!
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto text-sm leading-relaxed">
            Your complaint has been logged. The AI triage engine has assigned a tracking number and classified the incident.
          </p>
        </div>

        <Card className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 p-6 rounded-2xl max-w-sm mx-auto">
          <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Ticket Tracking ID</p>
          <p className="text-2xl font-black text-primary-700 dark:text-primary-400 mt-1 tracking-wider uppercase font-mono">
            {createdTicket.ticket_number}
          </p>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href={`/citizen/tickets/${createdTicket.id}`} className="w-full sm:w-auto">
            <Button size="lg" className="w-full">
              Track Ticket Progress
            </Button>
          </a>
          <a href="/citizen/dashboard" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full">
              Return to Dashboard
            </Button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          File a Cyber Complaint
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Please submit accurate incident parameters. Cyber cell officers will analyze the details for active threat mapping.
        </p>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Step 1: Incident Description */}
        <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60">
          <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400">
              <ShieldAlert size={18} />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">1. Incident Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Complaint Title / Short Subject"
                placeholder="e.g. Lost money to fake investment group on telegram"
                required
                error={errors.title?.message}
                {...register('title')}
              />
            </div>

            <select
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              {...register('category')}
            >
              <option value="">Select Category</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category?.message && (
              <p className="error-message">{errors.category.message}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fraud Amount (INR)"
                type="number"
                placeholder="e.g. 50000"
                leftAddon={<DollarSign size={16} />}
                error={errors.fraud_amount?.message}
                {...register('fraud_amount')}
              />
              <Input
                label="Incident Date"
                type="date"
                leftAddon={<Calendar size={16} />}
                error={errors.incident_date?.message}
                {...register('incident_date')}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Detailed Description"
                placeholder="Explain the workflow of the scam. Mention timelines, how they contacted you, what payment links were shared, etc. (Detailed evidence helps the AI extraction engine)"
                rows={5}
                required
                error={errors.description?.message}
                {...register('description')}
              />
            </div>
          </div>
        </Card>

        {/* Step 2: Reporter Details */}
        <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60">
          <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400">
              <User size={18} />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">2. Complainant Contact Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Full Name"
              required
              error={errors.reporter_name?.message}
              {...register('reporter_name')}
            />
            <Input
              label="Email Address"
              type="email"
              error={errors.reporter_email?.message}
              {...register('reporter_email')}
            />
            <Input
              label="Contact Phone"
              placeholder="+91 XXXXX XXXXX"
              error={errors.reporter_phone?.message}
              {...register('reporter_phone')}
            />
          </div>
        </Card>

        {/* Step 3: Suspect Metadata */}
        <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60">
          <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400">
              <HelpCircle size={18} />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">3. Suspect Identifiers (Indicators of Compromise)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Suspect Name / Alias"
              placeholder="e.g. Telegram Admin 'Rahul'"
              {...register('suspect_name')}
            />
            <Input
              label="Suspect Contact Number"
              placeholder="e.g. +91 99999 88888"
              {...register('suspect_phone')}
            />
            <Input
              label="Suspect UPI ID"
              placeholder="e.g. scammer@upi"
              {...register('upi_id')}
            />
            <Input
              label="Suspect Bank Account Number / IFSC"
              placeholder="e.g. A/C 9876543210 SBIN0001234"
              {...register('bank_account')}
            />
            <Input
              label="Suspect Crypto Wallet Address"
              placeholder="e.g. 0x71C... or bc1q..."
              {...register('wallet_address')}
            />
            <Input
              label="Suspect URL / Fraud Website Link"
              placeholder="e.g. http://fake-trading-platform.com"
              {...register('url')}
            />
          </div>
        </Card>

        {/* Step 4: Evidence Attachment */}
        <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60">
          <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400">
              <Upload size={18} />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">4. Upload Evidence Attachments</h2>
          </div>

          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center bg-neutral-50/40 dark:bg-neutral-900/10 hover:border-primary-500/50 transition-colors duration-200 relative">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload size={32} className="text-neutral-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-neutral-800 dark:text-white">Click or drag files here to upload</p>
            <p className="text-xs text-neutral-400 mt-1">Accepts PNG, JPG, PDF, DOCX (Max 10MB per file)</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Attached Files</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {files.map((f) => (
                  <div 
                    key={f.id} 
                    className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-850 border border-neutral-150 dark:border-neutral-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={20} className="text-primary-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {f.file.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                          {(f.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="text-neutral-400 hover:text-danger p-1 rounded transition-colors duration-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {submitState !== 'idle' && (
          <Card className="p-5 border border-primary-100 dark:border-primary-950 bg-primary-50/20 dark:bg-primary-950/10 flex items-center gap-4">
            <Spinner size="md" className="text-primary-700" />
            <div className="text-sm">
              <p className="font-bold text-neutral-900 dark:text-white">
                {submitState === 'submitting_complaint' 
                  ? 'Filing complaint details to cyber registry...' 
                  : 'Filing complete. Uploading evidence attachments...'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Please do not close this window or navigate away.
              </p>
            </div>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Link href="/citizen/dashboard">
            <Button variant="outline" size="lg" disabled={submitState !== 'idle'}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="lg" disabled={submitState !== 'idle'}>
            File Complaint
          </Button>
        </div>

      </form>
    </div>
  )
}
