"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { month: "Jul", weight: 12400, co2: 3100, scans: 180 },
  { month: "Aug", weight: 15800, co2: 3900, scans: 220 },
  { month: "Sep", weight: 18200, co2: 4500, scans: 290 },
  { month: "Oct", weight: 22000, co2: 5100, scans: 340 },
  { month: "Nov", weight: 28400, co2: 6800, scans: 410 },
  { month: "Dec", weight: 25100, co2: 6200, scans: 380 },
  { month: "Jan", weight: 31200, co2: 7800, scans: 460 },
  { month: "Feb", weight: 34800, co2: 8400, scans: 520 },
];

export function TrendChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="weight"
          name="Weight (lbs)"
          stroke="#22c55e"
          strokeWidth={2.5}
          fill="url(#weightGrad)"
        />
        <Area
          type="monotone"
          dataKey="co2"
          name="CO₂ Saved (kg)"
          stroke="#8b5cf6"
          strokeWidth={2.5}
          fill="url(#co2Grad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
