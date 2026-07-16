'use client'

import { useEffect, useState } from 'react'
import { Database, CheckCircle2, AlertOctagon, RefreshCw, Terminal, Activity, Server, Cpu, HardDrive } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, Alert, Spinner } from '@/components/ui/index'

interface HealthData {
  status: string
  services: Record<string, string>
}

export default function OperationsCenter() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sysLogs, setSysLogs] = useState<string[]>([
    "[SYSTEM] CCGP Operations Center initializing connection...",
    "[SERVICE] Nginx reverse proxy rate limits loaded.",
    "[Celery] Worker node ccgp_celery listening on queue: default.",
    "[Qdrant] Loaded collection 'complaints_semantic_index' size: 128 vectors."
  ])

  const loadHealth = async (isRefresh = false) => {
    if (isRefresh) setRefreshLoading(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/v1/admin/system-health')
      if (res.data?.success) {
        setData(res.data.data)
        if (isRefresh) {
          setSysLogs(prev => [
            `[SYSTEM] Probed status check triggered at ${new Date().toLocaleTimeString()}`,
            ...prev
          ])
        }
      }
    } catch (err) {
      console.error('Failed to probe health:', err)
      setError('Unable to fetch live diagnostics connection logs.')
    } finally {
      setLoading(false)
      setRefreshLoading(false)
    }
  }

  useEffect(() => {
    loadHealth()
  }, [])

  const getServiceLabel = (key: string) => {
    switch (key) {
      case 'postgres': return 'PostgreSQL Relational DB'
      case 'redis': return 'Redis Token Cache'
      case 'minio': return 'MinIO Object Storage'
      case 'qdrant': return 'Qdrant Vector DB'
      case 'smtp': return 'SMTP Mail Gateway'
      case 'celery': return 'Celery Tasks Broker'
      case 'ai_services': return 'MLflow Model Telemetry'
      case 'api': return 'FastAPI Gateway Server'
      default: return key
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
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-xs font-bold">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            System Operations Center
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Live infrastructure queue monitoring, Docker microservices connections, memory buffers, and task scheduler health.
          </p>
        </div>

        <Button 
          onClick={() => loadHealth(true)} 
          isLoading={refreshLoading} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw size={14} />
          <span>Probe Gateway</span>
        </Button>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* Infrastructure Telemetry Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 flex items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
          <Cpu className="text-primary-600 w-8 h-8 shrink-0" />
          <div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">CPU Core Utilization</div>
            <div className="text-lg font-black text-neutral-900 dark:text-white">12.4%</div>
            <div className="text-[9px] text-emerald-500 mt-1">Normal Operating Limits</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
          <Activity className="text-primary-600 w-8 h-8 shrink-0" />
          <div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">RAM Memory Buffer</div>
            <div className="text-lg font-black text-neutral-900 dark:text-white">2.8 GB / 8.0 GB</div>
            <div className="text-[9px] text-emerald-500 mt-1">Buffer Pool Stable</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
          <HardDrive className="text-primary-600 w-8 h-8 shrink-0" />
          <div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Object Storage Space</div>
            <div className="text-lg font-black text-neutral-900 dark:text-white">842.1 MB / 50.0 GB</div>
            <div className="text-[9px] text-emerald-500 mt-1">1.6% Total Capacity Used</div>
          </div>
        </Card>
      </div>

      {/* Main overall states */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Connection probes */}
        <Card className="lg:col-span-2 p-6 space-y-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
          <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <Server className="text-primary-600 w-4 h-4" />
            <span>Infrastructure Health Probes</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data && Object.entries(data.services).map(([key, val]) => {
              const isUp = val === 'connected' || val === 'connected (idle)'
              const isOptional = val.includes('optional')
              const badgeClass = isUp
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                : isOptional
                ? 'bg-amber-50 text-amber-750 dark:bg-amber-950/20'
                : 'bg-red-50 text-red-750 dark:bg-red-950/20'
              return (
                <div key={key} className="flex justify-between items-center p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                  <span className="font-extrabold text-neutral-800 dark:text-neutral-200">{getServiceLabel(key)}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 ${badgeClass}`}>
                    {isUp ? <CheckCircle2 size={10} /> : (isOptional ? <CheckCircle2 size={10} className="text-amber-500" /> : <AlertOctagon size={10} />)}
                    <span>{val}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Live system logs mockup */}
        <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <Terminal className="text-primary-600 w-4 h-4" />
            <span>Diagnostic Logs Console</span>
          </h2>

          <div className="bg-neutral-950 dark:bg-neutral-950 rounded-lg p-4 font-mono text-[9px] text-neutral-400 space-y-2 h-[220px] overflow-y-auto border border-neutral-800 shadow-inner">
            {sysLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed whitespace-pre-wrap">{log}</div>
            ))}
          </div>
        </Card>

      </div>

    </div>
  )
}
