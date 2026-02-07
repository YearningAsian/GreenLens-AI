"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  Recyclable: "#22c55e",
  Organic: "#f59e0b",
  "Non-Recyclable": "#ef4444",
};

const data = [
  { name: "Recyclable", value: 55, color: CATEGORY_COLORS.Recyclable },
  { name: "Organic", value: 32, color: CATEGORY_COLORS.Organic },
  { name: "Non-Recyclable", value: 13, color: CATEGORY_COLORS["Non-Recyclable"] },
];

export function WasteCategoryChart() {
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
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
          formatter={(value: number) => [`${value}%`, ""]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-xs text-gray-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
