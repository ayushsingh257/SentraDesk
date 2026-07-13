'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckSquare, RefreshCw } from 'lucide-react'

import api from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Card, Alert, Spinner } from '@/components/ui/index'
import { formatRelativeTime } from '@/lib/utils'

interface InAppNotification {
  id: string
  ticket_id: string | null
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export default function NotificationCenter() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await api.get(API_ROUTES.notifications)
      if (res.data?.success) {
        setNotifications(res.data.data)
      }
    } catch (err: any) {
      console.error('Failed to load notifications:', err)
      setError('Unable to load alerts. Please check server connections.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markAllAsRead = async () => {
    setActionLoading(true)
    try {
      const res = await api.put(API_ROUTES.markAllNotificationsRead)
      if (res.data?.success) {
        // Optimistically set all as read
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleNotificationClick = async (notif: InAppNotification) => {
    // If unread, mark as read
    if (!notif.is_read) {
      try {
        await api.put(API_ROUTES.markNotificationRead(notif.id))
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        )
      } catch (err) {
        console.error('Failed to mark notification read:', err)
      }
    }

    // Redirect to ticket details if ticket_id is present
    if (notif.ticket_id) {
      router.push(`/citizen/tickets/${notif.ticket_id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Notification Center
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            You have {unreadCount} unread system notifications.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadNotifications}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </Button>
          {unreadCount > 0 && (
            <Button 
              size="sm" 
              onClick={markAllAsRead} 
              isLoading={actionLoading}
              className="flex items-center gap-2"
            >
              <CheckSquare size={14} />
              <span>Mark All Read</span>
            </Button>
          )}
        </div>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* Notifications List */}
      <Card className="p-0 overflow-hidden border border-neutral-200/80 dark:border-neutral-800 shadow-card">
        {notifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Bell size={40} className="text-neutral-300 dark:text-neutral-600 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">No alerts found</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Any updates to case status, assignment details, or public officer correspondence messages will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-150 dark:divide-neutral-800">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full text-left p-5 flex gap-4 transition-colors duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 relative ${
                  !notif.is_read ? 'bg-primary-50/20 dark:bg-primary-950/10' : ''
                }`}
              >
                {/* Unread indicator bullet */}
                {!notif.is_read && (
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-4">
                    <p className={`text-sm ${!notif.is_read ? 'font-black text-neutral-900 dark:text-white' : 'font-semibold text-neutral-700 dark:text-neutral-300'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-neutral-400 font-medium shrink-0">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}
