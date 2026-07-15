'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  Users, 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  PieChart, 
  MapPin, 
  Briefcase,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card, Spinner } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

interface DashboardData {
  stats: {
    pending_approvals: int
    active_investigations: int
    sla_breached: int
    sla_approaching: int
    escalated_count: int
    total_tickets: int
    avg_resolution_hours: float
    resolution_rate: float
  }
  category_distribution: Array<{ category: string; count: number }>
  district_distribution: Array<{ district: string; count: number }>
  trends: Array<{ date: string; count: number }>
  officer_productivity: Array<{
    officer_id: string
    officer_name: string
    active_count: number
    closed_count: number
    avg_resolution_hours: number
  }>
  recent_activities: Array<{
    id: string
    ticket_number: string
    event_type: string
    description: string
    created_at: string
  }>
  escalated_tickets_list: Array<{
    id: string
    ticket_number: string
    category: string
    severity: string
    created_at: string
    complaint: { title: string }
  }>
}

export default function SupervisorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(API_ROUTES.supervisorDashboard)
      if (res.data?.success) {
        setData(res.data.data)
      }
    } catch (err: any) {
      console.error('Failed to load supervisor dashboard data:', err)
      setError('Unable to load dashboard telemetry. Please verify server connections.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner size="lg" className="text-amber-700" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="p-8 text-center border-danger/25 bg-danger/5 max-w-lg mx-auto mt-20">
        <AlertTriangle size={40} className="text-danger mx-auto mb-3" />
        <h3 className="text-base font-bold text-neutral-850 dark:text-neutral-200">System Telemetry Offline</h3>
        <p className="text-xs text-neutral-500 mt-2">{error}</p>
        <Button onClick={loadData} className="mt-4 bg-amber-700 hover:bg-amber-800 text-white">
          Retry Metrics Scan
        </Button>
      </Card>
    )
  }

  const { stats, category_distribution, district_distribution, trends, officer_productivity, recent_activities, escalated_tickets_list } = data

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Supervisor Governance Hub
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Real-time operations center monitoring system SLAs, queue approvals, and investigator performance.
          </p>
        </div>
      </div>

      {/* Analytics KPI Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card flex items-center gap-4 hover:border-amber-500/30 transition-all">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl">
            <CheckSquare size={22} />
          </div>
          <div>
            <p className="text-xs text-neutral-450 dark:text-neutral-450 uppercase font-black tracking-wider">Pending Approvals</p>
            <h3 className="text-2xl font-black text-neutral-800 dark:text-white mt-1">{stats.pending_approvals}</h3>
            <Link href="/supervisor/approvals" className="text-[11px] text-amber-700 hover:underline mt-1 block">Review queue →</Link>
          </div>
        </Card>

        <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card flex items-center gap-4 hover:border-violet-500/30 transition-all">
          <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-750 dark:text-violet-400 rounded-xl">
            <Briefcase size={22} />
          </div>
          <div>
            <p className="text-xs text-neutral-450 dark:text-neutral-450 uppercase font-black tracking-wider">Active Cases</p>
            <h3 className="text-2xl font-black text-neutral-800 dark:text-white mt-1">{stats.active_investigations}</h3>
            <Link href="/supervisor/tickets" className="text-[11px] text-violet-700 hover:underline mt-1 block">View all cases →</Link>
          </div>
        </Card>

        <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card flex items-center gap-4 hover:border-red-500/30 transition-all">
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs text-neutral-450 dark:text-neutral-450 uppercase font-black tracking-wider">SLA Breached</p>
            <h3 className="text-2xl font-black text-neutral-800 dark:text-white mt-1">{stats.sla_breached}</h3>
            <Link href="/supervisor/sla" className="text-[11px] text-red-700 hover:underline mt-1 block">Monitor deadlines →</Link>
          </div>
        </Card>

        <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card flex items-center gap-4 hover:border-emerald-500/30 transition-all">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs text-neutral-450 dark:text-neutral-450 uppercase font-black tracking-wider">Resolution Rate</p>
            <h3 className="text-2xl font-black text-neutral-800 dark:text-white mt-1">{stats.resolution_rate}%</h3>
            <p className="text-[10px] text-neutral-400 mt-1">Avg resolved: {stats.avg_resolution_hours} hrs</p>
          </div>
        </Card>
      </div>

      {/* Main Analytics Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Distribution & Trends */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Trends and Complaint Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category breakdown widget */}
            <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card">
              <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
                <PieChart size={18} className="text-amber-700" />
                <h3 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider">Category distribution</h3>
              </div>
              <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                {category_distribution.slice(0, 8).map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-350">
                      <span>{cat.category}</span>
                      <span className="font-bold">{cat.count} cases</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-600 rounded-full" 
                        style={{ width: `${Math.min(100, (cat.count / Math.max(1, stats.total_tickets)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* District breakdown widget */}
            <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card">
              <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
                <MapPin size={18} className="text-violet-750" />
                <h3 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider">District operations</h3>
              </div>
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {district_distribution.slice(0, 8).map((dist) => (
                  <div key={dist.district} className="flex justify-between items-center text-xs py-1.5 border-b border-neutral-50 dark:border-neutral-800/40">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-350 truncate max-w-[180px]">{dist.district}</span>
                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-black text-[10px] text-neutral-700 dark:text-neutral-350">{dist.count} cases</span>
                  </div>
                ))}
              </div>
            </Card>

          </div>

          {/* Productivity Board */}
          <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
              <Users size={18} className="text-primary-700" />
              <h3 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider">Team workload & productivity</h3>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-450 uppercase font-black tracking-wider pb-2">
                    <th className="pb-3 font-black">Officer Name</th>
                    <th className="pb-3 font-black text-center">Active Cases</th>
                    <th className="pb-3 font-black text-center">Resolved Cases</th>
                    <th className="pb-3 font-black text-right">Avg Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                  {officer_productivity.map((off) => (
                    <tr key={off.officer_id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-850/20">
                      <td className="py-3 font-bold text-neutral-800 dark:text-neutral-200">{off.officer_name}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          off.active_count > 5 ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-750'
                        }`}>
                          {off.active_count}
                        </span>
                      </td>
                      <td className="py-3 text-center text-neutral-600 dark:text-neutral-400 font-bold">{off.closed_count}</td>
                      <td className="py-3 text-right text-neutral-500 dark:text-neutral-400 font-bold">
                        {off.avg_resolution_hours > 0 ? `${off.avg_resolution_hours} hrs` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

        </div>

        {/* Right Side: Escalations & Activity */}
        <div className="space-y-6">
          
          {/* Urgent Escalations Panel */}
          <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card bg-red-950/5 border-red-500/10">
            <div className="flex items-center justify-between border-b border-red-500/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-650" />
                <h3 className="text-xs font-black text-red-950 dark:text-red-400 uppercase tracking-widest">Escalated cases</h3>
              </div>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded">{stats.escalated_count}</span>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {escalated_tickets_list.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-450 dark:text-neutral-500 font-semibold">
                  No escalated complaints currently flagged.
                </div>
              ) : (
                escalated_tickets_list.map((ticket) => (
                  <Link 
                    key={ticket.id} 
                    href={`/supervisor/tickets/${ticket.id}`}
                    className="block p-3 rounded-xl border border-neutral-150 dark:border-neutral-800/80 bg-white dark:bg-neutral-850 hover:border-red-500/30 transition-all group"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-black text-neutral-500 group-hover:text-amber-700 transition-colors">
                        {ticket.ticket_number}
                      </span>
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-800 text-[9px] font-black rounded uppercase">
                        {ticket.severity}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 line-clamp-1 mt-1.5">
                      {ticket.complaint.title}
                    </h4>
                    <p className="text-[10px] text-neutral-450 mt-1">Category: {ticket.category}</p>
                  </Link>
                ))
              )}
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
              <ShieldCheck size={18} className="text-amber-700" />
              <h3 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider">System Activity Feed</h3>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {recent_activities.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-450 dark:text-neutral-500 font-semibold">
                  No recent operational activities log.
                </div>
              ) : (
                recent_activities.map((act) => (
                  <div key={act.id} className="text-xs relative pl-4 border-l border-neutral-200 dark:border-neutral-800 pb-2">
                    <div className="absolute w-2 h-2 rounded-full bg-amber-600 -left-1 top-1" />
                    <div className="flex justify-between text-[10px] text-neutral-450">
                      <span className="font-bold uppercase text-amber-750">{act.event_type}</span>
                      <span>{formatDate(act.created_at)}</span>
                    </div>
                    <p className="font-semibold text-neutral-700 dark:text-neutral-350 mt-1">
                      {act.description} (<span className="font-bold text-neutral-500">{act.ticket_number}</span>)
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>

      </div>

    </div>
  )
}
