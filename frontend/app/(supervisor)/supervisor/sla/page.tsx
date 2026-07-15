'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, RefreshCw, ChevronRight, CheckCircle2 } from 'lucide-react'
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
  sla_deadline: string | null
  is_escalated: boolean
  created_at: string
  complaint: {
    title: string
    status: string
    reporter_name: string
  }
}

export default function SupervisorSLA() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSLATickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(API_ROUTES.tickets, { params: { sla_breached: true } })
      if (res.data?.success) {
        setTickets(res.data.data)
      }
    } catch (err: any) {
      console.error('Failed to load SLA breached tickets:', err)
      setError('Unable to fetch SLA telemetry queue. Please check server connections.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSLATickets()
  }, [fetchSLATickets])

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            SLA Escalations Center
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Monitor complaints exceeding standard resolution deadlines. Escalate priority or assign senior investigators.
          </p>
        </div>
        <Button onClick={fetchSLATickets} size="sm" className="flex items-center gap-2 border-neutral-200 hover:bg-neutral-100">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh SLA Queue</span>
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Spinner size="lg" className="text-amber-700" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center border-danger/25 bg-danger/5">
          <AlertTriangle size={32} className="text-danger mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-250">Load Failure</h3>
          <p className="text-xs text-neutral-500 mt-1">{error}</p>
          <Button onClick={fetchSLATickets} size="sm" className="mt-4 bg-amber-700 text-white">
            Retry Connection
          </Button>
        </Card>
      ) : tickets.length === 0 ? (
        <Card className="py-20 text-center space-y-4 shadow-card border border-neutral-200 dark:border-neutral-800">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">No SLA Breaches Found</h3>
            <p className="text-xs text-neutral-450 max-w-xs mx-auto">
              Outstanding! All active cybercrime complaints are currently within their designated SLA resolution window.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-500/10 rounded-xl text-xs text-red-800 dark:text-red-400 font-semibold flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>Attention: There are {tickets.length} active complaints currently exceeding designated SLA resolution deadlines.</span>
          </div>

          <Card className="border border-neutral-200/80 dark:border-neutral-800 shadow-card overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-150 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/20 text-neutral-450 uppercase font-black tracking-wider">
                    <th className="py-4 px-5 font-black">Ticket Reference</th>
                    <th className="py-4 px-3 font-black">Complaint Title</th>
                    <th className="py-4 px-3 font-black">Category</th>
                    <th className="py-4 px-3 font-black">SLA Deadline</th>
                    <th className="py-4 px-3 font-black text-center">Status</th>
                    <th className="py-4 px-5 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-850/10">
                      <td className="py-4 px-5 space-y-1">
                        <span className="text-[10px] font-black uppercase text-red-800 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100/50">
                          {t.ticket_number}
                        </span>
                        {t.is_escalated && (
                          <span className="block text-[8px] font-black text-amber-700 uppercase tracking-widest mt-1">
                            ⚠️ Escalated
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-3 font-bold text-neutral-850 dark:text-neutral-200 max-w-[200px]">
                        {t.complaint.title}
                      </td>
                      <td className="py-4 px-3 font-semibold text-neutral-700 dark:text-neutral-350">
                        {t.category}
                      </td>
                      <td className="py-4 px-3 text-red-650 font-bold space-y-1">
                        <p className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>Breached</span>
                        </p>
                        <p className="text-[10px] text-neutral-400">Deadline: {t.sla_deadline ? formatDate(t.sla_deadline) : 'N/A'}</p>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold rounded">
                          {t.complaint.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link href={`/supervisor/tickets/${t.id}`}>
                          <Button size="sm" className="bg-amber-700 hover:bg-amber-850 text-white font-bold text-xs flex items-center gap-1 ml-auto">
                            <span>Manage Case</span>
                            <ChevronRight size={12} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
