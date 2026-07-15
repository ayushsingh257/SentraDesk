'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { CheckSquare, AlertCircle, RefreshCw, ClipboardCheck, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card, Spinner } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

interface Ticket {
  id: string
  ticket_number: string
  category: string
  severity: string
  created_at: string
  l1_approved: boolean
  l2_approved: boolean
  complaint: {
    title: string
    description: string
    status: string
    reporter_name: string
    metadata_json: {
      closure_reason?: string
    }
  }
}

export default function SupervisorApprovals() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkComment, setBulkComment] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)

  const fetchApprovals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(API_ROUTES.tickets, { params: { status: 'Closure Requested' } })
      if (res.data?.success) {
        setTickets(res.data.data)
        setSelectedIds([])
      }
    } catch (err: any) {
      console.error('Failed to load pending approvals:', err)
      setError('Unable to fetch approvals queue. Please check server connections.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  // Bulk operation handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === tickets.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(tickets.map((t) => t.id))
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.length === 0) return
    if (bulkComment.trim().length < 3) {
      setBulkError('Please enter a comment/remarks for this bulk decision (minimum 3 characters).')
      return
    }

    setBulkLoading(true)
    setBulkError(null)
    try {
      const res = await api.post(API_ROUTES.bulkApprove, {
        ticket_ids: selectedIds,
        action,
        comment: bulkComment
      })
      if (res.data?.success) {
        setBulkComment('')
        fetchApprovals()
      } else {
        setBulkError(res.data?.error || 'Bulk operation completed with errors.')
      }
    } catch (err: any) {
      console.error('Bulk decision failure:', err)
      setBulkError(err.response?.data?.error?.message || 'Bulk request failed.')
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Closure Approvals Center
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Review investigators&apos; requests to resolve cases. Decisions require L1 and L2 supervisor approvals.
          </p>
        </div>
        <Button onClick={fetchApprovals} size="sm" className="flex items-center gap-2 border-neutral-200 hover:bg-neutral-100">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Spinner size="lg" className="text-amber-700" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center border-danger/25 bg-danger/5">
          <AlertCircle size={32} className="text-danger mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-250">Failed to load approvals</h3>
          <p className="text-xs text-neutral-500 mt-1">{error}</p>
          <Button onClick={fetchApprovals} size="sm" className="mt-4 bg-amber-700 text-white">
            Retry Connection
          </Button>
        </Card>
      ) : tickets.length === 0 ? (
        <Card className="py-20 text-center space-y-4 shadow-card border border-neutral-200 dark:border-neutral-800">
          <ClipboardCheck size={48} className="text-neutral-300 dark:text-neutral-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Approvals Queue is Clear</h3>
            <p className="text-xs text-neutral-450 max-w-xs mx-auto">
              There are no pending case closure requests requiring supervisor L1 or L2 decisions at this time.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Bulk Action Controls */}
          {selectedIds.length > 0 && (
            <Card className="p-5 border border-amber-500/20 bg-amber-500/5 shadow-card space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-350">
                  Bulk Actions: <span className="font-extrabold text-amber-750">{selectedIds.length} tickets selected</span>
                </span>
                <button onClick={() => setSelectedIds([])} className="text-[11px] text-neutral-500 hover:underline">
                  Clear selection
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[11px] uppercase font-black text-neutral-450 tracking-wider">Bulk Approval Remarks / Comments</label>
                  <input
                    type="text"
                    placeholder="Enter decision comments (e.g. Audit checklist complete and evidence verified.)"
                    value={bulkComment}
                    onChange={(e) => setBulkComment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex gap-3 shrink-0 w-full md:w-auto">
                  <Button 
                    disabled={bulkLoading} 
                    onClick={() => handleBulkAction('approve')}
                    className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 flex items-center justify-center gap-2"
                  >
                    <ClipboardCheck size={14} />
                    <span>Approve Selected</span>
                  </Button>
                  <Button 
                    disabled={bulkLoading} 
                    onClick={() => handleBulkAction('reject')}
                    className="flex-1 md:flex-initial bg-red-650 hover:bg-red-700 text-white font-bold text-xs px-5 py-2 flex items-center justify-center gap-2"
                  >
                    <XCircle size={14} />
                    <span>Reject Selected</span>
                  </Button>
                </div>
              </div>
              {bulkError && (
                <p className="text-[11px] text-danger font-semibold">{bulkError}</p>
              )}
            </Card>
          )}

          {/* Approvals Queue Table */}
          <Card className="border border-neutral-200/80 dark:border-neutral-800 shadow-card overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-150 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/20 text-neutral-450 uppercase font-black tracking-wider">
                    <th className="py-4 px-5 w-10 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedIds.length === tickets.length}
                        onChange={handleSelectAll}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-3 font-black">Case Reference</th>
                    <th className="py-4 px-3 font-black">Category & Severity</th>
                    <th className="py-4 px-3 font-black">Closure Justification</th>
                    <th className="py-4 px-3 font-black text-center">Queue Tier</th>
                    <th className="py-4 px-5 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                  {tickets.map((t) => {
                    const isSelected = selectedIds.includes(t.id)
                    const isL2Pending = t.l1_approved
                    return (
                      <tr 
                        key={t.id} 
                        className={`hover:bg-neutral-50/40 dark:hover:bg-neutral-850/10 transition-colors ${
                          isSelected ? 'bg-amber-50/20 dark:bg-amber-950/5' : ''
                        }`}
                      >
                        <td className="py-4 px-5 text-center">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(t.id)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="py-4 px-3 space-y-1">
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-100/50">
                            {t.ticket_number}
                          </span>
                          <h4 className="font-bold text-neutral-850 dark:text-neutral-200 line-clamp-1 max-w-[200px] mt-1">
                            {t.complaint.title}
                          </h4>
                          <p className="text-[10px] text-neutral-400">Filed: {formatDate(t.created_at)}</p>
                        </td>
                        <td className="py-4 px-3 space-y-1.5">
                          <p className="font-semibold text-neutral-700 dark:text-neutral-300">{t.category}</p>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
                            t.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                            t.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                            'bg-neutral-100 text-neutral-700'
                          }`}>
                            {t.severity}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-neutral-600 dark:text-neutral-400 max-w-[280px]">
                          <p className="line-clamp-2 leading-relaxed text-xs italic">
                            &ldquo;{t.complaint.metadata_json?.closure_reason || 'No justification submitted.'}&rdquo;
                          </p>
                          <span className="block text-[10px] text-neutral-400 mt-1 font-semibold">
                            👤 By: {t.complaint.reporter_name}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isL2Pending 
                              ? 'bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-400' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/45 dark:text-blue-400'
                          }`}>
                            {isL2Pending ? 'Level 2 Pending' : 'Level 1 Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <Link href={`/supervisor/tickets/${t.id}`}>
                            <Button size="sm" className="px-4 py-1.5 text-xs font-bold bg-amber-700 hover:bg-amber-850 text-white">
                              Review Case
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
