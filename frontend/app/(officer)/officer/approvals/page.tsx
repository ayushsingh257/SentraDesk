'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  CheckSquare, 
  AlertCircle, 
  Inbox, 
  ArrowRight,
  ClipboardCheck,
  XCircle,
  Clock
} from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card, Alert, Spinner } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'

interface Ticket {
  id: string
  ticket_number: string
  category: string
  severity: string
  l1_approved: boolean
  l2_approved: boolean
  created_at: string
  reopen_reason: string | null
  complaint: {
    title: string
    description: string
    status: string
    reporter_name: string
  }
}

export default function SupervisorApprovals() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Decision Form Modal States
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [decisionType, setDecisionType] = useState<'approve' | 'reject'>('approve')
  const [commentText, setCommentText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchApprovals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(API_ROUTES.tickets)
      if (res.data?.success) {
        // Filter tickets that are in 'Closure Requested' status
        const closureReqs = res.data.data.filter((t: Ticket) => t.complaint.status === 'Closure Requested')
        setTickets(closureReqs)
      }
    } catch (err: any) {
      console.error('Failed to load supervisor approvals:', err)
      setError('Unable to retrieve pending approvals list. Ensure supervisor privileges.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  // Handle Approving (L1 or L2)
  const handleApprove = async (ticket: Ticket) => {
    setActionLoading(true)
    try {
      const level = !ticket.l1_approved ? 'l1' : 'l2'
      const endpoint = level === 'l1' ? API_ROUTES.l1Approve(ticket.id) : API_ROUTES.l2Approve(ticket.id)
      const res = await api.post(endpoint, { comment: commentText })
      
      if (res.data?.success) {
        setCommentText('')
        setActiveTicket(null)
        fetchApprovals()
      }
    } catch (err) {
      console.error('Approval sign-off failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Rejecting (reopens ticket)
  const handleReject = async (ticket: Ticket) => {
    setActionLoading(true)
    try {
      // Reopening via status transition reject (matches submit_approval_action logic in backend)
      // Rejecting resets approvals and sets status to 'Reopened'
      const res = await api.put(API_ROUTES.updateStatus(ticket.id), { status: 'Reopened' })
      if (res.data?.success) {
        setCommentText('')
        setActiveTicket(null)
        fetchApprovals()
      }
    } catch (err) {
      console.error('Rejection of closure failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const getClosureReason = (ticket: Ticket) => {
    // Re-use or find closure reason from notes or custom logic
    return 'Investigation concluded. Evidence successfully acquired and verified.'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Supervisor Approval Center
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Review, sign-off, or reject closure requests submitted by field investigators.
        </p>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Spinner size="lg" className="text-primary-700" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="py-20 text-center space-y-4 shadow-card border border-neutral-150 dark:border-neutral-800">
          <Inbox size={48} className="text-neutral-350 dark:text-neutral-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">All caught up</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              There are no pending L1 or L2 case closure requests requiring supervisor approval.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tickets.map((ticket) => {
            const level = !ticket.l1_approved ? 'L1 Supervisor Sign-off' : 'L2 Senior Supervisor Sign-off'
            
            return (
              <Card 
                key={ticket.id}
                className="p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-card bg-white dark:bg-neutral-900/40"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 dark:border-neutral-800/80 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded border border-primary-100/50 dark:border-primary-900/20">
                        {ticket.ticket_number}
                      </span>
                      <span className="text-[10px] font-bold text-warning-700 dark:text-warning-400 bg-warning-50/50 dark:bg-warning-950/20 px-2 py-0.5 rounded border border-warning-100/20">
                        {level}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-1.5">
                      {ticket.complaint.title}
                    </h3>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto shrink-0">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setActiveTicket(ticket)
                        setDecisionType('reject')
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <XCircle size={14} className="text-danger" />
                      <span>Reject</span>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setActiveTicket(ticket)
                        setDecisionType('approve')
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <ClipboardCheck size={14} />
                      <span>Approve</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-neutral-400 block mb-1">Closure Justification</span>
                    <p className="p-3.5 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800/60 rounded-xl text-neutral-600 dark:text-neutral-350 leading-relaxed">
                      {getClosureReason(ticket)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-neutral-450 border-t border-neutral-100 dark:border-neutral-800/80 pt-3">
                    <span>Submitted by: Investigator</span>
                    <span>Date Created: {formatDate(ticket.created_at)}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Decision Comment Modal */}
      {activeTicket && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 relative bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card animate-scale-in">
            <button 
              onClick={() => setActiveTicket(null)}
              className="absolute right-4 top-4 p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
            >
              <XCircle size={18} />
            </button>

            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-4">
              {decisionType === 'approve' ? 'Confirm Closure Approval' : 'Reject Closure Request'}
            </h2>

            <div className="space-y-4">
              <p className="text-xs text-neutral-500 leading-relaxed">
                Confirm your decision for ticket <span className="font-bold text-neutral-800 dark:text-white">{activeTicket.ticket_number}</span>.
              </p>

              <Textarea
                label="Supervisor Evaluation Note"
                placeholder={decisionType === 'approve' ? 'Add evaluation notes for approval sign-off...' : 'Specify reason/deficiencies requiring further investigation...'}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                required
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActiveTicket(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => decisionType === 'approve' ? handleApprove(activeTicket) : handleReject(activeTicket)} 
                  size="sm" 
                  isLoading={actionLoading}
                  className={decisionType === 'reject' ? 'bg-danger hover:bg-danger-hover border-danger' : ''}
                >
                  Confirm Decision
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  )
}
