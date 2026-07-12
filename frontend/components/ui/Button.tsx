'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantClasses = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  outline:   'btn-outline',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
  success:   'btn-success',
}

const sizeClasses = {
  sm:   'btn-sm',
  md:   '',
  lg:   'btn-lg',
  xl:   'btn-xl',
  icon: 'btn-icon',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn('btn', variantClasses[variant], sizeClasses[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="spinner w-4 h-4 border-[1.5px]" />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
