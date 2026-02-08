"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
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

export function CityImpactChart() {
  const { selectedState } = useStateSelection();
  const [period, setPeriod] = useState<"month" | "year">("month");

  const allTimeStats = useQuery(api.scans.getDashboardStats, { state: selectedState });
  const periodData = useQuery(api.scans.getCityStatsByPeriod, { state: selectedState, period });

  const data = period === "month" || period === "year"
    ? (periodData ?? [])
    : allTimeStats?.cityStats
      ? Object.entries(allTimeStats.cityStats)
          .map(([city, s]) => ({
            city,
            diverted: Math.round(s.weight),
            co2: Math.round(s.co2),
          }))
          .sort((a, b) => b.diverted - a.diverted)
      : [];

  return (
    <div>
      {/* Period toggle */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4 w-fit">
        <button
          onClick={() => setPeriod("month")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
            period === "month"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setPeriod("year")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
            period === "year"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          This Year
        </button>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[260px] text-sm text-gray-400">
          {!periodData ? "Loading city data…" : "No data for this period"}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="city" stroke="#9ca3af" fontSize={12} />
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
            <Bar
              dataKey="diverted"
              name="Diverted (lbs)"
              fill="#22c55e"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="co2"
              name="CO₂ Saved (kg)"
              fill="#8b5cf6"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
