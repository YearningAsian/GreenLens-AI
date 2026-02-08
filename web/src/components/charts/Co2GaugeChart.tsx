"use client";

import { useState } from "react";
import { PieChart, Pie, ResponsiveContainer } from "recharts";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStateSelection } from "@/context/StateContext";

const MONTHLY_TARGET = 5000; // kg CO₂
const YEARLY_TARGET = 50000; // kg CO₂

export function Co2GaugeChart() {
  const { selectedState } = useStateSelection();
  const co2Data = useQuery(api.scans.getCo2ByPeriod, { state: selectedState });

  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  const target = period === "monthly" ? MONTHLY_TARGET : YEARLY_TARGET;
  const current = co2Data
    ? period === "monthly"
      ? co2Data.monthlyCo2
      : co2Data.yearlyCo2
    : 0;
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const data = [
    { name: "Achieved", value: current, fill: "#22c55e" },
    { name: "Remaining", value: Math.max(0, target - current), fill: "#e5e7eb" },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Period toggle */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 mb-3 w-full max-w-[200px]">
        <button
          onClick={() => setPeriod("monthly")}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
            period === "monthly"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setPeriod("yearly")}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
            period === "yearly"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Yearly
        </button>
      </div>

      <div className="relative">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              fill="#22c55e"
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
          <span className="text-xs text-gray-500">of {period} goal</span>
        </div>
      </div>
      <div className="mt-4 text-center space-y-2 w-full">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Current</span>
          <span className="font-semibold text-green-600">{current.toLocaleString()} kg CO₂</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{period === "monthly" ? "Monthly" : "Yearly"} Target</span>
          <span className="font-semibold text-gray-700">{target.toLocaleString()} kg CO₂</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Remaining</span>
          <span className="font-semibold text-amber-600">
            {Math.max(0, target - current).toLocaleString()} kg CO₂
          </span>
        </div>
      </div>
    </div>
  );
}
