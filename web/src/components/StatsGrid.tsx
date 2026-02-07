"use client";

import {
  ScanLine,
  Weight,
  Cloud,
  MapPin,
  TrendingUp,
  Recycle,
} from "lucide-react";

const stats = [
  {
    label: "Total Scans",
    value: "2,847",
    change: "+12.5%",
    positive: true,
    icon: ScanLine,
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50",
  },
  {
    label: "Weight Diverted",
    value: "184.2 tons",
    change: "+8.3%",
    positive: true,
    icon: Weight,
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-50",
  },
  {
    label: "CO₂ Offset",
    value: "42.6 tons",
    change: "+15.7%",
    positive: true,
    icon: Cloud,
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-50",
  },
  {
    label: "Active Neighborhoods",
    value: "34",
    change: "+3",
    positive: true,
    icon: MapPin,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50",
  },
  {
    label: "Diversion Rate",
    value: "73.4%",
    change: "+2.1%",
    positive: true,
    icon: Recycle,
    color: "from-teal-500 to-green-600",
    bgColor: "bg-teal-50",
  },
  {
    label: "Green Score",
    value: "82/100",
    change: "+5",
    positive: true,
    icon: TrendingUp,
    color: "from-rose-400 to-pink-600",
    bgColor: "bg-rose-50",
  },
];

export function StatsGrid() {
  return (
    <div className="grid grid-cols-6 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card glass-card p-4 cursor-default">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`w-[18px] h-[18px] bg-gradient-to-br ${stat.color} bg-clip-text`} style={{color: stat.color.includes('green') ? '#22c55e' : stat.color.includes('blue') ? '#3b82f6' : stat.color.includes('violet') ? '#8b5cf6' : stat.color.includes('amber') ? '#f59e0b' : stat.color.includes('teal') ? '#14b8a6' : '#f43f5e'}} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {stat.change}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
