'use client'

import { useState, useEffect } from 'react'
import { COMMON_PASSWORDS, PASSWORD_REQUIREMENTS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface StrengthMeterProps {
  password?: string
  onChangeValidity?: (isValid: boolean) => void
}

export function PasswordStrengthMeter({ password = '', onChangeValidity }: StrengthMeterProps) {
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')

  const checks = {
    length: password.length >= PASSWORD_REQUIREMENTS.minLength && password.length <= PASSWORD_REQUIREMENTS.maxLength,
    uppercase: PASSWORD_REQUIREMENTS.hasUppercase.test(password),
    lowercase: PASSWORD_REQUIREMENTS.hasLowercase.test(password),
    digit: PASSWORD_REQUIREMENTS.hasDigit.test(password),
    special: PASSWORD_REQUIREMENTS.hasSpecial.test(password),
    notCommon: !COMMON_PASSWORDS.has(password.toLowerCase()),
  }

  useEffect(() => {
    if (!password) {
      setScore(0)
      setFeedback('')
      onChangeValidity?.(false)
      return
    }

    let currentScore = 0
    if (checks.length) currentScore += 1
    if (checks.uppercase) currentScore += 1
    if (checks.lowercase) currentScore += 1
    if (checks.digit) currentScore += 1
    if (checks.special) currentScore += 1
    
    // Blacklisted password auto-fails the strength meter
    const isBlacklisted = !checks.notCommon
    if (isBlacklisted) {
      currentScore = 0
    }

    setScore(currentScore)

    if (isBlacklisted) {
      setFeedback('Common password — rejected for security')
      onChangeValidity?.(false)
    } else if (currentScore < 3) {
      setFeedback('Weak password')
      onChangeValidity?.(false)
    } else if (currentScore < 5) {
      setFeedback('Moderate password')
      onChangeValidity?.(false)
    } else {
      setFeedback('Strong password')
      onChangeValidity?.(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password])

  const barColors = [
    'bg-danger',     // Score 0-1 (Weak/Common)
    'bg-danger',     // Score 2 (Weak)
    'bg-warning',    // Score 3 (Moderate)
    'bg-warning',    // Score 4 (Moderate)
    'bg-success',    // Score 5 (Strong)
  ]

  return (
    <div className="mt-3 space-y-3">
      {/* Progress Bars */}
      <div>
        <div className="flex items-center gap-1.5 h-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                'flex-1 h-full rounded-full transition-colors duration-300',
                score >= level ? barColors[score - 1] : 'bg-neutral-200 dark:bg-neutral-700'
              )}
            />
          ))}
        </div>
        {password && (
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Password Strength
            </span>
            <span
              className={cn(
                'text-xs font-bold',
                score <= 2 ? 'text-danger' : score <= 4 ? 'text-warning' : 'text-success'
              )}
            >
              {feedback}
            </span>
          </div>
        )}
      </div>

      {/* Rules list */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        {[
          { label: '12-128 characters', met: checks.length },
          { label: 'At least one uppercase letter', met: checks.uppercase },
          { label: 'At least one lowercase letter', met: checks.lowercase },
          { label: 'At least one digit (0-9)', met: checks.digit },
          { label: 'At least one special character', met: checks.special },
          { label: 'Not a common password', met: checks.notCommon },
        ].map((rule) => (
          <li key={rule.label} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold border',
                rule.met
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400'
              )}
            >
              {rule.met ? '✓' : '✗'}
            </span>
            <span className={cn(rule.met && 'text-neutral-700 dark:text-neutral-200 font-medium')}>
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
