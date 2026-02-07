"use client";

import { Sidebar } from "@/components/Sidebar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FileText,
  Download,
  TrendingUp,
  Leaf,
  Building2,
  Calendar,
} from "lucide-react";

const monthlyESG = [
  { month: "Jul '25", co2: 3100, diverted: 12400, landfill: 3200 },
  { month: "Aug", co2: 3900, diverted: 15800, landfill: 2900 },
  { month: "Sep", co2: 4500, diverted: 18200, landfill: 2600 },
  { month: "Oct", co2: 5100, diverted: 22000, landfill: 2400 },
  { month: "Nov", co2: 6800, diverted: 28400, landfill: 2100 },
  { month: "Dec", co2: 6200, diverted: 25100, landfill: 2300 },
  { month: "Jan '26", co2: 7800, diverted: 31200, landfill: 1800 },
  { month: "Feb", co2: 8400, diverted: 34800, landfill: 1500 },
];

const wasteComposition = [
  { name: "Recycled", value: 73, color: "#22c55e" },
  { name: "Reused", value: 12, color: "#3b82f6" },
  { name: "Landfill", value: 15, color: "#ef4444" },
];

const regionData = [
  { region: "Metro Atlanta", sites: 14, diverted: 78500, co2: 18200, rate: "78%" },
  { region: "Coastal (Savannah)", sites: 8, diverted: 42200, co2: 9800, rate: "71%" },
  { region: "West GA (Columbus)", sites: 6, diverted: 35800, co2: 8100, rate: "70%" },
  { region: "Central GA (Macon)", sites: 9, diverted: 51300, co2: 11000, rate: "69%" },
  { region: "Northeast GA (Athens)", sites: 3, diverted: 18300, co2: 4100, rate: "65%" },
  { region: "Augusta Area", sites: 5, diverted: 24700, co2: 5600, rate: "67%" },
];

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen bg-[#f8faf9]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-green-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Community Impact Reports</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Environmental impact metrics for the GreenLens community
              </p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-200">
              <Download className="w-4 h-4" />
              Export PDF Report
            </button>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total CO₂ Offset", value: "42.6 tons", icon: Leaf, color: "text-green-600", bg: "bg-green-50" },
              { label: "Waste Diverted", value: "184.2 tons", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Diversion Rate", value: "73.4%", icon: Building2, color: "text-violet-600", bg: "bg-violet-50" },
              { label: "Reporting Period", value: "Q3 2025 - Q1 2026", icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
            ].map((card) => (
              <div key={card.label} className="glass-card p-5">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* CO2 Trend */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Monthly CO₂ Offset & Diversion Trend
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyESG}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "12px" }}
                />
                <Legend />
                <Line type="monotone" dataKey="co2" name="CO₂ Saved (kg)" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="landfill" name="To Landfill (lbs)" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Waste Composition */}
            <div className="col-span-4 glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Waste Disposition
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={wasteComposition}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {wasteComposition.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Regional breakdown table */}
            <div className="col-span-8 glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Regional Performance
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Region</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Sites</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Diverted (lbs)</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">CO₂ (kg)</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {regionData.map((row) => (
                    <tr key={row.region} className="border-b border-gray-50 hover:bg-green-50/30 transition-colors">
                      <td className="py-3 px-2 font-semibold text-gray-800">{row.region}</td>
                      <td className="py-3 px-2 text-right text-gray-600">{row.sites}</td>
                      <td className="py-3 px-2 text-right text-gray-600">{row.diverted.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-gray-600">{row.co2.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">
                        <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                          {row.rate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diverted by month bar chart */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Monthly Waste Diverted (lbs)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyESG}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "12px" }}
                />
                <Bar dataKey="diverted" name="Diverted (lbs)" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Community Impact Goals */}
          <div className="glass-card p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Community Impact Goals
                </h3>
                <p className="text-sm text-gray-500">Annual sustainability targets for Georgia</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Landfill Diversion Goal</p>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: "73%" }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">73% achieved</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">CO₂ Reduction Target</p>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: "67%" }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">67% achieved</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Community Engagement</p>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-violet-500 h-3 rounded-full" style={{ width: "81%" }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">81% achieved</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
