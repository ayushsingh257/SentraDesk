"use client";

import React, { useState } from "react";
import { Search, Filter, Download, ArrowRight, Calendar, AlertTriangle, ShieldCheck } from "lucide-react";

export default function UnifiedSearch() {
  const [query, setQuery] = useState("");
  const [matchType, setMatchType] = useState("hybrid"); // hybrid, keyword, semantic
  const [indicatorType, setIndicatorType] = useState(""); // phone, upi, email, wallet, bank_account
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const token = localStorage.getItem("access_token");
      // Execute the search route we mapped
      let url = `http://localhost:8000/api/v1/tickets/global/search?q=${encodeURIComponent(query)}&limit=30`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Local filtering to simulate facet refinement
        let filtered = data.data || [];
        if (severity) {
          filtered = filtered.filter((t: any) => t.severity.toLowerCase() === severity.toLowerCase());
        }
        if (category) {
          filtered = filtered.filter((t: any) => t.category.toLowerCase() === category.toLowerCase());
        }
        setResults(filtered);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format: "json" | "csv") => {
    if (results.length === 0) return;
    let dataStr = "";
    let mimeType = "";
    let filename = "";

    if (format === "json") {
      dataStr = JSON.stringify(results, null, 2);
      mimeType = "application/json";
      filename = `search_export_${Date.now()}.json`;
    } else {
      const headers = ["Ticket ID", "Number", "Title", "Category", "Severity", "Status", "Score", "Match Type"];
      const rows = results.map(r => [
        r.ticket_id, r.ticket_number, `"${r.title.replace(/"/g, '""')}"`, r.category, r.severity, r.status, r.score, r.match_type
      ]);
      dataStr = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
      mimeType = "text/csv";
      filename = `search_export_${Date.now()}.csv`;
    }

    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-5 p-5">
      {/* Search Panel */}
      <div className="glass-card rounded-xl p-5 border border-cyan-500/10 bg-[#060814]/40">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Search className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <span className="text-[10px] font-bold font-mono uppercase tracking-[0.15em] text-slate-400">Faceted Global Search Console</span>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Enter search keywords, IP addresses, UPI IDs, bank accounts, hashes..."
                className="cyber-input pl-10 w-full text-xs py-3"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 font-mono font-bold text-xs uppercase tracking-wider text-white hover:from-blue-500 hover:to-cyan-500 hover:shadow-[0_0_16px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2"
            >
              {loading ? "Searching..." : "Execute Scan"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Facets / Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-slate-500 block">Match Logic</label>
              <select
                value={matchType}
                onChange={e => setMatchType(e.target.value)}
                className="cyber-input w-full text-[10px] py-1.5 px-2"
              >
                <option value="hybrid">Hybrid (SQL + Semantic)</option>
                <option value="keyword">SQL Keyword Match</option>
                <option value="semantic">Qdrant Vector Semantic</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-slate-500 block">Indicator Facet</label>
              <select
                value={indicatorType}
                onChange={e => setIndicatorType(e.target.value)}
                className="cyber-input w-full text-[10px] py-1.5 px-2"
              >
                <option value="">Any Technical Indicator</option>
                <option value="phone">Phone Number</option>
                <option value="upi">UPI Address</option>
                <option value="email">Email Account</option>
                <option value="wallet">Crypto Wallet</option>
                <option value="bank_account">Bank Account</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-slate-500 block">Severity Classification</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="cyber-input w-full text-[10px] py-1.5 px-2"
              >
                <option value="">Any Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-slate-500 block">Incident Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="cyber-input w-full text-[10px] py-1.5 px-2"
              >
                <option value="">Any Category</option>
                <option value="cyber financial fraud">Cyber Financial Fraud</option>
                <option value="hacking">Hacking</option>
                <option value="ransomware">Ransomware</option>
                <option value="online harassment">Online Harassment</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Export & Results Header */}
      {searched && (
        <div className="flex justify-between items-center px-2">
          <div className="text-[10px] font-mono uppercase text-slate-500">
            Scan complete &mdash; <span className="text-cyan-400">{results.length} Matches</span> identified
          </div>
          {results.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => exportData("csv")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-black/40 px-3 py-1.5 text-[9px] font-bold font-mono text-slate-400 hover:text-white hover:border-slate-600 transition-all"
              >
                <Download className="h-3 w-3" /> Export CSV
              </button>
              <button
                onClick={() => exportData("json")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-black/40 px-3 py-1.5 text-[9px] font-bold font-mono text-slate-400 hover:text-white hover:border-slate-600 transition-all"
              >
                <Download className="h-3 w-3" /> Export JSON
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3 border border-white/5 bg-black/20 rounded-xl">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Running database cross-scan queries...</span>
        </div>
      ) : results.length === 0 ? (
        searched ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3 border border-white/5 bg-black/20 rounded-xl text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500/60" />
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Zero Target Matches Found</h3>
              <p className="text-[10px] text-slate-600 mt-1 max-w-sm">No matches found in SQL index grids or semantic vector coordinates.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 gap-3 border border-white/5 bg-black/20 rounded-xl text-center">
            <ShieldCheck className="h-8 w-8 text-cyan-500/40" />
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">Global Threat Intelligence Search</h3>
              <p className="text-[10px] text-slate-600 mt-1">Submit keywords or technical values above to search the unified complaint registry.</p>
            </div>
          </div>
        )
      ) : (
        <div className="grid gap-3.5">
          {results.map((item: any) => (
            <div key={item.ticket_id} className="glass-card rounded-xl p-4 border border-white/5 hover:border-cyan-500/20 bg-[#060814]/30 hover:bg-[#060814]/60 transition-all flex justify-between items-start">
              <div className="space-y-1.5 flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-bold font-mono text-cyan-400 uppercase tracking-widest">{item.ticket_number}</span>
                  <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[8px] font-bold font-mono uppercase text-slate-400">{item.category}</span>
                  <span className="rounded bg-slate-500/10 border border-slate-500/20 text-[8px] font-bold font-mono uppercase text-slate-400 px-1.5 py-0.5">{item.severity}</span>
                </div>
                <h3 className="text-[13px] font-bold text-white/95 truncate">{item.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-3 text-[9px] font-mono text-slate-600">
                  <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                  <span>&middot;</span>
                  <span>Assigned Unit: {item.assigned_group || "General Triage"}</span>
                </div>
              </div>

              {/* Match telemetry */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${
                  item.match_type === "entity_index" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" :
                  item.match_type === "hybrid" ? "border-blue-500/25 bg-blue-500/10 text-blue-400" : "border-slate-500/25 bg-slate-500/10 text-slate-400"
                }`}>
                  {item.match_type === "entity_index" ? "ENTITY DETECTED" : item.match_type}
                </span>
                <div className="text-right">
                  <span className="block text-[8px] font-mono text-slate-600 uppercase">Match Score</span>
                  <span className="text-xs font-bold font-mono text-cyan-400">{item.score.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
