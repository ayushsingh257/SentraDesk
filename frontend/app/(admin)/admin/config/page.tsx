'use client'

import { useEffect, useState } from 'react'
import { Settings2, Save, Mail, ShieldAlert, Sparkles, Bell, ToggleLeft } from 'lucide-react'

import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert, Spinner } from '@/components/ui/index'

export default function AdminConfig() {
  const [config, setConfig] = useState<any>({
    email_settings: {},
    notification_settings: {},
    security_settings: {},
    ai_settings: {},
    feature_flags: {}
  })

  const [loading, setLoading] = useState(true)
  const [saveLoadingKey, setSaveLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await api.get('/api/v1/admin/config')
        if (res.data?.success) {
          setConfig(res.data.data)
        }
      } catch (err) {
        console.error('Failed to load system configs:', err)
        setError('Failed to fetch platform configuration profiles.')
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleSaveConfig = async (key: string) => {
    setSaveLoadingKey(key)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.put('/api/v1/admin/config', {
        key: key,
        value: config[key]
      })
      if (res.data?.success) {
        setSuccess(`Configuration category '${key.replace('_', ' ')}' successfully updated.`)
      }
    } catch (err) {
      console.error('Config update error:', err)
      setError(`Failed to update settings category: ${key}`)
    } finally {
      setSaveLoadingKey(null)
    }
  }

  const handleNestedFieldChange = (category: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          System Configurations Command
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Modify dynamic feature flags, AI thresholds, SMTP servers, and system security controls.
        </p>
      </div>

      {error && <Alert type="danger">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="space-y-8">
        
        {/* Email Settings */}
        <Card className="p-6 space-y-5 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="text-neutral-400 w-5 h-5" />
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">SMTP Email Configurations</h3>
            </div>
            <Button 
              size="sm" 
              onClick={() => handleSaveConfig('email_settings')}
              isLoading={saveLoadingKey === 'email_settings'}
              className="flex items-center gap-1.5"
            >
              <Save size={12} />
              <span>Save SMTP</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <Input
              label="SMTP Host Server"
              value={config.email_settings.smtp_host || ''}
              onChange={(e) => handleNestedFieldChange('email_settings', 'smtp_host', e.target.value)}
            />
            <Input
              label="SMTP Port"
              type="number"
              value={config.email_settings.smtp_port || 587}
              onChange={(e) => handleNestedFieldChange('email_settings', 'smtp_port', parseInt(e.target.value) || 587)}
            />
            <Input
              label="SMTP Auth Username"
              value={config.email_settings.smtp_user || ''}
              onChange={(e) => handleNestedFieldChange('email_settings', 'smtp_user', e.target.value)}
            />
            <Input
              label="Sender Display Name"
              value={config.email_settings.smtp_from_name || ''}
              onChange={(e) => handleNestedFieldChange('email_settings', 'smtp_from_name', e.target.value)}
            />
          </div>
        </Card>

        {/* AI & Classifier Settings */}
        <Card className="p-6 space-y-5 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-neutral-400 w-5 h-5" />
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">AI Engine & Entity Extraction</h3>
            </div>
            <Button 
              size="sm" 
              onClick={() => handleSaveConfig('ai_settings')}
              isLoading={saveLoadingKey === 'ai_settings'}
              className="flex items-center gap-1.5"
            >
              <Save size={12} />
              <span>Save AI</span>
            </Button>
          </div>

          <div className="space-y-4 text-xs font-bold">
            <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
              <div>
                <span className="font-bold text-neutral-850 dark:text-neutral-200 block">Auto-Classification Pipeline</span>
                <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">Categorize incoming complaints via offline TF-IDF vector training.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.ai_settings.auto_classification_enabled || false}
                  onChange={(e) => handleNestedFieldChange('ai_settings', 'auto_classification_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <Input
              label="Minimum Classifier Confidence Threshold"
              type="number"
              step="0.05"
              max="1.0"
              min="0.1"
              value={config.ai_settings.min_confidence_threshold || 0.85}
              onChange={(e) => handleNestedFieldChange('ai_settings', 'min_confidence_threshold', parseFloat(e.target.value) || 0.85)}
              helpText="Auto-approve AI category predictions only above this confidence limit."
            />
          </div>
        </Card>

        {/* System Security Policies */}
        <Card className="p-6 space-y-5 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-neutral-400 w-5 h-5" />
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Security & Access Policy</h3>
            </div>
            <Button 
              size="sm" 
              onClick={() => handleSaveConfig('security_settings')}
              isLoading={saveLoadingKey === 'security_settings'}
              className="flex items-center gap-1.5"
            >
              <Save size={12} />
              <span>Save Security</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <Input
              label="Minimum Credentials Length"
              type="number"
              value={config.security_settings.min_password_length || 12}
              onChange={(e) => handleNestedFieldChange('security_settings', 'min_password_length', parseInt(e.target.value) || 12)}
            />
            <Input
              label="Session Expiration Window (Minutes)"
              type="number"
              value={config.security_settings.session_timeout_minutes || 30}
              onChange={(e) => handleNestedFieldChange('security_settings', 'session_timeout_minutes', parseInt(e.target.value) || 30)}
            />
          </div>
        </Card>

        {/* Feature Flags */}
        <Card className="p-6 space-y-5 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <ToggleLeft className="text-neutral-400 w-5 h-5" />
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Platform System Feature Flags</h3>
            </div>
            <Button 
              size="sm" 
              onClick={() => handleSaveConfig('feature_flags')}
              isLoading={saveLoadingKey === 'feature_flags'}
              className="flex items-center gap-1.5"
            >
              <Save size={12} />
              <span>Save Flags</span>
            </Button>
          </div>

          <div className="space-y-4 text-xs font-bold">
            {[
              { key: 'email_intake', label: 'Multi-Channel Email Intake Listener', desc: 'Monitor dedicated mailboxes to auto-create tickets from email streams.' },
              { key: 'ai_copilot', label: 'AI Investigation Copilot Assist', desc: 'Display entity telemetry extraction suggestions in officer details panel.' },
              { key: 'threat_intel', label: 'IP & URL Threat Intel Scan Registry', desc: 'Perform live scans matching AbuseIPDB / local IoC databases.' },
              { key: 'blockchain_anchoring', label: 'Hyperledger Log Archival Anchoring', desc: 'Commit compiled Merkle transaction roots onto distributed nodes.' }
            ].map((flag) => (
              <div key={flag.key} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
                <div>
                  <span className="font-bold text-neutral-850 dark:text-neutral-200 block">{flag.label}</span>
                  <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">{flag.desc}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={config.feature_flags[flag.key] || false}
                    onChange={(e) => handleNestedFieldChange('feature_flags', flag.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>

      </div>

    </div>
  )
}
