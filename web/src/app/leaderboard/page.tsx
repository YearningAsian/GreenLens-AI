"use client";

import { Sidebar } from "@/components/Sidebar";
import { useStateSelection } from "@/context/StateContext";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Image from "next/image";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  MapPin,
  ScanLine,
  Weight,
  Cloud,
  Flame,
  Star,
  Users,
  Home,
  Truck,
  Landmark,
} from "lucide-react";

type RoleName = "Neighborhood Volunteer" | "General Worker" | "Government Worker";

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

const RANK_STYLES = [
  { bg: "bg-gradient-to-r from-yellow-50 to-amber-50", border: "border-yellow-200", icon: Trophy, color: "text-yellow-500" },
  { bg: "bg-gradient-to-r from-gray-50 to-slate-50", border: "border-gray-200", icon: Medal, color: "text-gray-400" },
  { bg: "bg-gradient-to-r from-amber-50 to-orange-50", border: "border-amber-200", icon: Award, color: "text-amber-600" },
];

export default function LeaderboardPage() {
  const { selectedState } = useStateSelection();
  const users = useQuery(api.users.getAllUsers, { state: selectedState });

  const isLoading = !users;

  const sortedUsers = users
    ? [...users].sort((a, b) => b.totalWeightDiverted - a.totalWeightDiverted)
    : [];

  // Top 3 podium
  const top3 = sortedUsers.slice(0, 3);
  const rest = sortedUsers.slice(3);

  return (
    <div className="flex min-h-screen bg-[#f8faf9]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-green-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Top contributors in {selectedState}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Users className="w-4 h-4" />
              {sortedUsers.length} members ranked
            </div>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Top 3 podium */}
          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-green-100 animate-pulse">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100" />
                    <div className="h-5 w-24 bg-gray-100 rounded" />
                    <div className="h-3 w-32 bg-gray-50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : top3.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {top3.map((user, i) => {
                const style = RANK_STYLES[i];
                const Icon = style.icon;
                const roleName = ROLE_LABELS[user.role] || "Neighborhood Volunteer";
                const roleStyle = ROLE_STYLES[roleName];
                const RoleIcon = roleStyle.icon;
                const initials = user.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={user._id}
                    className={`${style.bg} rounded-2xl p-6 border ${style.border} ${i === 0 ? "ring-2 ring-yellow-300/50 shadow-lg shadow-yellow-100" : ""}`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative">
                        {user.profileImageUrl ? (
                          <div className="relative">
                            <Image
                              src={user.profileImageUrl}
                              alt={user.name}
                              width={64}
                              height={64}
                              className="rounded-full object-cover border-2 border-white shadow-sm"
                              unoptimized
                            />
                            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center">
                              <Icon className={`w-4 h-4 ${style.color}`} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700 border-2 border-white shadow-sm">
                              {initials}
                            </div>
                            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center">
                              <Icon className={`w-4 h-4 ${style.color}`} />
                            </div>
                          </>
                        )}
                      </div>
                      <h3 className="mt-3 text-base font-bold text-gray-900">{user.name}</h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleStyle.bg} ${roleStyle.text} mt-1`}>
                        <RoleIcon className="w-2.5 h-2.5" />
                        {roleName.split(" ")[0]}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <MapPin className="w-3 h-3" />
                        {user.city}
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4 w-full">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{user.totalScans}</p>
                          <p className="text-[10px] text-gray-400">Scans</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-blue-600">{user.totalWeightDiverted.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">lbs</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-600">{user.totalCo2Saved.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">kg CO₂</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs font-semibold text-orange-500">🔥 {user.streakDays}d</span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Lv {user.level}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Full ranking table */}
          <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-green-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Full Rankings</h3>
              <span className="text-xs text-gray-400">Ranked by waste diverted</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-green-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 w-16">Rank</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Member</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Role</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">City</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Scans</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Diverted</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">CO₂ Saved</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Streak</th>
                    <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.length > 0 ? (
                    sortedUsers.map((v, i) => {
                      const roleName = ROLE_LABELS[v.role] || "Neighborhood Volunteer";
                      const roleStyle = ROLE_STYLES[roleName];
                      const RoleIcon = roleStyle.icon;
                      const initials = v.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <tr
                          key={v._id}
                          className={`border-b border-green-50 hover:bg-green-50/50 transition-colors ${i < 3 ? "bg-yellow-50/30" : ""}`}
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
                              {v.profileImageUrl ? (
                                <Image
                                  src={v.profileImageUrl}
                                  alt={v.name}
                                  width={36}
                                  height={36}
                                  className="rounded-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                                  {initials}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                                <p className="text-xs text-gray-400">Joined {v.joinedDate}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${roleStyle.bg} ${roleStyle.text}`}>
                              <RoleIcon className="w-3 h-3" />
                              {roleName.split(" ")[0]}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600">{v.city}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-gray-700">{v.totalScans}</td>
                          <td className="px-6 py-4 text-right text-sm text-gray-600">{v.totalWeightDiverted.toLocaleString()} lbs</td>
                          <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">{v.totalCo2Saved.toLocaleString()} kg</td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-orange-500">🔥 {v.streakDays}d</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
                              Lv {v.level}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                        {isLoading ? (
                          <span className="animate-pulse">Loading leaderboard...</span>
                        ) : (
                          "No members found in this state"
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
