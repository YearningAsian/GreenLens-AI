"use client";

import {
  ScanLine,
  Weight,
  Cloud,
  TrendingUp,
  Recycle,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useStateSelection } from "@/context/StateContext";

const statConfig = [
  { key: "totalScans", label: "Total Scans", icon: ScanLine, color: "from-green-500 to-emerald-600", bgColor: "bg-green-50", iconColor: "#22c55e", format: (v: number) => v.toLocaleString() },
  { key: "totalWeightLbs", label: "Weight Diverted", icon: Weight, color: "from-blue-500 to-cyan-600", bgColor: "bg-blue-50", iconColor: "#3b82f6", format: (v: number) => `${v.toLocaleString()} lbs` },
  { key: "totalCo2SavedKg", label: "CO₂ Offset", icon: Cloud, color: "from-violet-500 to-purple-600", bgColor: "bg-violet-50", iconColor: "#8b5cf6", format: (v: number) => `${v.toLocaleString()} kg` },
  { key: "diversionRate", label: "Diversion Rate", icon: Recycle, color: "from-teal-500 to-green-600", bgColor: "bg-teal-50", iconColor: "#14b8a6", format: (v: number) => `${v}%` },
  { key: "avgConfidence", label: "Avg Confidence", icon: TrendingUp, color: "from-rose-400 to-pink-600", bgColor: "bg-rose-50", iconColor: "#f43f5e", format: (v: number) => `${v}%` },
];

export function StatsGrid() {
  const { selectedState } = useStateSelection();
  const stats = useQuery(api.scans.getDashboardStats, { state: selectedState });

  if (!stats) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {statConfig.map((s) => (
          <div key={s.key} className="stat-card glass-card p-4 animate-pulse">
            <div className="h-9 w-9 rounded-xl bg-gray-100 mb-3" />
            <div className="h-7 w-20 bg-gray-100 rounded" />
            <div className="h-3 w-16 bg-gray-50 rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-4">
      {statConfig.map((s) => {
        const value = (stats as any)[s.key] ?? 0;
        return (
          <div key={s.key} className="stat-card glass-card p-4 cursor-default">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${s.bgColor} flex items-center justify-center`}>
                <s.icon className="w-[18px] h-[18px]" style={{ color: s.iconColor }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.format(value)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}
