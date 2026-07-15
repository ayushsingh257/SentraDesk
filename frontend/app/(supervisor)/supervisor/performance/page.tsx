'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, AlertTriangle, RefreshCw, BarChart3, ShieldAlert, Award } from 'lucide-react'
import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card, Spinner } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'

interface ProductivityStats {
  officer_id: string
  officer_name: string
  active_count: number
  closed_count: number
  avg_resolution_hours: number
}

interface DashboardData {
  stats: {
    total_tickets: number
    pending_approvals: number
    active_investigations: number
  }
  officer_productivity: ProductivityStats[]
  district_distribution: Array<{ district: string; count: number }>
}

export default function SupervisorPerformance() {
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
      console.error('Failed to load performance telemetry:', err)
      setError('Unable to retrieve investigator productivity metrics. Please check server connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-amber-700" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="p-8 text-center border-danger/25 bg-danger/5 max-w-lg mx-auto mt-20">
        <AlertTriangle size={40} className="text-danger mx-auto mb-3" />
        <h3 className="text-base font-bold text-neutral-850 dark:text-neutral-200">Telemetry Offline</h3>
        <p className="text-xs text-neutral-500 mt-2">{error}</p>
        <Button onClick={loadData} className="mt-4 bg-amber-700 text-white">
          Retry Metrics Scan
        </Button>
      </Card>
    )
  }

  const { officer_productivity, district_distribution, stats } = data

  // Find most productive officer (highest closed count)
  const topPerformer = [...officer_productivity].sort((a, b) => b.closed_count - a.closed_count)[0]

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Team Workload & Telemetry
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Workload distribution heatmaps, average resolution time monitoring, and investigator performance indices.
          </p>
        </div>
        <Button onClick={loadData} size="sm" className="flex items-center gap-2 border-neutral-200 hover:bg-neutral-100">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Performance Data</span>
        </Button>
      </div>

      {/* Top Performer Highlights */}
      {topPerformer && topPerformer.closed_count > 0 && (
        <Card className="p-6 border border-amber-500/20 bg-amber-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 rounded-2xl">
              <Award size={32} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-amber-750 tracking-wider">Top Resolved Cases Performer</span>
              <h3 className="text-lg font-black text-neutral-850 dark:text-white mt-0.5">{topPerformer.officer_name}</h3>
              <p className="text-xs text-neutral-500 mt-1">Successfully resolved {topPerformer.closed_count} complaints with an average resolution speed of {topPerformer.avg_resolution_hours} hours.</p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-100 dark:border-neutral-800/80 shadow-sm">
            <span className="text-2xl font-black text-amber-700">{topPerformer.closed_count}</span>
            <span className="text-[10px] uppercase font-black text-neutral-450 tracking-wider">Resolved</span>
          </div>
        </Card>
      )}

      {/* Grid workload heatmap & distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Workload Heatmap List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
              <BarChart3 size={18} className="text-amber-700" />
              <h3 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider">Investigator Active Workloads</h3>
            </div>

            <div className="space-y-6">
              {officer_productivity.map((off) => {
                const total = off.active_count + off.closed_count
                const activePercentage = total > 0 ? (off.active_count / total) * 100 : 0
                
                return (
                  <div key={off.officer_id} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-neutral-850 dark:text-neutral-200">{off.officer_name}</span>
                        <span className="ml-2 text-[10px] font-black uppercase text-amber-700 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-100/50">
                          {off.active_count} Active
                        </span>
                      </div>
                      <span className="text-neutral-500 font-semibold">{off.closed_count} Resolved</span>
                    </div>

                    {/* Progress visual bar */}
                    <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          off.active_count > 6 ? 'bg-red-500' :
                          off.active_count > 3 ? 'bg-orange-500' :
                          'bg-amber-600'
                        }`}
                        style={{ width: `${activePercentage}%` }}
                      />
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${100 - activePercentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right Side: District Workload Summary */}
        <div className="space-y-6">
          <Card className="p-5 border border-neutral-200 dark:border-neutral-800 shadow-card">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
              <ShieldAlert size={18} className="text-violet-750" />
              <h3 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider">District Cases Concentration</h3>
            </div>
            
            <div className="space-y-4">
              {district_distribution.map((dist) => {
                const totalCases = stats.active_investigations
                const percentage = totalCases > 0 ? (dist.count / totalCases) * 100 : 0
                
                return (
                  <div key={dist.district} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-700 dark:text-neutral-350">{dist.district}</span>
                      <span className="font-semibold text-neutral-500">{dist.count} cases</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-violet-600 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

      </div>

    </div>
  )
}
