"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Search, Plus, Clock, AlertTriangle,
  MessageSquare, FileText, UserCheck, Power,
  FolderOpen, Upload, Download, FileArchive,
  RefreshCw, Activity, Cpu, Lock, CheckCircle2,
  XCircle, ChevronRight, Zap
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────

function getSeverityClass(s: string) {
  if (s === "Critical") return "badge-critical";
  if (s === "High") return "badge-high";
  if (s === "Medium") return "badge-medium";
  return "badge-low";
}

function getSeverityDot(s: string) {
  if (s === "Critical") return "status-dot-red";
  if (s === "High") return "bg-orange-500 w-1.5 h-1.5 rounded-full inline-block";
  if (s === "Medium") return "status-dot-yellow";
  return "bg-emerald-500 w-1.5 h-1.5 rounded-full inline-block";
}

function getStatusColor(s: string) {
  if (s === "Closed") return { text: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" };
  if (s === "Closure Requested") return { text: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
  if (s === "Under Investigation") return { text: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
  if (s === "Assigned") return { text: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" };
  if (s === "Reopened") return { text: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" };
  return { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
}

// ── Skeleton Loader ───────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="p-3 space-y-2.5 border-l-2 border-transparent">
      <div className="flex justify-between">
        <div className="h-2 w-20 rounded shimmer" />
        <div className="h-2 w-14 rounded shimmer" />
      </div>
      <div className="h-3 w-full rounded shimmer" />
      <div className="flex justify-between">
        <div className="h-2 w-16 rounded shimmer" />
        <div className="h-2 w-12 rounded shimmer" />
      </div>
    </div>
  );
}

// ── Panel Section Header ──────────────────────────────────────────
function PanelHeader({ icon: Icon, title, color = "#0ea5e9", children }: {
  icon: any; title: string; color?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] font-bold font-mono uppercase tracking-[0.12em] text-slate-500">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("Officer");
  const [userRole, setUserRole] = useState("cyber_cell_officer");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newNote, setNewNote] = useState("");
  const [timeline, setTimeline] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [remainingSlaText, setRemainingSlaText] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [approvalComment, setApprovalComment] = useState("");
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newReporter, setNewReporter] = useState("");
  const [newReporterEmail, setNewReporterEmail] = useState("");
  const [newReporterPhone, setNewReporterPhone] = useState("");
  const [newCategory, setNewCategory] = useState("Cyber Financial Fraud");
  const [newAmount, setNewAmount] = useState("");

  // ── Init ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }
    setUserName(localStorage.getItem("name") || "Officer");
    setUserRole(localStorage.getItem("role") || "cyber_cell_officer");
    fetchTickets();
    fetchUsers();
  }, [router]);

  // ── SLA Timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTicket?.sla_deadline) { setRemainingSlaText(""); return; }
    const update = () => {
      const diff = new Date(selectedTicket.sla_deadline).getTime() - Date.now();
      if (diff <= 0) { setRemainingSlaText("BREACHED 🚨"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemainingSlaText(`${h}h ${m}m ${s}s`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [selectedTicket]);

  // ── API Calls (all preserved exactly) ─────────────────────────
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      let url = "http://localhost:8000/api/v1/tickets?";
      if (statusFilter) url += `status=${statusFilter}&`;
      if (severityFilter) url += `severity=${severityFilter}&`;
      if (search) url += `search=${search}&`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const r = await res.json();
      if (r.success) setTickets(r.data);
    } catch { } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/v1/users/list", { headers: { Authorization: `Bearer ${token}` } });
      const r = await res.json();
      if (r.success) setOfficers(r.data);
    } catch { }
  };

  const fetchEvidence = async (ticketId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/evidence/${ticketId}`, { headers: { Authorization: `Bearer ${token}` } });
      const r = await res.json();
      if (r.success) setEvidenceList(r.data);
    } catch { }
  };

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setNewComment(""); setNewNote(""); setRejectionReason(""); setApprovalComment("");
    fetchEvidence(ticket.id);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/tickets/${ticket.id}/timeline`, { headers: { Authorization: `Bearer ${token}` } });
      const r = await res.json();
      if (r.success) setTimeline(r.data);
    } catch { }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const token = localStorage.getItem("access_token");
      const urlRes = await fetch(`http://localhost:8000/api/v1/evidence/${selectedTicket.id}/upload-link`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: file.name }),
      });
      const urlData = await urlRes.json();
      if (!urlData.success) throw new Error();
      const { upload_url, file_path } = urlData.data;
      await fetch(upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      const saveRes = await fetch(`http://localhost:8000/api/v1/evidence/${selectedTicket.id}/save`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: file.name, file_path, mime_type: file.type || "application/octet-stream", file_size: file.size, sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }),
      });
      const saveData = await saveRes.json();
      if (saveData.success) fetchEvidence(selectedTicket.id);
    } catch { } finally { setUploading(false); }
  };

  const handleDownloadAsset = async (evidenceId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/evidence/download/${evidenceId}`, { headers: { Authorization: `Bearer ${token}` } });
      const r = await res.json();
      if (r.success) window.open(r.data, "_blank");
    } catch { }
  };

  const handleDownloadBulkZip = () => {
    const token = localStorage.getItem("access_token");
    fetch(`http://localhost:8000/api/v1/evidence/${selectedTicket.id}/zip`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `evidence_${selectedTicket.ticket_number}.zip`;
        document.body.appendChild(a); a.click(); a.remove();
      }).catch(() => {});
  };

  const handleRequestClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureReason.trim()) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/approvals/${selectedTicket.id}/request-closure`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: closureReason }),
      });
      const r = await res.json();
      if (r.success) { setShowClosureModal(false); setClosureReason(""); handleSelectTicket(r.data); fetchTickets(); }
    } catch { }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/v1/tickets", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, description: newDesc, source: "portal", reporter_name: newReporter, reporter_email: newReporterEmail, reporter_phone: newReporterPhone, metadata_json: { category: newCategory, amount: parseFloat(newAmount) || 0 } }),
      });
      const r = await res.json();
      if (r.success) { setShowCreateModal(false); setNewTitle(""); setNewDesc(""); setNewReporter(""); setNewReporterEmail(""); setNewReporterPhone(""); setNewAmount(""); fetchTickets(); }
    } catch { }
  };

  const handleAssign = async () => {
    if (!selectedOfficer) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket.id}/assign`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ officer_id: selectedOfficer }),
      });
      const r = await res.json();
      if (r.success) { setSelectedOfficer(""); handleSelectTicket(r.data); fetchTickets(); }
    } catch { }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket.id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const r = await res.json();
      if (r.success) { handleSelectTicket(r.data); fetchTickets(); }
    } catch { }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket.id}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newComment }),
      });
      const r = await res.json();
      if (r.success) { setNewComment(""); handleSelectTicket(selectedTicket); }
    } catch { }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket.id}/notes`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newNote }),
      });
      const r = await res.json();
      if (r.success) { setNewNote(""); handleSelectTicket(selectedTicket); }
    } catch { }
  };

  const handleApprovalAction = async (action: "approved" | "rejected", level: number) => {
    try {
      const token = localStorage.getItem("access_token");
      let url = "", method = "POST", payload: any = {};
      if (action === "approved") {
        url = `http://localhost:8000/api/v1/approvals/${selectedTicket.id}/${level === 1 ? "l1-approve" : "l2-approve"}`;
        payload = { comment: approvalComment || "Approved by supervisor" };
      } else {
        url = `http://localhost:8000/api/v1/tickets/${selectedTicket.id}/status`;
        method = "PUT";
        payload = { status: "Under Investigation" };
        await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket.id}/comments`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: `--- [Closure Rejected] ---\nReason: ${rejectionReason || "Reverted by supervisor"}` }),
        });
      }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const r = await res.json();
      if (r.success) { setApprovalComment(""); setRejectionReason(""); handleSelectTicket(r.data); fetchTickets(); }
    } catch { }
  };

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  // ── Computed ───────────────────────────────────────────────────
  const isSlaBreach = remainingSlaText.includes("BREACHED") || selectedTicket?.is_escalated;
  const criticalCount = tickets.filter(t => t.severity === "Critical").length;
  const openCount = tickets.filter(t => t.complaint?.status !== "Closed").length;

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#060814] font-sans">

      {/* ── TOP NAV ──────────────────────────────────── */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-cyan-500/8 bg-[#060814]/95 px-5 backdrop-blur-xl z-40">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center"
            style={{ boxShadow: "0 0 16px rgba(14,165,233,0.4)" }}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black tracking-[0.15em] text-white uppercase font-mono">CCGP</span>
            <span className="hidden text-[8px] font-bold tracking-[0.2em] text-cyan-400/50 uppercase font-mono md:block">SOC Console</span>
          </div>
          {/* Separator */}
          <div className="hidden md:block h-4 w-px bg-white/10 mx-1" />
          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-3 text-[9px] font-mono">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {openCount} OPEN
            </span>
            {criticalCount > 0 && (
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
                {criticalCount} CRITICAL
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-1 text-[9px] font-mono text-emerald-400">
            <span className="status-dot-green" />
            NOMINAL
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <Cpu className="h-3 w-3 text-cyan-500/70" />
            <span className="uppercase tracking-wider hidden sm:block">{userName}</span>
            <span className="rounded-md border border-cyan-500/15 bg-cyan-500/8 px-1.5 py-0.5 text-[9px] text-cyan-400 uppercase">{userRole}</span>
          </div>
          <button id="logout-btn" onClick={handleLogout}
            className="h-8 w-8 rounded-lg border border-white/8 flex items-center justify-center text-slate-600 hover:border-red-500/30 hover:bg-red-500/8 hover:text-red-400 transition-all">
            <Power className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ── BODY ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: TICKET QUEUE ─────────────────────── */}
        <div className="flex w-[320px] shrink-0 flex-col border-r border-white/5 bg-black/20">

          {/* Queue header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-cyan-500" />
              <span className="text-[9px] font-bold font-mono uppercase tracking-[0.15em] text-slate-500">Incident Queue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/15 rounded-full px-2 py-0.5">{tickets.length}</span>
              <button id="refresh-btn" onClick={fetchTickets} className="h-6 w-6 rounded flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/5 transition-all">
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-2 border-b border-white/5 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchTickets()}
                placeholder="Search incidents..."
                className="cyber-input pl-9 text-[11px] py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="cyber-input text-[10px] py-1.5 px-2.5">
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Closure Requested">Closure Requested</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
              <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
                className="cyber-input text-[10px] py-1.5 px-2.5">
                <option value="">All Severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button id="query-btn" onClick={fetchTickets}
                className="flex-1 rounded-lg bg-cyan-600/15 border border-cyan-500/20 py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/25 transition-all">
                Query
              </button>
              <button id="new-ticket-btn" onClick={() => setShowCreateModal(true)}
                className="h-8 w-8 rounded-lg border border-white/8 bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Tickets list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="divide-y divide-white/[0.04]">
                {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 gap-3 text-center">
                <div className="h-12 w-12 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-slate-700" />
                </div>
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">No tickets found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {tickets.map(t => {
                  const statusC = getStatusColor(t.complaint?.status);
                  const isActive = selectedTicket?.id === t.id;
                  return (
                    <motion.div
                      key={t.id}
                      id={`ticket-${t.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleSelectTicket(t)}
                      className={`ticket-card flex flex-col gap-2 p-3 cursor-pointer ${isActive ? "active" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono text-cyan-400 tracking-wider">{t.ticket_number}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase ${getSeverityClass(t.severity)}`}>{t.severity}</span>
                      </div>
                      <h4 className="text-[12px] font-semibold text-white/90 line-clamp-1 leading-snug">{t.complaint?.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase border ${statusC.bg} ${statusC.text}`}>{t.complaint?.status}</span>
                        <span className="text-[9px] text-slate-600 font-mono">{t.assigned_group || "Unassigned"}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: CASE DETAIL ─────────────────────── */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div
                key={selectedTicket.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="p-5 space-y-4"
              >
                {/* ── Case Header ── */}
                <div className="glass-card rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-bold font-mono text-cyan-400 tracking-[0.15em] uppercase">{selectedTicket.ticket_number}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase ${getSeverityClass(selectedTicket.severity)}`}>{selectedTicket.severity}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase ${getStatusColor(selectedTicket.complaint?.status).bg} ${getStatusColor(selectedTicket.complaint?.status).text}`}>{selectedTicket.complaint?.status}</span>
                        {selectedTicket.is_escalated && (
                          <span className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase text-red-400 animate-pulse">🚨 ESCALATED</span>
                        )}
                      </div>
                      <h2 className="text-lg font-black text-white tracking-tight leading-tight">{selectedTicket.complaint?.title}</h2>
                      <p className="text-[10px] font-mono text-slate-600">
                        Source: <span className="text-slate-400">{selectedTicket.complaint?.source}</span>
                        <span className="mx-2 text-slate-700">|</span>
                        Reporter: <span className="text-slate-400">{selectedTicket.complaint?.reporter_name}</span>
                        {selectedTicket.complaint?.reporter_phone && <><span className="mx-2 text-slate-700">|</span><span className="text-slate-400">{selectedTicket.complaint.reporter_phone}</span></>}
                      </p>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex shrink-0 gap-2 flex-wrap">
                      {selectedTicket.complaint?.status === "New" && (
                        <button id="acknowledge-btn" onClick={() => handleStatusChange("Assigned")}
                          className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold font-mono uppercase text-emerald-400 hover:bg-emerald-500/20 transition-all">
                          Acknowledge
                        </button>
                      )}
                      {selectedTicket.complaint?.status === "Assigned" && (
                        <button id="investigate-btn" onClick={() => handleStatusChange("Under Investigation")}
                          className="rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold font-mono uppercase text-blue-400 hover:bg-blue-500/20 transition-all">
                          Begin Investigation
                        </button>
                      )}
                      {selectedTicket.complaint?.status === "Under Investigation" && (
                        <button id="closure-req-btn" onClick={() => setShowClosureModal(true)}
                          className="rounded-lg border border-yellow-500/25 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-bold font-mono uppercase text-yellow-400 hover:bg-yellow-500/20 transition-all">
                          Request Closure
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 2-col Detail + Routing ── */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Case Details */}
                  <div className="glass-card rounded-xl p-4">
                    <PanelHeader icon={FileText} title="Case Details" />
                    <p className="text-[11px] text-slate-500 leading-relaxed bg-black/20 rounded-lg p-3 min-h-[56px] border border-white/5 mb-3">
                      {selectedTicket.complaint?.description}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><span className="block text-[9px] font-mono uppercase tracking-wider text-slate-600 mb-0.5">Category</span><span className="text-xs font-semibold text-white">{selectedTicket.category}</span></div>
                      <div><span className="block text-[9px] font-mono uppercase tracking-wider text-slate-600 mb-0.5">Status</span><span className="text-xs font-semibold text-white">{selectedTicket.complaint?.status}</span></div>
                    </div>
                  </div>

                  {/* Routing & SLA */}
                  <div className="glass-card rounded-xl p-4">
                    <PanelHeader icon={UserCheck} title="Routing & SLA" color="#8b5cf6" />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div><span className="block text-[9px] font-mono uppercase tracking-wider text-slate-600 mb-0.5">Group</span><span className="text-xs font-semibold text-white">{selectedTicket.assigned_group || "—"}</span></div>
                      <div><span className="block text-[9px] font-mono uppercase tracking-wider text-slate-600 mb-0.5">Officer</span><span className="text-xs font-semibold text-white">{selectedTicket.assigned_officer_id ? (officers.find(o => o.id === selectedTicket.assigned_officer_id)?.name || "Assigned") : "—"}</span></div>
                    </div>
                    {/* SLA countdown */}
                    <div className={`rounded-lg p-3 flex items-center justify-between border ${isSlaBreach ? "border-red-500/20 bg-red-500/5" : "border-white/5 bg-black/20"}`}>
                      <div>
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-600 mb-0.5">SLA Countdown</span>
                        <span className={`text-sm font-bold font-mono ${isSlaBreach ? "text-red-400 animate-pulse" : "text-yellow-400"}`}>
                          {remainingSlaText || "No SLA Set"}
                        </span>
                      </div>
                      <Clock className={`h-5 w-5 ${isSlaBreach ? "text-red-500" : "text-yellow-500/50"}`} />
                    </div>
                    {/* Assign officer (supervisor) */}
                    {userRole === "supervisor" && (
                      <div className="flex gap-2 mt-3">
                        <select id="officer-select" value={selectedOfficer} onChange={e => setSelectedOfficer(e.target.value)}
                          className="cyber-input flex-1 text-[10px] py-1.5">
                          <option value="">Select Investigator</option>
                          {officers.map(o => <option key={o.id} value={o.id}>{o.name} ({o.role})</option>)}
                        </select>
                        <button id="assign-btn" onClick={handleAssign}
                          className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
                          Assign
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Evidence Vault ── */}
                <div className="glass-card rounded-xl p-4">
                  <PanelHeader icon={FolderOpen} title="Evidence Vault" color="#10b981">
                    {evidenceList.length > 0 && (
                      <button id="download-zip-btn" onClick={handleDownloadBulkZip}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 text-[9px] font-bold font-mono text-emerald-400 hover:bg-emerald-500/15 transition-all">
                        <FileArchive className="h-3 w-3" /> Bundle ZIP
                      </button>
                    )}
                  </PanelHeader>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 mb-3">
                    {evidenceList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-7 rounded-lg border border-dashed border-white/5">
                        <Lock className="h-5 w-5 text-slate-700 mb-2" />
                        <p className="text-[10px] font-mono text-slate-600">Vault empty — no evidence uploaded</p>
                      </div>
                    ) : (
                      evidenceList.map(file => (
                        <motion.div key={file.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between bg-black/25 rounded-lg px-3 py-2 border border-white/5">
                          <div className="min-w-0 flex-1 mr-3">
                            <span className="text-[11px] font-semibold text-white/90 truncate block">{file.filename}</span>
                            <span className="text-[9px] font-mono text-slate-600">
                              v{file.version} &middot; {(file.file_size / 1024).toFixed(1)} KB &middot; <span className="text-cyan-400/70">{file.sha256_hash.substring(0, 10)}…</span>
                            </span>
                          </div>
                          <button id={`dl-${file.id}`} onClick={() => handleDownloadAsset(file.id)}
                            className="h-7 w-7 rounded-lg border border-white/5 flex items-center justify-center text-slate-600 hover:bg-white/5 hover:text-white transition-all">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {(userRole === "investigator" || userRole === "cyber_cell_officer" || userRole === "supervisor") && (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/8 hover:border-cyan-500/25 hover:bg-cyan-500/4 py-3 text-[10px] font-mono text-slate-600 hover:text-cyan-400 transition-all">
                      {uploading ? (
                        <><RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-500" /> Uploading to vault...</>
                      ) : (
                        <><Upload className="h-3.5 w-3.5 text-cyan-500/60" /> Upload Evidence File</>
                      )}
                      <input type="file" className="hidden" onChange={handleUploadFile} disabled={uploading} />
                    </label>
                  )}
                </div>

                {/* ── L1/L2 Approvals ── */}
                {selectedTicket.complaint?.status === "Closure Requested" && userRole === "supervisor" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-yellow-500/20 bg-yellow-500/4 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-[9px] font-bold font-mono uppercase tracking-[0.15em] text-yellow-400">Pending Closure Approvals</span>
                    </div>
                    <div className="flex gap-5 text-[10px] font-mono">
                      <span className={selectedTicket.l1_approved ? "text-emerald-400" : "text-slate-500"}>
                        {selectedTicket.l1_approved ? <CheckCircle2 className="h-3 w-3 inline mr-1" /> : <XCircle className="h-3 w-3 inline mr-1" />}
                        L1 {selectedTicket.l1_approved ? "Approved" : "Pending"}
                      </span>
                      <span className={selectedTicket.l2_approved ? "text-emerald-400" : "text-slate-500"}>
                        {selectedTicket.l2_approved ? <CheckCircle2 className="h-3 w-3 inline mr-1" /> : <XCircle className="h-3 w-3 inline mr-1" />}
                        L2 {selectedTicket.l2_approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <input id="approval-comment" type="text" value={approvalComment} onChange={e => setApprovalComment(e.target.value)}
                        placeholder="Supervisor approval comment..." className="cyber-input text-[11px]" />
                      <input id="rejection-reason" type="text" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                        placeholder="Rejection reason (if rejecting)..." className="cyber-input text-[11px]" />
                      <div className="flex gap-2">
                        {!selectedTicket.l1_approved && (
                          <button id="l1-approve-btn" onClick={() => handleApprovalAction("approved", 1)}
                            className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold font-mono text-emerald-400 hover:bg-emerald-500/20 transition-all">
                            L1 Approve
                          </button>
                        )}
                        {selectedTicket.l1_approved && !selectedTicket.l2_approved && (
                          <button id="l2-approve-btn" onClick={() => handleApprovalAction("approved", 2)}
                            className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold font-mono text-emerald-400 hover:bg-emerald-500/20 transition-all">
                            L2 Final Close
                          </button>
                        )}
                        <button id="reject-btn" onClick={() => handleApprovalAction("rejected", 1)}
                          className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold font-mono text-red-400 hover:bg-red-500/20 transition-all">
                          Reject
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Comments & Notes ── */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="glass-card rounded-xl p-4">
                    <PanelHeader icon={MessageSquare} title="Public Discussion" color="#0ea5e9" />
                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input id="comment-input" type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a message..." className="cyber-input flex-1 text-[11px]" />
                      <button id="post-comment-btn" type="submit"
                        className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-[10px] font-bold font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
                        Post
                      </button>
                    </form>
                  </div>

                  <div className="glass-card rounded-xl p-4 border-yellow-500/8">
                    <PanelHeader icon={Shield} title="Private Notes" color="#f59e0b" />
                    {userRole !== "citizen" ? (
                      <form onSubmit={handleAddNote} className="flex gap-2">
                        <input id="note-input" type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
                          placeholder="Internal note only..." className="cyber-input flex-1 text-[11px]" style={{ borderColor: "rgba(234,179,8,0.12)" }} />
                        <button id="post-note-btn" type="submit"
                          className="rounded-lg border border-yellow-500/25 bg-yellow-500/10 px-3 py-2 text-[10px] font-bold font-mono text-yellow-400 hover:bg-yellow-500/20 transition-all">
                          Note
                        </button>
                      </form>
                    ) : (
                      <p className="text-[10px] font-mono text-slate-600">Citizens cannot access private notes.</p>
                    )}
                  </div>
                </div>

                {/* ── Activity Timeline ── */}
                <div className="glass-card rounded-xl p-4">
                  <PanelHeader icon={Clock} title="Activity Timeline" color="#8b5cf6" />
                  {timeline.length === 0 ? (
                    <p className="text-[10px] font-mono text-slate-600 text-center py-4">No activity recorded yet.</p>
                  ) : (
                    <div className="relative ml-3 space-y-4 border-l border-white/5 pl-5">
                      {timeline.map((event, idx) => (
                        <motion.div key={event.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                          className="relative text-[11px]">
                          <div className="absolute -left-[22px] top-1.5 h-2 w-2 rounded-full bg-cyan-500 border-2 border-[#060814]" style={{ boxShadow: "0 0 6px rgba(6,182,212,0.5)" }} />
                          <div className="flex items-center justify-between font-mono mb-0.5">
                            <span className="font-bold text-white text-[11px]">{event.event_type}</span>
                            <span className="text-[9px] text-slate-600">{new Date(event.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-500 leading-relaxed text-[11px]">{event.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Empty state */
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center p-16 gap-6 text-center">
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
                    <FolderOpen className="h-9 w-9 text-slate-700" />
                  </div>
                  {tickets.length > 0 && (
                    <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <span className="text-[9px] font-bold font-mono text-cyan-400">{tickets.length}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-base font-bold text-white tracking-wide">Select an Incident</h3>
                  <p className="text-[11px] font-mono text-slate-600 leading-relaxed">
                    Click any incident in the queue panel to view case details, SLA monitoring, evidence vault, and workflow controls.
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-700 rotate-180 md:rotate-0" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════ */}

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-cyan-500" />
                </div>
                <div><h3 className="text-sm font-bold text-white">File Incident Complaint</h3>
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">New tracked incident ticket</p></div>
                <button onClick={() => setShowCreateModal(false)} className="ml-auto text-slate-600 hover:text-white text-xl leading-none transition-colors">&times;</button>
              </div>
              <form onSubmit={handleCreateTicket} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-600">Reporter Name</label><input id="new-reporter" type="text" required value={newReporter} onChange={e => setNewReporter(e.target.value)} className="cyber-input" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-600">Reporter Phone</label><input id="new-phone" type="text" value={newReporterPhone} onChange={e => setNewReporterPhone(e.target.value)} className="cyber-input" /></div>
                </div>
                <div className="space-y-1"><label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-600">Reporter Email</label><input id="new-email" type="email" value={newReporterEmail} onChange={e => setNewReporterEmail(e.target.value)} className="cyber-input" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-600">Category</label>
                    <select id="new-category" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="cyber-input">
                      <option value="Cyber Financial Fraud">Cyber Financial Fraud</option>
                      <option value="Hacking">Hacking</option>
                      <option value="Ransomware">Ransomware</option>
                      <option value="Cyber Stalking">Cyber Stalking</option>
                    </select></div>
                  <div className="space-y-1"><label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-600">Loss Amount (INR)</label><input id="new-amount" type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="cyber-input" /></div>
                </div>
                <div className="space-y-1"><label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-600">Incident Title</label><input id="new-title" type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="cyber-input" /></div>
                <div className="space-y-1"><label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-600">Description</label><textarea id="new-desc" required value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="cyber-input resize-none" /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)}
                    className="rounded-lg border border-white/8 bg-white/5 px-4 py-2 text-[10px] font-bold font-mono text-slate-400 hover:bg-white/10 hover:text-white transition-all">Cancel</button>
                  <button type="submit" id="submit-ticket-btn"
                    className="btn-cyber text-[10px] py-2 px-4">File Complaint</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Closure Request Modal */}
      <AnimatePresence>
        {showClosureModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border-yellow-500/10">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="h-8 w-8 rounded-lg bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </div>
                <div><h3 className="text-sm font-bold text-white">Request Incident Closure</h3>
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">Requires multi-tier supervisor approval</p></div>
                <button onClick={() => setShowClosureModal(false)} className="ml-auto text-slate-600 hover:text-white text-xl leading-none transition-colors">&times;</button>
              </div>
              <form onSubmit={handleRequestClosure} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-600">Closure Reason / Investigation Outcomes</label>
                  <textarea id="closure-reason" required rows={4} value={closureReason} onChange={e => setClosureReason(e.target.value)}
                    placeholder="Specify resolution findings..." className="cyber-input resize-none" style={{ borderColor: "rgba(234,179,8,0.12)" }} />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowClosureModal(false)}
                    className="rounded-lg border border-white/8 bg-white/5 px-4 py-2 text-[10px] font-bold font-mono text-slate-400 hover:bg-white/10 hover:text-white transition-all">Cancel</button>
                  <button type="submit" id="submit-closure-btn"
                    className="rounded-lg border border-yellow-500/25 bg-yellow-500/10 px-4 py-2 text-[10px] font-bold font-mono text-yellow-400 hover:bg-yellow-500/20 transition-all">Submit Request</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
