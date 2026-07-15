'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, Save, RefreshCw, Send, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert, Spinner } from '@/components/ui/index'

interface NotificationLog {
  id: string
  recipient: string
  template_name: string
  status: string
  error_message: string | null
  retry_count: number
  sent_at: string | null
  created_at: string | null
}

export default function NotificationAdministration() {
  const [smtp, setSmtp] = useState<any>({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: 'alerts.ccgp@example.com',
    smtp_from_email: 'alerts.ccgp@example.com',
    smtp_from_name: 'CCGP Alert System'
  })

  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadSmtpAndLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const [configRes, logsRes] = await Promise.all([
        api.get('/api/v1/admin/config'),
        api.get('/api/v1/admin/notifications/logs')
      ])
      if (configRes.data?.success) {
        setSmtp(configRes.data.data.email_settings || {})
      }
      if (logsRes.data?.success) {
        setLogs(logsRes.data.data)
      }
    } catch (err) {
      console.error('Failed to load SMTP config or logs:', err)
      setError('Unable to fetch alerts delivery history logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSmtpAndLogs()
  }, [])

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.put('/api/v1/admin/config', {
        key: 'email_settings',
        value: smtp
      })
      if (res.data?.success) {
        setSuccess('SMTP mail server parameter settings updated.')
      }
    } catch (err) {
      console.error('SMTP config write failure:', err)
      setError('Failed to update email gateway parameters.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-xs font-bold">
      
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          SMTP Gateway & Alerts Engine
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Monitor dispatch queues, configure mail server bindings, and review retry logs.
        </p>
      </div>

      {error && <Alert type="danger">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Logs List */}
        <Card className="lg:col-span-2 p-6 space-y-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
          <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Send className="text-primary-600 w-4 h-4" />
            <span>Delivery Queue & Retry logs</span>
          </h2>

          <div className="overflow-x-auto rounded-lg border border-neutral-100 dark:border-neutral-800">
            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800 text-neutral-450 uppercase font-black border-b border-neutral-150 dark:border-neutral-800">
                  <th className="px-4 py-3">Recipient Address</th>
                  <th className="px-4 py-3">Template</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Retry count</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-150 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                      No notifications have been queued or sent.
                    </td>
                  </tr>
                ) : (
                  logs.map(l => (
                    <tr key={l.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                      <td className="px-4 py-3 font-extrabold text-neutral-900 dark:text-white">{l.recipient}</td>
                      <td className="px-4 py-3 uppercase">{l.template_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          l.status === 'Sent' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                          l.status === 'Failed' ? 'bg-red-50 text-red-750 dark:bg-red-950/20' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{l.retry_count}</td>
                      <td className="px-4 py-3">{l.created_at ? new Date(l.created_at).toLocaleString() : 'Pending'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* SMTP configuration parameters */}
        <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-card">
          <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
            <ShieldAlert className="text-primary-600 w-4 h-4" />
            <span>SMTP Server Configurations</span>
          </h2>

          <form onSubmit={handleSaveSmtp} className="space-y-4">
            <Input
              label="SMTP Host Bind Address"
              value={smtp.smtp_host}
              onChange={(e) => setSmtp({ ...smtp, smtp_host: e.target.value })}
              required
            />

            <Input
              label="SMTP Gate Port"
              type="number"
              value={smtp.smtp_port}
              onChange={(e) => setSmtp({ ...smtp, smtp_port: parseInt(e.target.value) || 587 })}
              required
            />

            <Input
              label="Username (credential)"
              value={smtp.smtp_user}
              onChange={(e) => setSmtp({ ...smtp, smtp_user: e.target.value })}
              required
            />

            <Input
              label="Sender Display Address"
              value={smtp.smtp_from_email}
              onChange={(e) => setSmtp({ ...smtp, smtp_from_email: e.target.value })}
              required
            />

            <Input
              label="Sender Name"
              value={smtp.smtp_from_name}
              onChange={(e) => setSmtp({ ...smtp, smtp_from_name: e.target.value })}
              required
            />

            <Button type="submit" isLoading={actionLoading} className="w-full">
              Save Server Parameters
            </Button>
          </form>
        </Card>

      </div>

    </div>
  )
}
