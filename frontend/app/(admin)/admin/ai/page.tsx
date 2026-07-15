'use client'

import { useEffect, useState } from 'react'
import { Cpu, Save, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert, Spinner } from '@/components/ui/index'

export default function AIAdministrationConsole() {
  const [ai, setAi] = useState<any>({
    auto_classification_enabled: true,
    min_confidence_threshold: 0.85,
    extract_entities_enabled: true,
    threat_intel_scans_enabled: true,
    selected_model: 'SGDClassifier-offline-V2',
    threat_intel_provider: 'AbuseIPDB/VirusTotal-dual',
    api_key_masked: '••••••••••••••••••••••••••••••••'
  })

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadAIConfig = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/v1/admin/config')
      if (res.data?.success) {
        setAi(res.data.data.ai_settings || {})
      }
    } catch (err) {
      console.error('Failed to load AI config:', err)
      setError('Unable to fetch system AI configurations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAIConfig()
  }, [])

  const handleSaveAI = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.put('/api/v1/admin/config', {
        key: 'ai_settings',
        value: ai
      })
      if (res.data?.success) {
        setSuccess('AI Classifier and model parameters updated.')
      }
    } catch (err) {
      console.error('AI settings save error:', err)
      setError('Failed to update LLM configuration.')
    } finally {
      setActionLoading(false)
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
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-xs font-bold">
      
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          AI & NLP Classifier Administration
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Govern machine learning models, entities extraction parameters, and AbuseIPDB / VirusTotal scanner APIs keys.
        </p>
      </div>

      {error && <Alert type="danger">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* API parameters */}
        <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
          <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
            <Cpu className="text-primary-600 w-4 h-4" />
            <span>AI Model & Provider parameters</span>
          </h2>

          <form onSubmit={handleSaveAI} className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] text-neutral-400 uppercase">Select Classification Model</span>
              <select
                value={ai.selected_model || 'SGDClassifier-offline-V2'}
                onChange={(e) => setAi({ ...ai, selected_model: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-250 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                required
              >
                <option value="SGDClassifier-offline-V2">SGDClassifier (Offline Vectorizer)</option>
                <option value="gemini-1.5-flash-online">Gemini 1.5 Flash (Online LLM)</option>
                <option value="llama-3-local-triage">Llama 3 (Local Forensics)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-neutral-400 uppercase">Threat Intelligence Scanner</span>
              <select
                value={ai.threat_intel_provider || 'AbuseIPDB/VirusTotal-dual'}
                onChange={(e) => setAi({ ...ai, threat_intel_provider: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-250 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                required
              >
                <option value="AbuseIPDB/VirusTotal-dual">AbuseIPDB & VirusTotal (Dual-lookup)</option>
                <option value="VT-standalone">VirusTotal Standalone API</option>
                <option value="abuseipdb-standalone">AbuseIPDB Standalone API</option>
              </select>
            </div>

            <Input
              label="Confidence classification limit threshold"
              type="number"
              step="0.01"
              value={ai.min_confidence_threshold}
              onChange={(e) => setAi({ ...ai, min_confidence_threshold: parseFloat(e.target.value) || 0.85 })}
              required
            />

            <Input
              label="Masked Threat Intel Key"
              type="text"
              value={ai.api_key_masked || '••••••••••••••••••••••••••••••••'}
              disabled
            />

            <Button type="submit" isLoading={actionLoading} className="w-full">
              Save AI Settings
            </Button>
          </form>
        </Card>

        {/* AI Health Indicators */}
        <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-primary-600 w-4 h-4" />
            <span>AI Model health indicators</span>
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span>Offline Classifier pipeline</span>
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                <CheckCircle2 size={14} />
                <span>LOADED</span>
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span>NLP Entities extractor engine</span>
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                <CheckCircle2 size={14} />
                <span>ACTIVE</span>
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span>Threat Intel connections lookup</span>
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                <CheckCircle2 size={14} />
                <span>STABLE</span>
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>MLflow telemetry URI connection</span>
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                <CheckCircle2 size={14} />
                <span>CONNECTED</span>
              </span>
            </div>
          </div>
        </Card>

      </div>

    </div>
  )
}
