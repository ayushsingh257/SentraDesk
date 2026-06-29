"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Search, 
  Plus, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  FileText,
  UserCheck,
  Power,
  FolderOpen,
  Upload,
  Download,
  FileArchive,
  RefreshCw,
  Activity,
  Cpu,
  Lock
} from "lucide-react";

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

  // Create new ticket form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newReporter, setNewReporter] = useState("");
  const [newReporterEmail, setNewReporterEmail] = useState("");
  const [newReporterPhone, setNewReporterPhone] = useState("");
  const [newCategory, setNewCategory] = useState("Cyber Financial Fraud");
  const [newAmount, setNewAmount] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setUserName(localStorage.getItem("name") || "Officer");
    setUserRole(localStorage.getItem("role") || "cyber_cell_officer");
    fetchTickets();
    fetchUsers();
  }, [router]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      let url = "http://localhost:8000/api/v1/tickets?";
      if (statusFilter) url += `status=${statusFilter}&`;
      if (severityFilter) url += `severity=${severityFilter}&`;
      if (search) url += `search=${search}&`;

      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setTickets(result.data);
      }
    } catch (err) {
      console.error("Failed to load tickets list:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/api/v1/users/list", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setOfficers(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch users list:", err);
    }
  };

  useEffect(() => {
    if (!selectedTicket?.sla_deadline) {
      setRemainingSlaText("");
      return;
    }
    const updateTimer = () => {
      const deadline = new Date(selectedTicket.sla_deadline).getTime();
      const now = new Date().getTime();
      const diff = deadline - now;
      if (diff <= 0) {
        setRemainingSlaText("BREACHED 🚨");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setRemainingSlaText(`${hours}h ${mins}m ${secs}s remaining`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  const fetchEvidence = async (ticketId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/v1/evidence/${ticketId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setEvidenceList(result.data);
      }
    } catch (err) {
      console.error("Failed to load evidence:", err);
    }
  };

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setNewComment("");
    setNewNote("");
    setRejectionReason("");
    setApprovalComment("");
    fetchEvidence(ticket.id);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/v1/tickets/${ticket.id}/timeline`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setTimeline(result.data);
      }
    } catch (err) {
      console.error("Failed to load timeline details:", err);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const token = localStorage.getItem("access_token");
      const urlResponse = await fetch(`http://localhost:8000/api/v1/evidence/${selectedTicket.id}/upload-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ filename: file.name })
      });
      const urlResult = await urlResponse.json();
      if (!urlResult.success) throw new Error(urlResult.error?.message || "Failed upload link");
      
      const { upload_url, file_path } = urlResult.data;

      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });

      const saveResponse = await fetch(`http://localhost:8000/api/v1/evidence/${selectedTicket.id}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: file.name,
          file_path: file_path,
          mime_type: file.type || "application/octet-stream",
          file_size: file.size,
          sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        })
      });
      
      const saveResult = await saveResponse.json();
      if (saveResult.success) {
        fetchEvidence(selectedTicket.id);
      }
    } catch (err) {
      console.error("Failed to upload evidence asset:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadAsset = async (evidenceId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/v1/evidence/download/${evidenceId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        window.open(result.data, "_blank");
      }
    } catch (err) {
      console.error("Failed to download evidence asset:", err);
    }
  };

  const handleDownloadBulkZip = () => {
    const token = localStorage.getItem("access_token");
    const url = `http://localhost:8000/api/v1/evidence/${selectedTicket.id}/zip`;
    fetch(url, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `evidence_${selectedTicket.ticket_number}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    })
    .catch(err => console.error("Failed to download zip archive:", err));
  };

  const handleRequestClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureReason.trim()) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/v1/approvals/${selectedTicket.id}/request-closure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reason: closureReason })
      });
      const result = await response.json();
      if (result.success) {
        setShowClosureModal(false);
        setClosureReason("");
        const updated = result.data;
        handleSelectTicket(updated);
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to request closure:", err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/api/v1/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          source: "portal",
          reporter_name: newReporter,
          reporter_email: newReporterEmail,
          reporter_phone: newReporterPhone,
          metadata_json: {
            category: newCategory,
            amount: parseFloat(newAmount) || 0.0
          }
        })
      });
      const result = await response.json();
      if (result.success) {
        setShowCreateModal(false);
        setNewTitle("");
        setNewDesc("");
        setNewReporter("");
        setNewReporterEmail("");
        setNewReporterPhone("");
        setNewAmount("");
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to create ticket:", err);
    }
  };

  const handleAssign = async () => {
    if (!selectedOfficer) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket.id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ officer_id: selectedOfficer })
      });
      const result = await response.json();
      if (result.success) {
        setSelectedOfficer("");
        const updated = result.data;
        handleSelectTicket(updated);
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to assign ticket:", err);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (result.success) {
        const updated = result.data;
        handleSelectTicket(updated);
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to change status:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      const result = await response.json();
      if (result.success) {
        setNewComment("");
        handleSelectTicket(selectedTicket);
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newNote })
      });
      const result = await response.json();
      if (result.success) {
        setNewNote("");
        handleSelectTicket(selectedTicket);
      }
    } catch (err) {
      console.error("Failed to add private note:", err);
    }
  };

  const handleApprovalAction = async (action: "approved" | "rejected", level: number) => {
    try {
      const token = localStorage.getItem("access_token");
      let url = "";
      let method = "POST";
      let payload: any = {};
      
      if (action === "approved") {
        url = `http://localhost:8000/api/v1/approvals/${selectedTicket.id}/${level === 1 ? "l1-approve" : "l2-approve"}`;
        payload = { comment: approvalComment || "Approved by supervisor" };
      } else {
        url = `http://localhost:8000/api/v1/tickets/${selectedTicket.id}/status`;
        method = "PUT";
        payload = { status: "Under Investigation" };
        
        await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket.id}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ content: `--- [Closure Rejected] ---\nReason: ${rejectionReason || "Reverted by supervisor"}` })
        });
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        setApprovalComment("");
        setRejectionReason("");
        const updated = result.data;
        handleSelectTicket(updated);
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to record approval decision:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // Severity styling helper
  const severityStyle = (s: string) => {
    if (s === "Critical") return "bg-red-500/10 text-red-400 border border-red-500/20";
    if (s === "High") return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
    if (s === "Medium") return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    return "bg-green-500/10 text-green-400 border border-green-500/20";
  };

  const statusStyle = (s: string) => {
    if (s === "Closed") return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    if (s === "Closure Requested") return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    if (s === "Under Investigation") return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    if (s === "Assigned") return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
    if (s === "Reopened") return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#060814] font-sans">
      {/* ── TOP NAVIGATION BAR ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#060814]/95 px-5 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-widest text-white font-mono uppercase">CCGP</span>
            <span className="ml-2 text-[9px] font-bold text-blue-400/70 tracking-widest uppercase font-mono">SOC Console</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* System status pill */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/5 bg-black/30 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-green-400 uppercase tracking-wider">Systems Nominal</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <Cpu className="h-3.5 w-3.5 text-blue-500" />
            <span className="uppercase tracking-wider font-bold">{userName}</span>
            <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[9px] text-blue-400 uppercase tracking-wider">{userRole}</span>
          </div>
          <button 
            id="logout-btn"
            onClick={handleLogout}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 text-gray-500 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <Power className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: TICKET QUEUE ── */}
        <div className="flex w-[340px] shrink-0 flex-col border-r border-white/5 bg-black/15">
          
          {/* Queue Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-gray-400">Incident Queue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-400">{tickets.length}</span>
              <button
                id="refresh-tickets-btn"
                onClick={fetchTickets}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="space-y-2.5 border-b border-white/5 p-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
                placeholder="Search tickets..."
                className="w-full rounded-lg border border-white/5 bg-black/40 py-2 pl-8 pr-3 text-xs text-white outline-none focus:border-blue-500/30 placeholder-gray-600 font-mono transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-white/5 bg-black/40 py-1.5 px-2.5 text-[11px] text-gray-400 outline-none focus:border-blue-500/30 font-mono"
              >
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Closure Requested">Closure Requested</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
              <select 
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="rounded-lg border border-white/5 bg-black/40 py-1.5 px-2.5 text-[11px] text-gray-400 outline-none focus:border-blue-500/30 font-mono"
              >
                <option value="">All Severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                id="query-tickets-btn"
                onClick={fetchTickets}
                className="flex-1 rounded-lg bg-blue-600/80 py-1.5 text-[11px] font-bold font-mono uppercase tracking-wider text-white hover:bg-blue-500 transition-all"
              >
                Execute Query
              </button>
              <button 
                id="new-ticket-btn"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Ticket Cards */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="animate-pulse rounded-xl bg-white/3 border border-white/5 p-3 space-y-2">
                    <div className="flex justify-between">
                      <div className="h-2.5 w-20 rounded bg-white/10" />
                      <div className="h-2.5 w-12 rounded bg-white/10" />
                    </div>
                    <div className="h-3 w-full rounded bg-white/5" />
                    <div className="h-2 w-3/4 rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-[11px] text-gray-600 font-mono">No tickets found matching filter criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {tickets.map((t) => (
                  <div 
                    key={t.id} 
                    id={`ticket-${t.id}`}
                    onClick={() => handleSelectTicket(t)}
                    className={`flex flex-col gap-2 p-3 cursor-pointer transition-all ${
                      selectedTicket?.id === t.id 
                        ? "bg-blue-500/5 border-l-2 border-blue-500" 
                        : "border-l-2 border-transparent hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono text-blue-400 tracking-wider">{t.ticket_number}</span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase ${severityStyle(t.severity)}`}>
                        {t.severity}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-white line-clamp-1 leading-relaxed">{t.complaint.title}</h4>
                    <div className="flex items-center justify-between">
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase ${statusStyle(t.complaint.status)}`}>
                        {t.complaint.status}
                      </span>
                      <span className="text-[9px] text-gray-600 font-mono">{t.assigned_group || "Unassigned"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: CASE DETAIL PANEL ── */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-[#060814]">
          {selectedTicket ? (
            <div className="p-5 space-y-5">
              
              {/* Case Header */}
              <div className="glass rounded-xl p-5 border border-white/5 bg-slate-950/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold font-mono text-blue-400 tracking-widest uppercase">{selectedTicket.ticket_number}</span>
                      <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold font-mono uppercase ${severityStyle(selectedTicket.severity)}`}>
                        {selectedTicket.severity}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold font-mono uppercase ${statusStyle(selectedTicket.complaint.status)}`}>
                        {selectedTicket.complaint.status}
                      </span>
                      {selectedTicket.is_escalated && (
                        <span className="rounded-md px-2 py-0.5 text-[9px] font-bold font-mono uppercase bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse">
                          🚨 ESCALATED
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight">{selectedTicket.complaint.title}</h2>
                    <p className="text-[11px] text-gray-500 font-mono">
                      Source: <span className="text-gray-300">{selectedTicket.complaint.source}</span>
                      <span className="mx-2 text-gray-700">|</span>
                      Reporter: <span className="text-gray-300">{selectedTicket.complaint.reporter_name}</span>
                      {selectedTicket.complaint.reporter_phone && (
                        <><span className="mx-2 text-gray-700">|</span><span className="text-gray-300">{selectedTicket.complaint.reporter_phone}</span></>
                      )}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex shrink-0 gap-2">
                    {selectedTicket.complaint.status === "New" && (
                      <button 
                        id="acknowledge-btn"
                        onClick={() => handleStatusChange("Assigned")}
                        className="rounded-lg bg-emerald-600/80 border border-emerald-500/20 px-3 py-1.5 text-[11px] font-bold font-mono uppercase tracking-wider text-white hover:bg-emerald-500 transition-all"
                      >
                        Acknowledge
                      </button>
                    )}
                    {selectedTicket.complaint.status === "Assigned" && (
                      <button 
                        id="investigate-btn"
                        onClick={() => handleStatusChange("Under Investigation")}
                        className="rounded-lg bg-blue-600/80 border border-blue-500/20 px-3 py-1.5 text-[11px] font-bold font-mono uppercase tracking-wider text-white hover:bg-blue-500 transition-all"
                      >
                        Investigate
                      </button>
                    )}
                    {selectedTicket.complaint.status === "Under Investigation" && (
                      <button 
                        id="request-closure-btn"
                        onClick={() => setShowClosureModal(true)}
                        className="rounded-lg bg-yellow-600/80 border border-yellow-500/20 px-3 py-1.5 text-[11px] font-bold font-mono uppercase tracking-wider text-black hover:bg-yellow-500 transition-all"
                      >
                        Request Closure
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Two-column Detail Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                
                {/* Case Details */}
                <div className="glass rounded-xl p-4 border border-white/5 bg-slate-950/20 space-y-3">
                  <h3 className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-gray-500">
                    <FileText className="h-3.5 w-3.5 text-blue-500" /> Case Details
                  </h3>
                  <p className="text-[11px] leading-relaxed text-gray-400 bg-black/20 rounded-lg p-3 min-h-[60px] border border-white/5">
                    {selectedTicket.complaint.description}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold font-mono uppercase tracking-widest text-gray-600">Category</span>
                      <span className="text-xs font-semibold text-white">{selectedTicket.category}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold font-mono uppercase tracking-widest text-gray-600">Status</span>
                      <span className="text-xs font-semibold text-white">{selectedTicket.complaint.status}</span>
                    </div>
                  </div>
                </div>

                {/* Routing & SLA */}
                <div className="glass rounded-xl p-4 border border-white/5 bg-slate-950/20 space-y-3">
                  <h3 className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-gray-500">
                    <UserCheck className="h-3.5 w-3.5 text-blue-500" /> Routing & SLA
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold font-mono uppercase tracking-widest text-gray-600">Assigned Group</span>
                      <span className="text-xs font-semibold text-white">{selectedTicket.assigned_group || "—"}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold font-mono uppercase tracking-widest text-gray-600">Officer</span>
                      <span className="text-xs font-semibold text-white">
                        {selectedTicket.assigned_officer_id 
                          ? (officers.find(o => o.id === selectedTicket.assigned_officer_id)?.name || "Assigned") 
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* SLA Countdown */}
                  <div className="rounded-lg border border-white/5 bg-black/25 p-3 flex items-center justify-between">
                    <div>
                      <span className="block text-[9px] font-bold font-mono uppercase tracking-widest text-gray-600 mb-1">SLA Countdown</span>
                      <span className={`text-sm font-bold font-mono ${
                        selectedTicket.is_escalated || remainingSlaText.includes("BREACHED") 
                          ? "text-red-400 animate-pulse" 
                          : "text-yellow-400"
                      }`}>
                        {remainingSlaText || "No SLA Set"}
                      </span>
                    </div>
                    <Clock className={`h-5 w-5 ${selectedTicket.is_escalated ? "text-red-500" : "text-yellow-500/50"}`} />
                  </div>

                  {/* Supervisor Assign */}
                  {userRole === "supervisor" && (
                    <div className="flex gap-2 pt-1">
                      <select 
                        id="officer-select"
                        value={selectedOfficer}
                        onChange={(e) => setSelectedOfficer(e.target.value)}
                        className="flex-1 rounded-lg border border-white/5 bg-black/40 py-1.5 px-2.5 text-[11px] text-gray-400 outline-none focus:border-blue-500/30 font-mono"
                      >
                        <option value="">Select Investigator</option>
                        {officers.map((o) => (
                          <option key={o.id} value={o.id}>{o.name} ({o.role})</option>
                        ))}
                      </select>
                      <button 
                        id="assign-btn"
                        onClick={handleAssign}
                        className="rounded-lg bg-blue-600/80 border border-blue-500/20 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500 transition-all font-mono"
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Evidence Repository */}
              <div className="glass rounded-xl p-4 border border-white/5 bg-slate-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-gray-500">
                    <FolderOpen className="h-3.5 w-3.5 text-blue-500" /> Evidence Vault
                  </h3>
                  {evidenceList.length > 0 && (
                    <button
                      id="download-zip-btn"
                      onClick={handleDownloadBulkZip}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 text-[10px] font-bold font-mono text-blue-400 hover:bg-blue-500/15 transition-all"
                    >
                      <FileArchive className="h-3 w-3" /> Bundle ZIP
                    </button>
                  )}
                </div>
                
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {evidenceList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-white/5 bg-black/10 gap-2">
                      <Lock className="h-5 w-5 text-gray-700" />
                      <p className="text-[11px] text-gray-600 font-mono">No evidence files in vault.</p>
                    </div>
                  ) : (
                    evidenceList.map((file) => (
                      <div key={file.id} className="flex items-center justify-between bg-black/25 p-2.5 rounded-lg border border-white/5">
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
                          <span className="text-xs font-semibold text-white truncate">{file.filename}</span>
                          <span className="text-[9px] text-gray-600 font-mono">
                            v{file.version} &middot; {(file.file_size / 1024).toFixed(1)} KB &middot; SHA-256: <code className="text-blue-400">{file.sha256_hash.substring(0, 10)}…</code>
                          </span>
                        </div>
                        <button
                          id={`download-file-${file.id}`}
                          onClick={() => handleDownloadAsset(file.id)}
                          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/5 text-gray-500 hover:bg-white/5 hover:text-white transition-all"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {(userRole === "investigator" || userRole === "cyber_cell_officer" || userRole === "supervisor") && (
                  <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 py-3 transition-all text-[11px] font-mono text-gray-600 hover:text-gray-300">
                    {uploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                        <span>Uploading to vault...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-blue-500/70" />
                        <span>Upload Evidence (Presigned PUT)</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleUploadFile}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {/* L1/L2 Supervisor Approvals Panel */}
              {selectedTicket.complaint.status === "Closure Requested" && userRole === "supervisor" && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-yellow-400">Pending Closure Approvals</h3>
                  </div>
                  <div className="flex gap-4 text-[11px] font-mono">
                    <span>L1: <strong className="text-white">{selectedTicket.l1_approved ? "✅ Approved" : "❌ Pending"}</strong></span>
                    <span>L2: <strong className="text-white">{selectedTicket.l2_approved ? "✅ Approved" : "❌ Pending"}</strong></span>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="text"
                      id="approval-comment-input"
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder="Supervisor approval comment..."
                      className="w-full rounded-lg border border-white/5 bg-black/30 py-2 px-3 text-xs text-white outline-none focus:border-yellow-500/30 font-mono placeholder-gray-600"
                    />
                    <input 
                      type="text"
                      id="rejection-reason-input"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Rejection reason (if rejecting)..."
                      className="w-full rounded-lg border border-white/5 bg-black/30 py-2 px-3 text-xs text-white outline-none focus:border-red-500/30 font-mono placeholder-gray-600"
                    />
                    <div className="flex gap-2">
                      {!selectedTicket.l1_approved && (
                        <button 
                          id="l1-approve-btn"
                          onClick={() => handleApprovalAction("approved", 1)}
                          className="rounded-lg bg-green-600/80 border border-green-500/20 px-3 py-1.5 text-[11px] font-bold font-mono uppercase text-white hover:bg-green-500 transition-all"
                        >
                          L1 Approve
                        </button>
                      )}
                      {selectedTicket.l1_approved && !selectedTicket.l2_approved && (
                        <button 
                          id="l2-approve-btn"
                          onClick={() => handleApprovalAction("approved", 2)}
                          className="rounded-lg bg-green-600/80 border border-green-500/20 px-3 py-1.5 text-[11px] font-bold font-mono uppercase text-white hover:bg-green-500 transition-all"
                        >
                          L2 Final Close
                        </button>
                      )}
                      <button 
                        id="reject-closure-btn"
                        onClick={() => handleApprovalAction("rejected", 1)}
                        className="rounded-lg bg-red-600/80 border border-red-500/20 px-3 py-1.5 text-[11px] font-bold font-mono uppercase text-white hover:bg-red-500 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments & Notes Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Public Comments */}
                <div className="glass rounded-xl p-4 border border-white/5 bg-slate-950/20 space-y-3">
                  <h3 className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-gray-500">
                    <MessageSquare className="h-3.5 w-3.5 text-blue-500" /> Public Discussion
                  </h3>
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input 
                      type="text"
                      id="comment-input"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a message..."
                      className="flex-1 rounded-lg border border-white/5 bg-black/30 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/30 font-mono placeholder-gray-600"
                    />
                    <button 
                      id="submit-comment-btn"
                      type="submit"
                      className="rounded-lg bg-blue-600/80 border border-blue-500/20 px-3 py-2 text-[11px] font-bold font-mono text-white hover:bg-blue-500 transition-all"
                    >
                      Post
                    </button>
                  </form>
                </div>

                {/* Private Notes */}
                <div className="glass rounded-xl p-4 border border-yellow-500/10 bg-yellow-500/[0.02] space-y-3">
                  <h3 className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-yellow-500/70">
                    <Shield className="h-3.5 w-3.5 text-yellow-500" /> Private Investigation Notes
                  </h3>
                  {userRole !== "citizen" ? (
                    <form onSubmit={handleAddNote} className="flex gap-2">
                      <input 
                        type="text"
                        id="note-input"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Internal note only..."
                        className="flex-1 rounded-lg border border-yellow-500/10 bg-black/30 py-2 px-3 text-xs text-white outline-none focus:border-yellow-500/30 font-mono placeholder-gray-600"
                      />
                      <button 
                        id="submit-note-btn"
                        type="submit"
                        className="rounded-lg bg-yellow-600/80 border border-yellow-500/20 px-3 py-2 text-[11px] font-bold font-mono text-black hover:bg-yellow-500 transition-all"
                      >
                        Note
                      </button>
                    </form>
                  ) : (
                    <p className="text-[11px] text-gray-600 font-mono">Citizen accounts cannot access private notes.</p>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="glass rounded-xl p-4 border border-white/5 bg-slate-950/20 space-y-3">
                <h3 className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-gray-500">
                  <Clock className="h-3.5 w-3.5 text-blue-500" /> Activity Timeline
                </h3>
                {timeline.length === 0 ? (
                  <p className="text-[11px] text-gray-600 font-mono py-3 text-center">No activity recorded yet.</p>
                ) : (
                  <div className="relative ml-2 space-y-3 border-l border-white/5 pl-4">
                    {timeline.map((event) => (
                      <div key={event.id} className="relative text-[11px]">
                        <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-blue-500 border-2 border-[#060814]" />
                        <div className="flex items-center justify-between text-gray-600 font-mono mb-0.5">
                          <span className="font-bold text-white text-[11px]">{event.event_type}</span>
                          <span className="text-[9px]">{new Date(event.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-500 leading-relaxed">{event.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-1 flex-col items-center justify-center text-center p-16 gap-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
                  <FolderOpen className="h-9 w-9 text-gray-700" />
                </div>
                <div className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <span className="text-[9px] text-blue-400 font-bold font-mono">{tickets.length}</span>
                </div>
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="text-base font-bold text-white tracking-wide">Select an Incident</h3>
                <p className="text-[11px] text-gray-500 font-mono leading-relaxed">
                  Click any incident ticket from the queue panel to view case details, evidence, SLA tracking, and workflow controls.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE TICKET MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-white/10 bg-slate-950/70 space-y-5">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Plus className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">File Incident Complaint</h3>
                <p className="text-[10px] text-gray-500 font-mono">Create a new tracked incident ticket</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="ml-auto text-gray-600 hover:text-white transition-all text-lg leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-gray-500">Reporter Name</label>
                  <input id="new-reporter-name" type="text" required value={newReporter} onChange={(e) => setNewReporter(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/30 font-mono placeholder-gray-600" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-gray-500">Reporter Phone</label>
                  <input id="new-reporter-phone" type="text" value={newReporterPhone} onChange={(e) => setNewReporterPhone(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/30 font-mono placeholder-gray-600" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-gray-500">Reporter Email</label>
                <input id="new-reporter-email" type="email" value={newReporterEmail} onChange={(e) => setNewReporterEmail(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/30 font-mono placeholder-gray-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-gray-500">Category</label>
                  <select id="new-category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-gray-300 outline-none focus:border-blue-500/30 font-mono">
                    <option value="Cyber Financial Fraud">Cyber Financial Fraud</option>
                    <option value="Hacking">Hacking</option>
                    <option value="Ransomware">Ransomware</option>
                    <option value="Cyber Stalking">Cyber Stalking</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-gray-500">Loss Amount (INR)</label>
                  <input id="new-amount" type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/30 font-mono placeholder-gray-600" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-gray-500">Incident Title</label>
                <input id="new-title" type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/30 font-mono placeholder-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-gray-500">Incident Description</label>
                <textarea id="new-desc" required value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/30 font-mono placeholder-gray-600 resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button id="cancel-create-btn" type="button" onClick={() => setShowCreateModal(false)} className="rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-xs font-bold font-mono text-gray-400 hover:bg-white/10 hover:text-white transition-all">
                  Cancel
                </button>
                <button id="submit-create-btn" type="submit" className="rounded-lg bg-blue-600/90 border border-blue-500/20 px-4 py-2 text-xs font-bold font-mono text-white hover:bg-blue-500 transition-all">
                  File Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CLOSURE REQUEST MODAL ── */}
      {showClosureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-yellow-500/10 bg-slate-950/70 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="h-8 w-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Request Incident Closure</h3>
                <p className="text-[10px] text-gray-500 font-mono">Requires multi-tier supervisor approval</p>
              </div>
              <button onClick={() => setShowClosureModal(false)} className="ml-auto text-gray-600 hover:text-white transition-all text-lg leading-none">&times;</button>
            </div>
            <form onSubmit={handleRequestClosure} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-gray-500">Closure Reason / Investigation Outcomes</label>
                <textarea
                  id="closure-reason-input"
                  required
                  rows={4}
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="Specify resolution findings..."
                  className="w-full rounded-lg border border-white/5 bg-black/30 py-2.5 px-3 text-xs text-white outline-none focus:border-yellow-500/30 font-mono placeholder-gray-600 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button id="cancel-closure-btn" type="button" onClick={() => setShowClosureModal(false)} className="rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-xs font-bold font-mono text-gray-400 hover:bg-white/10 hover:text-white transition-all">
                  Cancel
                </button>
                <button id="submit-closure-btn" type="submit" className="rounded-lg bg-yellow-600/80 border border-yellow-500/20 px-4 py-2 text-xs font-bold font-mono text-black hover:bg-yellow-500 transition-all">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
