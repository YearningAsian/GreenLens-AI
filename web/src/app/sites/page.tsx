"use client";

import { Sidebar } from "@/components/Sidebar";
import {
  Building2,
  MapPin,
  TrendingUp,
  Users,
  ChevronRight,
} from "lucide-react";

const jobSites = [
  { name: "Midtown Tower Phase 2", city: "Atlanta", region: "Metro Atlanta", volunteers: 24, scans: 342, diverted: 28400, co2: 6200, greenScore: 92, status: "active" },
  { name: "Savannah River Plaza", city: "Savannah", region: "Coastal", volunteers: 18, scans: 210, diverted: 18500, co2: 4100, greenScore: 85, status: "active" },
  { name: "Augusta Medical Center", city: "Augusta", region: "Central GA", volunteers: 14, scans: 156, diverted: 14200, co2: 3200, greenScore: 78, status: "active" },
  { name: "Columbus Convention Center", city: "Columbus", region: "West GA", volunteers: 16, scans: 178, diverted: 16400, co2: 3700, greenScore: 81, status: "active" },
  { name: "Macon Heritage Park", city: "Macon", region: "Central GA", volunteers: 10, scans: 134, diverted: 12800, co2: 2900, greenScore: 74, status: "active" },
  { name: "Athens Innovation Hub", city: "Athens", region: "Northeast GA", volunteers: 8, scans: 98, diverted: 9100, co2: 2100, greenScore: 71, status: "active" },
  { name: "Buckhead Residences", city: "Atlanta", region: "Metro Atlanta", volunteers: 20, scans: 287, diverted: 24600, co2: 5500, greenScore: 88, status: "active" },
  { name: "Port of Savannah Expansion", city: "Savannah", region: "Coastal", volunteers: 32, scans: 198, diverted: 22300, co2: 4800, greenScore: 82, status: "active" },
  { name: "Augusta Cyber Center", city: "Augusta", region: "Central GA", volunteers: 12, scans: 112, diverted: 10500, co2: 2400, greenScore: 76, status: "paused" },
  { name: "Columbus Riverwalk Complex", city: "Columbus", region: "West GA", volunteers: 11, scans: 104, diverted: 11200, co2: 2600, greenScore: 73, status: "active" },
  { name: "Macon Convention Hall", city: "Macon", region: "Central GA", volunteers: 15, scans: 145, diverted: 13100, co2: 3000, greenScore: 77, status: "active" },
  { name: "Atlanta BeltLine Extension", city: "Atlanta", region: "Metro Atlanta", volunteers: 28, scans: 312, diverted: 26800, co2: 5900, greenScore: 90, status: "active" },
];

function getScoreColor(score: number) {
  if (score >= 85) return "text-green-600 bg-green-50";
  if (score >= 70) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

export default function SitesPage() {
  return (
    <div className="flex min-h-screen bg-[#f8faf9]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-green-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Sites</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage construction sites across Georgia
              </p>
            </div>
            <button className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-200">
              + Add Job Site
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-500">Active Sites</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">208</p>
                <p className="text-xs text-gray-500">Total Volunteers</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">81.3</p>
                <p className="text-xs text-gray-500">Avg Green Score</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">6</p>
                <p className="text-xs text-gray-500">GA Cities</p>
              </div>
            </div>
          </div>

          {/* Sites grid */}
          <div className="grid grid-cols-2 gap-4">
            {jobSites.map((site) => (
              <div key={site.name} className="glass-card p-5 hover:shadow-lg hover:shadow-green-100/50 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                      {site.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{site.city}, GA • {site.region}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      site.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {site.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{site.volunteers}</p>
                    <p className="text-[10px] text-gray-500">Volunteers</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{(site.diverted / 1000).toFixed(1)}k</p>
                    <p className="text-[10px] text-gray-500">lbs diverted</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-violet-600">{(site.co2 / 1000).toFixed(1)}k</p>
                    <p className="text-[10px] text-gray-500">kg CO₂</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold px-2 py-0.5 rounded-lg inline-block ${getScoreColor(site.greenScore)}`}>
                      {site.greenScore}
                    </p>
                    <p className="text-[10px] text-gray-500">Green Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
