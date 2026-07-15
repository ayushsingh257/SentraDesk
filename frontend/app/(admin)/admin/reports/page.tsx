'use client'

import { useEffect, useState } from 'react'
import { FileText, FileDown, RefreshCw, BarChart2, Award } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, Alert, Spinner } from '@/components/ui/index'

interface ComplianceStats {
  sla_compliance_rate: number
  average_resolution_hours: number
  ai_duplication_detected: number
  total_threat_intel_scans: number
  intake_trend: Array<{ name: string; tickets: number }>
}

export default function ReportsEngine() {
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadComplianceStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/v1/admin/reports/compliance')
      if (res.data?.success) {
        setStats(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load compliance report data:', err)
      setError('Unable to compile system compliance summaries.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComplianceStats()
  }, [])

  const triggerExport = (reportType: string, format: string) => {
    // Open CSV compliance downloader endpoint
    if (format === 'csv') {
      window.open('/api/v1/admin/reports/export/csv', '_blank')
    } else {
      // Mock PDF export downloader endpoint
      window.open('/api/v1/audit/export/pdf', '_blank')
    }
  }

  const reportsList = [
    { key: 'complaints', name: 'Complaint Lifecycle Report', desc: 'Case categorizations, severity, and status changes overview.' },
    { key: 'officer', name: 'Officer Workloads & Productivity', desc: 'Investigator load capacities, closure speed and open tickets ratios.' },
    { key: 'supervisor', name: 'Supervisor Decisions Audit', desc: 'L1/L2 approval counts, average case closure approvals time.' },
    { key: 'ai', name: 'AI NLP Classifier Analytics', desc: 'Confidence scoring profiles, duplicates detected matches.' },
    { key: 'threat', name: 'Threat Intelligence Reputational scans', desc: 'Total VT / AbuseIPDB scanner integrations lookups.' },
    { key: 'sla', name: 'SLA Compliances & Deadline breaches', desc: 'Deadlines breach counts, critical severity response intervals.' }
  ]

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-xs font-bold">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Compliance & Reports Engine
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Generate and export official performance digests, monthly complaint stats, and SLA audits to PDF or CSV formats.
          </p>
        </div>

        <Button onClick={loadComplianceStats} variant="outline" className="flex items-center gap-2">
          <RefreshCw size={14} />
          <span>Refresh stats</span>
        </Button>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">SLA Compliance Rate</div>
            <div className="text-xl font-black text-neutral-900 dark:text-white mt-1">{stats.sla_compliance_rate}%</div>
          </Card>
          <Card className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Avg Resolution Time</div>
            <div className="text-xl font-black text-neutral-900 dark:text-white mt-1">{stats.average_resolution_hours} hrs</div>
          </Card>
          <Card className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Duplications Flagged</div>
            <div className="text-xl font-black text-neutral-900 dark:text-white mt-1">{stats.ai_duplication_detected} matches</div>
          </Card>
          <Card className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Reputational Scans</div>
            <div className="text-xl font-black text-neutral-900 dark:text-white mt-1">{stats.total_threat_intel_scans} lookups</div>
          </Card>
        </div>
      )}

      {/* Reports Generation list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <BarChart2 className="text-primary-600 w-4 h-4" />
            <span>Generate Executive Reports</span>
          </h2>

          <div className="space-y-4">
            {reportsList.map(r => (
              <div key={r.key} className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0 last:pb-0">
                <div className="flex-1 pr-4">
                  <div className="font-extrabold text-neutral-800 dark:text-neutral-200">{r.name}</div>
                  <div className="text-[10px] text-neutral-450 mt-0.5">{r.desc}</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => triggerExport(r.key, 'pdf')} size="sm" variant="outline" className="flex items-center gap-1 p-2">
                    <FileDown size={12} />
                    <span>PDF</span>
                  </Button>
                  <Button onClick={() => triggerExport(r.key, 'csv')} size="sm" variant="outline" className="flex items-center gap-1 p-2">
                    <FileDown size={12} />
                    <span>CSV</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Mock Intake charts */}
        <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <Award className="text-primary-600 w-4 h-4" />
            <span>Monthly Intake Compliance Level</span>
          </h2>

          <div className="flex items-end justify-between h-[200px] pt-4 px-2">
            {stats?.intake_trend.map(t => {
              const pct = (t.tickets / 40) * 100
              return (
                <div key={t.name} className="flex flex-col items-center gap-2 w-10">
                  <div 
                    className="w-8 bg-primary-600 rounded-t-md transition-all duration-500" 
                    style={{ height: `${Math.max(pct, 5)}%` }}
                  />
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">{t.name}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

    </div>
  )
}
