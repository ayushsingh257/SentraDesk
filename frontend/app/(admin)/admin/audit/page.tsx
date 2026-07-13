'use client'

import { useEffect, useState } from 'react'
import { History, ShieldCheck, AlertTriangle, FileDown, RefreshCw, Anchor, Play } from 'lucide-react'

import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, Alert, Spinner } from '@/components/ui/index'
import { formatDateTime } from '@/lib/utils'

interface AuditLogEntry {
  id: string
  action: string
  actor_id: string | null
  actor_role: string
  target_type: string
  target_id: string | null
  ip_address: string | null
  created_at: string
  current_hash: string | null
  previous_hash: string | null
  is_anchored: boolean
  anchored_tx_id: string | null
}

interface VerificationReport {
  success: boolean
  total_logs: number
  verified_records: number
  anomalies: any[]
  timestamp: string
}

export default function CryptographicAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [report, setReport] = useState<VerificationReport | null>(null)
  const unanchoredCount = logs.filter(l => !l.is_anchored).length
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadLogsAndReport = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const [logsRes, verifyRes] = await Promise.all([
        api.get('/api/v1/audit/logs'),
        api.get('/api/v1/audit/verify')
      ])
      if (logsRes.data?.success) setLogs(logsRes.data.data)
      if (verifyRes.data?.success) setReport(verifyRes.data.data)
    } catch (err) {
      console.error('Failed to load cryptographic logs:', err)
      setError('Unable to fetch blockchain audit chain metadata.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogsAndReport()
  }, [])

  // Anchor unanchored log batch to mock Hyperledger node
  const handleAnchorBatch = async () => {
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post('/api/v1/audit/anchor')
      if (res.data?.success) {
        setSuccess(res.data.data.message)
        loadLogsAndReport(true)
      }
    } catch (err) {
      console.error('Blockchain anchoring failure:', err)
      setError('Failed to anchor audit logs to Hyperledger network.')
    } finally {
      setActionLoading(false)
    }
  }

  // Export Cryptographic PDF Report
  const handleExportPDF = async () => {
    try {
      window.open('/api/v1/audit/export/pdf', '_blank')
    } catch (err) {
      console.error('PDF report compilation failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Security & Audit Ledger
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Immutable row-level hash chain signatures anchored into mock Hyperledger blockchain node.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto shrink-0">
          <Button 
            onClick={() => loadLogsAndReport()} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            <span>Verify Chain</span>
          </Button>

          {report && unanchoredCount > 0 && (
            <Button 
              onClick={handleAnchorBatch} 
              isLoading={actionLoading} 
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Anchor size={14} />
              <span>Anchor Batch</span>
            </Button>
          )}

          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1.5"
          >
            <FileDown size={14} />
            <span>Export PDF</span>
          </Button>
        </div>
      </div>

      {error && <Alert type="danger">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Integrity Verification summary card */}
      {report && (
        <Card className={`p-6 border ${
          report.success 
            ? 'border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/10' 
            : 'border-danger-100 dark:border-danger-950/40 bg-danger-50/10'
        } shadow-card`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              report.success ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40' : 'bg-danger-100 text-danger dark:bg-danger-900/40'
            }`}>
              {report.success ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div className="flex-1 text-xs">
              <h3 className="font-extrabold text-neutral-900 dark:text-white uppercase tracking-wide">
                Ledger Chain Integrity: {report.success ? 'Intact & Signed' : 'Gap/Alteration Detected'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 font-semibold text-neutral-600 dark:text-neutral-450">
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">Total Rows Verified</span>
                  <span className="font-bold text-sm block mt-0.5 text-neutral-850 dark:text-white">{report.verified_records}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">Merkle Unanchored</span>
                  <span className="font-bold text-sm block mt-0.5 text-neutral-850 dark:text-white">{unanchoredCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">Blockchain Anchor</span>
                  <span className="font-bold text-sm block mt-0.5 text-neutral-850 dark:text-white">Active</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">Gaps Detected</span>
                  <span className={`font-black text-sm block mt-0.5 ${(report.anomalies || []).length > 0 ? 'text-danger' : 'text-emerald-600'}`}>
                    {(report.anomalies || []).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Audit Logs Table */}
      {logs.length === 0 ? (
        <Card className="py-16 text-center space-y-3 border border-neutral-200 dark:border-neutral-800">
          <History size={40} className="text-neutral-350 dark:text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">Audit log empty</h3>
          <p className="text-xs text-neutral-450">No operations records or user logins logged yet.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden shadow-card border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-150 dark:border-neutral-800 text-neutral-450 font-extrabold uppercase">
                  <th className="px-5 py-4">Logged Operation</th>
                  <th className="px-5 py-4">Actor</th>
                  <th className="px-5 py-4">Hash Signature</th>
                  <th className="px-5 py-4">Blockchain Anchor ID</th>
                  <th className="px-5 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-150 dark:divide-neutral-800 text-neutral-750 dark:text-neutral-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-neutral-900 dark:text-white">{log.action}</div>
                      <div className="text-[10px] text-neutral-400 font-semibold mt-0.5">Target: {log.target_type} ({log.target_id || 'N/A'})</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold">{log.actor_role}</div>
                      <div className="text-[10px] text-neutral-450 mt-0.5">IP: {log.ip_address || '127.0.0.1'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[9px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 block w-40 truncate">
                        {log.current_hash || '—'}
                      </span>
                      <span className="font-mono text-[8px] text-neutral-400 block mt-0.5 w-40 truncate">
                        prev: {log.previous_hash || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {log.is_anchored ? (
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase">Anchored</span>
                          <span className="font-mono text-[8px] text-neutral-400 block max-w-[120px] truncate">{log.anchored_tx_id}</span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-800 text-[9px] font-black uppercase">Local Ledger Only</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-[10px] font-semibold text-neutral-450">
                      {formatDateTime(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </div>
  )
}
