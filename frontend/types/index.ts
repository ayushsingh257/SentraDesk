// ============================================================
// TypeScript Type Definitions — SentraDesk Platform
// ============================================================

// --- User & Auth ---

export type UserRole =
  | 'citizen'
  | 'complaint_operator'
  | 'cyber_cell_officer'
  | 'investigator'
  | 'senior_investigator'
  | 'supervisor'
  | 'security_auditor'
  | 'state_administrator'
  | 'system_administrator'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  is_active: boolean
  email_verified: boolean
  created_at: string
  updated_at?: string
}

export interface UserStats {
  open_tickets: number
  closed_tickets: number
  under_investigation: number
  pending_response: number
  total_tickets: number
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  role: UserRole
  user_id: string
  name: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// --- API Standard Response ---

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  error: ApiError | null
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

// --- Tickets & Complaints ---

export type TicketStatus =
  | 'New'
  | 'AI Processing'
  | 'Assigned'
  | 'Under Investigation'
  | 'Waiting for Citizen'
  | 'Evidence Received'
  | 'Closure Requested'
  | 'L1 Approved'
  | 'Closed'
  | 'Reopened'

export type TicketSeverity = 'Critical' | 'High' | 'Medium' | 'Low'

export type TicketCategory =
  | 'UPI Fraud'
  | 'Banking Fraud'
  | 'Credit Card Fraud'
  | 'Loan Scam'
  | 'Cryptocurrency Scam'
  | 'Social Media Fraud'
  | 'Identity Theft'
  | 'OTP Scam'
  | 'Investment Scam'
  | 'Phishing'
  | 'QR Code Fraud'
  | 'Fake Job Scam'
  | 'Fake Shopping Website'
  | 'Sextortion'
  | 'Malware'
  | 'Ransomware'
  | 'Cyber Harassment'
  | 'Cyber Financial Fraud'
  | 'Hacking'
  | 'Online Harassment'
  | 'Cyber Stalking'
  | 'Other Cybercrime'
  | 'Unclassified'

export interface Complaint {
  id: string
  title: string
  description: string
  source: string
  status: TicketStatus
  reporter_name: string
  reporter_email?: string
  reporter_phone?: string
  citizen_id?: string
  metadata_json?: Record<string, unknown>
  created_at: string
  updated_at?: string
}

export interface Ticket {
  id: string
  ticket_number: string
  complaint_id: string
  complaint: Complaint
  category: TicketCategory
  severity: TicketSeverity
  assigned_officer_id?: string
  assigned_group?: string
  jurisdiction?: string
  sla_deadline?: string
  is_escalated: boolean
  l1_approved: boolean
  l2_approved: boolean
  rating?: number
  feedback?: string
  reopened_at?: string
  reopen_reason?: string
  created_at: string
  updated_at?: string
}

export interface TicketListItem {
  id: string
  ticket_number: string
  title: string
  category: TicketCategory
  severity: TicketSeverity
  status: TicketStatus
  is_escalated: boolean
  sla_deadline?: string
  created_at: string
  updated_at?: string
}

export interface TimelineEvent {
  id: string
  ticket_id: string
  event_type: string
  description: string
  actor_id?: string
  created_at: string
}

export interface Comment {
  id: string
  ticket_id: string
  author_id: string
  content: string
  attachment_meta?: Record<string, unknown>
  created_at: string
}

export interface PrivateNote {
  id: string
  ticket_id: string
  author_id: string
  content: string
  created_at: string
}

// --- Evidence ---

export interface Evidence {
  id: string
  ticket_id: string
  filename: string
  file_path: string
  mime_type: string
  file_size: number
  sha256_hash: string
  uploaded_by_id: string
  version_number: number
  is_deleted: boolean
  created_at: string
}

export interface EvidenceUploadResponse {
  upload_url: string
  file_path: string
  expires_in: number
}

// --- Notifications ---

export interface Notification {
  id: string
  user_id: string
  type: string
  subject: string
  body: string
  is_read: boolean
  created_at: string
  ticket_id?: string
}

// --- AI & Intelligence ---

export interface AIAnalysis {
  category: string
  confidence: number
  severity: string
  risk_score: number
  language: string
  needs_ai_review: boolean
  extracted_entities: {
    phones?: string[]
    emails?: string[]
    upi_ids?: string[]
    bank_accounts?: string[]
    urls?: string[]
    ip_addresses?: string[]
    wallet_addresses?: string[]
  }
}

export interface SimilarTicket {
  ticket_number: string
  title: string
  category: string
  similarity_score: number
  ticket_id: string
}

// --- Officer KPIs ---

export interface OfficerKPIs {
  assigned_tickets: number
  open_tickets: number
  under_investigation: number
  pending_citizen_response: number
  closed_tickets: number
  avg_resolution_hours: number
  sla_breached: number
  sla_compliant: number
}

// --- Admin / Governance ---

export interface GovernanceKPIs {
  total_tickets: number
  active_tickets: number
  solved_tickets: number
  solve_rate: number
  breached_tickets: number
  sla_breach_rate: number
  category_distribution: Array<{ name: string; value: number }>
  regional_hotspots: Array<{ name: string; value: number }>
  officer_workloads: Array<{
    name: string
    role: string
    assigned_tickets: number
    solved_tickets: number
    avg_resolve_time_hours: number
  }>
}

export interface SystemHealthStatus {
  postgres: 'connected' | 'disconnected'
  redis: 'connected' | 'disconnected'
  minio?: 'connected' | 'disconnected' | 'unavailable'
  qdrant?: 'connected' | 'disconnected' | 'unavailable'
  celery?: 'online' | 'offline' | 'unavailable'
  smtp?: 'connected' | 'disconnected' | 'unavailable'
  overall: 'healthy' | 'degraded' | 'unhealthy'
}

// --- Form Types ---

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface ComplaintFormData {
  title: string
  description: string
  category?: TicketCategory
  amount?: number
  incident_date?: string
  reporter_phone?: string
  upi_id?: string
  bank_account?: string
  bank_name?: string
  ifsc_code?: string
  wallet_address?: string
  suspect_url?: string
  social_media_url?: string
  suspect_name?: string
  suspect_phone?: string
  additional_info?: string
}

// --- Pagination ---

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface PaginationParams {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
