"use client";

import React, { useState, useEffect } from "react";
import { Lock, ShieldAlert, CheckCircle2, RefreshCw, Layers, Database, Cpu, HelpCircle, FileText } from "lucide-react";

export default function AuditorConsole() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [anchoring, setAnchoring] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [anchorResult, setAnchorResult] = useState<any>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/v1/audit/logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const runVerification = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/v1/audit/verify", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVerificationResult(data.data);
      }
    } catch (err) {
      console.error("Error verifying audit chain:", err);
    } finally {
      setVerifying(false);
    }
  };

  const anchorBatch = async () => {
    setAnchoring(true);
    setAnchorResult(null);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/v1/audit/anchor", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAnchorResult(data.data);
        fetchAuditLogs(); // Refresh logs to update anchored badges
      }
    } catch (err) {
      console.error("Error anchoring batch:", err);
    } finally {
      setAnchoring(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-5 p-5">
      {/* Hashing Ledger Status */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Verification Summary Card */}
        <div className="glass-card rounded-xl p-4 border border-cyan-500/10 bg-[#060814]/40 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Chain Integrity Status</span>
              <Lock className="h-4 w-4 text-cyan-400" />
            </div>
            {verificationResult ? (
              verificationResult.success ? (
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" /> VERIFIED SECURE
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-sm">
                  <ShieldAlert className="h-4 w-4 animate-pulse" /> INTEGRITY COMPROMISED
                </div>
              )
            ) : (
              <span className="text-slate-400 text-xs font-mono">Scan Awaiting Trigger</span>
            )}
          </div>
          <button
            onClick={runVerification}
            disabled={verifying}
            className="w-full mt-4 rounded-lg bg-cyan-600/15 border border-cyan-500/20 py-2 text-[10px] font-bold font-mono uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/25 transition-all flex items-center justify-center gap-2"
          >
            {verifying ? (
              <><RefreshCw className="h-3 w-3 animate-spin" /> RUNNING VERIFICATION...</>
            ) : "RUN INTEGRITY VERIFIER"}
          </button>
        </div>

        {/* Anchor Ledger Card */}
        <div className="glass-card rounded-xl p-4 border border-cyan-500/10 bg-[#060814]/40 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Verifiable Anchors</span>
              <Layers className="h-4 w-4 text-purple-400" />
            </div>
            {anchorResult ? (
              <div className="text-xs font-mono">
                <span className="text-purple-400 block font-bold">Ledger Batch Anchored</span>
                <span className="text-[9px] text-slate-500 truncate block mt-0.5 max-w-[200px]">{anchorResult.transaction_id || "N/A"}</span>
              </div>
            ) : (
              <span className="text-slate-400 text-xs font-mono">Batch Pending Anchor</span>
            )}
          </div>
          <button
            onClick={anchorBatch}
            disabled={anchoring}
            className="w-full mt-4 rounded-lg bg-purple-600/15 border border-purple-500/20 py-2 text-[10px] font-bold font-mono uppercase tracking-wider text-purple-400 hover:bg-purple-500/25 transition-all flex items-center justify-center gap-2"
          >
            {anchoring ? (
              <><RefreshCw className="h-3 w-3 animate-spin" /> SUBMITTING TO LEDGER...</>
            ) : "ANCHOR BATCH TO LEDGER"}
          </button>
        </div>

        {/* Audit Analytics Card */}
        <div className="glass-card rounded-xl p-4 border border-cyan-500/10 bg-[#060814]/40 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Cryptographic Telemetry</span>
              <Database className="h-4 w-4 text-slate-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="block text-[8px] text-slate-500 uppercase">Total Logs</span>
                <span className="text-white font-bold">{logs.length} entries</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 uppercase">Anchored</span>
                <span className="text-emerald-400 font-bold">
                  {logs.filter(l => l.is_anchored).length} anchored
                </span>
              </div>
            </div>
          </div>
          <div className="text-[9px] font-mono text-slate-600 mt-2">
            Chain linked SHA-256 ledger integrity scanning active.
          </div>
        </div>
      </div>

      {/* Anomalies / Verification Log Results */}
      {verificationResult && (
        <div className={`glass-card rounded-xl p-4 border ${
          verificationResult.success ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Cpu className={`h-4 w-4 ${verificationResult.success ? "text-emerald-400" : "text-red-400"}`} />
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-white">Cryptographic Verification Results</span>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between border-b border-white/5 py-1">
              <span>Integrity Verification Status:</span>
              <span className={verificationResult.success ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {verificationResult.success ? "SECURE" : "FAILED / TAMPERED"}
              </span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-1">
              <span>Database Records Scanned:</span>
              <span>{verificationResult.total_logs} records</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-1">
              <span>Cryptographic Signatures Match:</span>
              <span>{verificationResult.verified_records} verified</span>
            </div>

            {verificationResult.anomalies.length > 0 && (
              <div className="mt-3 space-y-2.5">
                <span className="block text-[10px] font-bold uppercase text-red-400">Anomalies Detected:</span>
                {verificationResult.anomalies.map((anom: any, idx: number) => (
                  <div key={idx} className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg text-[10px] space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-red-400">Type: {anom.type}</span>
                      <span className="text-slate-500">Log ID: {anom.log_id}</span>
                    </div>
                    <p className="text-slate-400">{anom.reason}</p>
                    <div className="text-[9px] text-slate-600">Action: {anom.action}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Chain List */}
      <div className="glass-card rounded-xl p-5 border border-white/5 bg-[#060814]/30 flex flex-col h-[400px]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold font-mono uppercase tracking-[0.12em] text-slate-400">Hashed Chain Logging Ledger</span>
          </div>
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="rounded border border-white/8 bg-white/5 h-7 px-3 text-[9px] font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} /> Reload
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600 font-mono text-[10px]">
              <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" /> Loading log nodes...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 font-mono text-[10px]">
              No audit logs captured. Execute system transactions first.
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-3 bg-black/35 rounded-lg border border-white/5 hover:border-cyan-500/15 transition-all text-xs font-mono space-y-2">
                <div className="flex justify-between items-start flex-wrap gap-1">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-cyan-400">{log.action}</span>
                    <div className="text-[9px] text-slate-500">
                      Actor: {log.actor_role} ({log.actor_id ? log.actor_id.substring(0, 8) : "System"}) &middot; IP: {log.ip_address || "internal"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] text-slate-600">{new Date(log.created_at).toLocaleString()}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      log.is_anchored ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                    }`}>
                      {log.is_anchored ? "ANCHORED" : "UNANCHORED"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[9px] text-slate-500 leading-snug">
                  <div>
                    <span className="block text-[8px] text-slate-600 uppercase">Current Hash</span>
                    <span className="text-cyan-400/80 truncate block select-all">{log.current_hash || "None"}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-600 uppercase">Predecessor Hash</span>
                    <span className="truncate block select-all">{log.previous_hash || "None"}</span>
                  </div>
                </div>

                {log.is_anchored && (
                  <div className="bg-purple-950/10 border border-purple-500/10 rounded px-2 py-1 text-[8px] text-purple-400 flex items-center justify-between">
                    <span>Anchor Root Match Verified</span>
                    <span className="truncate max-w-[200px]">Tx: {log.anchored_tx_id}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
