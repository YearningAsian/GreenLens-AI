"use client";

import { Sidebar } from "@/components/Sidebar";
import {
  ScanLine,
  Filter,
  Search,
  ChevronDown,
  Recycle,
  MapPin,
  Clock,
} from "lucide-react";

const scanHistory = [
  { id: 1, volunteer: "Marcus Johnson", site: "Midtown Tower Phase 2", city: "Atlanta", categories: "Recyclable 85%, Non-Recyclable 15%", weight: 120, co2: 110.2, confidence: 93, time: "2 min ago" },
  { id: 2, volunteer: "Sarah Chen", site: "Savannah River Plaza", city: "Savannah", categories: "Organic 60%, Recyclable 40%", weight: 450, co2: 275.4, confidence: 89, time: "8 min ago" },
  { id: 3, volunteer: "David Williams", site: "Augusta Medical Center", city: "Augusta", categories: "Recyclable 70%, Non-Recyclable 30%", weight: 85, co2: 62.0, confidence: 91, time: "15 min ago" },
  { id: 4, volunteer: "Maria Garcia", site: "Macon Heritage Park", city: "Macon", categories: "Organic 90%, Non-Recyclable 10%", weight: 200, co2: 62.2, confidence: 87, time: "22 min ago" },
  { id: 5, volunteer: "James Brown", site: "Athens Innovation Hub", city: "Athens", categories: "Recyclable 55%, Organic 30%, Non-Recyclable 15%", weight: 600, co2: 402.0, confidence: 96, time: "35 min ago" },
  { id: 6, volunteer: "Emily Davis", site: "Buckhead Residences", city: "Atlanta", categories: "Organic 65%, Recyclable 35%", weight: 180, co2: 104.0, confidence: 85, time: "1 hr ago" },
  { id: 7, volunteer: "Robert Wilson", site: "Port of Savannah", city: "Savannah", categories: "Recyclable 80%, Non-Recyclable 20%", weight: 340, co2: 281.5, confidence: 94, time: "1.5 hrs ago" },
  { id: 8, volunteer: "Ana Martinez", site: "Columbus Convention Center", city: "Columbus", categories: "Recyclable 45%, Organic 40%, Non-Recyclable 15%", weight: 210, co2: 124.1, confidence: 90, time: "2 hrs ago" },
  { id: 9, volunteer: "Chris Taylor", site: "Columbus Riverwalk Complex", city: "Columbus", categories: "Organic 70%, Recyclable 30%", weight: 95, co2: 51.7, confidence: 88, time: "2.5 hrs ago" },
];

export default function ScansPage() {
  return (
    <div className="flex min-h-screen bg-[#f8faf9]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-green-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Scan Analytics</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                All waste classification scans across Georgia sites
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search scans..."
                  className="pl-10 pr-4 py-2 rounded-xl bg-green-50 border border-green-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-64"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-100 text-sm text-gray-600 hover:bg-green-50">
                <Filter className="w-4 h-4" />
                Filter
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">2,847</p>
              <p className="text-xs text-gray-500">Total Scans</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">91.2%</p>
              <p className="text-xs text-gray-500">Avg Confidence</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">184.2t</p>
              <p className="text-xs text-gray-500">Total Diverted</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-violet-600">42.6t</p>
              <p className="text-xs text-gray-500">CO₂ Offset</p>
            </div>
          </div>

          {/* Scan table */}
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50/50 border-b border-green-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Volunteer</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Site</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Categories</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Weight</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">CO₂ Saved</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Confidence</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.map((scan) => (
                  <tr key={scan.id} className="border-b border-gray-50 hover:bg-green-50/20 transition-colors cursor-pointer">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                          <Recycle className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <span className="font-semibold text-gray-800">{scan.volunteer}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="text-gray-800">{scan.site}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{scan.city}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{scan.categories}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-800">{scan.weight} lbs</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">{scan.co2} kg</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        scan.confidence >= 90 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {scan.confidence}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{scan.time}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
