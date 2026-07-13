'use client'

import { useEffect, useState } from 'react'
import { ToggleLeft, HelpCircle, Save, Plus, Trash2 } from 'lucide-react'

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

interface JurisdictionRule {
  jurisdiction: string
  group: string
}

interface AssignmentRules {
  category_rules: CategoryRule[]
  severity_rules: SeverityRule[]
  jurisdiction_rules: JurisdictionRule[]
}

export default function RulesEngine() {
  const [rules, setRules] = useState<AssignmentRules>({
    category_rules: [],
    severity_rules: [],
    jurisdiction_rules: []
  })
  
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadRules() {
      try {
        const res = await api.get('/api/v1/admin/config')
        if (res.data?.success) {
          const rulesData = res.data.data.assignment_rules || {
            category_rules: [],
            severity_rules: [],
            jurisdiction_rules: []
          }
          setRules(rulesData)
        }
      } catch (err) {
        console.error('Failed to load rules engine configurations:', err)
        setError('Unable to fetch assignment routing rules config.')
      } finally {
        setLoading(false)
      }
    }
    loadRules()
  }, [])

  const handleSaveRules = async () => {
    setSaveLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.put('/api/v1/admin/config', {
        key: 'assignment_rules',
        value: rules
      })
      if (res.data?.success) {
        setSuccess('Assignment rules configuration successfully updated.')
      }
    } catch (err) {
      console.error('Failed to save rules engine config:', err)
      setError('Failed to update assignment rules profile.')
    } finally {
      setSaveLoading(false)
    }
  }

  // Row Manipulation helpers
  const addCategoryRule = () => {
    setRules(prev => ({
      ...prev,
      category_rules: [...prev.category_rules, { category: '', group: '' }]
    }))
  }

  const removeCategoryRule = (idx: number) => {
    setRules(prev => ({
      ...prev,
      category_rules: prev.category_rules.filter((_, i) => i !== idx)
    }))
  }

  const updateCategoryRule = (idx: number, field: keyof CategoryRule, val: string) => {
    setRules(prev => ({
      ...prev,
      category_rules: prev.category_rules.map((item, i) => i === idx ? { ...item, [field]: val } : item)
    }))
  }

  const addSeverityRule = () => {
    setRules(prev => ({
      ...prev,
      severity_rules: [...prev.severity_rules, { severity: '', escalate_to: '' }]
    }))
  }

  const removeSeverityRule = (idx: number) => {
    setRules(prev => ({
      ...prev,
      severity_rules: prev.severity_rules.filter((_, i) => i !== idx)
    }))
  }

  const updateSeverityRule = (idx: number, field: keyof SeverityRule, val: string) => {
    setRules(prev => ({
      ...prev,
      severity_rules: prev.severity_rules.map((item, i) => i === idx ? { ...item, [field]: val } : item)
    }))
  }

  const addJurisdictionRule = () => {
    setRules(prev => ({
      ...prev,
      jurisdiction_rules: [...prev.jurisdiction_rules, { jurisdiction: '', group: '' }]
    }))
  }

  const removeJurisdictionRule = (idx: number) => {
    setRules(prev => ({
      ...prev,
      jurisdiction_rules: prev.jurisdiction_rules.filter((_, i) => i !== idx)
    }))
  }

  const updateJurisdictionRule = (idx: number, field: keyof JurisdictionRule, val: string) => {
    setRules(prev => ({
      ...prev,
      jurisdiction_rules: prev.jurisdiction_rules.map((item, i) => i === idx ? { ...item, [field]: val } : item)
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Routing Rules Engine
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Define dynamic routing behaviors based on category classifications, severity tiers, and geographic jurisdictions.
          </p>
        </div>

        <Button onClick={handleSaveRules} isLoading={saveLoading} className="flex items-center gap-2">
          <Save size={16} />
          <span>Save Configuration</span>
        </Button>
      </div>

      {error && <Alert type="danger">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Rules Config Panels */}
      <div className="space-y-8">
        
        {/* Category-based assignment */}
        <Card className="p-6 space-y-4 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Incident Category Assignments</h3>
              <p className="text-[10px] text-neutral-450 mt-0.5">Route complaints based on classified cybercrime category.</p>
            </div>
            <Button size="sm" onClick={addCategoryRule} className="flex items-center gap-1">
              <Plus size={12} />
              <span>Add Rule</span>
            </Button>
          </div>

          <div className="space-y-3">
            {rules.category_rules.length === 0 ? (
              <p className="text-xs text-neutral-450 py-2">No category assignment rules defined.</p>
            ) : (
              rules.category_rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-4 text-xs">
                  <div className="flex-1">
                    <Input
                      placeholder="Category name (e.g. UPI Fraud)"
                      value={rule.category}
                      onChange={(e) => updateCategoryRule(idx, 'category', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Target Group (e.g. Financial Fraud Unit)"
                      value={rule.group}
                      onChange={(e) => updateCategoryRule(idx, 'group', e.target.value)}
                    />
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => removeCategoryRule(idx)}
                    className="p-2 border-red-200 hover:bg-red-50 text-red-500"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Severity Escalation rules */}
        <Card className="p-6 space-y-4 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Severity SLA Escalations</h3>
              <p className="text-[10px] text-neutral-450 mt-0.5">Define escalation supervisor paths for critical incident thresholds.</p>
            </div>
            <Button size="sm" onClick={addSeverityRule} className="flex items-center gap-1">
              <Plus size={12} />
              <span>Add Rule</span>
            </Button>
          </div>

          <div className="space-y-3">
            {rules.severity_rules.length === 0 ? (
              <p className="text-xs text-neutral-450 py-2">No severity SLA rules defined.</p>
            ) : (
              rules.severity_rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-4 text-xs">
                  <div className="flex-1">
                    <select
                      value={rule.severity}
                      onChange={(e) => updateSeverityRule(idx, 'severity', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-neutral-250 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Severity...</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Escalate To (e.g. Supervisor)"
                      value={rule.escalate_to}
                      onChange={(e) => updateSeverityRule(idx, 'escalate_to', e.target.value)}
                    />
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => removeSeverityRule(idx)}
                    className="p-2 border-red-200 hover:bg-red-50 text-red-500"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Geographic Jurisdiction rules */}
        <Card className="p-6 space-y-4 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-900">
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Geographic Jurisdiction Routing</h3>
              <p className="text-[10px] text-neutral-450 mt-0.5">Direct tickets based on reporter location or regional hotspots.</p>
            </div>
            <Button size="sm" onClick={addJurisdictionRule} className="flex items-center gap-1">
              <Plus size={12} />
              <span>Add Rule</span>
            </Button>
          </div>

          <div className="space-y-3">
            {rules.jurisdiction_rules.length === 0 ? (
              <p className="text-xs text-neutral-450 py-2">No regional jurisdiction routing defined.</p>
            ) : (
              rules.jurisdiction_rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-4 text-xs">
                  <div className="flex-1">
                    <Input
                      placeholder="Jurisdiction Zone (e.g. Delhi)"
                      value={rule.jurisdiction}
                      onChange={(e) => updateJurisdictionRule(idx, 'jurisdiction', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Allocated Unit (e.g. Delhi Cyber Cell)"
                      value={rule.group}
                      onChange={(e) => updateJurisdictionRule(idx, 'group', e.target.value)}
                    />
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => removeJurisdictionRule(idx)}
                    className="p-2 border-red-200 hover:bg-red-50 text-red-500"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>

    </div>
  )
}
