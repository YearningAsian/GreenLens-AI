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
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStateSelection } from "@/context/StateContext";

export function TrendChart() {
  const { selectedState } = useStateSelection();
  const data = useQuery(api.scans.getMonthlyTrend, { state: selectedState });

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-gray-400">
        Loading trend data…
      </div>
    );
  }

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
          dataKey="diverted"
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
