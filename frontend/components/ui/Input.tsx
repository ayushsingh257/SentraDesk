'use client'

import { cn } from '@/lib/utils'
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

// --- Input ---
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  required?: boolean
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, required, leftAddon, rightAddon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={inputId} className={cn('label', required && 'label-required')}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center text-neutral-400 pointer-events-none">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input',
              error && 'input-error',
              leftAddon && 'pl-10',
              rightAddon && 'pr-10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center text-neutral-400">
              {rightAddon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="error-message">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${inputId}-help`} className="help-text">
            {helpText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// --- Textarea ---
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helpText?: string
  required?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, required, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={inputId} className={cn('label', required && 'label-required')}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn('input resize-none', error && 'input-error', className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="error-message">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p className="help-text">{helpText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// --- Select ---
interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helpText?: string
  required?: boolean
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helpText, required, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={inputId} className={cn('label', required && 'label-required')}>
            {label}
          </label>
        )}
        <select
          ref={ref as React.Ref<HTMLSelectElement>}
          id={inputId}
          className={cn('input appearance-none cursor-pointer', error && 'input-error', className)}
          {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="error-message">{error}</p>}
        {helpText && !error && <p className="help-text">{helpText}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
