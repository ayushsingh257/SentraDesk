'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Clock, 
  Shield, 
  AlertTriangle,
  FolderOpen,
  MessageSquare,
  Lock,
  Sparkles,
  Search,
  CheckCircle,
  FileText,
  User,
  History,
  FolderPlus,
  Send,
  X,
  FileDown
} from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, Alert, Spinner } from '@/components/ui/index'
import { formatFileSize, formatDateTime, getFileIcon, formatDate } from '@/lib/utils'

interface TimelineEvent {
  id: string
  event_type: string
  description: string
  actor_id: string | null
  created_at: string
}

interface Comment {
  id: string
  author_id: string
  content: string
  created_at: string
}

interface PrivateNote {
  id: string
  author_id: string
  content: string
  created_at: string
}

interface EvidenceFile {
  id: string
  filename: string
  mime_type: string
  file_size: number
  sha256_hash: string
  created_at: string
}

interface Ticket {
  id: string
  ticket_number: string
  category: string
  severity: string
  assigned_officer_id: string | null
  assigned_group: string | null
  jurisdiction: string | null
  sla_deadline: string | null
  l1_approved: boolean
  l2_approved: boolean
  complaint: {
    title: string
    description: string
    status: string
    reporter_name: string
    reporter_email: string | null
    reporter_phone: string | null
    metadata_json: Record<string, any> | null
  }
}

interface AIAnalystResult {
  summary: string
  overall_risk: string
  confidence: number
  classification_reasoning: string
  executive_summary: string
  investigation_narrative: string
  probabilities: Array<{ category: string; confidence: number }>
  timeline: Array<{ date: string; event: string }>
  recommendations: Array<{ action: string; priority: string; status: string }>
  legal_sections: Array<{ section: string; act: string; description: string }>
  evidence_gaps: string[]
  similar_cases?: any[]
}

export default function OfficerTicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [privateNotes, setPrivateNotes] = useState<PrivateNote[]>([])
  const [evidenceList, setEvidenceList] = useState<EvidenceFile[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'ai' | 'threat' | 'evidence' | 'notes' | 'discussion'>('timeline')

  // AI Analyst state
  const [aiAnalyst, setAiAnalyst] = useState<AIAnalystResult | null>(null)
  const [aiAnalystLoading, setAiAnalystLoading] = useState(false)
  const [aiAnalystError, setAiAnalystError] = useState<string | null>(null)


  // Threat bulk scan state
  const [bulkScannedIndicators, setBulkScannedIndicators] = useState<any[] | null>(null)
  const [bulkScanning, setBulkScanning] = useState(false)

  // Actions states
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [verifyingHashId, setVerifyingHashId] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<Record<string, 'matched' | 'mismatched' | null>>({})

  // Status transitions
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('')

  // Closure Request Modal
  const [closureModalOpen, setClosureModalOpen] = useState(false)
  const [closureReason, setClosureReason] = useState('')
  const [closureLoading, setClosureLoading] = useState(false)

  // Supervisor Approvals
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')

  // Threat Intel Lookup
  const [intelQuery, setIntelQuery] = useState('')
  const [intelResult, setIntelResult] = useState<any>(null)
  const [intelLoading, setIntelLoading] = useState(false)
  const [intelError, setIntelError] = useState<string | null>(null)
  const [intelSavingToCase, setIntelSavingToCase] = useState(false)
  const [intelSaveSuccess, setIntelSaveSuccess] = useState<string | null>(null)

  const loadTicketData = useCallback(async () => {
    try {
      const [ticketRes, timelineRes, commentsRes, evidenceRes] = await Promise.all([
        api.get(API_ROUTES.ticket(id)),
        api.get(API_ROUTES.ticketTimeline(id)),
        api.get(API_ROUTES.ticketComments(id)),
        api.get(API_ROUTES.evidenceList(id))
      ])

      if (ticketRes.data?.success) {
        setTicket(ticketRes.data.data)
        setSelectedStatus(ticketRes.data.data.complaint.status)
      }
      if (timelineRes.data?.success) setTimeline(timelineRes.data.data)
      if (commentsRes.data?.success) setComments(commentsRes.data.data)
      if (evidenceRes.data?.success) setEvidenceList(evidenceRes.data.data)

      // Fetch private notes (restricted to cyber cell officer+)
      try {
        const notesRes = await api.get(API_ROUTES.ticketNotes(id))
        if (notesRes.data?.success) {
          setPrivateNotes(notesRes.data.data)
        }
      } catch (err) {
        console.error('Failed to load private notes:', err)
      }

    } catch (err: any) {
      console.error('Failed to load ticket details:', err)
      setError('Unable to load ticket details. Verify endpoint routing.')
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadAiAnalystData = useCallback(async (refresh = false) => {
    setAiAnalystLoading(true)
    setAiAnalystError(null)
    try {
      const res = await api.get(`/api/v1/tickets/${id}/ai-analyst?refresh=${refresh}`)
      if (res.data?.success) {
        setAiAnalyst(res.data.data)
      } else {
        setAiAnalystError('Unable to load AI Analysis insights.')
      }
    } catch (err: any) {
      console.error('Failed to load AI analyst data:', err)
      setAiAnalystError('Failed to load AI analyst data.')
    } finally {
      setAiAnalystLoading(false)
    }
  }, [id])


  const handleBulkScanIndicators = async () => {
    setBulkScanning(true)
    try {
      const res = await api.post(`/api/v1/tickets/${id}/scan-all-indicators`)
      if (res.data?.success) {
        setBulkScannedIndicators(res.data.data)
        // Refresh timeline after scan logs it
        const timelineRes = await api.get(API_ROUTES.ticketTimeline(id))
        if (timelineRes.data?.success) setTimeline(timelineRes.data.data)
      }
    } catch (err) {
      console.error('Failed to run bulk indicators scan:', err)
    } finally {
      setBulkScanning(false)
    }
  }

  useEffect(() => {
    loadTicketData()
    loadAiAnalystData()
  }, [loadTicketData, loadAiAnalystData])

  // Post public comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentLoading(true)
    try {
      const res = await api.post(API_ROUTES.ticketComments(id), { content: commentText })
      if (res.data?.success) {
        setCommentText('')
        // Refresh comments & timeline
        const [commentsRes, timelineRes] = await Promise.all([
          api.get(API_ROUTES.ticketComments(id)),
          api.get(API_ROUTES.ticketTimeline(id))
        ])
        if (commentsRes.data?.success) setComments(commentsRes.data.data)
        if (timelineRes.data?.success) setTimeline(timelineRes.data.data)
      }
    } catch (err) {
      console.error('Failed to post public reply:', err)
    } finally {
      setCommentLoading(false)
    }
  }

  // Post private note
  const handlePostPrivateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return
    setNoteLoading(true)
    try {
      const res = await api.post(API_ROUTES.ticketNotes(id), { content: noteText })
      if (res.data?.success) {
        setNoteText('')
        // Refresh notes & timeline
        const [notesRes, timelineRes] = await Promise.all([
          api.get(API_ROUTES.ticketNotes(id)),
          api.get(API_ROUTES.ticketTimeline(id))
        ])
        if (notesRes.data?.success) setPrivateNotes(notesRes.data.data)
        if (timelineRes.data?.success) setTimeline(timelineRes.data.data)
      }
    } catch (err) {
      console.error('Failed to post private note:', err)
    } finally {
      setNoteLoading(false)
    }
  }

  // SHA-256 integrity calculation helper
  const calculateSHA256 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  // Handle Evidence Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setUploadLoading(true)
    setUploadError(null)
    
    try {
      const file = files[0]
      // 1. Fetch Presigned URL
      const linkRes = await api.post(API_ROUTES.evidenceUploadLink(id), {
        filename: file.name
      })
      if (!linkRes.data?.success) throw new Error('Upload link request failed')
      
      const { upload_url, file_path } = linkRes.data.data

      // 2. Upload file to MinIO presigned URL
      const uploadHeaders = { 'Content-Type': file.type }
      await api.put(upload_url, file, { headers: uploadHeaders })

      // 3. Compute Hash
      const hashVal = await calculateSHA256(file)

      // 4. Save metadata details
      await api.post(API_ROUTES.evidenceSave(id), {
        filename: file.name,
        file_path: file_path,
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
        sha256_hash: hashVal
      })
      
      // Refresh evidence list & timeline
      const [evidenceRes, timelineRes] = await Promise.all([
        api.get(API_ROUTES.evidenceList(id)),
        api.get(API_ROUTES.ticketTimeline(id))
      ])
      if (evidenceRes.data?.success) setEvidenceList(evidenceRes.data.data)
      if (timelineRes.data?.success) setTimeline(timelineRes.data.data)
    } catch (err: any) {
      console.error('File upload error:', err)
      setUploadError(err.message || 'Evidence upload failed.')
    } finally {
      setUploadLoading(false)
    }
  }

  // Download Evidence Zip archive
  const handleDownloadZip = async () => {
    try {
      const res = await api.get(API_ROUTES.evidenceZip(id))
      if (res.data?.success) {
        window.open(res.data.data.zip_url, '_blank')
      }
    } catch (err) {
      console.error('Failed to trigger ZIP bundle generation:', err)
    }
  }

  // Verify evidence file hash integrity server-side (EV-1, FE-6)
  const handleVerifyHash = async (evidence: EvidenceFile) => {
    setVerifyingHashId(evidence.id)
    try {
      const res = await api.post(API_ROUTES.verifyIntegrity(evidence.id))
      if (res.data?.success && res.data.data) {
        const isVerified = res.data.data.verified
        setVerificationResult(prev => ({ 
          ...prev, 
          [evidence.id]: isVerified ? 'matched' : 'mismatched' 
        }))
      } else {
        setVerificationResult(prev => ({ ...prev, [evidence.id]: 'matched' }))
      }
    } catch (err) {
      setVerificationResult(prev => ({ ...prev, [evidence.id]: 'mismatched' }))
    } finally {
      setVerifyingHashId(null)
    }
  }


  // Handle Threat Intel Lookup
  const handleIntelLookup = async (queryVal: string) => {
    if (!queryVal.trim()) return
    setIntelLoading(true)
    setIntelError(null)
    setIntelResult(null)
    setIntelSaveSuccess(null)
    try {
      const res = await api.get(`/api/v1/threat-intel/lookup?q=${encodeURIComponent(queryVal)}`)
      if (res.data?.success) {
        setIntelResult(res.data.data)
      } else {
        setIntelError('No threat intelligence records found for this indicator.')
      }
    } catch (err: any) {
      const statusCode = err.response?.status
      if (statusCode === 404) {
        setIntelError('No records found. This indicator is not flagged in the current threat database.')
      } else {
        setIntelError('Threat reputation check failed. Verify backend connectivity.')
      }
    } finally {
      setIntelLoading(false)
    }
  }

  // Save indicator to case
  const handleSaveIndicatorToCase = async () => {
    if (!intelResult) return
    setIntelSavingToCase(true)
    setIntelSaveSuccess(null)
    try {
      const res = await api.post(`/api/v1/tickets/${id}/indicators`, {
        entity_type: intelResult.indicator_type || 'unknown',
        entity_value: intelResult.indicator,
        note: `Threat scan: ${intelResult.status}, Score: ${intelResult.threat_score}/100`
      })
      if (res.data?.success) {
        const msg = res.data.data?.already_exists 
          ? 'Indicator already linked to this case.' 
          : 'Indicator successfully linked to case.'
        setIntelSaveSuccess(msg)
        // Refresh timeline
        const timelineRes = await api.get(API_ROUTES.ticketTimeline(id))
        if (timelineRes.data?.success) setTimeline(timelineRes.data.data)
      }
    } catch (err) {
      setIntelSaveSuccess('Failed to save indicator. Please try again.')
    } finally {
      setIntelSavingToCase(false)
    }
  }

  // Handle clicking an entity tag -> populate Threat Intel and switch tab
  const handleEntityTagClick = (value: string) => {
    setIntelQuery(value)
    setActiveTab('threat')
    setIntelResult(null)
    setIntelError(null)
    setIntelSaveSuccess(null)
    handleIntelLookup(value)
  }

  // Handle Status Update Transition
  const handleStatusChange = async () => {
    if (selectedStatus === ticket?.complaint.status) return
    setStatusLoading(true)
    setStatusError(null)
    try {
      const res = await api.put(API_ROUTES.updateStatus(id), { status: selectedStatus })
      if (res.data?.success) {
        setTicket(res.data.data)
        // Refresh timeline
        const timelineRes = await api.get(API_ROUTES.ticketTimeline(id))
        if (timelineRes.data?.success) setTimeline(timelineRes.data.data)
      }
    } catch (err: any) {
      console.error('Status change error:', err)
      setStatusError(err.response?.data?.error?.message || 'Transition blocked by lifecycle validation matrix.')
      setSelectedStatus(ticket?.complaint.status || '')
    } finally {
      setStatusLoading(false)
    }
  }

  // Request Closure
  const handleClosureRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!closureReason.trim()) return
    setClosureLoading(true)
    try {
      const res = await api.post(API_ROUTES.requestClosure(id), { reason: closureReason })
      if (res.data?.success) {
        setTicket(res.data.data)
        setClosureModalOpen(false)
        setClosureReason('')
        // Refresh details & timeline
        loadTicketData()
      }
    } catch (err) {
      console.error('Closure request error:', err)
    } finally {
      setClosureLoading(false)
    }
  }

  // Submit L1 / L2 Approval
  const handleApprovalAction = async (decision: 'l1' | 'l2') => {
    setApprovalLoading(true)
    try {
      const endpoint = decision === 'l1' ? API_ROUTES.l1Approve(id) : API_ROUTES.l2Approve(id)
      const res = await api.post(endpoint, { comment: approvalComment })
      if (res.data?.success) {
        setApprovalComment('')
        loadTicketData()
      }
    } catch (err) {
      console.error('Approval submission error:', err)
    } finally {
      setApprovalLoading(false)
    }
  }

  // Download Case Investigation PDF
  const [reportDownloading, setReportDownloading] = useState(false)
  const handleDownloadReport = async () => {
    setReportDownloading(true)
    try {
      const res = await api.get(`/api/v1/tickets/${id}/report/case`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `case_report_${ticket?.ticket_number || id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download case report:', err)
    } finally {
      setReportDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  if (error || !ticket) {
    return <Alert type="danger">{error || 'Ticket not found.'}</Alert>
  }

  // Extracted telemetry metadata from AI
  const aiMeta = ticket.complaint.metadata_json || {}
  const extractedEntities = aiMeta.ai_extracted_entities || aiMeta.extracted_entities || {}
  const recommendedSteps = aiMeta.recommended_steps || []

  // Normalize: backend returns plural keys (phones, upis, emails, etc.)
  // Build a structured list of all indicators with their types
  const ENTITY_LABEL_MAP: Record<string, string> = {
    phones: 'Phone Number',
    emails: 'Email Address',
    upis: 'UPI ID',
    bank_accounts: 'Bank Account',
    ifsc_codes: 'IFSC Code',
    pan_cards: 'PAN Card',
    crypto_wallets: 'Crypto Wallet',
    domains: 'Domain',
    urls: 'URL',
    ip_addresses: 'IP Address',
    telegram_usernames: 'Telegram Handle',
    vehicle_numbers: 'Vehicle Number',
    social_media_handles: 'Social Media Handle',
  }

  const allExtractedIndicators: { type: string; label: string; value: string }[] = []
  for (const [key, values] of Object.entries(extractedEntities)) {
    if (Array.isArray(values) && values.length > 0) {
      for (const val of values as string[]) {
        allExtractedIndicators.push({
          type: key.endsWith('s') ? key.slice(0, -1) : key,
          label: ENTITY_LABEL_MAP[key] || key,
          value: val
        })
      }
    }
  }

  // Confidence: clamp to 0-100 range
  const rawConfidence = aiMeta.ai_confidence ?? 0
  const displayConfidence = typeof rawConfidence === 'number'
    ? Math.min(rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence, 100).toFixed(1)
    : '—'

  // Check if SLA Breached
  const isSLABreached = () => {
    if (!ticket.sla_deadline || ticket.complaint.status === 'Closed' || ticket.complaint.status === 'Resolved') return false
    const now = new Date()
    const deadline = new Date(ticket.sla_deadline)
    return deadline < now
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Breadcrumbs */}
      <Link 
        href="/officer/tickets" 
        className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200"
      >
        <ArrowLeft size={14} />
        <span>Back to Tickets</span>
      </Link>

      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-neutral-850 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-700/60 shadow-card">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold uppercase bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded border border-primary-100 dark:border-primary-900/60">
              {ticket.ticket_number}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
              ticket.severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/45 dark:text-red-400' :
              ticket.severity === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/45 dark:text-orange-400' :
              ticket.severity === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-400' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {ticket.severity} Severity
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-2 leading-tight">
            {ticket.complaint.title}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            ticket.complaint.status === 'New' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30' :
            ticket.complaint.status === 'Under Investigation' ? 'bg-orange-50 text-orange-750 dark:bg-orange-950/30' :
            ticket.complaint.status === 'Waiting for Citizen' ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30' :
            ticket.complaint.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' :
            'bg-neutral-50 text-neutral-700'
          }`}>
            Status: {ticket.complaint.status}
          </span>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleDownloadReport}
            isLoading={reportDownloading}
            className="flex items-center gap-1.5 font-bold"
          >
            <FileDown size={14} />
            <span>Case Report</span>
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Complaint Description & Complainant Info */}
          <Card className="p-6 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60">
            <div>
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Complainant Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-neutral-750 dark:text-neutral-300">
                <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-400 font-medium block">Name</span>
                  {ticket.complaint.reporter_name}
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-400 font-medium block">Email</span>
                  {ticket.complaint.reporter_email || '—'}
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-400 font-medium block">Phone</span>
                  {ticket.complaint.reporter_phone || '—'}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">Detailed Complaint description</h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-350 bg-neutral-50 dark:bg-neutral-900/60 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 leading-relaxed whitespace-pre-wrap">
                {ticket.complaint.description}
              </p>
            </div>
          </Card>

          {/* Interactive Workspaces */}
          <Card className="shadow-card border border-neutral-100 dark:border-neutral-700/60 overflow-hidden">
            {/* Tabs Trigger Header */}
            <div className="flex border-b border-neutral-100 dark:border-neutral-850 overflow-x-auto bg-neutral-50/50 dark:bg-neutral-900/20">
              {[
                { id: 'timeline', label: 'Timeline', icon: History },
                { id: 'ai', label: 'AI Intelligence', icon: Sparkles },
                { id: 'threat', label: 'Threat Intel', icon: Shield },
                { id: 'evidence', label: 'Evidence Vault', icon: FolderOpen },
                { id: 'notes', label: 'Private Notes', icon: Lock },
                { id: 'discussion', label: 'Discussion Thread', icon: MessageSquare }
              ].map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-4 text-xs font-bold border-b-2 transition-all duration-200 whitespace-nowrap ${
                      isActive 
                        ? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-400 bg-white dark:bg-neutral-850'
                        : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-350 hover:bg-neutral-50 dark:hover:bg-neutral-800/10'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              
              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  {timeline.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-6">No timeline logs found.</p>
                  ) : (
                    <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-3.5 space-y-6">
                      {timeline.map((event) => (
                        <div key={event.id} className="relative pl-7">
                          {/* Dot indicator */}
                          <span className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary-650 ring-4 ring-primary-50 dark:ring-primary-950/60" />
                          <div className="text-xs">
                            <span className="font-bold text-neutral-850 dark:text-neutral-200">{event.event_type}</span>
                            <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">{formatDateTime(event.created_at)}</span>
                            <p className="text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI INTELLIGENCE TAB */}
              {activeTab === 'ai' && (
                <div className="space-y-6 text-neutral-800 dark:text-neutral-200">
                  {aiAnalystLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <Spinner size="md" className="text-primary-600" />
                      <p className="text-xs text-neutral-500 font-bold">AI Case Analyst is synthesizing findings...</p>
                    </div>
                  ) : aiAnalystError || !aiAnalyst ? (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl">
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium">{aiAnalystError || 'Failed to initialize AI Case Analyst.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      {/* Classification Summary Card */}
                      <div className="bg-primary-50/40 dark:bg-primary-950/20 p-5 rounded-2xl border border-primary-100 dark:border-primary-900/40">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex justify-between items-start w-full sm:w-auto gap-4">
                            <div>
                              <span className="text-[10px] font-black text-primary-700 dark:text-primary-400 uppercase tracking-wider block mb-1">
                                AI Classification Summary
                              </span>
                              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                                {aiAnalyst.summary}
                              </h3>
                            </div>
                            <Button
                              onClick={() => loadAiAnalystData(true)}
                              variant="outline"
                              size="sm"
                              className="text-[10px] py-1.5 px-2.5 h-auto flex items-center gap-1 border-primary-200/60 dark:border-primary-900/40 text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 shrink-0"
                              isLoading={aiAnalystLoading}
                            >
                              <Sparkles size={12} />
                              <span>Recalculate</span>
                            </Button>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] text-neutral-400 font-bold block uppercase">Overall Risk</span>
                              <span className={`text-xs font-black uppercase ${
                                aiAnalyst.overall_risk === 'CRITICAL' || aiAnalyst.overall_risk === 'HIGH'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}>{aiAnalyst.overall_risk}</span>
                            </div>
                            <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
                            <div className="text-right">
                              <span className="text-[10px] text-neutral-400 font-bold block uppercase">Confidence</span>
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                {displayConfidence}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Probabilities grid */}
                        <div className="mt-4 pt-4 border-t border-primary-100/50 dark:border-primary-900/30">
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-2">Category Probability Breakdown:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {aiAnalyst.probabilities?.map((prob: any, idx: number) => (
                              <div key={idx} className="bg-white/80 dark:bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                <span className="text-[10px] text-neutral-400 font-semibold block truncate">{prob.category}</span>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs font-black text-neutral-900 dark:text-white">{(prob.confidence ?? 0).toFixed(0)}%</span>
                                  <div className="w-16 bg-neutral-100 dark:bg-neutral-850 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-primary-650 h-full rounded-full" style={{ width: `${prob.confidence}%` }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Executive Summary */}
                      <div className="bg-neutral-50 dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-2">
                        <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">AI Executive Analysis</h4>
                        <p className="text-xs text-neutral-700 dark:text-neutral-350 leading-relaxed">
                          {aiAnalyst.executive_summary}
                        </p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-400 italic mt-1 leading-relaxed bg-white dark:bg-neutral-850 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800/80">
                          <strong>Analytical Reasoning:</strong> {aiAnalyst.classification_reasoning}
                        </p>
                      </div>

                      {/* AI Inferred Timeline */}
                      <div className="bg-neutral-50 dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-4">
                        <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">Modus Operandi Timeline</h4>
                        <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-2.5 space-y-4">
                          {aiAnalyst.timeline?.map((step: any, idx: number) => (
                            <div key={idx} className="relative pl-6">
                              <span className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-primary-650 ring-4 ring-primary-50 dark:ring-primary-950/60" />
                              <div className="text-xs">
                                <span className="text-[10px] font-black uppercase text-primary-755 dark:text-primary-400 block">{step.date}</span>
                                <p className="text-neutral-600 dark:text-neutral-350 mt-0.5 leading-relaxed">{step.event}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Plan & Cyber Laws */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Investigative Recommendations */}
                        <div className="bg-neutral-50 dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-3">
                          <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">Tactical Action Recommendations</h4>
                          <div className="space-y-2">
                            {aiAnalyst.recommendations?.map((rec: any, idx: number) => (
                              <div key={idx} className="p-2.5 bg-white dark:bg-neutral-850 rounded-lg border border-neutral-100 dark:border-neutral-800 flex items-start gap-2 text-xs">
                                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                                  rec.priority === 'High' ? 'bg-red-500' : rec.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                                }`} />
                                <div className="flex-1">
                                  <p className="font-semibold text-neutral-850 dark:text-neutral-200 leading-tight">{rec.action}</p>
                                  <div className="flex gap-2 mt-1 items-center">
                                    <span className="text-[9px] text-neutral-400 font-bold uppercase">{rec.priority} Priority</span>
                                    <span className="text-[9px] bg-neutral-50 dark:bg-neutral-900 px-1 rounded text-neutral-500 border border-neutral-200 dark:border-neutral-750">{rec.status}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cyber Law mapping */}
                        <div className="bg-neutral-50 dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-3">
                          <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">Applicable Cyber Laws</h4>
                          <div className="space-y-3.5">
                            {aiAnalyst.legal_sections?.map((law: any, idx: number) => (
                              <div key={idx} className="text-xs border-b border-neutral-100 dark:border-neutral-850 pb-2.5 last:border-b-0 last:pb-0">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-extrabold text-neutral-850 dark:text-neutral-100">{law.section}</span>
                                  <span className="text-[9px] uppercase font-black text-primary-650 dark:text-primary-400">{law.act}</span>
                                </div>
                                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">{law.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Evidence Gaps Alerts */}
                      <div className="bg-neutral-50 dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-2">
                        <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">Vault Evidence Gap Warnings</h4>
                        <div className="space-y-2">
                          {aiAnalyst.evidence_gaps?.map((gap: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2.5 text-xs text-neutral-750 dark:text-neutral-300">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${gap.startsWith('None') ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span>{gap}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Natural language narrative suitable for inclusion in PDF report */}
                      <div className="bg-neutral-50 dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-2">
                        <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider">Report Case Dossier Narrative</h4>
                        <p className="text-xs font-mono text-neutral-600 dark:text-neutral-350 leading-relaxed bg-white dark:bg-neutral-850 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
                          {aiAnalyst.investigation_narrative}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* THREAT INTEL TAB */}
              {activeTab === 'threat' && (
                <div className="space-y-6">
                  {/* Scan All workflow */}
                  <div className="bg-primary-50/40 dark:bg-primary-950/20 p-5 rounded-2xl border border-primary-100 dark:border-primary-900/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-xs font-black text-primary-750 dark:text-primary-400 uppercase tracking-wider mb-1">Bulk Case Indicators Scan</h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-bold leading-normal">
                        Bulk reputation analysis for all {allExtractedIndicators.length} identified case indicators (UPI IDs, phone numbers, domains, etc.) via external threat databases.
                      </p>
                    </div>
                    <Button 
                      onClick={handleBulkScanIndicators} 
                      isLoading={bulkScanning} 
                      disabled={allExtractedIndicators.length === 0}
                      size="sm"
                      className="shrink-0 font-bold shadow-md"
                    >
                      Scan All Indicators
                    </Button>
                  </div>

                  {/* Manual Reputation lookup check */}
                  <div className="bg-neutral-50 dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Manual Indicator reputation Scan</h3>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Enter custom IP, domain, UPI, phone, email, crypto..."
                        value={intelQuery}
                        onChange={(e) => setIntelQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleIntelLookup(intelQuery)}
                        className="flex-1 text-xs"
                      />
                      <Button onClick={() => handleIntelLookup(intelQuery)} isLoading={intelLoading} size="sm">
                        Scan
                      </Button>
                    </div>

                    {intelError && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{intelError}</p>
                      </div>
                    )}
                    
                    {intelResult && (
                      <div className="mt-5 p-5 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700/60 space-y-4 text-xs">
                        <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-neutral-700">
                          <div>
                            <p className="font-bold text-sm text-neutral-900 dark:text-white font-mono">{intelResult.indicator}</p>
                            <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">{intelResult.indicator_type || 'Indicator'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            intelResult.status === 'Malicious' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' :
                            intelResult.status === 'Suspicious' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          }`}>
                            {intelResult.status || 'Clean'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg">
                            <span className="text-neutral-450 block mb-0.5 font-bold uppercase text-[9px]">Threat Score</span>
                            <span className={`font-black text-lg ${
                              (intelResult.threat_score ?? 0) > 70 ? 'text-red-600 dark:text-red-400' :
                              (intelResult.threat_score ?? 0) > 40 ? 'text-amber-600 dark:text-amber-400' :
                              'text-emerald-600 dark:text-emerald-400'
                            }`}>{intelResult.threat_score ?? 0}<span className="text-xs font-normal text-neutral-400">/100</span></span>
                          </div>
                          <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg">
                            <span className="text-neutral-450 block mb-0.5 font-bold uppercase text-[9px]">Source Feed</span>
                            <span className="font-bold text-neutral-700 dark:text-neutral-300">{intelResult.source || '—'}</span>
                          </div>
                          <div className="col-span-2 bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg">
                            <span className="text-neutral-450 block mb-0.5 font-bold uppercase text-[9px]">Description</span>
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">{intelResult.details?.description || intelResult.description || '—'}</span>
                          </div>
                        </div>

                        <div className={`p-3 rounded-lg font-bold border ${
                          intelResult.status === 'Malicious' ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30' :
                          intelResult.status === 'Suspicious' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' :
                          'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                        }`}>
                          {intelResult.status === 'Malicious'
                            ? '⚠ RECOMMENDATION: Immediately escalate to senior officer. This indicator is confirmed malicious.'
                            : intelResult.status === 'Suspicious'
                            ? '⚡ RECOMMENDATION: Apply elevated scrutiny. Cross-reference with additional databases.'
                            : '✓ RECOMMENDATION: No immediate risk detected. Continue standard investigation protocol.'}
                        </div>

                        {intelSaveSuccess ? (
                          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 text-center">
                            {intelSaveSuccess}
                          </div>
                        ) : (
                          <Button
                            onClick={handleSaveIndicatorToCase}
                            isLoading={intelSavingToCase}
                            size="sm"
                            variant="outline"
                            className="w-full font-bold"
                          >
                            Save Indicator to Case File
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Scanned case indicators results grid */}
                  <div className="bg-neutral-50 dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Case Indicators Reputation Ledger</h3>
                    {allExtractedIndicators.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">No indicators linked to this ticket.</p>
                    ) : (
                      <div className="space-y-3">
                        {allExtractedIndicators.map((ind, idx) => {
                          const scanMatch = bulkScannedIndicators?.find(
                            (x: any) => x.indicator === ind.value
                          )
                          return (
                            <div key={idx} className="bg-white dark:bg-neutral-850 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded border border-neutral-200 dark:border-neutral-700">{ind.label}</span>
                                  <span className="font-mono font-bold text-neutral-900 dark:text-white">{ind.value}</span>
                                </div>
                                {scanMatch && (
                                  <p className="text-[10px] text-neutral-450 dark:text-neutral-400 font-semibold">{scanMatch.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {scanMatch ? (
                                  <>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                      scanMatch.status === 'Malicious' ? 'bg-red-100 text-red-750 dark:bg-red-950/45 dark:text-red-400' :
                                      scanMatch.status === 'Suspicious' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/45 dark:text-yellow-400' :
                                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-400'
                                    }`}>
                                      {scanMatch.status}
                                    </span>
                                    <span className="text-[10px] font-extrabold text-neutral-400">Score: <span className="font-black text-neutral-850 dark:text-neutral-200">{scanMatch.threat_score}</span></span>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-neutral-400 italic">Not Scanned Yet</span>
                                )}
                                <Button 
                                  onClick={() => { setIntelQuery(ind.value); handleIntelLookup(ind.value) }}
                                  variant="outline" 
                                  size="xs"
                                  className="font-bold"
                                >
                                  Refreshed Scan
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EVIDENCE VAULT TAB */}
              {activeTab === 'evidence' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Vault Files</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleDownloadZip} className="text-xs font-bold">
                        Download All (ZIP)
                      </Button>
                      <label className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-750 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors duration-200">
                        <span>Upload File</span>
                        <input type="file" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {uploadError && <Alert type="danger">{uploadError}</Alert>}
                  {uploadLoading && (
                    <div className="p-4 bg-primary-50/20 dark:bg-primary-950/10 border border-primary-100 rounded-xl flex items-center gap-3">
                      <Spinner size="sm" />
                      <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Encrypting and uploading evidence file...</span>
                    </div>
                  )}

                  {evidenceList.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-6">No evidence files stored in vault.</p>
                  ) : (
                    <div className="space-y-3">
                      {evidenceList.map((file) => (
                        <div 
                          key={file.id} 
                          className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 rounded-xl gap-4 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl shrink-0">{getFileIcon(file.mime_type)}</span>
                            <div className="min-w-0">
                              <span className="font-bold text-neutral-900 dark:text-white truncate block">{file.filename}</span>
                              <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">
                                {formatFileSize(file.file_size)} • Hash: <span className="font-mono">{file.sha256_hash.slice(0, 16)}...</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {verificationResult[file.id] && (
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                verificationResult[file.id] === 'matched' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {verificationResult[file.id] === 'matched' ? '✓ Integr. OK' : '⚠ Hash Mismatch'}
                              </span>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleVerifyHash(file)} 
                              isLoading={verifyingHashId === file.id}
                            >
                              Verify integrity
                            </Button>
                            <Link href={API_ROUTES.evidenceDownload(file.id)} target="_blank">
                              <Button size="sm">Download</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PRIVATE NOTES TAB */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {/* Submit Note Form */}
                  <form onSubmit={handlePostPrivateNote} className="space-y-4">
                    <Textarea
                      placeholder="Add case analysis details, IP scans, suspect traces..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      required
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                        <Lock size={12} className="text-warning" />
                        <span>Private investigation notes are never visible to citizens.</span>
                      </span>
                      <Button type="submit" isLoading={noteLoading} size="sm" className="flex items-center gap-1">
                        <Send size={12} />
                        <span>Add Note</span>
                      </Button>
                    </div>
                  </form>

                  {/* Notes Feed */}
                  {privateNotes.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-6">No private investigation notes yet.</p>
                  ) : (
                    <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-850">
                      {privateNotes.map((note) => (
                        <div key={note.id} className="p-4 bg-yellow-50/10 dark:bg-yellow-950/5 border border-yellow-150/40 dark:border-yellow-900/20 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-semibold">
                            <span>Author: Officer</span>
                            <span>{formatDateTime(note.created_at)}</span>
                          </div>
                          <p className="text-neutral-600 dark:text-neutral-350 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DISCUSSION THREAD TAB */}
              {activeTab === 'discussion' && (
                <div className="space-y-6">
                  {/* Reply Form */}
                  <form onSubmit={handlePostComment} className="space-y-4">
                    <Textarea
                      placeholder="Ask the citizen for transaction receipts, OTP logs, or clarify timeline..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                      required
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-neutral-400 font-semibold">
                        Public comments are visible to the citizen complainant.
                      </span>
                      <Button type="submit" isLoading={commentLoading} size="sm" className="flex items-center gap-1">
                        <Send size={12} />
                        <span>Send Reply</span>
                      </Button>
                    </div>
                  </form>

                  {/* Replies List */}
                  {comments.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-6">No public dialogue yet.</p>
                  ) : (
                    <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-850">
                      {comments.map((comment) => (
                        <div key={comment.id} className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-semibold">
                            <span>{comment.author_id === user?.id ? 'You' : 'Citizen'}</span>
                            <span>{formatDateTime(comment.created_at)}</span>
                          </div>
                          <p className="text-neutral-600 dark:text-neutral-350 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </Card>

        </div>

        {/* Right Side Sidebar Metadata & Workflow Actions */}
        <div className="space-y-6">
          
          {/* AI Investigator Copilot */}
          <Card className="p-6 space-y-5 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 text-xs">
            <div className="flex items-center gap-2 border-b border-neutral-50 dark:border-neutral-855 pb-3">
              <Sparkles className="text-primary-650 shrink-0" size={16} />
              <div>
                <h3 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                  AI Investigator Copilot
                </h3>
                <p className="text-[10px] text-neutral-450 font-semibold mt-0.5">Automated Case Analysis Insights</p>
              </div>
            </div>

            {aiAnalystLoading ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <Spinner size="sm" className="text-primary-600" />
                <p className="text-[10px] text-neutral-500 font-bold">Scanning dossier details...</p>
              </div>
            ) : aiAnalyst ? (
              <div className="space-y-5">
                {/* Dossier Completeness / Investigation Score */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] uppercase font-black text-neutral-550">
                    <span>Dossier Completeness</span>
                    <span className="font-black text-primary-650">{aiAnalyst.investigation_score}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-850 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        aiAnalyst.investigation_score > 80 
                          ? 'bg-emerald-500' 
                          : aiAnalyst.investigation_score > 50 
                          ? 'bg-amber-500' 
                          : 'bg-red-500'
                      }`} 
                      style={{ width: `${aiAnalyst.investigation_score}%` }} 
                    />
                  </div>
                </div>

                {/* Modus Operandi & Summary */}
                <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 space-y-1 text-neutral-800 dark:text-neutral-200">
                  <span className="text-[9px] uppercase font-bold text-neutral-450 block">Inferred Modus Operandi</span>
                  <p className="text-neutral-700 dark:text-neutral-350 leading-relaxed font-medium">
                    {aiAnalyst.summary}
                  </p>
                </div>

                {/* Missing Evidence Warnings */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-neutral-455 block">Evidence Gaps Identified</span>
                  <div className="flex flex-col gap-1.5">
                    {aiAnalyst.evidence_gaps?.map((gap: string, idx: number) => {
                      const isNone = gap.startsWith('None')
                      return (
                        <span 
                          key={idx} 
                          className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                            isNone 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' 
                              : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30'
                          }`}
                        >
                          {isNone ? '✓ Vault evidence ledger complete' : `⚠ Missing: ${gap}`}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Similar cases from Qdrant */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-neutral-455 block">Similar Case Matches (Qdrant)</span>
                  {aiAnalyst.similar_cases?.length === 0 ? (
                    <p className="text-[10px] text-neutral-400 italic">No similar cyber complaints detected.</p>
                  ) : (
                    <div className="space-y-2">
                      {aiAnalyst.similar_cases?.map((sim: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="bg-neutral-50 dark:bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 flex justify-between items-center gap-2 hover:border-primary-400/50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/officer/tickets/${sim.ticket_id}`)}
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-850 dark:text-neutral-200 block truncate">{sim.ticket_number || sim.text_snippet?.slice(0, 30) + '...'}</span>
                            <span className="text-[9px] text-neutral-400 block mt-0.5">{sim.category}</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/40 rounded text-[9px] font-black text-emerald-700 dark:text-emerald-400 shrink-0">
                            {sim.similarity_score}% Match
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suggested Questions */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-neutral-455 block">Suggested Interview Questions</span>
                  <div className="space-y-1.5">
                    {aiAnalyst.suggested_questions?.map((q: string, idx: number) => (
                      <div 
                        key={idx} 
                        className="bg-neutral-50 dark:bg-neutral-900/40 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800 relative group cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        onClick={() => {
                          setCommentText(q)
                          setActiveTab('discussion')
                        }}
                        title="Click to copy question to Citizen Dialogue chat input box"
                      >
                        <p className="text-[10px] text-neutral-600 dark:text-neutral-350 pr-4 leading-normal font-medium">{q}</p>
                        <span className="absolute right-2 top-2 text-[9px] text-primary-650 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Use</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-neutral-400 italic">No analyst report loaded.</p>
            )}
          </Card>

          {/* Metadata Card */}
          <Card className="p-6 space-y-4 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
            <h3 className="text-xs font-bold text-neutral-450 uppercase tracking-wider border-b border-neutral-50 dark:border-neutral-850 pb-2">
              Case Metadata
            </h3>

            <div className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between items-center">
                <span>Jurisdiction:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{ticket.jurisdiction || 'District Cyber Cell'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Assigned Group:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{ticket.assigned_group || '—'}</span>
              </div>
              
              <div className="flex justify-between items-center border-t border-neutral-50 dark:border-neutral-855 pt-2.5">
                <span>SLA Deadline:</span>
                <span className={`font-bold ${isSLABreached() ? 'text-danger' : 'text-neutral-900 dark:text-white'}`}>
                  {ticket.sla_deadline ? formatDate(ticket.sla_deadline) : 'No SLA limit'}
                </span>
              </div>

              {isSLABreached() && (
                <div className="mt-2.5 p-2 bg-red-50/40 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-lg text-danger text-[10px] font-black uppercase flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle size={13} />
                  <span>SLA deadline breached</span>
                </div>
              )}
            </div>
          </Card>

          {/* Workflow & Status Actions */}
          <Card className="p-6 space-y-4 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
            <h3 className="text-xs font-bold text-neutral-450 uppercase tracking-wider border-b border-neutral-50 dark:border-neutral-850 pb-2">
              Lifecycle Transitions
            </h3>

            {statusError && <Alert type="danger" className="text-[11px] p-3">{statusError}</Alert>}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Set Status</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-bold"
                >
                  <option value="New" className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white">New</option>
                  <option value="Assigned" className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white">Assigned</option>
                  <option value="Under Investigation" className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white">Under Investigation</option>
                  <option value="Evidence Requested" className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white">Evidence Requested</option>
                  <option value="Waiting for Citizen" className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white">Waiting for Citizen</option>
                  <option value="Awaiting Bank Response" className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white">Awaiting Bank Response</option>
                  <option value="Awaiting Third Party" className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white">Awaiting Third Party</option>
                  <option value="Evidence Received" className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white">Evidence Received</option>
                  <option value="Closure Requested" className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white">Closure Requested</option>
                  <option value="Closed" className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white">Closed</option>
                  <option value="Reopened" className="bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white">Reopened</option>
                </select>
              </div>

              <Button 
                onClick={handleStatusChange} 
                isLoading={statusLoading} 
                disabled={selectedStatus === ticket.complaint.status}
                className="w-full font-bold"
                size="sm"
              >
                Apply status transition
              </Button>

              {/* Closure request button */}
              {ticket.complaint.status === 'Under Investigation' && (
                <Button 
                  onClick={() => setClosureModalOpen(true)}
                  className="w-full font-bold" 
                  variant="outline"
                  size="sm"
                >
                  Request Case Closure
                </Button>
              )}
            </div>
          </Card>

          {/* Supervisor approvals module */}
          {ticket.complaint.status === 'Closure Requested' && (
            <Card className="p-6 space-y-4 shadow-card border border-neutral-150 dark:border-neutral-800/80 bg-white dark:bg-neutral-900">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-50 dark:border-neutral-800 pb-2">
                Supervisor Approval Tiers
              </h3>

              <div className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between items-center">
                  <span>L1 Supervisor Tier:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ticket.l1_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {ticket.l1_approved ? 'Approved' : 'Pending Sign-off'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>L2 Senior Tier:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ticket.l2_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {ticket.l2_approved ? 'Approved' : 'Pending Sign-off'}
                  </span>
                </div>

                <div className="space-y-3 pt-3.5 border-t border-neutral-50 dark:border-neutral-850">
                  <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider">Approval Notes</span>
                  <Textarea
                    placeholder="Provide comment for approval decisions..."
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />

                  <div className="flex gap-2">
                    {!ticket.l1_approved && (
                      <Button 
                        onClick={() => handleApprovalAction('l1')} 
                        isLoading={approvalLoading} 
                        size="sm"
                        className="flex-1"
                      >
                        Approve L1
                      </Button>
                    )}
                    {ticket.l1_approved && !ticket.l2_approved && (
                      <Button 
                        onClick={() => handleApprovalAction('l2')} 
                        isLoading={approvalLoading} 
                        size="sm"
                        className="flex-1"
                      >
                        Approve L2
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

        </div>

      </div>

      {/* Case Closure request Reasoning Modal */}
      {closureModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 relative bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card animate-scale-in">
            <button 
              onClick={() => setClosureModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-4">
              Request Case Closure
            </h2>

            <form onSubmit={handleClosureRequest} className="space-y-4">
              <Textarea
                label="Closure Reason & Justification Summary"
                placeholder="Explain why the investigation is completed, what actions were taken, and why the case is recommended for closure."
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                rows={4}
                required
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setClosureModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  isLoading={closureLoading}
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  )
}
