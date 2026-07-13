'use client'

import { useEffect, useState } from 'react'
import { Database, CheckCircle2, AlertOctagon, RefreshCw, Activity, Terminal } from 'lucide-react'

import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, Alert, Spinner } from '@/components/ui/index'

interface HealthData {
  status: string
  services: Record<string, string>
}

export default function SystemHealth() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHealth = async (isRefresh = false) => {
    if (isRefresh) setRefreshLoading(true)
    else setLoading(true)
    setError(null)
    
    try {
      const res = await api.get('/api/v1/admin/system-health')
      if (res.data?.success) {
        setData(res.data.data)
      }
    } catch (err) {
      console.error('Failed to probe health diagnostics:', err)
      setError('Unable to reach backend diagnostic uvicorn check.')
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
      case 'postgres': return 'Relational PostgreSQL Database'
      case 'redis': return 'Session & Token Revocation Cache (Redis)'
      case 'minio': return 'Evidence Object Storage (MinIO)'
      case 'qdrant': return 'Semantic Vector Match DB (Qdrant)'
      case 'smtp': return 'Email Alert SMTP Server'
      case 'celery': return 'Background Tasks Broker (Celery)'
      case 'ai_services': return 'MLflow Model Telemetry Pipeline'
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

  const overallHealthy = data?.status === 'healthy'

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            System Diagnostics Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Probe active connections, infrastructure storage enclaves, and MLflow pipeline telemetry.
          </p>
        </div>

        <Button 
          onClick={() => loadHealth(true)} 
          isLoading={refreshLoading} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw size={14} />
          <span>Probe Status</span>
        </Button>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* Main Overall State Card */}
      {data && (
        <Card className={`p-6 border ${
          overallHealthy 
            ? 'border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/10' 
            : 'border-warning-100 dark:border-warning-950/40 bg-warning-50/10'
        } shadow-card`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              overallHealthy ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40' : 'bg-warning-100 text-warning-700 dark:bg-warning-900/40'
            }`}>
              {overallHealthy ? <CheckCircle2 size={24} /> : <AlertOctagon size={24} />}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white uppercase tracking-wide">
                Platform Diagnostic: {overallHealthy ? 'Healthy' : 'Partial Degradation'}
              </h3>
              <p className="text-[11px] text-neutral-450 mt-1">
                {overallHealthy 
                  ? 'All backing engines and dependencies are reporting active socket connections.' 
                  : 'One or more secondary microservices are unreachable. Core gateway operates in degraded failover mode.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Services List Grid */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(data.services).map(([key, status]) => {
            const isUp = status === 'connected' || status === 'connected (idle)'
            return (
              <Card 
                key={key} 
                className="p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-card bg-white dark:bg-neutral-900/40 flex justify-between items-center text-xs"
              >
                <div className="space-y-1">
                  <span className="font-extrabold text-neutral-900 dark:text-white block">{getServiceLabel(key)}</span>
                  <span className="text-[10px] text-neutral-400 font-bold block">service key: <span className="font-mono">{key}</span></span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap ${
                  isUp 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                    : 'bg-red-50 text-red-750 dark:bg-red-950/20'
                }`}>
                  {status}
                </span>
              </Card>
            )
          })}
        </div>
      )}

    </div>
  )
}
