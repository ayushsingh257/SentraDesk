'use client'

import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

// --- Card ---
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  as?: 'div' | 'article' | 'section'
}

export function Card({ hover, as: Tag = 'div', className, children, ...props }: CardProps) {
  return (
    <Tag className={cn(hover ? 'card-hover' : 'card', className)} {...(props as HTMLAttributes<HTMLDivElement>)}>
      {children}
    </Tag>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card-header', className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ className, size = 'default', children, ...props }: HTMLAttributes<HTMLDivElement> & { size?: 'default' | 'sm' }) {
  return (
    <div className={cn(size === 'sm' ? 'card-body-sm' : 'card-body', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card-footer', className)} {...props}>
      {children}
    </div>
  )
}

// --- KPI Card ---
interface KPICardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: number; label: string; positive?: boolean }
  className?: string
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
}

const accentMap = {
  primary: 'text-primary-600 bg-primary-50 dark:bg-primary-950 dark:text-primary-400',
  success: 'text-success bg-green-50 dark:bg-green-950 dark:text-green-400',
  warning: 'text-warning bg-amber-50 dark:bg-amber-950 dark:text-amber-400',
  danger:  'text-danger bg-red-50 dark:bg-red-950 dark:text-red-400',
  neutral: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400',
}

export function KPICard({ label, value, icon, trend, className, accent = 'primary' }: KPICardProps) {
  return (
    <Card className={cn('kpi-card', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="kpi-label">{label}</p>
          <p className="kpi-value mt-1">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium mt-1', trend.positive !== false ? 'text-success' : 'text-danger')}>
              {trend.positive !== false ? '↑' : '↓'} {trend.value}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', accentMap[accent])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
