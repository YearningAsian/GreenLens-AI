"use client";

import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { useStateSelection, StateName } from "@/context/StateContext";

const stateLeaders: Record<StateName, {
  rank: number;
  name: string;
  area: string;
  role: string;
  diverted: string;
  co2: string;
  streak: number;
  badge: string;
}[]> = {
  Georgia: [
    {
      rank: 1,
      name: "Marcus Johnson",
      area: "Midtown, Atlanta",
      role: "Neighborhood Volunteer",
      diverted: "12,450 lbs",
      co2: "2,840 kg",
      streak: 28,
      badge: "eco-champion",
    },
    {
      rank: 2,
      name: "Sarah Chen",
      area: "Downtown Savannah",
      role: "Independent Hauler",
      diverted: "10,220 lbs",
      co2: "2,310 kg",
      streak: 21,
      badge: "zero-waste-week",
    },
    {
      rank: 3,
      name: "David Williams",
      area: "Harrisburg, Augusta",
      role: "Neighborhood Volunteer",
      diverted: "8,750 lbs",
      co2: "1,980 kg",
      streak: 14,
      badge: "100-lbs",
    },
    {
      rank: 4,
      name: "Maria Garcia",
      area: "Ingleside, Macon",
      role: "Government Liaison",
      diverted: "7,100 lbs",
      co2: "1,620 kg",
      streak: 10,
      badge: "first-scan",
    },
    {
      rank: 5,
      name: "James Brown",
      area: "Five Points, Athens",
      role: "Independent Hauler",
      diverted: "6,300 lbs",
      co2: "1,430 kg",
      streak: 7,
      badge: "first-scan",
    },
  ],
  Tennessee: [
    {
      rank: 1,
      name: "Emily Davis",
      area: "Music Row, Nashville",
      role: "Neighborhood Volunteer",
      diverted: "11,800 lbs",
      co2: "2,680 kg",
      streak: 24,
      badge: "eco-champion",
    },
    {
      rank: 2,
      name: "Robert Wilson",
      area: "South Main, Memphis",
      role: "Independent Hauler",
      diverted: "9,450 lbs",
      co2: "2,150 kg",
      streak: 19,
      badge: "zero-waste-week",
    },
    {
      rank: 3,
      name: "Ana Martinez",
      area: "Fort Sanders, Knoxville",
      role: "Neighborhood Volunteer",
      diverted: "7,900 lbs",
      co2: "1,800 kg",
      streak: 12,
      badge: "100-lbs",
    },
    {
      rank: 4,
      name: "Lisa Anderson",
      area: "North Shore, Chattanooga",
      role: "Government Liaison",
      diverted: "6,200 lbs",
      co2: "1,410 kg",
      streak: 9,
      badge: "first-scan",
    },
    {
      rank: 5,
      name: "Chris Taylor",
      area: "Downtown Clarksville",
      role: "Independent Hauler",
      diverted: "5,100 lbs",
      co2: "1,160 kg",
      streak: 5,
      badge: "first-scan",
    },
  ],
};

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

export function LeaderboardPanel() {
  const { selectedState } = useStateSelection();
  const leaders = stateLeaders[selectedState];

  return (
    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
      {leaders.map((leader, i) => (
        <div
          key={leader.rank}
          className={`flex items-center gap-3 p-3 rounded-xl transition-colors border ${
            i === 0
              ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200/50"
              : "bg-gray-50/50 hover:bg-gray-50 border-gray-100/50"
          }`}
        >
          <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
            {i < 3 ? (
              (() => {
                const Icon = rankIcons[i];
                return <Icon className={`w-5 h-5 ${rankColors[i]}`} />;
              })()
            ) : (
              <span className="text-sm font-bold text-gray-400">#{leader.rank}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800 truncate">
                {leader.name}
              </span>
              <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {leader.streak}d streak
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{leader.area} · <span className="text-violet-500">{leader.role}</span></p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-green-600 font-medium">
                {leader.diverted}
              </span>
              <span className="text-xs text-violet-600 font-medium">
                {leader.co2} CO₂
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
