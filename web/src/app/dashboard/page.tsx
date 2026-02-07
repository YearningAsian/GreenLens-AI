"use client";

import { Sidebar } from "@/components/Sidebar";
import { StatsGrid } from "@/components/StatsGrid";
import { WasteCategoryChart } from "@/components/charts/MaterialBreakdownChart";
import { CityImpactChart } from "@/components/charts/CityImpactChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { Co2GaugeChart } from "@/components/charts/Co2GaugeChart";
import { RecentScans } from "@/components/RecentScans";
import { GeorgiaHeatmap } from "@/components/GeorgiaHeatmap";
import { LeaderboardPanel } from "@/components/LeaderboardPanel";
import { useStateSelection } from "@/context/StateContext";
import {
  Leaf,
  Bell,
  Search,
  Info,
} from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [showMethodology, setShowMethodology] = useState(false);
  const { selectedState, stateConfig } = useStateSelection();

  return (
    <div className="flex min-h-screen bg-[#f8faf9]">
      <Sidebar />
      <main className="flex-1 ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-green-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Community Impact Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Real-time waste diversion analytics — {selectedState} Pilot ({stateConfig.cities.length} cities)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search scans, volunteers..."
                className="pl-10 pr-4 py-2 rounded-xl bg-green-50 border border-green-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-64"
              />
            </div>
            <button className="relative p-2 rounded-xl hover:bg-green-50 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full live-pulse" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full green-gradient flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">GreenLens</p>
                <p className="text-xs text-gray-500">Community</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Live indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full live-pulse" />
              <span>Live syncing with community volunteers across {stateConfig.cities.length} {selectedState} cities</span>
            </div>
            <button
              onClick={() => setShowMethodology(!showMethodology)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <Info className="w-3.5 h-3.5" />
              How are these numbers calculated?
            </button>
          </div>

          {/* Methodology panel (collapsible) */}
          {showMethodology && (
            <div className="glass-card p-5 border-l-4 border-blue-400 bg-blue-50/30">
              <h4 className="font-semibold text-gray-800 text-sm mb-2">Calculation Methodology</h4>
              <div className="grid md:grid-cols-3 gap-4 text-xs text-gray-600">
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Weight Estimation</p>
                  <p>Gemini AI estimates weight from visual scale cues (objects, containers, reference sizes).</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-1">CO₂ Savings (EPA WARM v16)</p>
                  <p>Recyclable: 1.02 kg/lb &bull; Organic: 0.34 kg/lb &bull; Non-recyclable: 0.05 kg/lb — compares diversion vs. landfilling.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Diversion Rate</p>
                  <p>(Recyclable + Organic weight) / Total weight × 100%. Updated live as scans arrive from community volunteers.</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats cards */}
          <StatsGrid />

          {/* Charts row 1 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Waste Diversion Trend
              </h3>
              <TrendChart />
            </div>
            <div className="col-span-4 glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                CO₂ Offset Goal
              </h3>
              <Co2GaugeChart />
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-5 glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Waste Categories
              </h3>
              <WasteCategoryChart />
            </div>
            <div className="col-span-7 glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                City Impact Comparison
              </h3>
              <CityImpactChart />
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-4 glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {selectedState} Heatmap
              </h3>
              <GeorgiaHeatmap />
            </div>
            <div className="col-span-4 glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Top Diverters
              </h3>
              <LeaderboardPanel />
            </div>
            <div className="col-span-4 glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recent Scans
              </h3>
              <RecentScans />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
