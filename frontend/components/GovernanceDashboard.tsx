"use client";

import React, { useState, useEffect } from "react";
import { Shield, Users, BarChart3, TrendingUp, AlertOctagon, Map, CheckCircle2, RefreshCw } from "lucide-react";

export default function GovernanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>("Zone Alpha");

  const fetchKpis = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/v1/governance/kpis", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const r = await res.json();
      if (r.success) {
        setData(r.data);
      }
    } catch (err) {
      console.error("Error fetching KPIs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3 border border-white/5 bg-black/20 rounded-xl">
        <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Loading Governance Command metrics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-10 font-mono text-slate-500 text-xs">
        Failed to fetch governance metrics data.
      </div>
    );
  }

  // Calculate Zone metrics dynamically
  const zoneHotspots: Record<string, number> = {};
  data.regional_hotspots?.forEach((h: any) => {
    zoneHotspots[h.name] = h.value;
  });

  return (
    <div className="space-y-6 p-5">
      {/* KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Tickets */}
        <div className="glass-card rounded-xl p-4 border border-white/5 bg-[#060814]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[9px] font-mono uppercase tracking-wider">Total Incidents</span>
            <Shield className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-white">{data.total_tickets}</span>
            <span className="block text-[8px] font-mono text-slate-600 uppercase mt-0.5">Logged in system</span>
          </div>
        </div>

        {/* Solve Rate */}
        <div className="glass-card rounded-xl p-4 border border-white/5 bg-[#060814]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[9px] font-mono uppercase tracking-wider">Solve Velocity</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-emerald-400">{data.solve_rate}%</span>
            <span className="block text-[8px] font-mono text-slate-600 uppercase mt-0.5">Complaints Closed</span>
          </div>
        </div>

        {/* Active Queue */}
        <div className="glass-card rounded-xl p-4 border border-white/5 bg-[#060814]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[9px] font-mono uppercase tracking-wider">Active Queue</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-blue-400">{data.active_tickets}</span>
            <span className="block text-[8px] font-mono text-slate-600 uppercase mt-0.5">Under active action</span>
          </div>
        </div>

        {/* SLA Breach */}
        <div className="glass-card rounded-xl p-4 border border-white/5 bg-[#060814]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[9px] font-mono uppercase tracking-wider">SLA Violation Rate</span>
            <AlertOctagon className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-red-400">{data.sla_breach_rate}%</span>
            <span className="block text-[8px] font-mono text-slate-600 uppercase mt-0.5">Critical escalations</span>
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* District Hotzones SVG Tactical Map */}
        <div className="glass-card rounded-xl p-5 border border-white/5 bg-[#060814]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Jurisdiction Hot-Zone Heatmap</span>
            </div>
            <span className="text-[9px] font-mono text-slate-600 uppercase">Interactive Tactical Grid</span>
          </div>

          {/* India Hotzones SVG Map Grid */}
          <div className="flex items-center justify-center py-6 bg-black/20 rounded-xl border border-white/5">
            <svg width="240" height="240" viewBox="0 0 100 100" className="drop-shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              {/* Zone Alpha (Northwest) */}
              <path
                d="M 10 10 L 50 10 L 50 50 L 10 50 Z"
                fill={selectedZone === "Zone Alpha" ? "rgba(239, 68, 68, 0.45)" : "rgba(239, 68, 68, 0.15)"}
                stroke="rgba(239, 68, 68, 0.6)"
                strokeWidth="0.75"
                onClick={() => setSelectedZone("Zone Alpha")}
                className="cursor-pointer transition-all duration-300 hover:fill-red-500/50"
              />
              {/* Zone Beta (Northeast) */}
              <path
                d="M 50 10 L 90 10 L 90 40 L 50 40 Z"
                fill={selectedZone === "Zone Beta" ? "rgba(249, 115, 22, 0.45)" : "rgba(249, 115, 22, 0.15)"}
                stroke="rgba(249, 115, 22, 0.6)"
                strokeWidth="0.75"
                onClick={() => setSelectedZone("Zone Beta")}
                className="cursor-pointer transition-all duration-300 hover:fill-orange-500/50"
              />
              {/* Zone Gamma (East Coast) */}
              <path
                d="M 50 40 L 90 40 L 90 90 L 50 90 Z"
                fill={selectedZone === "Zone Gamma" ? "rgba(34, 197, 94, 0.45)" : "rgba(34, 197, 94, 0.15)"}
                stroke="rgba(34, 197, 94, 0.6)"
                strokeWidth="0.75"
                onClick={() => setSelectedZone("Zone Gamma")}
                className="cursor-pointer transition-all duration-300 hover:fill-emerald-500/50"
              />
              {/* Zone Delta (Southwest Coast) */}
              <path
                d="M 10 50 L 50 50 L 50 90 L 10 90 Z"
                fill={selectedZone === "Zone Delta" ? "rgba(239, 68, 68, 0.45)" : "rgba(239, 68, 68, 0.15)"}
                stroke="rgba(239, 68, 68, 0.6)"
                strokeWidth="0.75"
                onClick={() => setSelectedZone("Zone Delta")}
                className="cursor-pointer transition-all duration-300 hover:fill-red-500/50"
              />

              {/* Glowing Indicator dots */}
              <circle cx="30" cy="30" r="2.5" fill="#ef4444" className="animate-ping" />
              <circle cx="30" cy="30" r="1.5" fill="#ef4444" />
              <circle cx="70" cy="25" r="1.5" fill="#f97316" />
              <circle cx="70" cy="65" r="1.5" fill="#22c55e" />
              <circle cx="30" cy="70" r="2.5" fill="#ef4444" className="animate-ping" />
              <circle cx="30" cy="70" r="1.5" fill="#ef4444" />
            </svg>
          </div>

          {/* Selected Zone Card details */}
          <div className="mt-4 p-3 bg-black/25 rounded-lg border border-white/5 flex justify-between items-center text-xs font-mono">
            <div>
              <span className="text-slate-500 uppercase block text-[8px]">Selected Territory Grid</span>
              <span className="text-white font-bold">{selectedZone}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 uppercase block text-[8px]">Incidents Logged</span>
              <span className="text-cyan-400 font-bold">{zoneHotspots[selectedZone] || 0} Cases</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Custom Charts */}
        <div className="glass-card rounded-xl p-5 border border-white/5 bg-[#060814]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Incident Category Distribution</span>
            </div>
            <span className="text-[9px] font-mono text-slate-600 uppercase">Live Queue Breakdown</span>
          </div>

          <div className="flex-1 space-y-4">
            {data.category_distribution?.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 font-mono text-[10px]">
                No categories logged in index ledger.
              </div>
            ) : (
              data.category_distribution?.map((item: any, index: number) => {
                const totalVal = data.total_tickets || 1;
                const percentage = Math.round((item.value / totalVal) * 100);
                return (
                  <div key={index} className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>{item.name}</span>
                      <span className="text-cyan-400 font-bold">{item.value} ({percentage}%)</span>
                    </div>
                    {/* Visual Bar chart via custom inline CSS */}
                    <div className="h-2 w-full bg-slate-900 rounded border border-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)] rounded transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Investigator Workload Grid (Phase 83) */}
      <div className="glass-card rounded-xl p-5 border border-white/5 bg-[#060814]/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Investigator Workload & Performance Analytics</span>
          </div>
          <span className="text-[9px] font-mono text-slate-600 uppercase">Nodal Queue work rate</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase">
                <th className="py-2.5">Officer Name</th>
                <th className="py-2.5">Active Tickets</th>
                <th className="py-2.5">Solved Cases</th>
                <th className="py-2.5">Avg Resolution Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.officer_workloads?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-600">
                    No active investigator profiles registered in directory.
                  </td>
                </tr>
              ) : (
                data.officer_workloads?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-all">
                    <td className="py-3 text-white font-bold">{item.name}</td>
                    <td className="py-3 text-cyan-400 font-semibold">{item.assigned_tickets} cases</td>
                    <td className="py-3 text-emerald-400">{item.solved_tickets} cases</td>
                    <td className="py-3 text-slate-400">{item.avg_resolve_time_hours} hrs</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
