'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  KeyRound, 
  ShieldAlert, 
  X, 
  Edit3,
  RefreshCw
} from 'lucide-react'

import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Alert, Spinner } from '@/components/ui/index'

interface UserAccount {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  email_verified: boolean
  department: string | null
  jurisdiction: string | null
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  
  // Edit / Password Reset Modal States
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null)
  const [modalType, setModalType] = useState<'edit' | 'password' | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Edit fields
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editDept, setEditDept] = useState('')
  const [editJuris, setEditJuris] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.append('q', searchQuery)
      if (roleFilter) params.append('role', roleFilter)

      const res = await api.get(`/api/v1/admin/users?${params.toString()}`)
      if (res.data?.success) {
        setUsers(res.data.data)
      }
    } catch (err: any) {
      console.error('Failed to load system users:', err)
      setError('Unable to load user accounts list. Ensure uvicorn server connection.')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Toggle user activation status
  const handleToggleActivation = async (user: UserAccount) => {
    try {
      const res = await api.put(`/api/v1/admin/users/${user.id}`, {
        is_active: !user.is_active
      })
      if (res.data?.success) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !user.is_active } : u))
      }
    } catch (err) {
      console.error('Toggle activation failed:', err)
    }
  }

  // Open Edit Profile Modal
  const openEditModal = (user: UserAccount) => {
    setActiveUser(user)
    setEditName(user.name)
    setEditRole(user.role)
    setEditDept(user.department || '')
    setEditJuris(user.jurisdiction || '')
    setModalType('edit')
    setModalError(null)
  }

  // Open Password Reset Modal
  const openPasswordModal = (user: UserAccount) => {
    setActiveUser(user)
    setNewPassword('')
    setModalType('password')
    setModalError(null)
  }

  // Handle Edit Profile Submission
  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeUser) return
    setSaveLoading(true)
    setModalError(null)
    try {
      const res = await api.put(`/api/v1/admin/users/${activeUser.id}`, {
        name: editName,
        role: editRole,
        department: editDept || null,
        jurisdiction: editJuris || null
      })
      if (res.data?.success) {
        setModalType(null)
        setActiveUser(null)
        fetchUsers()
      }
    } catch (err: any) {
      setModalError('Failed to save profile changes.')
    } finally {
      setSaveLoading(false)
    }
  }

  // Handle Password Reset Submission
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeUser || !newPassword.trim()) return
    if (newPassword.length < 12) {
      setModalError('Reset password must be at least 12 characters.')
      return
    }
    setSaveLoading(true)
    setModalError(null)
    try {
      const res = await api.put(`/api/v1/admin/users/${activeUser.id}`, {
        password: newPassword
      })
      if (res.data?.success) {
        setModalType(null)
        setActiveUser(null)
        alert('Password successfully reset.')
      }
    } catch (err: any) {
      setModalError('Failed to reset account credentials.')
    } finally {
      setSaveLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'citizen': return 'Citizen'
      case 'complaint_operator': return 'Operator'
      case 'cyber_cell_officer': return 'Cell Officer'
      case 'investigator': return 'Investigator'
      case 'supervisor': return 'Supervisor'
      case 'system_administrator': return 'Admin'
      default: return role
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          System Users Directory
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Create, edit, suspend accounts, and configure jurisdictional investigator parameters.
        </p>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {/* Filter / Search Bar */}
      <Card className="p-4 shadow-card border border-neutral-100 dark:border-neutral-700/60 bg-white dark:bg-neutral-850">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search users by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto shrink-0">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-neutral-250 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">All System Roles</option>
              <option value="citizen">Citizen</option>
              <option value="complaint_operator">Complaint Operator</option>
              <option value="cyber_cell_officer">Cyber Cell Officer</option>
              <option value="investigator">Investigator</option>
              <option value="supervisor">Supervisor</option>
              <option value="system_administrator">System Admin</option>
            </select>

            <Button onClick={fetchUsers} size="sm" className="flex items-center gap-1">
              <RefreshCw size={14} />
              <span>Query</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <Spinner size="lg" className="text-primary-700" />
        </div>
      ) : users.length === 0 ? (
        <Card className="py-16 text-center space-y-3 border border-neutral-200 dark:border-neutral-800">
          <Users size={40} className="text-neutral-350 dark:text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">No accounts match parameters</h3>
          <p className="text-xs text-neutral-450">Try broadening your search metrics or filter options.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden shadow-card border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-150 dark:border-neutral-800 text-neutral-450 font-extrabold uppercase">
                  <th className="px-5 py-4">Account Holder</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Allocation</th>
                  <th className="px-5 py-4">Suspension Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-150 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                    <td className="px-5 py-4.5">
                      <div className="font-extrabold text-neutral-900 dark:text-white text-xs">{u.name}</div>
                      <div className="text-[10px] text-neutral-400 font-semibold mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-5 py-4.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        u.role === 'citizen' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800' :
                        u.role === 'system_administrator' ? 'bg-danger/10 text-danger' :
                        'bg-primary-50 text-primary-700 dark:bg-primary-950/20'
                      }`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-5 py-4.5">
                      {u.role === 'citizen' ? (
                        <span className="text-neutral-400 font-medium">—</span>
                      ) : (
                        <div>
                          <div className="font-bold">{u.department || 'General Triage'}</div>
                          <div className="text-[10px] text-neutral-400 font-semibold mt-0.5">{u.jurisdiction || 'District Cell'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        u.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-red-50 text-red-750 dark:bg-red-950/20'
                      }`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-4.5 text-right space-x-1.5 whitespace-nowrap">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openEditModal(u)}
                        className="p-1.5"
                      >
                        <Edit3 size={13} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openPasswordModal(u)}
                        className="p-1.5"
                      >
                        <KeyRound size={13} />
                      </Button>
                      <Button 
                        size="sm"
                        variant={u.is_active ? 'outline' : 'success'}
                        onClick={() => handleToggleActivation(u)}
                        className={u.is_active ? 'text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/10' : 'bg-emerald-600 hover:bg-emerald-750'}
                      >
                        {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit User Modal */}
      {modalType === 'edit' && activeUser && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 relative bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 shadow-card animate-scale-in">
            <button 
              onClick={() => setModalType(null)}
              className="absolute right-4 top-4 p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-4">
              Edit User Settings
            </h2>

            {modalError && <Alert type="danger">{modalError}</Alert>}

            <form onSubmit={handleEditProfile} className="space-y-4 text-xs font-bold">
              <Input
                label="Full Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <span className="text-[10px] text-neutral-400 uppercase">System Role</span>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-250 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                  <option value="citizen">Citizen</option>
                  <option value="complaint_operator">Complaint Operator</option>
                  <option value="cyber_cell_officer">Cyber Cell Officer</option>
                  <option value="investigator">Investigator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="system_administrator">System Admin</option>
                </select>
              </div>

              {editRole !== 'citizen' && (
                <>
                  <Input
                    label="Department / Unit"
                    placeholder="e.g. Financial Fraud Unit"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                  />

                  <Input
                    label="Jurisdiction Area"
                    placeholder="e.g. Zone Alpha"
                    value={editJuris}
                    onChange={(e) => setEditJuris(e.target.value)}
                  />
                </>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setModalType(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  isLoading={saveLoading}
                >
                  Save Profile
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Password Reset Modal */}
      {modalType === 'password' && activeUser && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 relative bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 shadow-card animate-scale-in">
            <button 
              onClick={() => setModalType(null)}
              className="absolute right-4 top-4 p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-4">
              Reset User Password
            </h2>

            {modalError && <Alert type="danger">{modalError}</Alert>}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new secure password (12+ characters)..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helpText="Must satisfy strength checks (upper, lower, digits, symbols)."
                required
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setModalType(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  isLoading={saveLoading}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  )
}
