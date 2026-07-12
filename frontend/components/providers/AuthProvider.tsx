'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setStoredUser,
  isTokenExpired,
  getHomePath,
} from '@/lib/auth'
import { User, UserRole, LoginResponse } from '@/types'

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserRole>
  logout: () => Promise<void>
  reloadSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function initAuth() {
      try {
        const token = getAccessToken()
        const storedUser = getStoredUser()

        if (token && storedUser && !isTokenExpired(token)) {
          setAccessToken(token)
          // Fetch fresh user details to sync
          const response = await api.get(API_ROUTES.me)
          const freshUser = response.data.data
          setUser(freshUser)
          setStoredUser({
            id: freshUser.id,
            name: freshUser.name,
            role: freshUser.role,
          })
        } else {
          // Attempt refresh on start if refresh token is present
          const refreshToken = getRefreshToken()
          if (refreshToken) {
            const refreshRes = await api.post(API_ROUTES.refresh, {
              refresh_token: refreshToken,
            })
            const { access_token, refresh_token: newRefreshToken } = refreshRes.data.data
            setTokens(access_token, newRefreshToken)
            setAccessToken(access_token)

            const userRes = await api.get(API_ROUTES.me)
            const freshUser = userRes.data.data
            setUser(freshUser)
            setStoredUser({
              id: freshUser.id,
              name: freshUser.name,
              role: freshUser.role,
            })
          } else {
            clearTokens()
          }
        }
      } catch (err) {
        console.error('Failed to initialize session:', err)
        clearTokens()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<UserRole> => {
    setIsLoading(true)
    try {
      const response = await api.post(API_ROUTES.login, { email, password })
      const loginData: LoginResponse = response.data.data
      
      setTokens(loginData.access_token, loginData.refresh_token)
      setAccessToken(loginData.access_token)

      // Fetch complete user profile
      const userResponse = await api.get(API_ROUTES.me)
      const fullUser: User = userResponse.data.data
      
      setUser(fullUser)
      setStoredUser({
        id: fullUser.id,
        name: fullUser.name,
        role: fullUser.role,
      })

      return fullUser.role
    } catch (err) {
      clearTokens()
      setUser(null)
      setAccessToken(null)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        await api.post(API_ROUTES.logout, { refresh_token: refreshToken })
      }
    } catch (err) {
      console.error('Logout request failed:', err)
    } finally {
      clearTokens()
      setUser(null)
      setAccessToken(null)
      setIsLoading(false)
      router.push('/auth/login')
    }
  }

  const reloadSession = async () => {
    try {
      const userRes = await api.get(API_ROUTES.me)
      const freshUser: User = userRes.data.data
      setUser(freshUser)
      setStoredUser({
        id: freshUser.id,
        name: freshUser.name,
        role: freshUser.role,
      })
    } catch (err) {
      console.error('Failed to reload session:', err)
    }
  }

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    reloadSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
