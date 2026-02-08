"use client";

import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useStateSelection } from "@/context/StateContext";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Recycle,
  MapPin,
  Clock,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  volunteer: "Neighborhood Volunteer",
  hauler: "General Worker",
  liaison: "Government Worker",
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type SortCol = "userName" | "city" | "totalWeightLbs" | "co2SavedKg" | "confidence" | "scannedAt";
type SortDir = "asc" | "desc" | null;

export default function ScansPage() {
  const { selectedState } = useStateSelection();
  const stats = useQuery(api.scans.getDashboardStats, { state: selectedState });
  const scanHistory = useQuery(api.scans.getScansByState, { state: selectedState });

  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (col: SortCol) => {
    if (sortCol !== col) {
      setSortCol(col);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortCol(null);
      setSortDir(null);
    }
  };

  const sortIcon = (col: SortCol) => {
    if (sortCol !== col || !sortDir) return <ChevronsUpDown className="w-3 h-3 ml-1 inline opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 ml-1 inline text-green-600" />
      : <ChevronDown className="w-3 h-3 ml-1 inline text-green-600" />;
  };

  const sortedScans = useMemo(() => {
    if (!scanHistory) return [];
    if (!sortCol || !sortDir) return scanHistory;

    return [...scanHistory].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "userName":
        case "city":
          cmp = (a[sortCol] ?? "").localeCompare(b[sortCol] ?? "");
          break;
        case "totalWeightLbs":
        case "co2SavedKg":
        case "confidence":
          cmp = (a[sortCol] ?? 0) - (b[sortCol] ?? 0);
          break;
        case "scannedAt":
          cmp = new Date(a.scannedAt ?? 0).getTime() - new Date(b.scannedAt ?? 0).getTime();
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [scanHistory, sortCol, sortDir]);

  const isLoading = !stats || !scanHistory;

  return (
    <div className="flex min-h-screen bg-[#f8faf9]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-green-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Scan Analytics</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                All waste classification scans across {selectedState}
              </p>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Stats bar */}
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-4 text-center animate-pulse">
                  <div className="h-6 w-16 bg-gray-100 rounded mx-auto" />
                  <div className="h-3 w-20 bg-gray-50 rounded mx-auto mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalScans.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Scans</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.avgConfidence}%</p>
                <p className="text-xs text-gray-500">Avg Confidence</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.totalWeightLbs.toLocaleString()} lbs</p>
                <p className="text-xs text-gray-500">Total Diverted</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-violet-600">{stats.totalCo2SavedKg.toLocaleString()} kg</p>
                <p className="text-xs text-gray-500">CO₂ Offset</p>
              </div>
            </div>
          )}

          {/* Scan table */}
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50/50 border-b border-green-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium cursor-pointer select-none hover:text-green-700 transition-colors" onClick={() => handleSort("userName")}>
                    User {sortIcon("userName")}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium cursor-pointer select-none hover:text-green-700 transition-colors" onClick={() => handleSort("city")}>
                    Location {sortIcon("city")}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Categories</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium cursor-pointer select-none hover:text-green-700 transition-colors" onClick={() => handleSort("totalWeightLbs")}>
                    Weight {sortIcon("totalWeightLbs")}
                  </th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium cursor-pointer select-none hover:text-green-700 transition-colors" onClick={() => handleSort("co2SavedKg")}>
                    CO₂ Saved {sortIcon("co2SavedKg")}
                  </th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium cursor-pointer select-none hover:text-green-700 transition-colors" onClick={() => handleSort("confidence")}>
                    Confidence {sortIcon("confidence")}
                  </th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium cursor-pointer select-none hover:text-green-700 transition-colors" onClick={() => handleSort("scannedAt")}>
                    Time {sortIcon("scannedAt")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedScans && sortedScans.length > 0 ? (
                  sortedScans.map((scan) => {
                    const categoryStr = scan.categories
                      .map((c) => `${c.name.charAt(0).toUpperCase() + c.name.slice(1)} ${c.percentage}%`)
                      .join(", ");

                    return (
                      <tr key={scan._id} className="border-b border-gray-50 hover:bg-green-50/20 transition-colors cursor-pointer">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                              <Recycle className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="font-semibold text-gray-800">{scan.userName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="text-gray-800">{scan.locationName}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">{scan.city}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{categoryStr}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-800">{scan.totalWeightLbs} lbs</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">{scan.co2SavedKg} kg</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            scan.confidence >= 0.90 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {(scan.confidence * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1 text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{timeAgo(scan.scannedAt)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      {isLoading ? (
                        <span className="animate-pulse">Loading scans...</span>
                      ) : (
                        "No scans recorded yet"
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
