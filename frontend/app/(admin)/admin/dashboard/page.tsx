'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  ShieldAlert, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Activity,
  Award,
  Sparkles,
  TrendingUp
} from 'lucide-react'

import api from '@/lib/api'
import { Card, Spinner, Alert, KPICard } from '@/components/ui/index'

interface Stats {
  total_citizens: number
  total_officers: number
  total_complaints: number
  open_complaints: number
  closed_complaints: number
  pending_approvals: number
  sla_breach_count: number
  active_investigations: number
  ai_processed_complaints: number
  total_notifications: number
  unread_notifications: number
}

interface CategoryDist {
  name: string
  value: number
}

interface OfficerWorkload {
  id: string
  name: string
  role: string
  assigned_tickets: number
  department: string
  jurisdiction: string
}

interface MonthlyGraph {
  month: string
  count: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [categoryDist, setCategoryDist] = useState<CategoryDist[]>([])
  const [officerWorkloads, setOfficerWorkloads] = useState<OfficerWorkload[]>([])
  const [monthlyGraph, setMonthlyGraph] = useState<MonthlyGraph[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await api.get('/api/v1/admin/dashboard')
        if (res.data?.success) {
          const { stats, category_distribution, officer_workloads, monthly_complaint_graph } = res.data.data
          setStats(stats)
          setCategoryDist(category_distribution)
          setOfficerWorkloads(officer_workloads)
          setMonthlyGraph(monthly_complaint_graph)
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err)
        setError('Failed to fetch administrative platform analytics.')
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

  if (error) {
    return <Alert type="danger">{error}</Alert>
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'cyber_cell_officer': return 'Cyber Cell Officer'
      case 'investigator': return 'Investigator'
      case 'supervisor': return 'Supervisor'
      case 'system_administrator': return 'Admin'
      default: return 'Officer'
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Governance Command Console
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Real-time analytics, user audits, and security metrics for CCGP operations.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            label="Registered Citizens"
            value={stats.total_citizens}
            icon={<Users className="w-5 h-5" />}
            accent="primary"
          />
          <KPICard
            label="Active Officers"
            value={stats.total_officers}
            icon={<ShieldAlert className="w-5 h-5" />}
            accent="success"
          />
          <KPICard
            label="Pending Approvals"
            value={stats.pending_approvals}
            icon={<Activity className="w-5 h-5" />}
            accent="warning"
          />
          <KPICard
            label="SLA Breach Count"
            value={stats.sla_breach_count}
            icon={<AlertTriangle className="w-5 h-5" />}
            accent="danger"
          />
        </div>
      )}

      {/* Second Row KPIs */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-neutral-850 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-700/60 shadow-card flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">AI Processed</span>
              <span className="text-lg font-black text-neutral-900 dark:text-white mt-1 block">{stats.ai_processed_complaints}</span>
            </div>
            <span className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Sparkles size={20} />
            </span>
          </div>

          <div className="bg-white dark:bg-neutral-850 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-700/60 shadow-card flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Active Enquiries</span>
              <span className="text-lg font-black text-neutral-900 dark:text-white mt-1 block">{stats.active_investigations}</span>
            </div>
            <span className="p-2.5 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-xl">
              <TrendingUp size={20} />
            </span>
          </div>

          <div className="bg-white dark:bg-neutral-850 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-700/60 shadow-card flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Closed Complaints</span>
              <span className="text-lg font-black text-neutral-900 dark:text-white mt-1 block">{stats.closed_complaints}</span>
            </div>
            <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle size={20} />
            </span>
          </div>

          <div className="bg-white dark:bg-neutral-850 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-700/60 shadow-card flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Total Complaints</span>
              <span className="text-lg font-black text-neutral-900 dark:text-white mt-1 block">{stats.total_complaints}</span>
            </div>
            <span className="p-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-xl">
              <FileText size={20} />
            </span>
          </div>
        </div>
      )}

      {/* Main Charts & Workloads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Trends & Categories */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Monthly Intake Trends Bar Chart */}
          <Card className="p-6 space-y-6 shadow-card border border-neutral-100 dark:border-neutral-700/60">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Monthly Incident Intake Trends</h3>
              <p className="text-[11px] text-neutral-400 mt-1">Total incoming cases tracked monthly across the system.</p>
            </div>

            <div className="h-64 flex items-end gap-3 sm:gap-6 pt-6 border-b border-neutral-100 dark:border-neutral-800">
              {monthlyGraph.map((item, idx) => {
                const maxVal = Math.max(...monthlyGraph.map(m => m.count), 1)
                const pct = (item.count / maxVal) * 100
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1.5">
                      {item.count}
                    </span>
                    <div 
                      className="w-full bg-primary-100 dark:bg-primary-950/30 hover:bg-primary-600 dark:hover:bg-primary-500 rounded-t-lg transition-all duration-300"
                      style={{ height: `${Math.max(pct, 5)}%` }}
                    />
                    <span className="text-[10px] text-neutral-500 font-bold mt-2 pb-1.5">{item.month}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Category Distribution list */}
          <Card className="p-6 space-y-4 shadow-card border border-neutral-100 dark:border-neutral-700/60">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Intake by Incident Category</h3>
              <p className="text-[11px] text-neutral-400 mt-1">Category breakdown for all logged ticket records.</p>
            </div>

            {categoryDist.length === 0 ? (
              <p className="text-xs text-neutral-450 py-4 text-center">No categories recorded yet.</p>
            ) : (
              <div className="space-y-3.5">
                {categoryDist.map((item, idx) => {
                  const maxVal = Math.max(...categoryDist.map(c => c.value), 1)
                  const pct = (item.value / maxVal) * 100
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-neutral-755 dark:text-neutral-305">
                        <span>{item.name || 'Unclassified'}</span>
                        <span>{item.value} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-50 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

        </div>

        {/* Right Side: Officer Workloads */}
        <div className="space-y-8">
          <Card className="p-6 space-y-4 shadow-card border border-neutral-100 dark:border-neutral-700/60 h-full">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white font-black">Officer Workload Allocation</h3>
              <p className="text-[11px] text-neutral-400 mt-1">Workload tracking per active cyber investigator.</p>
            </div>

            {officerWorkloads.length === 0 ? (
              <p className="text-xs text-neutral-450 py-4 text-center">No active officers registered.</p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {officerWorkloads.map((officer) => (
                  <div key={officer.id} className="py-4 first:pt-0 last:pb-0 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-white block">{officer.name}</span>
                        <span className="text-[10px] text-neutral-450 font-bold block mt-0.5">{getRoleLabel(officer.role)}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary-50 text-primary-700 dark:bg-primary-950/20 dark:text-primary-400">
                        {officer.assigned_tickets} cases
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 font-semibold">
                      <span>Unit: {officer.department}</span>
                      <span>{officer.jurisdiction}</span>
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
