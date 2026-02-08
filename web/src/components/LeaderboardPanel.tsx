"use client";

import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { useStateSelection } from "@/context/StateContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Image from "next/image";

const ROLE_LABELS: Record<string, string> = {
  volunteer: "Neighborhood Volunteer",
  hauler: "General Worker",
  liaison: "Government Worker",
};

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

export function LeaderboardPanel() {
  const { selectedState } = useStateSelection();
  const leaders = useQuery(api.leaderboard.getStateLeaderboard, {
    state: selectedState,
    limit: 5,
  });

  if (!leaders) {
    return (
      <div className="space-y-3 max-h-[340px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-3 w-32 bg-gray-50 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
      {leaders.map((leader, i) => {
        const initials = leader.userName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <div
            key={leader.userId}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors border ${
              i === 0
                ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200/50"
                : "bg-gray-50/50 hover:bg-gray-50 border-gray-100/50"
            }`}
          >
            <div className="flex items-center justify-center w-8 h-8 flex-shrink-0 relative">
              {leader.profileImageUrl ? (
                <div className="relative w-8 h-8">
                  <Image
                    src={leader.profileImageUrl}
                    alt={leader.userName}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                  {i < 3 && (
                    <div className={`absolute -top-1 -right-1 ${rankColors[i]}`}>
                      {(() => {
                        const Icon = rankIcons[i];
                        return <Icon className="w-3 h-3 drop-shadow" />;
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700">
                    {initials}
                  </div>
                  {i < 3 && (
                    <div className={`absolute -top-1 -right-1 ${rankColors[i]}`}>
                      {(() => {
                        const Icon = rankIcons[i];
                        return <Icon className="w-3 h-3 drop-shadow" />;
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800 truncate">
                  {leader.userName}
                </span>
                <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  {leader.streakDays}d streak
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {leader.city} · <span className="text-violet-500">{ROLE_LABELS[leader.role] ?? leader.role}</span>
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-green-600 font-medium">
                  {leader.totalWeightDiverted.toLocaleString()} lbs
                </span>
                <span className="text-xs text-violet-600 font-medium">
                  {leader.totalCo2Saved.toLocaleString()} kg CO₂
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
