'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ShieldAlert, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Inbox
} from 'lucide-react'

import { useAuth } from '@/components/providers/AuthProvider'
import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card, KPICard, Alert, Spinner } from '@/components/ui/index'
import { formatDate, getSeverityConfig, getStatusConfig } from '@/lib/utils'

interface DashboardStats {
  assigned: number
  open: number
  under_investigation: number
  pending: number
  closed: number
  avg_resolution: number
  sla_breached: number
}

interface Ticket {
  id: string
  ticket_number: string
  category: string
  severity: string
  sla_deadline: string | null
  complaint: {
    title: string
    status: string
    reporter_name: string
  }
}

export default function OfficerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [highPriority, setHighPriority] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setError(null)
        const res = await api.get('/api/v1/officer/dashboard')
        if (res.data?.success) {
          setStats(res.data.data.stats)
          setHighPriority(res.data.data.high_priority_tickets)
        }
      } catch (err: any) {
        console.error('Failed to load officer dashboard stats:', err)
        setError('Failed to fetch officer dashboard statistics. Ensure server connection is healthy.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'cyber_cell_officer': return 'Cyber Cell Officer'
      case 'investigator': return 'Investigator'
      case 'supervisor': return 'Supervisor'
      case 'system_administrator': return 'Administrator'
      default: return 'Officer'
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero */}
      <div className="bg-white dark:bg-neutral-850 rounded-2xl p-6 sm:p-8 shadow-card border border-neutral-100 dark:border-neutral-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Officer Console
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Logged in as <span className="font-bold text-neutral-800 dark:text-white">{user?.name}</span> ({getRoleLabel(user?.role || '')})
          </p>
        </div>
        <span className="px-3 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 text-xs font-bold rounded-full border border-primary-100 dark:border-primary-900/60 uppercase tracking-wider">
          {user?.role.replace('_', ' ')}
        </span>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            label="Total Assigned"
            value={stats.assigned}
            icon={<FileText className="w-5 h-5" />}
            accent="primary"
          />
          <KPICard
            label="Under Investigation"
            value={stats.under_investigation}
            icon={<Clock className="w-5 h-5" />}
            accent="warning"
          />
          <KPICard
            label="SLA Breached"
            value={stats.sla_breached}
            icon={<AlertTriangle className="w-5 h-5" />}
            accent="danger"
          />
          <KPICard
            label="Avg Resolution"
            value={`${stats.avg_resolution}h`}
            icon={<TrendingUp className="w-5 h-5" />}
            accent="success"
          />
        </div>
      )}

      {/* Main Section */}
      <div className="grid grid-cols-1 gap-8">
        {/* High Priority Queue */}
        <Card className="p-6 shadow-card border border-neutral-100 dark:border-neutral-700/60">
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-danger w-5 h-5" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">High Priority Action Queue</h2>
            </div>
            <Link 
              href="/officer/tickets" 
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors duration-200"
            >
              <span>View All Tickets</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {highPriority.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Inbox size={40} className="text-neutral-350 dark:text-neutral-600 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">No urgent items</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                No active complaints require immediate action or are approaching SLA breach threshold.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 font-bold uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-900/10">
                    <th className="py-3 px-6">Ticket No</th>
                    <th className="py-3 px-6">Complainant</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Severity</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">SLA Deadline</th>
                    <th className="py-3 px-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs">
                  {highPriority.map((ticket) => {
                    const statusCfg = getStatusConfig(ticket.complaint.status)
                    const sevCfg = getSeverityConfig(ticket.severity)
                    
                    return (
                      <tr 
                        key={ticket.id} 
                        className="hover:bg-neutral-50/40 dark:hover:bg-neutral-800/20 transition-colors duration-150"
                      >
                        <td className="py-4 px-6 font-bold text-neutral-850 dark:text-neutral-200">
                          {ticket.ticket_number}
                        </td>
                        <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300 font-medium">
                          {ticket.complaint.reporter_name}
                        </td>
                        <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400">
                          {ticket.category}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            ticket.severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/45 dark:text-red-400' :
                            ticket.severity === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/45 dark:text-orange-400' :
                            ticket.severity === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {ticket.severity}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ticket.complaint.status === 'New' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30' :
                            ticket.complaint.status === 'Under Investigation' ? 'bg-orange-50 text-orange-750 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-100/50 dark:border-orange-900/30' :
                            ticket.complaint.status === 'Waiting for Citizen' ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 border border-yellow-100/50 dark:border-yellow-900/30' :
                            ticket.complaint.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30' :
                            'bg-neutral-50 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}>
                            {ticket.complaint.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400">
                          {ticket.sla_deadline ? formatDate(ticket.sla_deadline) : 'No deadline'}
                        </td>
                        <td className="py-4 px-6">
                          <Link href={`/officer/tickets/${ticket.id}`}>
                            <button className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-primary-50 hover:text-primary-750 dark:hover:bg-primary-950/30 dark:hover:text-primary-400 rounded-md font-bold text-[11px] text-neutral-700 dark:text-neutral-300 transition-all duration-200">
                              Investigate
                            </button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
