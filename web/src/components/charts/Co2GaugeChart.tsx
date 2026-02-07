"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const target = 60; // target in tons
const current = 42.6; // current in tons
const percentage = Math.round((current / target) * 100);

const data = [
  { name: "Achieved", value: current },
  { name: "Remaining", value: target - current },
];

export function Co2GaugeChart() {
  return (
    <div className="flex flex-col items-center">
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
            >
              <Cell fill="#22c55e" />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
          <span className="text-xs text-gray-500">of goal</span>
        </div>
      </div>
      <div className="mt-4 text-center space-y-2 w-full">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Current</span>
          <span className="font-semibold text-green-600">{current} tons CO₂</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Target</span>
          <span className="font-semibold text-gray-700">{target} tons CO₂</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Remaining</span>
          <span className="font-semibold text-amber-600">
            {(target - current).toFixed(1)} tons CO₂
          </span>
        </div>
      </div>
    </div>
  );
}
