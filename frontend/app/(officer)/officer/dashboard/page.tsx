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
  Inbox,
  Bell,
  Zap,
  Users,
  Activity,
  RefreshCw,
  ChevronRight,
  Timer
} from 'lucide-react'

import { useAuth } from '@/components/providers/AuthProvider'
import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card, Alert, Spinner } from '@/components/ui/index'
import { formatDate } from '@/lib/utils'

interface DashboardStats {
  assigned: number
  open: number
  under_investigation: number
  pending: number
  closed: number
  avg_resolution: number
  sla_breached: number
  new_assignments: number
  pending_closures: number
  sla_approaching: number
}

interface Ticket {
  id: string
  ticket_number: string
  category: string
  severity: string
  sla_deadline: string | null
  created_at: string
  updated_at: string
  complaint: {
    title: string
    status: string
    reporter_name: string
  }
}

interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900/40',
    High: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border border-orange-200 dark:border-orange-900/40',
    Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40',
    Low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${map[severity] || map.Low}`}>
      {severity}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'New': 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30',
    'Assigned': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30',
    'Under Investigation': 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30',
    'Waiting for Citizen': 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30',
    'Closure Requested': 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30',
    'Closed': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30',
    'Resolved': 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-100 dark:border-green-900/30',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${map[status] || 'bg-neutral-50 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}`}>
      {status}
    </span>
  )
}

export default function OfficerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [highPriority, setHighPriority] = useState<Ticket[]>([])
  const [recentlyUpdated, setRecentlyUpdated] = useState<Ticket[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  async function loadDashboardData() {
    try {
      setError(null)
      const [dashRes, notifRes] = await Promise.allSettled([
        api.get('/api/v1/officer/dashboard'),
        api.get('/api/v1/users/notifications')
      ])

      if (dashRes.status === 'fulfilled' && dashRes.value.data?.success) {
        setStats(dashRes.value.data.data.stats)
        setHighPriority(dashRes.value.data.data.high_priority_tickets || [])
        setRecentlyUpdated(dashRes.value.data.data.recently_updated_tickets || [])
      }
      if (notifRes.status === 'fulfilled' && notifRes.value.data?.success) {
        setNotifications(notifRes.value.data.data.slice(0, 6))
      }
      setLastRefreshed(new Date())
    } catch (err: any) {
      console.error('Failed to load officer dashboard stats:', err)
      setError('Failed to fetch officer dashboard data. Check server connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'cyber_cell_officer': return 'Cyber Cell Officer'
      case 'investigator': return 'Investigator'
      case 'supervisor': return 'Supervisor'
      case 'system_administrator': return 'Administrator'
      default: return 'Officer'
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  const kpis = stats ? [
    {
      label: 'Total Assigned',
      value: stats.assigned,
      icon: <FileText className="w-5 h-5" />,
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-950/40',
      border: 'border-primary-100 dark:border-primary-900/30',
    },
    {
      label: 'Active / Open',
      value: stats.open,
      icon: <Activity className="w-5 h-5" />,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-100 dark:border-blue-900/30',
    },
    {
      label: 'New Assignments',
      value: stats.new_assignments,
      icon: <Zap className="w-5 h-5" />,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-100 dark:border-indigo-900/30',
    },
    {
      label: 'Under Investigation',
      value: stats.under_investigation,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/30',
    },
    {
      label: 'Pending Closure',
      value: stats.pending_closures,
      icon: <Users className="w-5 h-5" />,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      border: 'border-violet-100 dark:border-violet-900/30',
    },
    {
      label: 'SLA Approaching',
      value: stats.sla_approaching,
      icon: <Timer className="w-5 h-5" />,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      border: 'border-orange-100 dark:border-orange-900/30',
    },
    {
      label: 'SLA Breached',
      value: stats.sla_breached,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-100 dark:border-red-900/30',
    },
    {
      label: 'Resolved Cases',
      value: stats.closed,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-100 dark:border-emerald-900/30',
    },
  ] : []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 dark:from-primary-800 dark:to-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-primary-600/30 dark:border-primary-700/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Investigation Console
          </h1>
          <p className="mt-1 text-sm text-primary-200">
            Welcome back, <span className="font-bold text-white">{user?.name}</span> — {getRoleLabel(user?.role || '')}
          </p>
          <p className="mt-0.5 text-xs text-primary-300">
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setLoading(true); loadDashboardData() }}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-semibold transition-all duration-200"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <Link href="/officer/tickets">
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-primary-700 rounded-xl text-sm font-bold hover:bg-primary-50 transition-all duration-200 shadow">
              <FileText size={14} />
              All Cases
            </button>
          </Link>
        </div>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* KPI Cards Grid — 4 columns */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className={`rounded-xl border ${kpi.border} ${kpi.bg} p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-all duration-200`}
            >
              <div className={`flex items-center justify-between`}>
                <span className={`text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider`}>
                  {kpi.label}
                </span>
                <span className={kpi.color}>{kpi.icon}</span>
              </div>
              <p className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Avg Resolution Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 rounded-xl border border-teal-100 dark:border-teal-900/30 bg-teal-50 dark:bg-teal-950/30 p-4 flex items-center gap-4 shadow-sm">
            <TrendingUp className="w-8 h-8 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Avg. Resolution Time</p>
              <p className="text-2xl font-black text-teal-700 dark:text-teal-300">{stats.avg_resolution}h</p>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">Across all resolved cases</p>
            </div>
          </div>
          <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex items-center gap-4 shadow-sm">
            <Bell className="w-8 h-8 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Notifications</p>
              <p className="text-2xl font-black text-neutral-800 dark:text-white">
                {notifications.filter(n => !n.is_read).length}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">Unread alerts</p>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* High Priority Queue — 2/3 width */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="p-0 shadow-card border border-neutral-100 dark:border-neutral-700/60 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="text-red-500 w-5 h-5" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">High Priority Action Queue</h2>
              </div>
              <Link
                href="/officer/tickets"
                className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 transition-colors duration-200"
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {highPriority.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Inbox size={36} className="text-neutral-300 dark:text-neutral-600 mx-auto" />
                <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">No urgent cases</h3>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  All active complaints are within SLA and no immediate action is required.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider bg-neutral-50/70 dark:bg-neutral-800/30">
                      <th className="py-3 px-5">Ticket No</th>
                      <th className="py-3 px-5">Complainant</th>
                      <th className="py-3 px-5">Category</th>
                      <th className="py-3 px-5">Severity</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5">SLA</th>
                      <th className="py-3 px-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs">
                    {highPriority.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors duration-150"
                      >
                        <td className="py-3.5 px-5 font-bold text-neutral-800 dark:text-neutral-200 font-mono text-[11px]">
                          {ticket.ticket_number}
                        </td>
                        <td className="py-3.5 px-5 text-neutral-700 dark:text-neutral-300 font-medium">
                          {ticket.complaint.reporter_name}
                        </td>
                        <td className="py-3.5 px-5 text-neutral-500 dark:text-neutral-400 max-w-[100px] truncate">
                          {ticket.category}
                        </td>
                        <td className="py-3.5 px-5">
                          <SeverityBadge severity={ticket.severity} />
                        </td>
                        <td className="py-3.5 px-5">
                          <StatusBadge status={ticket.complaint.status} />
                        </td>
                        <td className="py-3.5 px-5 text-neutral-500 dark:text-neutral-400 text-[10px]">
                          {ticket.sla_deadline ? formatDate(ticket.sla_deadline) : 'No deadline'}
                        </td>
                        <td className="py-3.5 px-5">
                          <Link href={`/officer/tickets/${ticket.id}`}>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-[10px] transition-all duration-200 shadow-sm">
                              Investigate
                              <ChevronRight size={10} />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Recently Updated Cases */}
          <Card className="p-0 shadow-card border border-neutral-100 dark:border-neutral-700/60 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <Clock className="text-blue-500 w-5 h-5" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Recently Updated Cases</h2>
              </div>
            </div>
            {recentlyUpdated.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs text-neutral-400">No recent activity found.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {recentlyUpdated.map((ticket) => (
                  <Link key={ticket.id} href={`/officer/tickets/${ticket.id}`}>
                    <div className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-mono">{ticket.ticket_number}</p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">{ticket.complaint.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <SeverityBadge severity={ticket.severity} />
                        <StatusBadge status={ticket.complaint.status} />
                        <ChevronRight size={12} className="text-neutral-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Notifications Feed */}
        <div>
          <Card className="p-0 shadow-card border border-neutral-100 dark:border-neutral-700/60 overflow-hidden h-full">
            <div className="flex justify-between items-center p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <Bell className="text-amber-500 w-4 h-4" />
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Recent Alerts</h2>
              </div>
              <Link href="/officer/notifications">
                <span className="text-xs text-primary-600 dark:text-primary-400 font-bold hover:underline">View All</span>
              </Link>
            </div>
            {notifications.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Bell size={32} className="text-neutral-300 dark:text-neutral-600 mx-auto" />
                <p className="text-xs text-neutral-400">No notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 transition-colors ${n.is_read ? 'opacity-70' : 'bg-amber-50/30 dark:bg-amber-950/10'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${n.is_read ? 'bg-neutral-300 dark:bg-neutral-600' : 'bg-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{n.title}</p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">{formatDate(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
