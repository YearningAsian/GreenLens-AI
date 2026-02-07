"use client";

import { Sidebar } from "@/components/Sidebar";
import { useStateSelection } from "@/context/StateContext";

type RoleName = "Neighborhood Volunteer" | "Independent Hauler" | "Government Liaison";
import {
  Users,
  Search,
  Award,
  TrendingUp,
  ScanLine,
  MapPin,
  Star,
  Truck,
  Home,
  Landmark,
} from "lucide-react";

interface Volunteer {
  id: number;
  name: string;
  area: string;
  city: string;
  role: RoleName;
  scans: number;
  diverted: number;
  co2: number;
  streak: number;
  badges: number;
  avatar: string;
  status: "active" | "inactive";
  joinedDate: string;
}

const ROLE_STYLES: Record<RoleName, { bg: string; text: string; icon: typeof Home }> = {
  "Neighborhood Volunteer": { bg: "bg-green-50", text: "text-green-700", icon: Home },
  "Independent Hauler": { bg: "bg-blue-50", text: "text-blue-700", icon: Truck },
  "Government Liaison": { bg: "bg-violet-50", text: "text-violet-700", icon: Landmark },
};

const stateVolunteers: Record<string, Volunteer[]> = {
  Georgia: [
    { id: 1, name: "Marcus Johnson", area: "Midtown", city: "Atlanta", role: "Neighborhood Volunteer", scans: 342, diverted: 28400, co2: 6200, streak: 45, badges: 6, avatar: "MJ", status: "active", joinedDate: "Oct 2025" },
    { id: 2, name: "Sarah Chen", area: "Downtown", city: "Savannah", role: "Independent Hauler", scans: 287, diverted: 22100, co2: 4800, streak: 32, badges: 5, avatar: "SC", status: "active", joinedDate: "Oct 2025" },
    { id: 3, name: "David Williams", area: "Harrisburg", city: "Augusta", role: "Neighborhood Volunteer", scans: 256, diverted: 19800, co2: 4300, streak: 28, badges: 5, avatar: "DW", status: "active", joinedDate: "Nov 2025" },
    { id: 4, name: "Emily Davis", area: "Buckhead", city: "Atlanta", role: "Government Liaison", scans: 231, diverted: 18500, co2: 4100, streak: 22, badges: 4, avatar: "ED", status: "active", joinedDate: "Nov 2025" },
    { id: 5, name: "Maria Garcia", area: "Ingleside", city: "Macon", role: "Independent Hauler", scans: 198, diverted: 15400, co2: 3400, streak: 18, badges: 4, avatar: "MG", status: "active", joinedDate: "Nov 2025" },
    { id: 6, name: "James Brown", area: "Five Points", city: "Athens", role: "Neighborhood Volunteer", scans: 176, diverted: 14200, co2: 3100, streak: 15, badges: 3, avatar: "JB", status: "active", joinedDate: "Dec 2025" },
    { id: 7, name: "Robert Wilson", area: "Starland District", city: "Savannah", role: "Independent Hauler", scans: 162, diverted: 12800, co2: 2800, streak: 12, badges: 3, avatar: "RW", status: "active", joinedDate: "Dec 2025" },
    { id: 8, name: "Ana Martinez", area: "Uptown", city: "Columbus", role: "Government Liaison", scans: 145, diverted: 11600, co2: 2500, streak: 10, badges: 3, avatar: "AM", status: "active", joinedDate: "Dec 2025" },
    { id: 9, name: "Chris Taylor", area: "Riverwalk", city: "Columbus", role: "Neighborhood Volunteer", scans: 128, diverted: 10200, co2: 2200, streak: 8, badges: 2, avatar: "CT", status: "inactive", joinedDate: "Jan 2026" },
    { id: 10, name: "Jessica Lee", area: "Old Fourth Ward", city: "Atlanta", role: "Independent Hauler", scans: 112, diverted: 9100, co2: 1900, streak: 6, badges: 2, avatar: "JL", status: "active", joinedDate: "Jan 2026" },
  ],
  Tennessee: [
    { id: 11, name: "Tyler Brooks", area: "Music Row", city: "Nashville", role: "Neighborhood Volunteer", scans: 310, diverted: 25600, co2: 5500, streak: 38, badges: 5, avatar: "TB", status: "active", joinedDate: "Nov 2025" },
    { id: 12, name: "Keisha Harmon", area: "South Main", city: "Memphis", role: "Independent Hauler", scans: 278, diverted: 21400, co2: 4700, streak: 30, badges: 5, avatar: "KH", status: "active", joinedDate: "Nov 2025" },
    { id: 13, name: "Jordan Wells", area: "Fort Sanders", city: "Knoxville", role: "Neighborhood Volunteer", scans: 234, diverted: 18900, co2: 4100, streak: 25, badges: 4, avatar: "JW", status: "active", joinedDate: "Dec 2025" },
    { id: 14, name: "Aaliyah Scott", area: "North Shore", city: "Chattanooga", role: "Government Liaison", scans: 201, diverted: 16200, co2: 3500, streak: 20, badges: 4, avatar: "AS", status: "active", joinedDate: "Dec 2025" },
    { id: 15, name: "Brandon Cole", area: "Downtown", city: "Clarksville", role: "Independent Hauler", scans: 167, diverted: 13600, co2: 2900, streak: 14, badges: 3, avatar: "BC", status: "active", joinedDate: "Jan 2026" },
    { id: 16, name: "Nina Patel", area: "SoBro", city: "Nashville", role: "Government Liaison", scans: 156, diverted: 12400, co2: 2700, streak: 11, badges: 3, avatar: "NP", status: "active", joinedDate: "Jan 2026" },
    { id: 17, name: "Derek Nguyen", area: "Crosstown", city: "Memphis", role: "Neighborhood Volunteer", scans: 143, diverted: 11800, co2: 2500, streak: 9, badges: 3, avatar: "DN", status: "active", joinedDate: "Jan 2026" },
    { id: 18, name: "Samira Jackson", area: "Old City", city: "Knoxville", role: "Independent Hauler", scans: 121, diverted: 9800, co2: 2100, streak: 7, badges: 2, avatar: "SJ", status: "inactive", joinedDate: "Jan 2026" },
  ],
};

export default function CommunityPage() {
  const { selectedState } = useStateSelection();
  const volunteers = stateVolunteers[selectedState] || [];
  const activeCount = volunteers.filter((v) => v.status === "active").length;
  const totalScans = volunteers.reduce((a, v) => a + v.scans, 0);
  const totalDiverted = volunteers.reduce((a, v) => a + v.diverted, 0);

  const roleCounts = volunteers.reduce((acc, v) => {
    acc[v.role] = (acc[v.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex min-h-screen bg-[#f8faf9]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-green-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Community</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                People driving impact in {selectedState}
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search community members..."
                className="pl-10 pr-4 py-2 rounded-xl bg-green-50 border border-green-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-64"
              />
            </div>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs text-gray-500">Active Members</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-green-600 mt-1">of {volunteers.length} total</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <ScanLine className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs text-gray-500">Total Scans</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalScans.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs text-gray-500">Waste Diverted</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{(totalDiverted / 1000).toFixed(1)}k lbs</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs text-gray-500">Badges Awarded</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {volunteers.reduce((a, v) => a + v.badges, 0)}
              </p>
            </div>
          </div>

          {/* Role breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {(Object.entries(ROLE_STYLES) as [RoleName, typeof ROLE_STYLES[RoleName]][]).map(([role, style]) => {
              const Icon = style.icon;
              return (
                <div key={role} className={`${style.bg} rounded-2xl p-5 border border-opacity-30`}>
                  <div className="flex items-center gap-3 mb-1">
                    <Icon className={`w-5 h-5 ${style.text}`} />
                    <span className={`text-sm font-semibold ${style.text}`}>{role}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{roleCounts[role] || 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">members in {selectedState}</p>
                </div>
              );
            })}
          </div>

          {/* Members table */}
          <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-green-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Rank</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Member</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Role</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Area</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Scans</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Diverted</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">CO₂ Saved</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Streak</th>
                    <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Badges</th>
                    <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((v, i) => {
                    const roleStyle = ROLE_STYLES[v.role];
                    const RoleIcon = roleStyle.icon;
                    return (
                      <tr
                        key={v.id}
                        className="border-b border-green-50 hover:bg-green-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${i < 3 ? "text-amber-500" : "text-gray-400"}`}>
                            #{i + 1}
                            {i === 0 && " 🥇"}
                            {i === 1 && " 🥈"}
                            {i === 2 && " 🥉"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                              {v.avatar}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                              <p className="text-xs text-gray-400">Joined {v.joinedDate}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${roleStyle.bg} ${roleStyle.text}`}>
                            <RoleIcon className="w-3 h-3" />
                            {v.role.split(" ")[0]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{v.area}</span>
                          </div>
                          <span className="text-xs text-gray-400">{v.city}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-700">{v.scans}</td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">{(v.diverted / 1000).toFixed(1)}k lbs</td>
                        <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">{(v.co2 / 1000).toFixed(1)}k kg</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-orange-500">🔥 {v.streak}d</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {Array.from({ length: v.badges }).map((_, bi) => (
                              <Star key={bi} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                              v.status === "active"
                                ? "bg-green-50 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
