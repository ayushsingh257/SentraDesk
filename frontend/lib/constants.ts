// ============================================================
// lib/constants.ts — Shared application constants
// ============================================================

// Role hierarchy levels
export const ROLE_LEVELS: Record<string, number> = {
  citizen: 1,
  complaint_operator: 2,
  cyber_cell_officer: 3,
  investigator: 4,
  senior_investigator: 5,
  supervisor: 6,
  security_auditor: 6,
  state_administrator: 7,
  system_administrator: 8,
}

// Role display names
export const ROLE_LABELS: Record<string, string> = {
  citizen: 'Citizen',
  complaint_operator: 'Complaint Operator',
  cyber_cell_officer: 'Cyber Cell Officer',
  investigator: 'Investigator',
  senior_investigator: 'Senior Investigator',
  supervisor: 'Supervisor',
  security_auditor: 'Security Auditor',
  state_administrator: 'State Administrator',
  system_administrator: 'System Administrator',
}

// Role home paths (redirect after login)
export const ROLE_HOME_PATHS: Record<string, string> = {
  citizen: '/citizen/dashboard',
  complaint_operator: '/officer/dashboard',
  cyber_cell_officer: '/officer/dashboard',
  investigator: '/officer/dashboard',
  senior_investigator: '/officer/dashboard',
  supervisor: '/supervisor/dashboard',
  security_auditor: '/admin/audit',
  state_administrator: '/admin/dashboard',
  system_administrator: '/admin/dashboard',
}

// Ticket status display config
export const STATUS_CONFIG: Record<string, { label: string; color: string; className: string }> = {
  'New':                  { label: 'New',                   color: 'gray',   className: 'status-new' },
  'AI Processing':        { label: 'AI Processing',         color: 'blue',   className: 'badge badge-info animate-pulse-soft' },
  'Assigned':             { label: 'Assigned',              color: 'blue',   className: 'status-assigned' },
  'Under Investigation':  { label: 'Under Investigation',   color: 'violet', className: 'status-investigating' },
  'Waiting for Citizen':  { label: 'Waiting for Response',  color: 'amber',  className: 'status-pending' },
  'Evidence Received':    { label: 'Evidence Received',     color: 'amber',  className: 'status-pending' },
  'Closure Requested':    { label: 'Closure Requested',     color: 'orange', className: 'status-closure-requested' },
  'L1 Approved':          { label: 'L1 Approved',           color: 'orange', className: 'status-closure-requested' },
  'Closed':               { label: 'Resolved',              color: 'green',  className: 'status-closed' },
  'Reopened':             { label: 'Reopened',              color: 'red',    className: 'status-reopened' },
}

// Severity display config
export const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  Critical: { label: 'Critical', className: 'severity-critical' },
  High:     { label: 'High',     className: 'severity-high' },
  Medium:   { label: 'Medium',   className: 'severity-medium' },
  Low:      { label: 'Low',      className: 'severity-low' },
}

// Complaint categories
export const COMPLAINT_CATEGORIES = [
  'UPI Fraud',
  'Banking Fraud',
  'Credit Card Fraud',
  'Loan Scam',
  'Cryptocurrency Scam',
  'Social Media Fraud',
  'Identity Theft',
  'OTP Scam',
  'Investment Scam',
  'Phishing',
  'QR Code Fraud',
  'Fake Job Scam',
  'Fake Shopping Website',
  'Sextortion',
  'Malware',
  'Ransomware',
  'Cyber Harassment',
  'Cyber Financial Fraud',
  'Hacking',
  'Online Harassment',
  'Cyber Stalking',
  'Other Cybercrime',
] as const

// Common password blacklist (checked client-side; also enforced server-side)
export const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'password1234',
  '12345678', '123456789', '1234567890', '12345678910',
  'qwerty', 'qwerty123', 'qwertyuiop', 'qwerty1',
  'admin', 'admin123', 'admin1234', 'admin@123',
  'welcome', 'welcome1', 'welcome123',
  'letmein', 'letmein1', 'letmein123',
  'abc123', 'abc1234', 'abc123456',
  'test123', 'test1234', 'test@123',
  'changeme', 'changeme1', 'change123',
  'iloveyou', 'sunshine', 'master',
  'pass1234', 'ccgp123', 'cyber123',
  'monkey', 'dragon', 'princess',
  'football', 'baseball', 'login',
  'passw0rd', 'p@ssword', 'p@ss123',
])

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  maxLength: 128,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasDigit: /[0-9]/,
  hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/,
}

// API endpoints
export const API_ROUTES = {
  // Auth
  login: '/api/v1/auth/login',
  logout: '/api/v1/auth/logout',
  refresh: '/api/v1/auth/refresh',
  verifyEmail: '/api/v1/auth/verify-email',
  forgotPassword: '/api/v1/auth/forgot-password',
  resetPassword: '/api/v1/auth/reset-password',

  // Users
  register: '/api/v1/users/register',
  me: '/api/v1/users/me',
  myStats: '/api/v1/users/me/stats',
  updateProfile: '/api/v1/users/me',
  changePassword: '/api/v1/users/me/password',
  notifications: '/api/v1/users/notifications',
  notificationUnreadCount: '/api/v1/users/notifications/unread-count',
  markNotificationRead: (id: string) => `/api/v1/users/notifications/${id}/read`,
  markAllNotificationsRead: '/api/v1/users/notifications/read-all',

  // Tickets
  tickets: '/api/v1/tickets',
  myTickets: '/api/v1/tickets/my-tickets',
  ticket: (id: string) => `/api/v1/tickets/${id}`,
  assignTicket: (id: string) => `/api/v1/tickets/${id}/assign`,
  updateStatus: (id: string) => `/api/v1/tickets/${id}/status`,
  ticketComments: (id: string) => `/api/v1/tickets/${id}/comments`,
  ticketNotes: (id: string) => `/api/v1/tickets/${id}/notes`,
  ticketTimeline: (id: string) => `/api/v1/tickets/${id}/timeline`,
  ticketSimilar: (id: string) => `/api/v1/tickets/${id}/similar`,
  ticketAISummary: (id: string) => `/api/v1/tickets/${id}/ai-summary`,
  ticketExplain: (id: string) => `/api/v1/tickets/${id}/explain`,
  ticketComplaintReport: (id: string) => `/api/v1/tickets/${id}/report/complaint`,
  ticketCaseReport: (id: string) => `/api/v1/tickets/${id}/report/case`,
  ticketFeedback: (id: string) => `/api/v1/tickets/${id}/feedback`,
  ticketReopen: (id: string) => `/api/v1/tickets/${id}/reopen`,
  ticketSearch: '/api/v1/tickets/global/search',
  mergeTickets: '/api/v1/tickets/merge',

  // Evidence
  evidenceUploadLink: (ticketId: string) => `/api/v1/evidence/${ticketId}/upload-link`,
  evidenceSave: (ticketId: string) => `/api/v1/evidence/${ticketId}/save`,
  evidenceList: (ticketId: string) => `/api/v1/evidence/${ticketId}`,
  evidenceDownload: (evidenceId: string) => `/api/v1/evidence/download/${evidenceId}`,
  evidenceZip: (ticketId: string) => `/api/v1/evidence/${ticketId}/zip`,
  verifyIntegrity: (evidenceId: string) => `/api/v1/evidence/${evidenceId}/verify-integrity`,

  // Approvals
  requestClosure: (ticketId: string) => `/api/v1/approvals/${ticketId}/request-closure`,
  l1Approve: (ticketId: string) => `/api/v1/approvals/${ticketId}/l1-approve`,
  l2Approve: (ticketId: string) => `/api/v1/approvals/${ticketId}/l2-approve`,
  rejectClosure: (ticketId: string) => `/api/v1/approvals/${ticketId}/reject`,

  // Audit
  auditLogs: '/api/v1/audit/logs',
  auditVerify: '/api/v1/audit/verify',
  auditAnchor: '/api/v1/audit/anchor',
  auditExportPDF: '/api/v1/audit/export/pdf',


  // Governance
  governanceKPIs: '/api/v1/governance/kpis',
  governanceReport: '/api/v1/governance/reports/dispatch',
  exportJSON: '/api/v1/governance/export/json',
  exportCSV: '/api/v1/governance/export/csv',

  // Officer
  officerDashboard: '/api/v1/officer/dashboard',

  // Supervisor
  supervisorDashboard: '/api/v1/supervisor/dashboard',
  bulkApprove: '/api/v1/supervisor/bulk-approve',
  bulkReassign: '/api/v1/supervisor/bulk-reassign',
  bulkPriority: '/api/v1/supervisor/bulk-priority',
  bulkEscalate: '/api/v1/supervisor/bulk-escalate',

  // Admin
  adminDashboard: '/api/v1/admin/dashboard',
  adminUsers: '/api/v1/admin/users',
  adminUser: (id: string) => `/api/v1/admin/users/${id}`,
  adminSystemHealth: '/api/v1/admin/system-health',

  // Health
  health: '/api/v1/health',
  metrics: '/api/v1/metrics',
} as const

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20

// SLA hours by severity
export const SLA_HOURS: Record<string, number> = {
  Critical: 24,
  High: 72,
  Medium: 168,
  Low: 360,
}
