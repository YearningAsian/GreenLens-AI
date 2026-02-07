"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  MapPin,
  BarChart3,
  Users,
  FileText,
  Leaf,
  Heart,
  ChevronDown,
} from "lucide-react";
import { useStateSelection, STATE_CONFIGS, StateName } from "@/context/StateContext";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Scan Analytics", href: "/scans", icon: ScanLine },
  { label: "Heatmap", href: "/heatmaps", icon: MapPin },
  { label: "Impact Reports", href: "/reports", icon: FileText },
  { label: "Leaderboard", href: "/leaderboard", icon: BarChart3 },
  { label: "Community", href: "/workers", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { selectedState, setSelectedState, stateConfig, allStates } = useStateSelection();

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-green-100 flex flex-col z-40">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-green-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl green-gradient flex items-center justify-center shadow-lg shadow-green-200">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">GreenLens</h1>
            <p className="text-[10px] uppercase tracking-wider text-green-600 font-semibold">
              Community Impact
            </p>
          </div>
        </div>
      </div>

      {/* State Selector */}
      <div className="px-4 py-3 border-b border-green-100">
        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5 block">
          Viewing State
        </label>
        <div className="relative">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value as StateName)}
            className="w-full appearance-none bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-green-800 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
          >
            {allStates.map((state) => (
              <option key={state} value={state}>
                {state} ({STATE_CONFIGS[state].cities.length} cities)
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-green-50 text-green-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-green-600" : ""}`} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-green-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom card - Community Impact */}
      <div className="p-4">
        <div className="green-gradient-light rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Community Impact</span>
          </div>
          <p className="text-xs text-green-800 mb-3">
            National non-profit piloting across {stateConfig.cities.length} cities in {selectedState}.
          </p>
          <Link
            href="/"
            className="text-[11px] bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-block"
          >
            Learn More
          </Link>
        </div>
      </div>
    </aside>
  );
}
