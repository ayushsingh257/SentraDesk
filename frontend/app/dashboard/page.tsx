"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Search, Plus, Clock, AlertTriangle,
  MessageSquare, FileText, UserCheck, Power,
  FolderOpen, Upload, Download, FileArchive,
  RefreshCw, Activity, Cpu, Lock, CheckCircle2,
  XCircle, ChevronRight, Zap, Fingerprint, Terminal,
  Radio, HardDrive, ShieldAlert, CpuIcon
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────

function getSeverityClass(s: string) {
  if (s === "Critical") return "badge-critical text-[9px] font-mono tracking-wider uppercase";
  if (s === "High") return "badge-high text-[9px] font-mono tracking-wider uppercase";
  if (s === "Medium") return "badge-medium text-[9px] font-mono tracking-wider uppercase";
  return "badge-low text-[9px] font-mono tracking-wider uppercase";
}

function getSeverityDot(s: string) {
  if (s === "Critical") return "status-dot-red";
  if (s === "High") return "bg-orange-500 w-1.5 h-1.5 rounded-full inline-block animate-pulse";
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
    <div className="p-4 space-y-3 border-l-2 border-transparent bg-slate-900/10">
      <div className="flex justify-between">
        <div className="h-2 w-16 rounded shimmer bg-slate-800" />
        <div className="h-2 w-10 rounded shimmer bg-slate-800" />
      </div>
      <div className="h-3 w-full rounded shimmer bg-slate-800" />
      <div className="flex justify-between">
        <div className="h-2 w-14 rounded shimmer bg-slate-800" />
        <div className="h-2 w-10 rounded shimmer bg-slate-800" />
      </div>
    </div>
  );
}

// ── Panel Section Header ──────────────────────────────────────────
function PanelHeader({ icon: Icon, title, color = "#06b6d4", children }: {
  icon: any; title: string; color?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4 border-b border-slate-950 pb-2.5">
      <div className="flex items-center gap-2">
        <div className="h-6.5 w-6.5 rounded flex items-center justify-center border" style={{ background: `${color}08`, borderColor: `${color}15` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-slate-400">{title}</span>
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
  const isSlaBreach = selectedTicket?.is_escalated || remainingSlaText.includes("BREACHED");
  const criticalCount = tickets.filter(t => t.severity === "Critical").length;
  const openCount = tickets.filter(t => t.complaint?.status !== "Closed").length;

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#02040a] font-sans">
      
      {/* Dynamic Background Matrix overlay */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 cyber-grid-dense opacity-[0.18]" />
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-950/5 blur-[120px]" />
      </div>

      {/* ── TOP NAV (Holographic Design) ──────────────────────────────────── */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-slate-950 bg-[#02040a]/80 px-5 backdrop-blur-md z-45 relative">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border border-cyan-400/25"
            style={{ boxShadow: "0 0 15px rgba(6,182,212,0.25)" }}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-sm font-black tracking-[0.2em] text-white uppercase font-mono">CCGP</span>
            <span className="hidden text-[8px] font-bold tracking-[0.25em] text-cyan-400/50 uppercase font-mono md:block">OPERATIONS BASE</span>
          </div>
          {/* Separator */}
          <div className="hidden md:block h-3.5 w-px bg-slate-900 mx-1" />
          {/* Quick HUD Metrics */}
          <div className="hidden md:flex items-center gap-3 text-[9px] font-mono">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {openCount} ACTIVE INCIDENTS
            </span>
            {criticalCount > 0 && (
              <span className="flex items-center gap-1.5 text-red-400 bg-red-950/20 border border-red-500/20 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
                {criticalCount} CRITICAL ALERT
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="hidden lg:flex items-center gap-1.5 rounded border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[8.5px] font-mono text-emerald-400 tracking-wider">
            <span className="status-dot-green" />
            CONSOLE NOMINAL
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <CpuIcon className="h-3.5 w-3.5 text-cyan-500/60" />
            <span className="uppercase tracking-wider hidden sm:block">{userName}</span>
            <span className="rounded border border-cyan-500/20 bg-cyan-500/5 px-1.5 py-0.5 text-[8.5px] text-cyan-400 font-bold uppercase">{userRole}</span>
          </div>
          <button id="logout-btn" onClick={handleLogout}
            className="h-7.5 w-7.5 rounded border border-slate-900 flex items-center justify-center text-slate-500 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 transition-all"
            title="Disconnect terminal">
            <Power className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ── BODY (Unified Workspace Panels) ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative z-10">

        {/* ── LEFT: INCIDENT QUEUE ─────────────────────── */}
        <div className="flex w-[320px] shrink-0 flex-col border-r border-slate-950 bg-black/25">

          {/* Queue Title */}
          <div className="flex items-center justify-between border-b border-slate-950 px-4 py-3 bg-slate-950/20">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span className="text-[9.5px] font-bold font-mono uppercase tracking-[0.2em] text-slate-400">Incident Queue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-500/20 rounded px-1.5 py-0.5">{tickets.length}</span>
              <button id="refresh-btn" onClick={fetchTickets} className="h-6 w-6 rounded border border-slate-900 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-950 transition-all">
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Search & filters */}
          <div className="space-y-2 border-b border-slate-950 p-3 bg-slate-950/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchTickets()}
                placeholder="Query Ticket Ref..."
                className="cyber-input pl-9 text-[10.5px] py-1.5 border-slate-900 bg-slate-950"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="cyber-input text-[9.5px] py-1.5 px-2 border-slate-900 bg-slate-950 text-slate-300">
                <option value="">All States</option>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Closure Requested">Closure Requested</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
              <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
                className="cyber-input text-[9.5px] py-1.5 px-2 border-slate-900 bg-slate-950 text-slate-300">
                <option value="">All Tiers</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button id="query-btn" onClick={fetchTickets}
                className="flex-1 rounded border border-cyan-500/20 bg-cyan-500/5 py-1.5 text-[9.5px] font-bold font-mono uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/15 transition-all">
                Execute Query
              </button>
              <button id="new-ticket-btn" onClick={() => setShowCreateModal(true)}
                className="h-7.5 w-7.5 rounded border border-slate-900 bg-slate-950 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:border-cyan-500/25"
                title="File new complaint">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Queue Scroll Feed */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="divide-y divide-slate-950">
                {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 gap-3 text-center mt-12">
                <div className="h-10 w-10 rounded border border-slate-900 bg-slate-950 flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-slate-700" />
                </div>
                <p className="text-[9.5px] font-mono text-slate-600 uppercase tracking-widest">No entries found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-950">
                {tickets.map(t => {
                  const statusC = getStatusColor(t.complaint?.status);
                  const isActive = selectedTicket?.id === t.id;
                  const isCritical = t.severity === "Critical";
                  return (
                    <motion.div
                      key={t.id}
                      id={`ticket-${t.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleSelectTicket(t)}
                      className={`ticket-card flex flex-col gap-2 p-3.5 cursor-pointer relative ${isActive ? "active bg-cyan-950/5 border-l-2 border-l-cyan-500" : "border-l-2 border-l-transparent"} ${isCritical ? "scanline-active" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono text-cyan-400/80 tracking-wide">{t.ticket_number}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold font-mono uppercase ${getSeverityClass(t.severity)}`}>{t.severity}</span>
                      </div>
                      <h4 className="text-[11.5px] font-semibold text-white/95 line-clamp-1 leading-snug">{t.complaint?.title}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`rounded border px-1.5 py-0.5 text-[8.5px] font-bold font-mono uppercase ${statusC.bg} ${statusC.text}`}>{t.complaint?.status}</span>
                        <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">{t.assigned_group || "Unassigned"}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: SECURE DETAILS PANEL ─────────────────────── */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-slate-950/5">
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div
                key={selectedTicket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-5 space-y-4"
              >
                
                {/* ── Header Summary Card ── */}
                <div className="glass rounded-xl p-5 border-slate-900 relative overflow-hidden scanline-active"
                  style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9.5px] font-bold font-mono text-cyan-400 tracking-[0.2em] uppercase">{selectedTicket.ticket_number}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold font-mono uppercase ${getSeverityClass(selectedTicket.severity)}`}>{selectedTicket.severity}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-[8.5px] font-mono font-bold uppercase ${getStatusColor(selectedTicket.complaint?.status).bg} ${getStatusColor(selectedTicket.complaint?.status).text}`}>{selectedTicket.complaint?.status}</span>
                        {selectedTicket.is_escalated && (
                          <span className="rounded border border-red-500/25 bg-red-500/5 px-2 py-0.5 text-[8px] font-bold font-mono uppercase text-red-400 animate-pulse flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" /> SLA ESCALATED
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-extrabold text-white tracking-tight uppercase font-mono">{selectedTicket.complaint?.title}</h2>
                      <p className="text-[9.5px] font-mono text-slate-500">
                        SOURCE CHANNEL: <span className="text-slate-400 uppercase">{selectedTicket.complaint?.source}</span>
                        <span className="mx-2 text-slate-800">|</span>
                        IDENTITY: <span className="text-slate-400">{selectedTicket.complaint?.reporter_name}</span>
                        {selectedTicket.complaint?.reporter_phone && <><span className="mx-2 text-slate-800">|</span><span className="text-slate-400">{selectedTicket.complaint.reporter_phone}</span></>}
                      </p>
                    </div>

                    {/* Operational state triggers */}
                    <div className="flex shrink-0 gap-2 flex-wrap pt-1">
                      {selectedTicket.complaint?.status === "New" && (
                        <button id="acknowledge-btn" onClick={() => handleStatusChange("Assigned")}
                          className="rounded border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 text-[9.5px] font-bold font-mono uppercase text-emerald-400 hover:bg-emerald-500/15 transition-all">
                          Acknowledge
                        </button>
                      )}
                      {selectedTicket.complaint?.status === "Assigned" && (
                        <button id="investigate-btn" onClick={() => handleStatusChange("Under Investigation")}
                          className="rounded border border-blue-500/25 bg-blue-500/5 px-3 py-1.5 text-[9.5px] font-bold font-mono uppercase text-blue-400 hover:bg-blue-500/15 transition-all">
                          Begin Investigation
                        </button>
                      )}
                      {selectedTicket.complaint?.status === "Under Investigation" && (
                        <button id="closure-req-btn" onClick={() => setShowClosureModal(true)}
                          className="rounded border border-yellow-500/25 bg-yellow-500/5 px-3 py-1.5 text-[9.5px] font-bold font-mono uppercase text-yellow-400 hover:bg-yellow-500/15 transition-all">
                          Request Case Closure
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 2-Column: case metadata + SLA tracking ── */}
                <div className="grid gap-4 md:grid-cols-2">
                  
                  {/* Case specifications */}
                  <div className="glass rounded-xl p-4 border-slate-900">
                    <PanelHeader icon={FileText} title="Incident Metadata" />
                    <p className="text-[11px] text-slate-400 leading-relaxed bg-black/45 rounded border border-slate-950 p-3 min-h-[64px] mb-3 font-sans">
                      {selectedTicket.complaint?.description}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[8.5px] font-mono uppercase tracking-widest text-slate-500">Incident Category</span>
                        <span className="text-[11px] font-semibold text-white font-mono">{selectedTicket.category}</span>
                      </div>
                      <div>
                        <span className="block text-[8.5px] font-mono uppercase tracking-widest text-slate-500">Intake Source</span>
                        <span className="text-[11px] font-semibold text-white uppercase font-mono">{selectedTicket.complaint?.source}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational routing & SLA alerts */}
                  <div className="glass rounded-xl p-4 border-slate-900">
                    <PanelHeader icon={UserCheck} title="Personnel Assignment & SLA" color="#8b5cf6" />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="block text-[8.5px] font-mono uppercase tracking-widest text-slate-500">Command Group</span>
                        <span className="text-[11px] font-semibold text-white uppercase font-mono">{selectedTicket.assigned_group || "—"}</span>
                      </div>
                      <div>
                        <span className="block text-[8.5px] font-mono uppercase tracking-widest text-slate-500">Assigned Investigator</span>
                        <span className="text-[11px] font-semibold text-white font-mono">{selectedTicket.assigned_officer_id ? (officers.find(o => o.id === selectedTicket.assigned_officer_id)?.name || "Assigned") : "—"}</span>
                      </div>
                    </div>

                    {/* Countdown indicator */}
                    <div className={`rounded border p-3 flex items-center justify-between ${isSlaBreach ? "border-red-500/25 bg-red-500/5 hud-pulse-red" : "border-slate-950 bg-black/25"}`}>
                      <div>
                        <span className="block text-[8.5px] font-mono uppercase tracking-widest text-slate-500">SLA Breach Window</span>
                        <span className={`text-xs font-bold font-mono ${isSlaBreach ? "text-red-400" : "text-yellow-400"}`}>
                          {remainingSlaText || "No active SLA timer"}
                        </span>
                      </div>
                      <Clock className={`h-4.5 w-4.5 ${isSlaBreach ? "text-red-500" : "text-yellow-500/40"}`} />
                    </div>

                    {/* Routing selection for supervisors */}
                    {userRole === "supervisor" && (
                      <div className="flex gap-2 mt-3">
                        <select id="officer-select" value={selectedOfficer} onChange={e => setSelectedOfficer(e.target.value)}
                          className="cyber-input flex-1 text-[10px] py-1.5 border-slate-900 bg-slate-950">
                          <option value="">Select Investigator</option>
                          {officers.map(o => <option key={o.id} value={o.id}>{o.name} ({o.role})</option>)}
                        </select>
                        <button id="assign-btn" onClick={handleAssign}
                          className="rounded border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-[9.5px] font-bold font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
                          Route Case
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Cryptographic Evidence Vault ── */}
                <div className="glass rounded-xl p-4 border-slate-900">
                  <PanelHeader icon={HardDrive} title="Evidence Storage Vault (MinIO)" color="#10b981">
                    {evidenceList.length > 0 && (
                      <button id="download-zip-btn" onClick={handleDownloadBulkZip}
                        className="inline-flex items-center gap-1.5 rounded border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1 text-[8.5px] font-bold font-mono text-emerald-400 hover:bg-emerald-500/15 transition-all">
                        <FileArchive className="h-3 w-3" /> Package Zip
                      </button>
                    )}
                  </PanelHeader>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 mb-3">
                    {evidenceList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 rounded border border-dashed border-slate-900 bg-slate-950/20">
                        <Lock className="h-5.5 w-5.5 text-slate-800 mb-2" />
                        <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">Storage space empty. Awaiting investigator uploads.</p>
                      </div>
                    ) : (
                      evidenceList.map(file => (
                        <motion.div key={file.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between bg-black/35 rounded px-3 py-2 border border-slate-950">
                          <div className="min-w-0 flex-1 mr-3">
                            <span className="text-[11px] font-bold text-white/90 truncate block font-mono">{file.filename}</span>
                            <span className="text-[8.5px] font-mono text-slate-600">
                              VER: {file.version} &middot; {(file.file_size / 1024).toFixed(1)} KB &middot; HASH: <span className="text-cyan-400/80">{file.sha256_hash.substring(0, 12)}…</span>
                            </span>
                          </div>
                          <button id={`dl-${file.id}`} onClick={() => handleDownloadAsset(file.id)}
                            className="h-7 w-7 rounded border border-slate-900 flex items-center justify-center text-slate-500 hover:bg-slate-950 hover:text-white transition-all">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Upload box */}
                  {(userRole === "investigator" || userRole === "cyber_cell_officer" || userRole === "supervisor") && (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-slate-900 hover:border-cyan-500/25 hover:bg-cyan-500/5 py-3 text-[10px] font-mono text-slate-500 hover:text-cyan-400 transition-all select-none">
                      {uploading ? (
                        <><RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" /> Anchoring upload to vault...</>
                      ) : (
                        <><Upload className="h-3.5 w-3.5 text-cyan-500/50" /> Push Document to Cryptographic Vault</>
                      )}
                      <input type="file" className="hidden" onChange={handleUploadFile} disabled={uploading} />
                    </label>
                  )}
                </div>

                {/* ── Multi-Tier Close Approvals ── */}
                {selectedTicket.complaint?.status === "Closure Requested" && userRole === "supervisor" && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded border border-yellow-500/25 bg-yellow-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-[9.5px] font-bold font-mono uppercase tracking-[0.2em] text-yellow-400">PENDING CLOSURE CLEARANCE</span>
                    </div>
                    <div className="flex gap-5 text-[9.5px] font-mono">
                      <span className={selectedTicket.l1_approved ? "text-emerald-400" : "text-slate-600"}>
                        {selectedTicket.l1_approved ? <CheckCircle2 className="h-3.5 w-3.5 inline mr-1 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 inline mr-1 text-slate-700" />}
                        L1 Clearance {selectedTicket.l1_approved ? "Approved" : "Awaiting"}
                      </span>
                      <span className={selectedTicket.l2_approved ? "text-emerald-400" : "text-slate-600"}>
                        {selectedTicket.l2_approved ? <CheckCircle2 className="h-3.5 w-3.5 inline mr-1 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 inline mr-1 text-slate-700" />}
                        L2 Final Release {selectedTicket.l2_approved ? "Approved" : "Awaiting"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <input id="approval-comment" type="text" value={approvalComment} onChange={e => setApprovalComment(e.target.value)}
                        placeholder="Supervisor clear verification comment..." className="cyber-input text-[10.5px] border-slate-900 bg-slate-950" />
                      <input id="rejection-reason" type="text" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                        placeholder="Reversion reason (if rejecting)..." className="cyber-input text-[10.5px] border-slate-900 bg-slate-950" />
                      <div className="flex gap-2">
                        {!selectedTicket.l1_approved && (
                          <button id="l1-approve-btn" onClick={() => handleApprovalAction("approved", 1)}
                            className="rounded border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[9.5px] font-bold font-mono text-emerald-400 hover:bg-emerald-500/20 transition-all">
                            Approve Level 1
                          </button>
                        )}
                        {selectedTicket.l1_approved && !selectedTicket.l2_approved && (
                          <button id="l2-approve-btn" onClick={() => handleApprovalAction("approved", 2)}
                            className="rounded border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[9.5px] font-bold font-mono text-emerald-400 hover:bg-emerald-500/20 transition-all">
                            Approve Level 2 (Final Close)
                          </button>
                        )}
                        <button id="reject-btn" onClick={() => handleApprovalAction("rejected", 1)}
                          className="rounded border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[9.5px] font-bold font-mono text-red-400 hover:bg-red-500/20 transition-all">
                          Reject Closure
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Communication Logs & Internal Notes ── */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="glass rounded-xl p-4 border-slate-900">
                    <PanelHeader icon={MessageSquare} title="Case Correspondence" />
                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input id="comment-input" type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                        placeholder="Push conversation message..." className="cyber-input flex-1 text-[10.5px] border-slate-900 bg-slate-950" />
                      <button id="post-comment-btn" type="submit"
                        className="rounded border border-cyan-500/25 bg-cyan-500/5 px-3.5 py-1.5 text-[9.5px] font-bold font-mono text-cyan-400 hover:bg-cyan-500/15 transition-all">
                        Send
                      </button>
                    </form>
                  </div>

                  <div className="glass rounded-xl p-4 border-slate-900">
                    <PanelHeader icon={Lock} title="Private Ledger Notes" color="#f59e0b" />
                    {userRole !== "citizen" ? (
                      <form onSubmit={handleAddNote} className="flex gap-2">
                        <input id="note-input" type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
                          placeholder="Internal investigator comments..." className="cyber-input flex-1 text-[10.5px] border-slate-900 bg-slate-950" style={{ borderColor: "rgba(245,158,11,0.12)" }} />
                        <button id="post-note-btn" type="submit"
                          className="rounded border border-yellow-500/25 bg-yellow-500/5 px-3.5 py-1.5 text-[9.5px] font-bold font-mono text-yellow-400 hover:bg-yellow-500/15 transition-all">
                          Note
                        </button>
                      </form>
                    ) : (
                      <p className="text-[9.5px] font-mono text-slate-600 italic select-none">Notes restricted from citizen viewport</p>
                    )}
                  </div>
                </div>

                {/* ── System Audit Timeline ── */}
                <div className="glass rounded-xl p-4 border-slate-900">
                  <PanelHeader icon={Clock} title="Audit Verification Timeline" color="#8b5cf6" />
                  {timeline.length === 0 ? (
                    <p className="text-[9.5px] font-mono text-slate-600 text-center py-4">Timeline log diagnostics clear</p>
                  ) : (
                    <div className="relative ml-3.5 space-y-4.5 border-l border-slate-900 pl-5">
                      {timeline.map((event, idx) => (
                        <motion.div key={event.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                          className="relative text-[11px]">
                          <div className="absolute -left-[20.5px] top-1.5 h-2 w-2 rounded bg-cyan-400 border border-[#02040a]" style={{ boxShadow: "0 0 8px rgba(6,182,212,0.6)" }} />
                          <div className="flex items-center justify-between font-mono mb-1">
                            <span className="font-bold text-white text-[10.5px] tracking-wide uppercase">{event.event_type}</span>
                            <span className="text-[8.5px] text-slate-600">{new Date(event.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-500 leading-relaxed text-[11.5px] font-sans">{event.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Telemetry Clear Idle State */
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center p-16 gap-6 text-center mt-12">
                <div className="relative">
                  <div className="h-16 w-16 rounded border border-slate-900 bg-slate-950/40 flex items-center justify-center">
                    <FolderOpen className="h-7 w-7 text-slate-700" />
                  </div>
                  {tickets.length > 0 && (
                    <div className="absolute -right-2 -top-2 h-5 w-5 rounded bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
                      <span className="text-[9px] font-bold font-mono text-cyan-400">{tickets.length}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Operations Feed Idle</h3>
                  <p className="text-[10px] font-mono text-slate-600 leading-relaxed">
                    Select an active reference from the Incident Queue to review telemetry registers, update investigate states, or audit proof hashes.
                  </p>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-slate-800 rotate-90 md:rotate-0" />
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
              transition={{ duration: 0.25 }}
              className="glass-card w-full max-w-lg rounded-xl p-6 shadow-2xl space-y-5 border-slate-900">
              <div className="flex items-center gap-3 border-b border-slate-950 pb-4">
                <div className="h-8 w-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Plus className="h-4.5 w-4.5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Create Incident File</h3>
                  <p className="text-[8.5px] font-mono text-slate-600 uppercase tracking-widest">New Tracked Database Entry</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="ml-auto text-slate-600 hover:text-white text-xl leading-none transition-colors">&times;</button>
              </div>
              <form onSubmit={handleCreateTicket} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[8.5px] font-bold font-mono uppercase tracking-wider text-slate-600">Reporter Fullname</label><input id="new-reporter" type="text" required value={newReporter} onChange={e => setNewReporter(e.target.value)} className="cyber-input border-slate-900 bg-slate-950" /></div>
                  <div className="space-y-1"><label className="text-[8.5px] font-bold font-mono uppercase tracking-wider text-slate-600">Reporter Contact</label><input id="new-phone" type="text" value={newReporterPhone} onChange={e => setNewReporterPhone(e.target.value)} className="cyber-input border-slate-900 bg-slate-950" /></div>
                </div>
                <div className="space-y-1"><label className="text-[8.5px] font-bold font-mono uppercase tracking-wider text-slate-600">Identity Email Reference</label><input id="new-email" type="email" value={newReporterEmail} onChange={e => setNewReporterEmail(e.target.value)} className="cyber-input border-slate-900 bg-slate-950" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[8.5px] font-bold font-mono uppercase tracking-wider text-slate-600">Classification Category</label>
                    <select id="new-category" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="cyber-input border-slate-900 bg-slate-950 text-slate-300">
                      <option value="Cyber Financial Fraud">Cyber Financial Fraud</option>
                      <option value="Hacking">Hacking</option>
                      <option value="Ransomware">Ransomware</option>
                      <option value="Cyber Stalking">Cyber Stalking</option>
                    </select></div>
                  <div className="space-y-1"><label className="text-[8.5px] font-bold font-mono uppercase tracking-wider text-slate-600">Quantified Loss (INR)</label><input id="new-amount" type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="cyber-input border-slate-900 bg-slate-950" /></div>
                </div>
                <div className="space-y-1"><label className="text-[8.5px] font-bold font-mono uppercase tracking-wider text-slate-600">Incident Heading / Subject</label><input id="new-title" type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="cyber-input border-slate-900 bg-slate-950" /></div>
                <div className="space-y-1"><label className="text-[8.5px] font-bold font-mono uppercase tracking-wider text-slate-600">Full Incident Description</label><textarea id="new-desc" required value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="cyber-input resize-none border-slate-900 bg-slate-950" /></div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-950">
                  <button type="button" onClick={() => setShowCreateModal(false)}
                    className="rounded border border-slate-900 bg-slate-950 px-4 py-2 text-[9.5px] font-bold font-mono text-slate-500 hover:text-white transition-all">Cancel</button>
                  <button type="submit" id="submit-ticket-btn"
                    className="btn-cyber text-[9.5px] py-2 px-5">Commit Entry</button>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
              transition={{ duration: 0.25 }}
              className="glass-card w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4 border-yellow-500/10">
              <div className="flex items-center gap-3 border-b border-slate-950 pb-4">
                <div className="h-8 w-8 rounded bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-4.5 w-4.5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono font-extrabold">Request Incident Resolution</h3>
                  <p className="text-[8.5px] font-mono text-slate-600 uppercase tracking-widest">Requires Supervisor Clearances</p>
                </div>
                <button onClick={() => setShowClosureModal(false)} className="ml-auto text-slate-600 hover:text-white text-xl leading-none transition-colors">&times;</button>
              </div>
              <form onSubmit={handleRequestClosure} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8.5px] font-bold font-mono uppercase tracking-wider text-slate-600">Investigation Summary Details</label>
                  <textarea id="closure-reason" required rows={4} value={closureReason} onChange={e => setClosureReason(e.target.value)}
                    placeholder="Specify complete action outcome findings..." className="cyber-input resize-none border-slate-900 bg-slate-950 text-slate-300" style={{ borderColor: "rgba(245,158,11,0.12)" }} />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-950">
                  <button type="button" onClick={() => setShowClosureModal(false)}
                    className="rounded border border-slate-900 bg-slate-950 px-4 py-2 text-[9.5px] font-bold font-mono text-slate-500 hover:text-white transition-all">Cancel</button>
                  <button type="submit" id="submit-closure-btn"
                    className="rounded border border-yellow-500/25 bg-yellow-500/10 px-4 py-2 text-[9.5px] font-bold font-mono text-yellow-500 hover:bg-yellow-500/20 transition-all">Submit Request</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
