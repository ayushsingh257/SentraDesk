'use client'

import { use, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Paperclip, 
  Send, 
  Shield, 
  Star, 
  AlertCircle, 
  FolderPlus, 
  RotateCcw,
  CheckCircle2,
  Trash2,
  Download
} from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, Alert, Spinner } from '@/components/ui/index'
import { formatFileSize, formatDateTime, getFileIcon } from '@/lib/utils'

interface TimelineEvent {
  id: string
  event_type: string
  description: string
  created_at: string
}

interface Comment {
  id: string
  content: string
  author: {
    name: string
    role: string
  }
  created_at: string
}

interface Evidence {
  id: string
  filename: string
  mime_type: string
  file_size: number
  sha256_hash: string
  created_at: string
}

interface TicketDetail {
  id: string
  ticket_number: string
  category: string
  severity: string
  rating: number | null
  feedback: string | null
  created_at: string
  complaint: {
    title: string
    description: string
    status: string
    reporter_name: string
    reporter_email: string
    reporter_phone: string
    metadata_json: Record<string, any>
  }
}

function TicketDetailContent({ id }: { id: string }) {
  const { user } = useAuth()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sub-forms States
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  const [ratingVal, setRatingVal] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const [reopenReason, setReopenReason] = useState('')
  const [reopenLoading, setReopenLoading] = useState(false)
  const [reopenError, setReopenError] = useState<string | null>(null)
  const [showReopenForm, setShowReopenForm] = useState(false)

  // File Upload State
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadLoading, setUploadLoading] = useState(false)

  const loadTicketData = useCallback(async () => {
    try {
      const [ticketRes, timelineRes, commentsRes, evidenceRes] = await Promise.all([
        api.get(API_ROUTES.ticket(id)),
        api.get(API_ROUTES.ticketTimeline(id)),
        api.get(API_ROUTES.ticketComments(id)),
        api.get(API_ROUTES.evidenceList(id))
      ])

      if (ticketRes.data?.success) setTicket(ticketRes.data.data)
      if (timelineRes.data?.success) setTimeline(timelineRes.data.data)
      if (commentsRes.data?.success) setComments(commentsRes.data.data)
      if (evidenceRes.data?.success) setEvidenceList(evidenceRes.data.data)
    } catch (err: any) {
      console.error('Failed to load ticket details:', err)
      setError('Could not retrieve case details. Please check connection.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadTicketData()
  }, [loadTicketData])

  // Handle Comment Submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentLoading(true)
    try {
      const res = await api.post(API_ROUTES.ticketComments(id), { content: commentText })
      if (res.data?.success) {
        setCommentText('')
        // Reload comments & timeline
        const [commentsRes, timelineRes] = await Promise.all([
          api.get(API_ROUTES.ticketComments(id)),
          api.get(API_ROUTES.ticketTimeline(id))
        ])
        if (commentsRes.data?.success) setComments(commentsRes.data.data)
        if (timelineRes.data?.success) setTimeline(timelineRes.data.data)
      }
    } catch (err) {
      console.error('Failed to submit comment:', err)
    } finally {
      setCommentLoading(false)
    }
  }

  // Handle Feedback Submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ratingVal === 0) {
      setFeedbackError('Please select a star rating between 1 and 5.')
      return
    }
    setFeedbackLoading(true)
    setFeedbackError(null)
    try {
      const res = await api.post(API_ROUTES.ticketFeedback(id), {
        rating: ratingVal,
        feedback: feedbackText
      })
      if (res.data?.success) {
        // Reload ticket data to reflect feedback submission
        await loadTicketData()
      }
    } catch (err: any) {
      console.error('Feedback submit error:', err)
      setFeedbackError(err.response?.data?.error?.message || 'Failed to submit rating.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  // Handle Reopen Submission
  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reopenReason.trim()) {
      setReopenError('Please supply a valid reopen reasoning explanation.')
      return
    }
    setReopenLoading(true)
    setReopenError(null)
    try {
      const res = await api.post(API_ROUTES.ticketReopen(id), {
        reason: reopenReason
      })
      if (res.data?.success) {
        setReopenReason('')
        setShowReopenForm(false)
        await loadTicketData()
      }
    } catch (err: any) {
      console.error('Reopen submit error:', err)
      setReopenError(err.response?.data?.error?.message || 'Failed to reopen case.')
    } finally {
      setReopenLoading(false)
    }
  }

  // Handle Direct Evidence Download
  const handleDownload = async (evidenceId: string, filename: string) => {
    try {
      const res = await api.get(API_ROUTES.evidenceDownload(evidenceId))
      if (res.data?.success) {
        const downloadUrl = res.data.data.download_url
        // Trigger a download
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  // File Upload Helper
  const calculateSHA256 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files)
      setUploadLoading(true)
      try {
        for (let i = 0; i < selected.length; i++) {
          const file = selected[i]
          
          // 1. Fetch Presigned URL
          const linkRes = await api.post(API_ROUTES.evidenceUploadLink(id), {
            filename: file.name
          })
          if (!linkRes.data?.success) throw new Error('Upload link request failed')
          
          const { upload_url, file_path } = linkRes.data.data

          // 2. Put file to Object Storage
          await api.put(upload_url, file, {
            headers: { 'Content-Type': file.type }
          })

          // 3. Compute SHA256 Hash
          const hashVal = await calculateSHA256(file)

          // 4. Save metadata details
          await api.post(API_ROUTES.evidenceSave(id), {
            filename: file.name,
            file_path: file_path,
            mime_type: file.type || 'application/octet-stream',
            file_size: file.size,
            sha256_hash: hashVal
          })
        }
        
        // Refresh evidence list & timeline
        const [evidenceRes, timelineRes] = await Promise.all([
          api.get(API_ROUTES.evidenceList(id)),
          api.get(API_ROUTES.ticketTimeline(id))
        ])
        if (evidenceRes.data?.success) setEvidenceList(evidenceRes.data.data)
        if (timelineRes.data?.success) setTimeline(timelineRes.data.data)
      } catch (err) {
        console.error('File upload failed:', err)
      } finally {
        setUploadLoading(false)
      }
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
    return <Alert type="danger">{error || 'Ticket not found'}</Alert>
  }

  const isClosed = ticket.complaint.status === 'Closed'

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/citizen/tickets" className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 tracking-wider uppercase bg-primary-50 dark:bg-primary-950/40 px-2.5 py-0.5 rounded-lg">
                {ticket.ticket_number}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border ${
                ticket.severity === 'Critical'
                  ? 'bg-danger/10 border-danger/20 text-danger'
                  : ticket.severity === 'High'
                  ? 'bg-warning/10 border-warning/20 text-warning'
                  : 'bg-neutral-50 border-neutral-250 dark:bg-neutral-800 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
              }`}>
                {ticket.severity} Severity
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white mt-1 leading-tight line-clamp-1">
              {ticket.complaint.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold border ${
            ticket.complaint.status === 'Closed'
              ? 'bg-success/10 border-success/30 text-success'
              : ticket.complaint.status === 'Pending Response'
              ? 'bg-warning/10 border-warning/30 text-warning animate-pulse'
              : 'bg-primary-50 border-primary-200 dark:bg-primary-950/40 dark:border-primary-900 text-primary-700 dark:text-primary-400'
          }`}>
            {ticket.complaint.status}
          </span>
        </div>
      </div>

      {/* Main Grid: Info Timeline / Comments & Files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section A: Description & Identifiers */}
          <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
              Incident Details & Indicators
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Description</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1.5 leading-relaxed whitespace-pre-wrap">
                  {ticket.complaint.description}
                </p>
              </div>

              {/* Grid of indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-xs border-t border-neutral-50 dark:border-neutral-850">
                {ticket.complaint.metadata_json?.suspect_name && (
                  <div>
                    <span className="text-neutral-400 font-semibold block uppercase tracking-wider">Suspect Name</span>
                    <span className="text-neutral-900 dark:text-white font-bold">{ticket.complaint.metadata_json.suspect_name}</span>
                  </div>
                )}
                {ticket.complaint.metadata_json?.suspect_phone && (
                  <div>
                    <span className="text-neutral-400 font-semibold block uppercase tracking-wider">Suspect Phone</span>
                    <span className="text-neutral-900 dark:text-white font-bold">{ticket.complaint.metadata_json.suspect_phone}</span>
                  </div>
                )}
                {ticket.complaint.metadata_json?.upi_id && (
                  <div>
                    <span className="text-neutral-400 font-semibold block uppercase tracking-wider">Suspect UPI ID</span>
                    <span className="text-neutral-900 dark:text-white font-bold font-mono">{ticket.complaint.metadata_json.upi_id}</span>
                  </div>
                )}
                {ticket.complaint.metadata_json?.bank_account && (
                  <div>
                    <span className="text-neutral-400 font-semibold block uppercase tracking-wider">Suspect Bank A/C</span>
                    <span className="text-neutral-900 dark:text-white font-bold font-mono">{ticket.complaint.metadata_json.bank_account}</span>
                  </div>
                )}
                {ticket.complaint.metadata_json?.wallet_address && (
                  <div>
                    <span className="text-neutral-400 font-semibold block uppercase tracking-wider">Crypto Wallet</span>
                    <span className="text-neutral-900 dark:text-white font-bold font-mono select-all">{ticket.complaint.metadata_json.wallet_address}</span>
                  </div>
                )}
                {ticket.complaint.metadata_json?.url && (
                  <div>
                    <span className="text-neutral-400 font-semibold block uppercase tracking-wider">Suspect URL / Link</span>
                    <a 
                      href={ticket.complaint.metadata_json.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline font-semibold block truncate"
                    >
                      {ticket.complaint.metadata_json.url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Section B: Public Discussion thread */}
          <Card className="p-6 sm:p-8 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <MessageSquare size={18} className="text-neutral-400" />
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Officer Correspondence Thread
              </h2>
            </div>

            {/* Comments Stream */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {comments.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-6">No messages in this discussion thread yet.</p>
              ) : (
                comments.map((comm) => {
                  const isOfficer = comm.author.role !== 'citizen'
                  return (
                    <div 
                      key={comm.id} 
                      className={`p-4 rounded-2xl text-xs space-y-1.5 border max-w-[85%] ${
                        isOfficer 
                          ? 'ml-auto bg-primary-50/40 border-primary-100 dark:bg-primary-950/15 dark:border-primary-900/50' 
                          : 'bg-neutral-50/55 border-neutral-150 dark:bg-neutral-800/20 dark:border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 font-bold">
                        <span className={isOfficer ? 'text-primary-700 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'}>
                          {comm.author.name} {isOfficer && `(${comm.author.role.replace('_', ' ')})`}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-semibold">
                          {formatDateTime(comm.created_at)}
                        </span>
                      </div>
                      <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">{comm.content}</p>
                    </div>
                  )
                })
              )}
            </div>

            {/* Comment Form */}
            {!isClosed && (
              <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2">
                <div className="flex-1">
                  <Input
                    placeholder="Type follow-up query message details..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={commentLoading}
                  />
                </div>
                <Button type="submit" isLoading={commentLoading} className="px-4 shrink-0">
                  <Send size={16} />
                </Button>
              </form>
            )}
          </Card>

          {/* Section C: Post-closure / Feedback */}
          {isClosed && (
            <Card className="p-6 sm:p-8 space-y-5 shadow-card border border-neutral-100 dark:border-neutral-700/60 animate-fade-in">
              <div className="flex items-center gap-2.5 border-b border-neutral-155 dark:border-neutral-800 pb-3">
                <CheckCircle2 className="text-success" size={20} />
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Case Feedback & Reopen Controls</h2>
              </div>

              {ticket.rating !== null ? (
                // Feedback already submitted
                <div className="bg-success/5 border border-success/15 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-warning">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star 
                        key={idx} 
                        size={16} 
                        fill={idx < (ticket.rating || 0) ? 'currentColor' : 'transparent'} 
                      />
                    ))}
                    <span className="text-xs font-bold text-neutral-500 ml-1.5">Rating submitted</span>
                  </div>
                  {ticket.feedback && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed italic">
                      &quot;{ticket.feedback}&quot;
                    </p>
                  )}
                </div>
              ) : (
                // Render feedback rating form
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  {feedbackError && <Alert type="danger">{feedbackError}</Alert>}
                  <p className="text-xs text-neutral-500">
                    This ticket has been closed. Please rate your experience to help us improve cyber grievance cells:
                  </p>
                  
                  {/* Stars selector */}
                  <div className="flex items-center gap-1 text-neutral-300 dark:text-neutral-700">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const starVal = idx + 1
                      const isGold = starVal <= (hoverRating || ratingVal)
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setRatingVal(starVal)}
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={`focus:outline-none transition-colors duration-150 p-0.5 ${
                            isGold ? 'text-warning' : 'text-neutral-350 dark:text-neutral-700 hover:text-warning/70'
                          }`}
                        >
                          <Star size={24} fill={isGold ? 'currentColor' : 'transparent'} />
                        </button>
                      )
                    })}
                  </div>

                  <Textarea
                    placeholder="Enter write-up review comments (optional)..."
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                  />

                  <Button type="submit" isLoading={feedbackLoading}>
                    Submit Case Feedback
                  </Button>
                </form>
              )}

              {/* Case Reopen Panel */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5 space-y-3">
                <p className="text-xs text-neutral-500">
                  If the scam persists or funds were only partially returned, you can request to reopen this ticket within compliance window limits.
                </p>
                
                {reopenError && <Alert type="danger">{reopenError}</Alert>}

                {!showReopenForm ? (
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 text-danger hover:bg-danger/10 border-danger/25"
                    onClick={() => setShowReopenForm(true)}
                  >
                    <RotateCcw size={16} />
                    <span>Reopen Ticket Case</span>
                  </Button>
                ) : (
                  <form onSubmit={handleReopenSubmit} className="space-y-3 p-4 bg-danger/5 dark:bg-danger/10/20 border border-danger/15 rounded-2xl">
                    <Textarea
                      placeholder="Explain the specific reason why this case must be reopened..."
                      rows={3}
                      required
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" isLoading={reopenLoading} className="btn-danger">
                        Confirm Reopen
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowReopenForm(false)}
                        disabled={reopenLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          )}

        </div>

        {/* Right Sidebar: Timeline & Evidence Files */}
        <div className="space-y-8">
          
          {/* Section D: Evidence panel */}
          <Card className="p-6 space-y-5 shadow-card border border-neutral-100 dark:border-neutral-700/60">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Paperclip size={18} className="text-neutral-400" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Evidence Records</h2>
              </div>
              
              {/* Additional upload trigger */}
              {!isClosed && (
                <label className={`w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-700 dark:text-primary-400 hover:bg-primary-700 hover:text-white transition-colors duration-200 cursor-pointer ${
                  uploadLoading ? 'pointer-events-none' : ''
                }`}>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                  />
                  {uploadLoading ? <Spinner size="sm" /> : <FolderPlus size={16} />}
                </label>
              )}
            </div>

            {/* List of files */}
            <div className="space-y-2">
              {evidenceList.length === 0 ? (
                <p className="text-xs text-neutral-400 py-2">No evidence files uploaded yet.</p>
              ) : (
                evidenceList.map((ev) => (
                  <div 
                    key={ev.id}
                    className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-850 border border-neutral-150 dark:border-neutral-800 rounded-xl"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="text-lg shrink-0">{getFileIcon(ev.mime_type)}</span>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {ev.filename}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                          {formatFileSize(ev.file_size)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(ev.id, ev.filename)}
                      className="p-2 text-neutral-400 hover:text-primary-700 dark:hover:text-primary-400 bg-white dark:bg-neutral-900 hover:shadow-sm rounded-lg transition-colors border border-neutral-150 dark:border-neutral-700 shrink-0"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Section E: Visual Timeline stepper */}
          <Card className="p-6 space-y-5 shadow-card border border-neutral-100 dark:border-neutral-700/60">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <Clock size={18} className="text-neutral-400" />
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Case Progress Log</h2>
            </div>

            {/* Stepper timeline vertical list */}
            <div className="relative border-l border-neutral-200 dark:border-neutral-800 pl-4 ml-2.5 space-y-6">
              {timeline.map((event, idx) => (
                <div key={event.id} className="relative">
                  {/* Indicator bullet */}
                  <span className="absolute -left-[21px] top-1.5 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-primary-600 ring-4 ring-white dark:ring-neutral-950" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                      {event.event_type.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                      {event.description}
                    </p>
                    <span className="text-[10px] text-neutral-450 mt-1 block font-semibold">
                      {formatDateTime(event.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>
    </div>
  )
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  return <TicketDetailContent id={resolvedParams.id} />
}
