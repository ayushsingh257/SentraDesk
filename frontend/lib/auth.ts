import { UserRole } from '@/types'
import { ROLE_LEVELS, ROLE_HOME_PATHS } from './constants'

// Storage keys
const ACCESS_TOKEN_KEY = 'ccgp_access_token'
const REFRESH_TOKEN_KEY = 'ccgp_refresh_token'
const USER_KEY = 'ccgp_user'

// --- Token management ---

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// --- User session management ---

export function getStoredUser(): { id: string; name: string; role: UserRole } | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setStoredUser(user: { id: string; name: string; role: UserRole }): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// --- JWT payload decoding ---

export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function getTokenRole(token: string): UserRole | null {
  const payload = decodeJWT(token)
  return (payload?.role as UserRole) || null
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload?.exp) return true
  const exp = payload.exp as number
  return Date.now() / 1000 >= exp - 30 // 30 second buffer
}

// --- Role-based authorization ---

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = ROLE_LEVELS[userRole] || 0
  const requiredLevel = ROLE_LEVELS[requiredRole] || 999
  return userLevel >= requiredLevel
}

export function isOfficer(role: UserRole): boolean {
  return ROLE_LEVELS[role] >= ROLE_LEVELS['cyber_cell_officer']
}

export function isAdmin(role: UserRole): boolean {
  return ROLE_LEVELS[role] >= ROLE_LEVELS['system_administrator']
}

export function isCitizen(role: UserRole): boolean {
  return role === 'citizen'
}

export function getHomePath(role: UserRole): string {
  return ROLE_HOME_PATHS[role] || '/auth/login'
}

// --- Authentication check ---

export function isAuthenticated(): boolean {
  const token = getAccessToken()
  if (!token) return false
  return !isTokenExpired(token)
}
