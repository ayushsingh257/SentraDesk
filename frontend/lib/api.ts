import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

// Create the centralized axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor — inject JWT access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ccgp_access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Track if a refresh is already in progress to avoid loops
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else if (token) {
      p.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor — handle 401, refresh token rotation
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Skip refresh for auth endpoints themselves
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/logout')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(api(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = typeof window !== 'undefined'
          ? localStorage.getItem('ccgp_refresh_token')
          : null

        const res = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken || undefined },
          { withCredentials: true }
        )

        const { access_token, refresh_token: newRefreshToken } = res.data.data

        if (typeof window !== 'undefined') {
          if (access_token) localStorage.setItem('ccgp_access_token', access_token)
          if (newRefreshToken) localStorage.setItem('ccgp_refresh_token', newRefreshToken)
        }

        processQueue(null, access_token)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)

        // Clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ccgp_access_token')
          localStorage.removeItem('ccgp_refresh_token')
          localStorage.removeItem('ccgp_user')
          window.location.href = '/auth/login?session=expired'
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
