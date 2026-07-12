import { TicketStatus, TicketSeverity } from '@/types'
import { STATUS_CONFIG, SEVERITY_CONFIG } from './constants'

// --- Date formatting ---

export function formatDate(dateStr: string | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...options,
    })
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '—'
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateStr)
  } catch {
    return '—'
  }
}

export function formatSLADeadline(slaDeadline: string | undefined): {
  text: string
  isBreached: boolean
  isWarning: boolean
} {
  if (!slaDeadline) return { text: 'No deadline', isBreached: false, isWarning: false }

  const now = new Date()
  const deadline = new Date(slaDeadline)
  const diffMs = deadline.getTime() - now.getTime()
  const diffHours = diffMs / 3600000

  if (diffMs < 0) {
    const breachedHours = Math.abs(Math.floor(diffHours))
    const breachedDays = Math.floor(breachedHours / 24)
    const text = breachedDays > 0
      ? `Breached ${breachedDays}d ago`
      : `Breached ${breachedHours}h ago`
    return { text, isBreached: true, isWarning: false }
  }

  const hoursLeft = Math.floor(diffHours)
  const daysLeft = Math.floor(hoursLeft / 24)

  const isWarning = diffHours < 12 // Warning if less than 12 hours remain
  const text = daysLeft > 0
    ? `${daysLeft}d ${hoursLeft % 24}h remaining`
    : `${hoursLeft}h remaining`

  return { text, isBreached: false, isWarning }
}

// --- File size formatting ---

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// --- Number formatting ---

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n)
}

// --- Ticket number formatting ---

export function formatTicketNumber(num: string): string {
  return num // Already formatted: CCGP-YYYY-NNNNNN
}

// --- Status / Severity helpers ---

export function getStatusConfig(status: TicketStatus | string) {
  return STATUS_CONFIG[status] || { label: status, color: 'gray', className: 'badge badge-neutral' }
}

export function getSeverityConfig(severity: TicketSeverity | string) {
  return SEVERITY_CONFIG[severity] || { label: severity, className: 'badge badge-neutral' }
}

// --- String helpers ---

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function getInitials(name: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// --- Class name merging ---

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Copy to clipboard ---

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// --- File MIME type helpers ---

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '🗜️'
  return '📎'
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}
