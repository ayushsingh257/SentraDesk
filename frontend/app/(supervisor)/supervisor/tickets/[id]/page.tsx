'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw,
  FolderOpen,
  History,
  Send,
  XCircle,
  BrainCircuit,
  Binary
} from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card, Spinner } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

interface ApprovalRecord {
  id: string
  level: number
  decision: string
  comment: string | null
  created_at: string
}

interface UserProfile {
  id: string
  name: string
  role: string
  email: string
}

interface TicketDetail {
  id: string
  ticket_number: string
  category: string
  severity: string
  sla_deadline: string | null
  is_escalated: boolean
  l1_approved: boolean
  l2_approved: boolean
  created_at: string
  jurisdiction: string | null
  assigned_officer_id: string | null
  complaint: {
    title: string
    description: string
    status: string
    reporter_name: string
    reporter_email: string | null
    reporter_phone: string | null
    metadata_json: {
      category_probabilities?: Record<string, number>
      closure_reason?: string
      ai_extracted_entities?: Record<string, string[]>
      ai_analyst_dossier?: {
        executive_summary: string
        suggested_questions: string[]
        laws_applicable: string[]
      }
    }
  }
  approval_records: ApprovalRecord[]
}

interface TimelineEvent {
  id: string
  event_type: string
  description: string
  created_at: string
}

export default function SupervisorTicketDetail(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const ticketId = params.id

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [officers, setOfficers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Actions State
  const [actionComment, setActionComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Reassign State
  const [selectedOfficerId, setSelectedOfficerId] = useState('')
  const [reassignLoading, setReassignLoading] = useState(false)

  const loadTicketData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch ticket details
      const detailRes = await api.get(API_ROUTES.ticket(ticketId))
      if (detailRes.data?.success) {
        setTicket(detailRes.data.data)
        setSelectedOfficerId(detailRes.data.data.assigned_officer_id || '')
      }

      // 2. Fetch timeline
      const timelineRes = await api.get(API_ROUTES.ticketTimeline(ticketId))
      if (timelineRes.data?.success) {
        setTimeline(timelineRes.data.data)
      }

      // 3. Fetch active officers list
      const usersRes = await api.get(API_ROUTES.adminUsers)
      if (usersRes.data?.success) {
        const filteredUsers = usersRes.data.data.filter((u: UserProfile) => 
          ['cyber_cell_officer', 'investigator', 'senior_investigator', 'supervisor'].includes(u.role)
        )
        setOfficers(filteredUsers)
      }
    } catch (err: any) {
      console.error('Failed to load supervisor ticket details:', err)
      setError('Unable to load ticket information. Please verify connection.')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    loadTicketData()
  }, [loadTicketData])

  // Approval Handlers
  const handleApprovalAction = async (action: 'l1-approve' | 'l2-approve' | 'reject') => {
    if (actionComment.trim().length < 3) {
      setActionError('Please provide remarks/comments (minimum 3 characters).')
      return
    }

    setActionLoading(true)
    setActionError(null)
    setActionSuccess(null)

    try {
      let endpoint = ''
      if (action === 'l1-approve') endpoint = API_ROUTES.l1Approve(ticketId)
      else if (action === 'l2-approve') endpoint = API_ROUTES.l2Approve(ticketId)
      else endpoint = API_ROUTES.rejectClosure(ticketId)

      const res = await api.post(endpoint, { comment: actionComment })
      if (res.data?.success) {
        setActionSuccess(`Closure ${action === 'reject' ? 'rejection' : 'approval'} successfully logged.`)
        setActionComment('')
        loadTicketData()
      }
    } catch (err: any) {
      console.error('Approval operation failed:', err)
      setActionError(err.response?.data?.error?.message || 'Approval decision request failed.')
    } finally {
      setActionLoading(false)
    }
  }

  // Reassignment Handler
  const handleReassign = async () => {
    setReassignLoading(true)
    try {
      const res = await api.put(API_ROUTES.assignTicket(ticketId), {
        officer_id: selectedOfficerId || null
      })
      if (res.data?.success) {
        loadTicketData()
      }
    } catch (err: any) {
      console.error('Reassignment failed:', err)
    } finally {
      setReassignLoading(false)
    }
  }

  // SLA Escalation Toggle
  const handleToggleEscalation = async () => {
    if (!ticket) return
    try {
      const res = await api.post(API_ROUTES.bulkEscalate, {
        ticket_ids: [ticket.id],
        is_escalated: !ticket.is_escalated
      })
      if (res.data?.success) {
        loadTicketData()
      }
    } catch (err: any) {
      console.error('Escalation toggle failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner size="lg" className="text-amber-700" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <Card className="p-8 text-center border-danger/25 bg-danger/5 max-w-lg mx-auto mt-20">
        <AlertTriangle size={40} className="text-danger mx-auto mb-3" />
        <h3 className="text-base font-bold text-neutral-850 dark:text-neutral-250">Load Failure</h3>
        <p className="text-xs text-neutral-500 mt-2">{error}</p>
        <Button onClick={loadTicketData} className="mt-4 bg-amber-700 text-white">
          Reload Case File
        </Button>
      </Card>
    )
  }

  const isClosureRequested = ticket.complaint.status === 'Closure Requested'
  const isL2Pending = ticket.l1_approved

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Back link & Actions */}
      <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <Link href="/supervisor/tickets" className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-amber-700 transition-colors">
          <ArrowLeft size={14} />
          <span>Back to Case Repository</span>
        </Link>
        <div className="flex gap-3">
          <Button 
            onClick={handleToggleEscalation}
            className={`text-xs font-bold px-4 py-1.5 flex items-center gap-1.5 shadow-sm border ${
              ticket.is_escalated 
                ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-700 border-amber-500/20' 
                : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
            }`}
          >
            <ShieldAlert size={14} />
            <span>{ticket.is_escalated ? 'Escalation Active' : 'Escalate Priority'}</span>
          </Button>
          <Button onClick={loadTicketData} size="sm" className="border border-neutral-200 hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5">
            <RefreshCw size={13} />
            <span>Reload</span>
          </Button>
        </div>
      </div>

      {/* Title block */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase text-amber-700 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-100/50">
            {ticket.ticket_number}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
            ticket.severity === 'Critical' ? 'bg-red-100 text-red-800' :
            ticket.severity === 'High' ? 'bg-orange-100 text-orange-700' :
            'bg-neutral-100 text-neutral-750'
          }`}>
            {ticket.severity}
          </span>
          <span className="px-2 py-0.5 bg-neutral-150 dark:bg-neutral-800 text-[10px] font-bold rounded">
            {ticket.complaint.status}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          {ticket.complaint.title}
        </h1>
      </div>

      {/* Main Grid: Details / Decisions on left, Sidebar analytics on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Closure Review & Case details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* L1 / L2 Closure Review Panel */}
          {isClosureRequested && (
            <Card className="p-6 border border-amber-500/25 bg-amber-500/5 shadow-card space-y-5">
              <div className="flex items-center gap-2 border-b border-amber-500/10 pb-3">
                <CheckCircle2 size={20} className="text-amber-700" />
                <div>
                  <h3 className="text-sm font-black uppercase text-neutral-850 dark:text-white tracking-wider">Closure Review Panel</h3>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    Tier status: {isL2Pending ? 'Level 2 Senior Sign-off required' : 'Level 1 Supervisor Sign-off required'}
                  </p>
                </div>
              </div>

              {/* Justification quote */}
              <div className="p-4 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-150 dark:border-neutral-800/80 shadow-inner">
                <span className="text-[10px] uppercase font-black text-neutral-450 tracking-wider">Investigator Closure Justification</span>
                <p className="text-xs italic text-neutral-700 dark:text-neutral-350 mt-1.5 leading-relaxed">
                  &ldquo;{ticket.complaint.metadata_json?.closure_reason || 'No justification submitted.'}&rdquo;
                </p>
                <span className="block text-[10px] text-neutral-400 mt-2 font-semibold">
                  👤 Submitted by: {ticket.complaint.reporter_name}
                </span>
              </div>

              {/* Remarks/Comment Form */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-450 tracking-wider">Supervisor Remarks / Decisions Comments</label>
                  <textarea
                    rows={3}
                    placeholder="Enter approval details or grounds for returning the ticket to investigation..."
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {!isL2Pending ? (
                    <Button 
                      disabled={actionLoading}
                      onClick={() => handleApprovalAction('l1-approve')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={14} />
                      <span>Approve Case Closure (L1)</span>
                    </Button>
                  ) : (
                    <Button 
                      disabled={actionLoading}
                      onClick={() => handleApprovalAction('l2-approve')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={14} />
                      <span>Approve & Resolve Case (L2)</span>
                    </Button>
                  )}

                  <Button 
                    disabled={actionLoading}
                    onClick={() => handleApprovalAction('reject')}
                    className="flex-1 bg-red-650 hover:bg-red-700 text-white font-bold text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={14} />
                    <span>Reject Closure (Return to Officer)</span>
                  </Button>
                </div>

                {actionError && <p className="text-[11px] text-danger font-semibold">{actionError}</p>}
                {actionSuccess && <p className="text-[11px] text-emerald-600 font-semibold">{actionSuccess}</p>}
              </div>
            </Card>
          )}

          {/* Description details card */}
          <Card className="p-6 border border-neutral-200 dark:border-neutral-800 shadow-card space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <FileText size={18} className="text-amber-700" />
              <h3 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider">Complaint Narrative</h3>
            </div>
            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {ticket.complaint.description}
            </p>

            {/* Reporter details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-500">
              <div>
                <span className="font-semibold text-neutral-400">Complainant:</span>
                <p className="font-bold text-neutral-700 dark:text-neutral-300 mt-0.5">👤 {ticket.complaint.reporter_name}</p>
              </div>
              <div>
                <span className="font-semibold text-neutral-400">Email:</span>
                <p className="font-bold text-neutral-700 dark:text-neutral-300 mt-0.5">✉️ {ticket.complaint.reporter_email || 'N/A'}</p>
              </div>
              <div>
                <span className="font-semibold text-neutral-400">Phone:</span>
                <p className="font-bold text-neutral-700 dark:text-neutral-300 mt-0.5">📞 {ticket.complaint.reporter_phone || 'N/A'}</p>
              </div>
            </div>
          </Card>

          {/* Timeline & Audit History */}
          <Card className="p-6 border border-neutral-200 dark:border-neutral-800 shadow-card">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-5">
              <History size={18} className="text-amber-700" />
              <h3 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider">Immutable Case Timeline</h3>
            </div>
            <div className="space-y-5 max-h-[300px] overflow-y-auto pr-1">
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-450 dark:text-neutral-500 font-semibold">
                  No timeline events logs found.
                </div>
              ) : (
                timeline.map((act) => (
                  <div key={act.id} className="text-xs relative pl-4 border-l border-neutral-200 dark:border-neutral-800 pb-2">
                    <div className="absolute w-2 h-2 rounded-full bg-amber-600 -left-1 top-1" />
                    <div className="flex justify-between text-[10px] text-neutral-450">
                      <span className="font-bold uppercase text-amber-750">{act.event_type}</span>
                      <span>{formatDate(act.created_at)}</span>
                    </div>
                    <p className="font-semibold text-neutral-700 dark:text-neutral-350 mt-1">
                      {act.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>

        {/* Right Side: Reassignment & AI summaries */}
        <div className="space-y-6">
          
          {/* Reassignment Console */}
          <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <User size={18} className="text-amber-700" />
              <h3 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider">Case Assignment</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-neutral-450 tracking-wider">Investigator Officer</label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {officers.map(off => (
                    <option key={off.id} value={off.id}>{off.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>District: <span className="font-bold text-neutral-500">{ticket.jurisdiction || 'N/A'}</span></span>
                <span>Unit: <span className="font-bold text-neutral-500">{ticket.assigned_group || 'FIU'}</span></span>
              </div>
              <Button 
                onClick={handleReassign}
                disabled={reassignLoading}
                className="w-full bg-amber-700 hover:bg-amber-850 text-white font-bold text-xs"
              >
                {reassignLoading ? 'Reassigning case...' : 'Reassign Ticket'}
              </Button>
            </div>
          </Card>

          {/* AI Case Dossier Summary Panel */}
          {ticket.complaint.metadata_json?.ai_analyst_dossier && (
            <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card bg-amber-500/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <BrainCircuit size={18} className="text-amber-700 animate-pulse" />
                <h3 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider">AI Copilot Analysis</h3>
              </div>
              <div className="space-y-3.5 text-xs text-neutral-700 dark:text-neutral-350">
                <div>
                  <span className="font-black text-[9px] uppercase tracking-wider text-amber-750">Executive Summary</span>
                  <p className="mt-1 text-[11px] leading-relaxed">{ticket.complaint.metadata_json.ai_analyst_dossier.executive_summary}</p>
                </div>
                {ticket.complaint.metadata_json.ai_analyst_dossier.laws_applicable && (
                  <div>
                    <span className="font-black text-[9px] uppercase tracking-wider text-amber-750">Laws Applicable</span>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                      {ticket.complaint.metadata_json.ai_analyst_dossier.laws_applicable.map((law, idx) => (
                        <li key={idx}>{law}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* AI Entity Extractor Summary */}
          {ticket.complaint.metadata_json?.ai_extracted_entities && (
            <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <Binary size={18} className="text-violet-700" />
                <h3 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider">Extracted Threat Indicators</h3>
              </div>
              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {Object.entries(ticket.complaint.metadata_json.ai_extracted_entities).map(([key, vals]) => {
                  if (!vals || vals.length === 0) return null
                  return (
                    <div key={key} className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-violet-750 tracking-wider">{key.replace('_', ' ')}</span>
                      <div className="flex flex-wrap gap-1">
                        {vals.map((v, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono text-[9px] text-neutral-700 dark:text-neutral-350">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

        </div>

      </div>

    </div>
  )
}
