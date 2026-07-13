'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  HelpCircle, 
  ArrowRight,
  PlusCircle,
  Bell
} from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, KPICard, Alert, Spinner, EmptyState } from '@/components/ui/index'

interface Stats {
  total_cases: number
  open_cases: number
  closed_cases: number
  pending_followups: number
  avg_resolution_time_hours: number
}

interface InAppNotification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

interface Ticket {
  id: string
  ticket_number: string
  category: string
  severity: string
  complaint: {
    title: string
    status: string
    created_at: string
  }
}

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setError(null)
        const [statsRes, notifRes, ticketsRes] = await Promise.all([
          api.get(API_ROUTES.myStats),
          api.get(API_ROUTES.notifications),
          api.get(API_ROUTES.myTickets)
        ])

        if (statsRes.data?.success) {
          setStats(statsRes.data.data)
        }
        if (notifRes.data?.success) {
          setNotifications(notifRes.data.data.slice(0, 5))
        }
        if (ticketsRes.data?.success) {
          setRecentTickets(ticketsRes.data.data.slice(0, 5))
        }
      } catch (err: any) {
        console.error('Failed to load citizen dashboard data:', err)
        setError('Unable to retrieve dashboard parameters. Please check server connections.')
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 shadow-card border border-neutral-100 dark:border-neutral-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Welcome, {user?.name || 'Citizen'}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
            Securely report cyber incidents, monitor case progress, and communicate with investigating officers.
          </p>
        </div>
        <Link href="/citizen/complaints/new">
          <button className="btn btn-primary flex items-center gap-2 shadow-sm shrink-0">
            <PlusCircle size={18} />
            <span>File New Complaint</span>
          </button>
        </Link>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* Stats KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          label="Active Complaints"
          value={stats?.open_cases ?? 0}
          accent="primary"
          icon={<Clock className="text-primary-600 dark:text-primary-400" size={24} />}
        />
        <KPICard
          label="Pending Actions"
          value={stats?.pending_followups ?? 0}
          accent="warning"
          icon={<HelpCircle className="text-warning" size={24} />}
        />
        <KPICard
          label="Resolved Complaints"
          value={stats?.closed_cases ?? 0}
          accent="success"
          icon={<CheckCircle className="text-success" size={24} />}
        />
        <KPICard
          label="Total Registered"
          value={stats?.total_cases ?? 0}
          accent="neutral"
          icon={<FileText className="text-neutral-600 dark:text-neutral-400" size={24} />}
        />
      </div>

      {/* Main Grid: Tickets and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Tickets Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Recent Case Activity</h2>
            <Link 
              href="/citizen/tickets" 
              className="text-xs font-semibold text-primary-600 hover:text-primary-500 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <Card className="p-0 overflow-hidden border border-neutral-100 dark:border-neutral-700/60 shadow-card">
            {recentTickets.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="No complaints filed yet"
                  description="If you have been a victim of cyber crime, click the button above to file a complaint."
                />
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {recentTickets.map((ticket) => (
                  <Link 
                    key={ticket.id} 
                    href={`/citizen/tickets/${ticket.id}`}
                    className="block p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded">
                            {ticket.ticket_number}
                          </span>
                          <span className="text-xs font-medium text-neutral-400">
                            {new Date(ticket.complaint.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-1.5 line-clamp-1">
                          {ticket.complaint.title}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Category: {ticket.category} | Severity: <span className="font-semibold">{ticket.severity}</span>
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        ticket.complaint.status === 'Closed'
                          ? 'bg-success/10 border-success/30 text-success'
                          : ticket.complaint.status === 'Pending Response'
                          ? 'bg-warning/10 border-warning/30 text-warning animate-pulse'
                          : 'bg-primary-50 border-primary-200 dark:bg-primary-950/40 dark:border-primary-900 text-primary-700 dark:text-primary-400'
                      }`}>
                        {ticket.complaint.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Notifications Pane */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Recent Alerts</h2>
            <Link 
              href="/citizen/notifications" 
              className="text-xs font-semibold text-primary-600 hover:text-primary-500 flex items-center gap-1"
            >
              <span>Inbox</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <Card className="p-0 overflow-hidden border border-neutral-100 dark:border-neutral-700/60 shadow-card">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <Bell size={32} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">No recent notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 transition-colors duration-200 ${
                      !notif.is_read ? 'bg-primary-50/30 dark:bg-primary-950/10' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        !notif.is_read ? 'bg-primary-600' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white">
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
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
