"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStateSelection } from "@/context/StateContext";

const CATEGORY_COLORS: Record<string, string> = {
  Recyclable: "#22c55e",
  Organic: "#f59e0b",
  "Non-Recyclable": "#ef4444",
};

export function WasteCategoryChart() {
  const { selectedState } = useStateSelection();
  const stats = useQuery(api.scans.getDashboardStats, { state: selectedState });

  const data = (() => {
    if (!stats?.categoryStats) {
      return [
        { name: "Recyclable", value: 1, fill: CATEGORY_COLORS.Recyclable },
        { name: "Organic", value: 1, fill: CATEGORY_COLORS.Organic },
        { name: "Non-Recyclable", value: 1, fill: CATEGORY_COLORS["Non-Recyclable"] },
      ];
    }

    const totalWeight = Object.values(stats.categoryStats).reduce((s, c) => s + c.weight, 0);
    if (totalWeight === 0) {
      return [
        { name: "Recyclable", value: 1, fill: CATEGORY_COLORS.Recyclable },
        { name: "Organic", value: 1, fill: CATEGORY_COLORS.Organic },
        { name: "Non-Recyclable", value: 1, fill: CATEGORY_COLORS["Non-Recyclable"] },
      ];
    }

    return [
      { name: "Recyclable", value: Math.round(((stats.categoryStats.recyclable?.weight ?? 0) / totalWeight) * 100), fill: CATEGORY_COLORS.Recyclable },
      { name: "Organic", value: Math.round(((stats.categoryStats.organic?.weight ?? 0) / totalWeight) * 100), fill: CATEGORY_COLORS.Organic },
      { name: "Non-Recyclable", value: Math.round(((stats.categoryStats["non-recyclable"]?.weight ?? 0) / totalWeight) * 100), fill: CATEGORY_COLORS["Non-Recyclable"] },
    ];
  })();

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (value < 5) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
        {value}%
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
          label={renderLabel}
          labelLine={false}
        >
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
          formatter={(value: number | undefined) => [`${value ?? 0}%`, ""]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
