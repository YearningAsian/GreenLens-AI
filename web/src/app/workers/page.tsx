"use client";

import { Sidebar } from "@/components/Sidebar";
import { useStateSelection } from "@/context/StateContext";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type RoleName = "Neighborhood Volunteer" | "General Worker" | "Government Worker";
import {
  Users,
  Award,
  TrendingUp,
  ScanLine,
  Truck,
  Home,
  Landmark,
} from "lucide-react";

const ROLE_LABELS: Record<string, RoleName> = {
  volunteer: "Neighborhood Volunteer",
  hauler: "General Worker",
  liaison: "Government Worker",
};

const ROLE_STYLES: Record<RoleName, { bg: string; text: string; icon: typeof Home }> = {
  "Neighborhood Volunteer": { bg: "bg-green-50", text: "text-green-700", icon: Home },
  "General Worker": { bg: "bg-blue-50", text: "text-blue-700", icon: Truck },
  "Government Worker": { bg: "bg-violet-50", text: "text-violet-700", icon: Landmark },
};

export default function CommunityPage() {
  const { selectedState } = useStateSelection();
  const users = useQuery(api.users.getAllUsers, { state: selectedState });
  const communityStats = useQuery(api.users.getCommunityStats, { state: selectedState });

  const isLoading = !users || !communityStats;

  const roleCounts = communityStats?.roleCounts ?? {};

  return (
    <div className="flex min-h-screen bg-[#f8faf9]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-green-100 px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Community</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              People driving impact in {selectedState}
            </p>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Summary cards */}
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-green-100 animate-pulse">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-gray-100 rounded mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-green-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-500">Total Members</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{communityStats.totalUsers}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-green-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                    <ScanLine className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-500">Total Scans</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{communityStats.totalScans.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-green-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs text-gray-500">Waste Diverted</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{communityStats.totalWeight.toLocaleString()} lbs</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-green-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Award className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-xs text-gray-500">Avg Streak</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{communityStats.avgStreak} days</p>
              </div>
            </div>
          )}

          {/* Role breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {(Object.entries(ROLE_STYLES) as [RoleName, typeof ROLE_STYLES[RoleName]][]).map(([role, style]) => {
              const Icon = style.icon;
              /* Map display role name back to DB role key */
              const dbKey = Object.entries(ROLE_LABELS).find(([, v]) => v === role)?.[0] ?? "";
              return (
                <div key={role} className={`${style.bg} rounded-2xl p-5 border border-opacity-30`}>
                  <div className="flex items-center gap-3 mb-1">
                    <Icon className={`w-5 h-5 ${style.text}`} />
                    <span className={`text-sm font-semibold ${style.text}`}>{role}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{roleCounts[dbKey] || 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">members in {selectedState}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
