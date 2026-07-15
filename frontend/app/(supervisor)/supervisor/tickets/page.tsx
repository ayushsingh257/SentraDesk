'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Inbox, 
  RefreshCw, 
  ChevronRight, 
  UserPlus, 
  FileCheck, 
  ShieldAlert 
} from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES, COMPLAINT_CATEGORIES } from '@/lib/constants'
import { Card, Spinner } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  name: string
  role: string
  email: string
}

interface Ticket {
  id: string
  ticket_number: string
  category: string
  severity: string
  sla_deadline: string | null
  is_escalated: boolean
  l1_approved: boolean
  l2_approved: boolean
  created_at: string
  jurisdiction: string | null
  assigned_officer_id: string | null
  complaint: {
    title: string
    description: string
    status: string
    reporter_name: string
  }
}

export default function SupervisorTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [officers, setOfficers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [officerFilter, setOfficerFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [escalatedFilter, setEscalatedFilter] = useState(false)
  const [breachedFilter, setBreachedFilter] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Bulk Operations State
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkOfficerId, setBulkOfficerId] = useState('')
  const [bulkSeverity, setBulkSeverity] = useState('')
  const [bulkEscalated, setBulkEscalated] = useState<boolean | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)

  const fetchFiltersAndTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch tickets with active filters mapped directly to query params
      const params: Record<string, any> = {
        search: search || undefined,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        category: categoryFilter || undefined,
        assigned_officer_id: officerFilter || undefined,
        district: districtFilter || undefined,
        is_escalated: escalatedFilter ? true : undefined,
        sla_breached: breachedFilter ? true : undefined,
        date_from: dateFrom ? `${dateFrom}T00:00:00Z` : undefined,
        date_to: dateTo ? `${dateTo}T23:59:59Z` : undefined,
      }
      
      const ticketsRes = await api.get(API_ROUTES.tickets, { params })
      if (ticketsRes.data?.success) {
        setTickets(ticketsRes.data.data)
        setSelectedIds([])
      }

      // 2. Fetch users list for the officer selector dropdown
      const usersRes = await api.get(API_ROUTES.adminUsers)
      if (usersRes.data?.success) {
        // Filter users that have investigation or officer capability
        const filteredUsers = usersRes.data.data.filter((u: User) => 
          ['cyber_cell_officer', 'investigator', 'senior_investigator', 'supervisor'].includes(u.role)
        )
        setOfficers(filteredUsers)
      }
    } catch (err: any) {
      console.error('Failed to load tickets/filters:', err)
      setError('Unable to load queue data. Please verify server connections.')
    } finally {
      setLoading(false)
    }
  }, [
    search, statusFilter, severityFilter, categoryFilter, 
    officerFilter, districtFilter, escalatedFilter, breachedFilter, 
    dateFrom, dateTo
  ])

  useEffect(() => {
    fetchFiltersAndTickets()
  }, [fetchFiltersAndTickets])

  // Selection hooks
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === tickets.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(tickets.map((t) => t.id))
    }
  }

  // Bulk operation triggers
  const handleBulkReassign = async () => {
    if (selectedIds.length === 0 || !bulkOfficerId) return
    setBulkLoading(true)
    setBulkError(null)
    try {
      const res = await api.post(API_ROUTES.bulkReassign, {
        ticket_ids: selectedIds,
        officer_id: bulkOfficerId
      })
      if (res.data?.success) {
        setBulkOfficerId('')
        fetchFiltersAndTickets()
      }
    } catch (err: any) {
      console.error('Bulk reassign failed:', err)
      setBulkError(err.response?.data?.error?.message || 'Bulk reassignment request failed.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkPriority = async () => {
    if (selectedIds.length === 0 || !bulkSeverity) return
    setBulkLoading(true)
    setBulkError(null)
    try {
      const res = await api.post(API_ROUTES.bulkPriority, {
        ticket_ids: selectedIds,
        severity: bulkSeverity
      })
      if (res.data?.success) {
        setBulkSeverity('')
        fetchFiltersAndTickets()
      }
    } catch (err: any) {
      console.error('Bulk priority failed:', err)
      setBulkError(err.response?.data?.error?.message || 'Bulk priority change request failed.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkEscalation = async () => {
    if (selectedIds.length === 0 || bulkEscalated === null) return
    setBulkLoading(true)
    setBulkError(null)
    try {
      const res = await api.post(API_ROUTES.bulkEscalate, {
        ticket_ids: selectedIds,
        is_escalated: bulkEscalated
      })
      if (res.data?.success) {
        setBulkEscalated(null)
        fetchFiltersAndTickets()
      }
    } catch (err: any) {
      console.error('Bulk escalation failed:', err)
      setBulkError(err.response?.data?.error?.message || 'Bulk escalation toggle request failed.')
    } finally {
      setBulkLoading(false)
    }
  }

  // Extract unique districts from loaded tickets for the district filter list
  const districtsList = Array.from(new Set(tickets.map(t => t.jurisdiction).filter(Boolean))) as string[]

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Advanced Repository Search
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            System-wide complaint query tool offering advanced parameters, date range selectors, and bulk management options.
          </p>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <Card className="p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-2.5">
          <Filter size={16} className="text-amber-700" />
          <h3 className="text-xs font-black uppercase text-neutral-850 dark:text-white tracking-wider">Advanced Filter Suite</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <label className="block text-[10px] uppercase font-black text-neutral-450 tracking-wider mb-1.5">Keyword Search</label>
            <Input
              placeholder="Search no, title, reporter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftAddon={<Search size={14} />}
              className="w-full"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] uppercase font-black text-neutral-450 tracking-wider mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Waiting for Citizen">Waiting for Response</option>
              <option value="Evidence Received">Evidence Received</option>
              <option value="Closure Requested">Closure Requested</option>
              <option value="Closed">Resolved</option>
              <option value="Reopened">Reopened</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-[10px] uppercase font-black text-neutral-450 tracking-wider mb-1.5">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] uppercase font-black text-neutral-450 tracking-wider mb-1.5">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Categories</option>
              {COMPLAINT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Assigned Officer */}
          <div>
            <label className="block text-[10px] uppercase font-black text-neutral-450 tracking-wider mb-1.5">Assigned Investigator</label>
            <select
              value={officerFilter}
              onChange={(e) => setOfficerFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Officers</option>
              {officers.map(off => (
                <option key={off.id} value={off.id}>{off.name} ({off.role.replace('_', ' ')})</option>
              ))}
            </select>
          </div>

          {/* District / Jurisdiction */}
          <div>
            <label className="block text-[10px] uppercase font-black text-neutral-450 tracking-wider mb-1.5">District / Jurisdiction</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Districts</option>
              {districtsList.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[10px] uppercase font-black text-neutral-450 tracking-wider mb-1.5">Date Created From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[10px] uppercase font-black text-neutral-450 tracking-wider mb-1.5">Date Created To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Checkbox filters */}
        <div className="flex gap-6 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={escalatedFilter}
              onChange={(e) => setEscalatedFilter(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-350">Escalated Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={breachedFilter}
              onChange={(e) => setBreachedFilter(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-350">SLA Breached Only</span>
          </label>
        </div>
      </Card>

      {/* Bulk Operations Workspace */}
      {selectedIds.length > 0 && (
        <Card className="p-5 border border-amber-500/25 bg-amber-500/5 shadow-card space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <span className="text-xs font-black uppercase text-neutral-500 tracking-wider">
              Bulk Operations Console ({selectedIds.length} tickets selected)
            </span>
            <button onClick={() => setSelectedIds([])} className="text-[10px] text-neutral-450 hover:underline">
              Cancel Selection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* Reassign */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-black text-neutral-400">Reassign Investigator</label>
              <div className="flex gap-2">
                <select
                  value={bulkOfficerId}
                  onChange={(e) => setBulkOfficerId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                >
                  <option value="">Select Officer</option>
                  {officers.map(off => (
                    <option key={off.id} value={off.id}>{off.name}</option>
                  ))}
                </select>
                <Button 
                  onClick={handleBulkReassign} 
                  disabled={bulkLoading || !bulkOfficerId}
                  className="bg-amber-700 text-white text-xs px-3 font-bold flex gap-1"
                >
                  <UserPlus size={13} />
                  <span>Assign</span>
                </Button>
              </div>
            </div>

            {/* Severity change */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-black text-neutral-400">Change Severity / Priority</label>
              <div className="flex gap-2">
                <select
                  value={bulkSeverity}
                  onChange={(e) => setBulkSeverity(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                >
                  <option value="">Select Severity</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <Button 
                  onClick={handleBulkPriority} 
                  disabled={bulkLoading || !bulkSeverity}
                  className="bg-amber-700 text-white text-xs px-3 font-bold flex gap-1"
                >
                  <FileCheck size={13} />
                  <span>Update</span>
                </Button>
              </div>
            </div>

            {/* Escalation update */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-black text-neutral-400">Set Escalation Flag</label>
              <div className="flex gap-2">
                <select
                  value={bulkEscalated === null ? "" : String(bulkEscalated)}
                  onChange={(e) => setBulkEscalated(e.target.value === "" ? null : e.target.value === "true")}
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                >
                  <option value="">Select Flag</option>
                  <option value="true">Escalated</option>
                  <option value="false">Not Escalated</option>
                </select>
                <Button 
                  onClick={handleBulkEscalation} 
                  disabled={bulkLoading || bulkEscalated === null}
                  className="bg-amber-700 text-white text-xs px-3 font-bold flex gap-1"
                >
                  <ShieldAlert size={13} />
                  <span>Set Flag</span>
                </Button>
              </div>
            </div>
          </div>
          {bulkError && (
            <p className="text-[11px] text-danger font-semibold">{bulkError}</p>
          )}
        </Card>
      )}

      {/* Main Tickets Queue Table */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Spinner size="lg" className="text-amber-700" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center border-danger/25 bg-danger/5">
          <AlertTriangle size={32} className="text-danger mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-250">Load Failure</h3>
          <p className="text-xs text-neutral-500 mt-1">{error}</p>
          <Button onClick={fetchFiltersAndTickets} size="sm" className="mt-4 bg-amber-700 text-white">
            Reload Interface
          </Button>
        </Card>
      ) : tickets.length === 0 ? (
        <Card className="py-20 text-center space-y-4 shadow-card border border-neutral-200 dark:border-neutral-800">
          <Inbox size={48} className="text-neutral-350 dark:text-neutral-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">No Tickets Found</h3>
            <p className="text-xs text-neutral-450 max-w-xs mx-auto">
              We couldn&apos;t find any tickets matching your search query or selected category filter options.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="border border-neutral-200/80 dark:border-neutral-800 shadow-card overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-150 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/20 text-neutral-450 uppercase font-black tracking-wider">
                  <th className="py-4 px-5 w-10 text-center">
                    <input 
                      type="checkbox"
                      checked={selectedIds.length === tickets.length}
                      onChange={handleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-3 font-black">Ticket Reference</th>
                  <th className="py-4 px-3 font-black">Complaint Details</th>
                  <th className="py-4 px-3 font-black text-center">Severity & Status</th>
                  <th className="py-4 px-3 font-black">District</th>
                  <th className="py-4 px-3 font-black">Assigned Officer</th>
                  <th className="py-4 px-5 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                {tickets.map((t) => {
                  const isSelected = selectedIds.includes(t.id)
                  const matchedOfficer = officers.find(o => o.id === t.assigned_officer_id)
                  
                  return (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-neutral-50/40 dark:hover:bg-neutral-850/10 transition-colors ${
                        isSelected ? 'bg-amber-50/20 dark:bg-amber-950/5' : ''
                      }`}
                    >
                      <td className="py-4 px-5 text-center">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(t.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-3 space-y-1">
                        <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-100/50">
                          {t.ticket_number}
                        </span>
                        {t.is_escalated && (
                          <span className="block mt-1 text-[9px] font-black text-red-600 uppercase tracking-widest animate-pulse">
                            ⚠️ Escalated
                          </span>
                        )}
                        <p className="text-[10px] text-neutral-400 mt-1">Created: {formatDate(t.created_at)}</p>
                      </td>
                      <td className="py-4 px-3 space-y-1 max-w-[240px]">
                        <h4 className="font-bold text-neutral-850 dark:text-neutral-200 line-clamp-1">
                          {t.complaint.title}
                        </h4>
                        <p className="text-[10px] text-neutral-450 font-semibold line-clamp-1">{t.category}</p>
                      </td>
                      <td className="py-4 px-3 text-center space-y-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
                          t.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          t.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {t.severity}
                        </span>
                        <span className="block text-[10px] font-bold text-neutral-500">
                          {t.complaint.status}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-neutral-700 dark:text-neutral-300 font-semibold truncate max-w-[120px]">
                        {t.jurisdiction || 'Not set'}
                      </td>
                      <td className="py-4 px-3 text-neutral-600 dark:text-neutral-400 max-w-[140px]">
                        <p className="font-bold truncate">{matchedOfficer ? matchedOfficer.name : 'Unassigned'}</p>
                        <p className="text-[9px] text-neutral-400 truncate">{matchedOfficer ? matchedOfficer.email : 'N/A'}</p>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link href={`/supervisor/tickets/${t.id}`}>
                          <Button size="sm" className="px-3.5 py-1.5 text-[11px] font-bold bg-amber-700 hover:bg-amber-850 text-white flex items-center gap-1 ml-auto">
                            <span>Manage</span>
                            <ChevronRight size={12} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
