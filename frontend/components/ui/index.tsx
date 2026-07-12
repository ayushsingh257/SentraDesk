'use client'

import { cn } from '@/lib/utils'
import { getStatusConfig, getSeverityConfig, getInitials } from '@/lib/utils'
import { HTMLAttributes } from 'react'

// --- Generic Badge ---
interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'
  className?: string
}

const badgeVariants = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  neutral: 'badge-neutral',
  info:    'badge-info',
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span className={cn('badge', badgeVariants[variant], className)}>
      {children}
    </span>
  )
}

// --- Status Badge ---
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = getStatusConfig(status)
  return <span className={cn(config.className, className)}>{config.label}</span>
}

// --- Severity Badge ---
export function SeverityBadge({ severity, className }: { severity: string; className?: string }) {
  const config = getSeverityConfig(severity)
  return <span className={cn(config.className, className)}>{config.label}</span>
}

// --- Avatar ---
interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  src?: string
  className?: string
}

const avatarSizes = {
  sm:  'avatar-sm',
  md:  'avatar-md',
  lg:  'avatar-lg',
  xl:  'avatar-xl',
}

export function Avatar({ name, size = 'md', src, className }: AvatarProps) {
  if (src) {
    return (
      <img src={src} alt={name} className={cn(avatarSizes[size], 'rounded-full object-cover', className)} />
    )
  }
  return (
    <div className={cn(avatarSizes[size], className)}>{getInitials(name)}</div>
  )
}

// --- Spinner ---
interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string }
const spinnerSizes = { sm: 'w-4 h-4 border-[1.5px]', md: 'w-5 h-5 border-2', lg: 'w-8 h-8 border-2' }

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span className={cn('inline-block border-current border-t-transparent rounded-full animate-spin', spinnerSizes[size], className)} role="status" aria-label="Loading" />
  )
}

// --- Alert ---
interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  children: React.ReactNode
  className?: string
}
const alertTypes = { info: 'alert-info', success: 'alert-success', warning: 'alert-warning', danger: 'alert-danger' }
const alertIcons = { info: 'ℹ️', success: '✅', warning: '⚠️', danger: '🚫' }

export function Alert({ type = 'info', title, children, className }: AlertProps) {
  return (
    <div className={cn(alertTypes[type], className)} role="alert">
      <span className="text-lg leading-none flex-shrink-0">{alertIcons[type]}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}

// --- Skeleton ---
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

// --- Empty State ---
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div>
        <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">{title}</h3>
        {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export { ThemeToggle } from './ThemeToggle'
export { Card, CardHeader, CardBody, CardFooter, KPICard } from './Card'

