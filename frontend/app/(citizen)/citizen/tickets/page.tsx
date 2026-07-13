'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, SlidersHorizontal } from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES, COMPLAINT_CATEGORIES } from '@/lib/constants'
import { TicketCard } from '@/components/citizen/TicketCard'
import { Input } from '@/components/ui/Input'
import { Alert, Spinner, EmptyState } from '@/components/ui/index'

interface Ticket {
  id: string
  ticket_number: string
  category: string
  severity: string
  created_at: string
  complaint: {
    title: string
    description: string
    status: string
  }
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters State
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (category) params.append('category', category)
      params.append('sort_by', sortBy)
      params.append('sort_order', sortOrder)

      const res = await api.get(`${API_ROUTES.myTickets}?${params.toString()}`)
      if (res.data?.success) {
        setTickets(res.data.data)
      }
    } catch (err: unknown) {
      console.error('Failed to load tickets list:', err)
      setError('Unable to fetch registered complaint logs. Please verify connection.')
    } finally {
      setLoading(false)
    }
  }, [search, status, category, sortBy, sortOrder])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const selectClass =
    'w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer'

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            My Registered Complaints
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Monitor state transitions, upload additional files, or follow up with investigating officers.
          </p>
        </div>
        <Link href="/citizen/complaints/new">
          <button className="btn btn-primary flex items-center gap-2 shadow-sm shrink-0 w-full sm:w-auto">
            <PlusCircle size={18} />
            <span>File New Complaint</span>
          </button>
        </Link>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* Filter / Search Bar Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <SlidersHorizontal size={16} className="text-neutral-400" />
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Search and Filters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by ticket number or complaint keyword..."
              leftAddon={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter — native select styled consistently */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="AI Processing">AI Processing</option>
            <option value="Assigned">Assigned</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Waiting for Citizen">Waiting for Response</option>
            <option value="Closed">Closed</option>
            <option value="Reopened">Reopened</option>
          </select>

          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={selectClass}
          >
            <option value="">All Categories</option>
            {COMPLAINT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Sort controls */}
        <div className="flex flex-wrap gap-4 items-center justify-end text-xs text-neutral-500 pt-2">
          <span>Sort By:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent font-semibold text-neutral-800 dark:text-neutral-200 border-none focus:ring-0 cursor-pointer"
          >
            <option value="created_at">Submission Date</option>
            <option value="ticket_number">Ticket Number</option>
          </select>
          
          <span>Order:</span>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-transparent font-semibold text-neutral-800 dark:text-neutral-200 border-none focus:ring-0 cursor-pointer"
          >
            <option value="desc">Newest / Descending</option>
            <option value="asc">Oldest / Ascending</option>
          </select>
        </div>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner size="lg" className="text-primary-700" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl py-16">
          <EmptyState
            title="No complaints match filters"
            description="Adjust your search terms or filters to find registered complaints."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}

    </div>
  )
}
