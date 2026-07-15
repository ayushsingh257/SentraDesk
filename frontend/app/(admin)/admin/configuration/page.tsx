'use client'

import { useEffect, useState } from 'react'
import { Sliders, Save, Plus, Trash2, ShieldCheck, RefreshCw } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert, Spinner } from '@/components/ui/index'

interface CategoryRule {
  category: string
  group: string
}

interface SeverityRule {
  severity: string
  escalate_to: string
}

interface SLAConfig {
  severity: string
  resolution_limit_hours: number
  retention_months: number
}

export default function SystemConfiguration() {
  const [activeTab, setActiveTab] = useState<'assignment' | 'sla' | 'approval'>('assignment')
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([])
  const [severityRules, setSeverityRules] = useState<SeverityRule[]>([])
  
  const [slaConfigs, setSlaConfigs] = useState<SLAConfig[]>([
    { severity: 'Critical', resolution_limit_hours: 24, retention_months: 60 },
    { severity: 'High', resolution_limit_hours: 48, retention_months: 36 },
    { severity: 'Medium', resolution_limit_hours: 72, retention_months: 24 },
    { severity: 'Low', resolution_limit_hours: 120, retention_months: 12 }
  ])

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadConfigurations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/v1/admin/config')
      if (res.data?.success) {
        const rules = res.data.data.assignment_rules || { category_rules: [], severity_rules: [] }
        setCategoryRules(rules.category_rules || [])
        setSeverityRules(rules.severity_rules || [])
      }
    } catch (err) {
      console.error('Failed to load configs:', err)
      setError('Unable to fetch configurations profile from backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfigurations()
  }, [])

  const handleSaveConfigs = async () => {
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.put('/api/v1/admin/config', {
        key: 'assignment_rules',
        value: {
          category_rules: categoryRules,
          severity_rules: severityRules
        }
      })
      if (res.data?.success) {
        setSuccess('System routing policies successfully updated.')
      }
    } catch (err) {
      console.error('Config save error:', err)
      setError('Failed to write assignment configurations.')
    } finally {
      setActionLoading(false)
    }
  }

  const addCategoryRule = () => {
    setCategoryRules([...categoryRules, { category: '', group: '' }])
  }

  const removeCategoryRule = (idx: number) => {
    setCategoryRules(categoryRules.filter((_, i) => i !== idx))
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
          System Configurations Engine
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Govern category priorities, assignment rules, severity mappings, and storage retention limits.
        </p>
      </div>

      {error && <Alert type="danger">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Tabs */}
      <div className="flex border-b border-neutral-250 dark:border-neutral-850 gap-4 mb-4">
        <button
          onClick={() => setActiveTab('assignment')}
          className={`pb-2.5 px-1 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'assignment' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Routing & Assignment
        </button>
        <button
          onClick={() => setActiveTab('sla')}
          className={`pb-2.5 px-1 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'sla' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          SLA & Data Retention
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'assignment' && (
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <Sliders className="text-primary-600 w-4 h-4" />
                <span>Automatic Routing Matrix</span>
              </h2>
              <Button onClick={addCategoryRule} size="sm" variant="outline" className="flex items-center gap-1.5">
                <Plus size={13} />
                <span>Add Category rule</span>
              </Button>
            </div>

            <div className="space-y-4">
              {categoryRules.map((rule, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="e.g. UPI Fraud"
                      value={rule.category}
                      onChange={(e) => {
                        const next = [...categoryRules]
                        next[idx].category = e.target.value
                        setCategoryRules(next)
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="e.g. Financial Fraud Unit"
                      value={rule.group}
                      onChange={(e) => {
                        const next = [...categoryRules]
                        next[idx].group = e.target.value
                        setCategoryRules(next)
                      }}
                    />
                  </div>
                  <Button onClick={() => removeCategoryRule(idx)} size="sm" variant="outline" className="text-red-500 p-2">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <Button onClick={handleSaveConfigs} isLoading={actionLoading}>
                <Save size={14} className="mr-1.5" />
                <span>Apply Routing Policies</span>
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'sla' && (
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card space-y-4">
            <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <Sliders className="text-primary-600 w-4 h-4" />
              <span>SLA Target Closes & Data Retention Limits</span>
            </h2>

            <div className="overflow-x-auto rounded-lg border border-neutral-100 dark:border-neutral-800">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800 text-neutral-450 uppercase font-black border-b border-neutral-150 dark:border-neutral-800">
                    <th className="px-4 py-3">Severity Level</th>
                    <th className="px-4 py-3">Resolution Limit</th>
                    <th className="px-4 py-3">Retention Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {slaConfigs.map(c => (
                    <tr key={c.severity} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                      <td className="px-4 py-3 font-extrabold text-neutral-900 dark:text-white">{c.severity}</td>
                      <td className="px-4 py-3">{c.resolution_limit_hours} Hours</td>
                      <td className="px-4 py-3">{c.retention_months} Months (Archived)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

    </div>
  )
}
