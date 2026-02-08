"use client";

import { Sidebar } from "@/components/Sidebar";
import { useStateSelection } from "@/context/StateContext";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
  Download,
  TrendingUp,
  Leaf,
  Building2,
  Calendar,
} from "lucide-react";
import { generatePdfReport } from "@/lib/generatePdf";

export default function ReportsPage() {
  const { selectedState } = useStateSelection();
  const stats = useQuery(api.scans.getDashboardStats, { state: selectedState });
  const monthlyTrend = useQuery(api.scans.getMonthlyTrend, { state: selectedState });

  const isLoading = !stats || !monthlyTrend;

  /* Derived data */
  const wasteComposition = stats
    ? (() => {
        const total =
          (stats.categoryStats.recyclable?.weight ?? 0) +
          (stats.categoryStats.organic?.weight ?? 0) +
          (stats.categoryStats["non-recyclable"]?.weight ?? 0);
        if (total === 0) return [{ name: "No Data", value: 100, fill: "#d1d5db" }];
        return [
          { name: "Recyclable", value: Math.round(((stats.categoryStats.recyclable?.weight ?? 0) / total) * 100), fill: "#22c55e" },
          { name: "Organic", value: Math.round(((stats.categoryStats.organic?.weight ?? 0) / total) * 100), fill: "#3b82f6" },
          { name: "Non-Recyclable", value: Math.round(((stats.categoryStats["non-recyclable"]?.weight ?? 0) / total) * 100), fill: "#ef4444" },
        ].filter((d) => d.value > 0);
      })()
    : [];

  const regionData = stats
    ? Object.entries(stats.cityStats)
        .map(([city, data]) => ({
          region: city,
          scans: data.scans,
          diverted: Math.round(data.weight),
          co2: Math.round(data.co2),
          rate: stats.totalWeightLbs > 0
            ? `${Math.round((data.weight / stats.totalWeightLbs) * 100)}%`
            : "0%",
        }))
        .sort((a, b) => b.diverted - a.diverted)
    : [];

  return (
    <div className="flex min-h-screen bg-[#f8faf9]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-green-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Community Impact Reports</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Environmental impact metrics for {selectedState}
              </p>
            </div>
            <button
              onClick={() => {
                if (!stats || !monthlyTrend) return;
                generatePdfReport({
                  state: selectedState,
                  totalCo2: stats.totalCo2SavedKg,
                  totalWeight: stats.totalWeightLbs,
                  diversionRate: stats.diversionRate,
                  totalScans: stats.totalScans,
                  wasteComposition,
                  regionData,
                  monthlyTrend: monthlyTrend.map((m: any) => ({
                    month: m.month,
                    co2: m.co2 ?? 0,
                    diverted: m.diverted ?? 0,
                    landfill: m.landfill ?? 0,
                  })),
                });
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export PDF Report
            </button>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Summary cards */}
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 mb-3" />
                  <div className="h-6 w-20 bg-gray-100 rounded" />
                  <div className="h-3 w-28 bg-gray-50 rounded mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total CO₂ Offset", value: `${stats.totalCo2SavedKg.toLocaleString()} kg`, icon: Leaf, color: "text-green-600", bg: "bg-green-50" },
                { label: "Waste Diverted", value: `${stats.totalWeightLbs.toLocaleString()} lbs`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Diversion Rate", value: `${stats.diversionRate}%`, icon: Building2, color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Total Scans", value: stats.totalScans.toLocaleString(), icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
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
          )}

          {/* CO2 Trend */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Monthly CO₂ Offset & Landfill Trend
            </h3>
            {monthlyTrend && monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlyTrend}>
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
            ) : (
              <div className="h-[320px] flex items-center justify-center text-gray-400">
                {isLoading ? "Loading..." : "No trend data available"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Waste Composition */}
            <div className="col-span-4 glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Waste Disposition
              </h3>
              {wasteComposition.length > 0 ? (
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
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        if (value < 5) return null;
                        return (
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
                            {value}%
                          </text>
                        );
                      }}
                      labelLine={false}
                    >
                      {wasteComposition.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, ""]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400">No data</div>
              )}
            </div>

            {/* Regional breakdown table */}
            <div className="col-span-8 glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                City Performance
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">City</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Scans</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Diverted (lbs)</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">CO₂ (kg)</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {regionData.map((row) => (
                    <tr key={row.region} className="border-b border-gray-50 hover:bg-green-50/30 transition-colors">
                      <td className="py-3 px-2 font-semibold text-gray-800">{row.region}</td>
                      <td className="py-3 px-2 text-right text-gray-600">{row.scans}</td>
                      <td className="py-3 px-2 text-right text-gray-600">{row.diverted.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-gray-600">{row.co2.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">
                        <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                          {row.rate}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {regionData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        {isLoading ? "Loading..." : "No city data available"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diverted by month bar chart */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Monthly Waste Diverted (lbs)
            </h3>
            {monthlyTrend && monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "12px" }}
                  />
                  <Bar dataKey="diverted" name="Diverted (lbs)" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400">
                {isLoading ? "Loading..." : "No trend data available"}
              </div>
            )}
          </div>

          {/* Report footer removed from UI — kept in PDF export */}
        </div>
      </main>
    </div>
  );
}
