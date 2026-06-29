"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Search, 
  Filter, 
  Plus, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare, 
  FileText,
  UserCheck,
  Power,
  ChevronRight,
  TrendingUp,
  FolderOpen
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

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setNewComment("");
    setNewNote("");
    setRejectionReason("");
    // Fetch timeline
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
        // Reload details
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
        // Reload timeline
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

  const handleApprovalAction = async (decision: string, level: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/v1/tickets/${selectedTicket.id}/approvals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          decision,
          reason: decision === "rejected" ? rejectionReason : "Approved by supervisor",
          level
        })
      });
      const result = await response.json();
      if (result.success) {
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-cyber-bg">
      {/* Top Banner Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-cyber-bg px-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-500" />
          <span className="text-lg font-bold tracking-tight text-white uppercase">TechM CCGP Console</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-cyber-muted uppercase tracking-wider">{userName} ({userRole})</span>
          </div>
          <button 
            onClick={handleLogout}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-cyber-muted hover:text-red-400 transition-all"
          >
            <Power className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Primary Panels Dashboard Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Tickets Queue List */}
        <div className="flex w-2/5 flex-col border-r border-white/5 bg-black/10">
          {/* Filters & Controls */}
          <div className="space-y-4 p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyber-muted">
                  <Search className="h-4 w-4" />
                </span>
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
                  placeholder="Query ticket number or reporter..."
                  className="w-full rounded-lg border border-white/5 bg-black/40 py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-blue-500/40"
                />
              </div>
              <button 
                onClick={fetchTickets}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all"
              >
                Query
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-cyber-muted hover:bg-white/10 hover:text-white transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-cyber-muted outline-none focus:border-blue-500/40"
              >
                <option value="">All Statuses</option>
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
                className="flex-1 rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-cyber-muted outline-none focus:border-blue-500/40"
              >
                <option value="">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Cards List Scroller */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-xs text-cyber-muted">Scanning active queues...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-cyber-muted">No tickets found matching queries.</div>
            ) : (
              tickets.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => handleSelectTicket(t)}
                  className={`flex flex-col gap-3 p-4 cursor-pointer transition-all ${
                    selectedTicket?.id === t.id ? "bg-blue-500/5 border-l-2 border-blue-500" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">{t.ticket_number}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      t.severity === "Critical" ? "bg-red-500/10 text-red-400" :
                      t.severity === "High" ? "bg-orange-500/10 text-orange-400" :
                      t.severity === "Medium" ? "bg-yellow-500/10 text-yellow-400" : "bg-green-500/10 text-green-400"
                    }`}>
                      {t.severity}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{t.complaint.title}</h4>
                  <div className="flex items-center justify-between text-xs text-cyber-muted">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {t.complaint.status}</span>
                    <span>{t.assigned_group || "Unassigned"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Ticket Operations Details */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-black/5 p-6">
          {selectedTicket ? (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="flex items-start justify-between border-b border-white/5 pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{selectedTicket.complaint.title}</h2>
                    <span className="text-xs font-bold text-cyber-muted uppercase tracking-wider">
                      ({selectedTicket.ticket_number})
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-cyber-muted leading-relaxed">
                    Source: <span className="text-white font-semibold">{selectedTicket.complaint.source}</span> | 
                    Reporter: <span className="text-white font-semibold">{selectedTicket.complaint.reporter_name} ({selectedTicket.complaint.reporter_phone || "N/A"})</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedTicket.complaint.status === "New" && (
                    <button 
                      onClick={() => handleStatusChange("Assigned")}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all"
                    >
                      Acknowledge
                    </button>
                  )}
                  {selectedTicket.complaint.status === "Assigned" && (
                    <button 
                      onClick={() => handleStatusChange("Under Investigation")}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
                    >
                      Start Investigation
                    </button>
                  )}
                  {selectedTicket.complaint.status === "Under Investigation" && (
                    <button 
                      onClick={() => handleStatusChange("Closure Requested")}
                      className="rounded-lg bg-yellow-600 px-4 py-2 text-xs font-semibold text-white hover:bg-yellow-500 transition-all"
                    >
                      Request Closure
                    </button>
                  )}
                </div>
              </div>

              {/* Grid Properties Panels */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Details Card */}
                <div className="glass rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-muted flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-blue-500" /> Case Details
                  </h3>
                  <div className="text-xs leading-relaxed text-cyber-muted bg-black/20 p-4 rounded-lg min-h-[80px]">
                    {selectedTicket.complaint.description}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-cyber-muted">Status</span>
                      <span className="font-bold text-white">{selectedTicket.complaint.status}</span>
                    </div>
                    <div>
                      <span className="block text-cyber-muted">Category</span>
                      <span className="font-bold text-white">{selectedTicket.category}</span>
                    </div>
                  </div>
                </div>

                {/* Assignment & Escort Card */}
                <div className="glass rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-muted flex items-center gap-2">
                    <UserCheck className="h-4.5 w-4.5 text-blue-500" /> Routing & Controls
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-cyber-muted">Assigned Team</span>
                      <span className="font-bold text-white">{selectedTicket.assigned_group || "Unassigned"}</span>
                    </div>
                    <div>
                      <span className="block text-cyber-muted">Assigned Officer</span>
                      <span className="font-bold text-white">
                        {selectedTicket.assigned_officer_id ? 
                          (officers.find(o => o.id === selectedTicket.assigned_officer_id)?.name || "Assigned") 
                          : "Unassigned"}
                      </span>
                    </div>
                  </div>

                  {userRole === "supervisor" && (
                    <div className="flex gap-2 pt-2">
                      <select 
                        value={selectedOfficer}
                        onChange={(e) => setSelectedOfficer(e.target.value)}
                        className="flex-1 rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-cyber-muted outline-none focus:border-blue-500/40"
                      >
                        <option value="">Select Investigator</option>
                        {officers.map((o) => (
                          <option key={o.id} value={o.id}>{o.name} ({o.role})</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleAssign}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all"
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* L1 & L2 Supervisor Approvals Panel */}
              {selectedTicket.complaint.status === "Closure Requested" && userRole === "supervisor" && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="h-4.5 w-4.5" /> Pending Closure Approvals
                  </h3>
                  <p className="text-xs text-cyber-muted leading-relaxed">
                    This ticket requires supervisor approvals to move into Closed state. 
                    L1 Approval: <span className="font-bold text-white">{selectedTicket.l1_approved ? "Yes ✅" : "No ❌"}</span> | 
                    L2 Approval: <span className="font-bold text-white">{selectedTicket.l2_approved ? "Yes ✅" : "No ❌"}</span>
                  </p>
                  <div className="space-y-3">
                    <input 
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Specify rejection reason details if rejecting..."
                      className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/40"
                    />
                    <div className="flex gap-2">
                      {!selectedTicket.l1_approved && (
                        <button 
                          onClick={() => handleApprovalAction("approved", 1)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-500 transition-all"
                        >
                          L1 Approve
                        </button>
                      )}
                      {selectedTicket.l1_approved && !selectedTicket.l2_approved && (
                        <button 
                          onClick={() => handleApprovalAction("approved", 2)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-500 transition-all"
                        >
                          L2 Approve (Final Close)
                        </button>
                      )}
                      <button 
                        onClick={() => handleApprovalAction("rejected", 1)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-all"
                      >
                        Reject Closure
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Private Notes & Comments Sections */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Public Comments Thread */}
                <div className="glass rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-muted flex items-center gap-2">
                    <MessageSquare className="h-4.5 w-4.5 text-blue-500" /> Public Discussion
                  </h3>
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input 
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add public message..."
                      className="flex-1 rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/40"
                    />
                    <button 
                      type="submit"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all"
                    >
                      Post
                    </button>
                  </form>
                </div>

                {/* Private Investigation Notes */}
                <div className="glass rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5 text-yellow-500" /> Private Investigation Notes
                  </h3>
                  {userRole !== "citizen" ? (
                    <form onSubmit={handleAddNote} className="flex gap-2">
                      <input 
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add private note (internal only)..."
                        className="flex-1 rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/40"
                      />
                      <button 
                        type="submit"
                        className="rounded-lg bg-yellow-600 px-4 py-2 text-xs font-semibold text-black hover:bg-yellow-500 transition-all"
                      >
                        Note
                      </button>
                    </form>
                  ) : (
                    <p className="text-xs text-cyber-muted">Citizen portal accounts cannot access private note grids.</p>
                  )}
                </div>
              </div>

              {/* Case History Timeline */}
              <div className="glass rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-muted flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-blue-500" /> Activity History Feed
                </h3>
                <div className="space-y-4 relative border-l border-white/5 pl-4 ml-2">
                  {timeline.map((event) => (
                    <div key={event.id} className="relative text-xs">
                      <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 border border-cyber-bg" />
                      <div className="flex items-center justify-between text-cyber-muted">
                        <span className="font-bold text-white">{event.event_type}</span>
                        <span>{new Date(event.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-cyber-muted/80">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-12">
              <FolderOpen className="h-16 w-16 text-cyber-muted/30" />
              <h3 className="mt-4 text-lg font-bold text-white">Select a Case</h3>
              <p className="mt-2 max-w-xs text-xs text-cyber-muted leading-relaxed">
                Click on any incident ticket from the queue list panel to explore evidence details, workflows, and operations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6">
            <h3 className="text-lg font-bold text-white">File Incident Complaint</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted">Reporter Name</label>
                  <input type="text" required value={newReporter} onChange={(e) => setNewReporter(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/40" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted">Reporter Phone</label>
                  <input type="text" value={newReporterPhone} onChange={(e) => setNewReporterPhone(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/40" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted">Reporter Email</label>
                <input type="email" value={newReporterEmail} onChange={(e) => setNewReporterEmail(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/40" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-cyber-muted outline-none focus:border-blue-500/40">
                    <option value="Cyber Financial Fraud">Cyber Financial Fraud</option>
                    <option value="Hacking">Hacking</option>
                    <option value="Ransomware">Ransomware</option>
                    <option value="Cyber Stalking">Cyber Stalking</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted">Loss Amount (INR)</label>
                  <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/40" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted">Incident Title</label>
                <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/40" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted">Incident Description</label>
                <textarea required value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} className="w-full rounded-lg border border-white/5 bg-black/40 py-2 px-3 text-xs text-white outline-none focus:border-blue-500/40" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-xs font-semibold text-cyber-muted hover:bg-white/10 hover:text-white transition-all">Cancel</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all">File Complaint</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
