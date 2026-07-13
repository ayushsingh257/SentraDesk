'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  AlertCircle, 
  Clock, 
  Inbox,
  ChevronsUpDown,
  Calendar
} from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES, COMPLAINT_CATEGORIES } from '@/lib/constants'
import { Card, Spinner } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'

interface Ticket {
  id: string
  ticket_number: string
  category: string
  severity: string
  sla_deadline: string | null
  created_at: string
  complaint: {
    title: string
    description: string
    status: string
    reporter_name: string
  }
}

export default function OfficerTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filters State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at_desc')

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(API_ROUTES.myTickets)
      if (res.data?.success) {
        setTickets(res.data.data)
      }
    } catch (err: any) {
      console.error('Failed to load officer tickets:', err)
      setError('Unable to retrieve tickets. Please check server connections.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Client-side search, filtering, and sorting
  const filteredTickets = tickets.filter((t) => {
    const searchLower = search.toLowerCase()
    const matchesSearch = 
      t.ticket_number.toLowerCase().includes(searchLower) ||
      t.complaint.title.toLowerCase().includes(searchLower) ||
      t.complaint.description.toLowerCase().includes(searchLower) ||
      t.complaint.reporter_name.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === '' || t.complaint.status === statusFilter
    const matchesSeverity = severityFilter === '' || t.severity === severityFilter
    const matchesCategory = categoryFilter === '' || t.category === categoryFilter

    return matchesSearch && matchesStatus && matchesSeverity && matchesCategory
  })

  // Sort
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === 'created_at_desc') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (sortBy === 'created_at_asc') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    if (sortBy === 'sla_deadline') {
      if (!a.sla_deadline) return 1
      if (!b.sla_deadline) return -1
      return new Date(a.sla_deadline).getTime() - new Date(b.sla_deadline).getTime()
    }
    if (sortBy === 'severity') {
      const severityMap: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
      return (severityMap[b.severity] || 0) - (severityMap[a.severity] || 0)
    }
    return 0
  })

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Assigned Tickets
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Review and investigate all cases currently routed to your desk.
          </p>
        </div>
      </div>

      {/* Filters Panel */}
      <Card className="p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Search bar */}
          <div className="relative">
            <Input
              placeholder="Search by ticket no, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftAddon={<Search size={15} />}
              className="w-full"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Waiting for Citizen">Waiting for Citizen</option>
              <option value="Evidence Received">Evidence Received</option>
              <option value="Closure Requested">Closure Requested</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Sort selection */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="created_at_desc">Newest Created</option>
              <option value="created_at_asc">Oldest Created</option>
              <option value="sla_deadline">SLA Deadline</option>
              <option value="severity">Highest Severity</option>
            </select>
          </div>

        </div>
      </Card>

      {/* Error / Loading / Data rendering */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Spinner size="lg" className="text-primary-700" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center border-danger/25 bg-danger/5">
          <AlertCircle size={32} className="text-danger mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-250">Failed to load tickets</h3>
          <p className="text-xs text-neutral-500 mt-1">{error}</p>
          <Button onClick={fetchTickets} size="sm" className="mt-4">
            Retry Connection
          </Button>
        </Card>
      ) : sortedTickets.length === 0 ? (
        <Card className="py-20 text-center space-y-4 shadow-card border border-neutral-150 dark:border-neutral-800">
          <Inbox size={48} className="text-neutral-350 dark:text-neutral-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">No cases matched</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              We couldn't find any tickets matching your search query or selected category filter options.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="flex flex-col justify-between hover:border-primary-500/40 hover:shadow-hover transition-all duration-300 border border-neutral-200/80 dark:border-neutral-800 shadow-card p-5"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <span className="text-[10px] font-black uppercase text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded border border-primary-100/50 dark:border-primary-900/20">
                    {ticket.ticket_number}
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      ticket.severity === 'Critical' ? 'bg-red-150 text-red-800 dark:bg-red-950/45 dark:text-red-400' :
                      ticket.severity === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/45 dark:text-orange-400' :
                      ticket.severity === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-400' :
                      'bg-neutral-100 text-neutral-650 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                      {ticket.severity}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200 line-clamp-1">
                    {ticket.complaint.title}
                  </h3>
                  <p className="text-xs text-neutral-450 dark:text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {ticket.complaint.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-450 border-t border-neutral-100 dark:border-neutral-800/80 pt-3">
                  <span className="font-semibold text-neutral-600 dark:text-neutral-350 truncate max-w-[120px]">
                    👤 {ticket.complaint.reporter_name}
                  </span>
                  <span className="font-medium shrink-0 flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(ticket.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-center justify-between mt-5 border-t border-neutral-100 dark:border-neutral-800/80 pt-3.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  ticket.complaint.status === 'New' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30' :
                  ticket.complaint.status === 'Under Investigation' ? 'bg-orange-50 text-orange-750 dark:bg-orange-950/30' :
                  ticket.complaint.status === 'Waiting for Citizen' ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30' :
                  ticket.complaint.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' :
                  'bg-neutral-50 text-neutral-700'
                }`}>
                  {ticket.complaint.status}
                </span>

                <Link href={`/officer/tickets/${ticket.id}`} className="shrink-0">
                  <Button size="sm" className="px-4 py-1.5 text-xs font-bold shadow-sm">
                    Investigate
                  </Button>
                </Link>
              </div>

            </Card>
          ))}
        </div>
      )}

    </div>
  )
}
