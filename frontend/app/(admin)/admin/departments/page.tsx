'use client'

import { useEffect, useState } from 'react'
import { Network, Plus, CheckCircle2, ShieldAlert } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert, Spinner } from '@/components/ui/index'

interface Department {
  id: string
  name: string
  type: string
  jurisdiction: string
}

interface CyberCell {
  id: string
  name: string
  district: string
  default_supervisor: string
  default_officer: string
}

export default function DepartmentsCyberCells() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [cyberCells, setCyberCells] = useState<CyberCell[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Creation form states
  const [name, setName] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [cellType, setCellType] = useState('department') // department or cyber_cell

  const loadDepartmentsAndCells = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/v1/admin/departments')
      if (res.data?.success) {
        setDepartments(res.data.data.departments || [])
        setCyberCells(res.data.data.cyber_cells || [])
      }
    } catch (err) {
      console.error('Failed to load cell departments:', err)
      setError('Unable to fetch cyber units directory from FastAPI.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepartmentsAndCells()
  }, [])

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post('/api/v1/admin/departments', {
        name: name,
        jurisdiction: jurisdiction || null,
        cell_type: cellType
      })
      if (res.data?.success) {
        setSuccess(`Successfully added new unit '${name}' to repository configurations.`)
        setName('')
        setJurisdiction('')
        loadDepartmentsAndCells()
      }
    } catch (err) {
      console.error('Failed to add cyber cell:', err)
      setError('Unable to provision cyber unit.')
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
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-xs font-bold">
      
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Cyber Units & Cells Directory
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Configure specialized cyber crime investigation wings, local district cells, and default routing nodes.
        </p>
      </div>

      {error && <Alert type="danger">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Units / Departments Directory Listings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
            <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <Network className="text-primary-600 w-4 h-4" />
              <span>Specialized Cyber Investigation Wings</span>
            </h2>
            
            <div className="overflow-x-auto rounded-lg border border-neutral-100 dark:border-neutral-800">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800 text-neutral-450 uppercase font-black border-b border-neutral-150 dark:border-neutral-800">
                    <th className="px-4 py-3">Wing Name</th>
                    <th className="px-4 py-3">Core Specialty</th>
                    <th className="px-4 py-3">Jurisdiction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {departments.map(d => (
                    <tr key={d.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                      <td className="px-4 py-3 font-extrabold text-neutral-900 dark:text-white">{d.name}</td>
                      <td className="px-4 py-3 capitalize">{d.type}</td>
                      <td className="px-4 py-3">{d.jurisdiction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 space-y-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
            <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <Network className="text-primary-600 w-4 h-4" />
              <span>District Cyber Cells</span>
            </h2>
            
            <div className="overflow-x-auto rounded-lg border border-neutral-100 dark:border-neutral-800">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800 text-neutral-450 uppercase font-black border-b border-neutral-150 dark:border-neutral-800">
                    <th className="px-4 py-3">Cyber Cell Location</th>
                    <th className="px-4 py-3">District Node</th>
                    <th className="px-4 py-3">Default Supervisor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {cyberCells.map(c => (
                    <tr key={c.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                      <td className="px-4 py-3 font-extrabold text-neutral-900 dark:text-white">{c.name}</td>
                      <td className="px-4 py-3">{c.district}</td>
                      <td className="px-4 py-3 text-primary-700 dark:text-primary-400 font-extrabold">{c.default_supervisor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Creation Unit Form */}
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
            <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
              <Plus className="text-primary-600 w-4 h-4" />
              <span>Provision Cyber Unit</span>
            </h2>

            <form onSubmit={handleCreateUnit} className="space-y-4">
              <Input
                label="Unit / Cell Name"
                placeholder="e.g. Zone Gamma Regional Cell"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Jurisdiction / District Location"
                placeholder="e.g. Zone Gamma / State-wide"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
              />

              <div className="space-y-1.5">
                <span className="text-[10px] text-neutral-400 uppercase">Unit Type</span>
                <select
                  value={cellType}
                  onChange={(e) => setCellType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-250 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  required
                >
                  <option value="department">Specialized Wing (Department)</option>
                  <option value="cyber_cell">Local Cyber Cell Node</option>
                </select>
              </div>

              <Button type="submit" isLoading={actionLoading} className="w-full">
                Register Unit
              </Button>
            </form>
          </Card>
        </div>

      </div>

    </div>
  )
}
