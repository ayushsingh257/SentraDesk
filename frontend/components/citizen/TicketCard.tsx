'use client'

import Link from 'next/link'
import { Calendar, ChevronRight, FileText } from 'lucide-react'
import { Card } from '@/components/ui/index'

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

interface TicketCardProps {
  ticket: Ticket
}

export function TicketCard({ ticket }: TicketCardProps) {
  const status = ticket.complaint?.status || 'New'
  const severity = ticket.severity || 'Low'

  return (
    <Card className="hover:shadow-hover border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 hover:border-primary-500/30 dark:hover:border-primary-400/20 transition-all duration-200 flex flex-col justify-between gap-5 bg-white dark:bg-neutral-900 group">
      
      {/* Top Header Row */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-xs font-bold text-primary-600 dark:text-primary-400 tracking-wider uppercase bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-lg">
            {ticket.ticket_number}
          </span>
          <h3 className="text-base font-extrabold text-neutral-900 dark:text-white mt-3 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors duration-200 line-clamp-1">
            {ticket.complaint?.title}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
            {ticket.complaint?.description}
          </p>
        </div>
      </div>

      {/* Attributes Footer Grid */}
      <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Calendar size={14} />
            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border ${
            severity === 'Critical'
              ? 'bg-danger/10 border-danger/20 text-danger'
              : severity === 'High'
              ? 'bg-warning/10 border-warning/20 text-warning'
              : 'bg-neutral-50 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
          }`}>
            {severity}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
            status === 'Closed'
              ? 'bg-success/10 border-success/30 text-success'
              : status === 'Pending Response'
              ? 'bg-warning/10 border-warning/30 text-warning animate-pulse'
              : 'bg-primary-50 border-primary-200 dark:bg-primary-950/40 dark:border-primary-900 text-primary-700 dark:text-primary-400'
          }`}>
            {status}
          </span>
          <Link 
            href={`/citizen/tickets/${ticket.id}`}
            className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-primary-700 hover:text-white transition-all duration-200 shadow-sm shrink-0 border border-neutral-100 dark:border-neutral-700"
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

    </Card>
  )
}
