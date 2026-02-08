"use client";

import { Recycle, MapPin, Clock } from "lucide-react";
import { useStateSelection } from "@/context/StateContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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

export function RecentScans() {
  const { selectedState } = useStateSelection();
  const recentScans = useQuery(api.scans.getRecentScans, {
    state: selectedState,
    limit: 6,
  });

  if (!recentScans) {
    return (
      <div className="space-y-3 max-h-[340px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-green-50/50 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-green-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 bg-green-100 rounded" />
              <div className="h-3 w-40 bg-green-50 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
      {recentScans.map((scan) => {
        const categoryStr = scan.categories
          .map((c) => `${c.name.charAt(0).toUpperCase() + c.name.slice(1)} ${c.percentage}%`)
          .join(", ");

        return (
          <div
            key={scan._id}
            className="flex items-start gap-3 p-3 rounded-xl bg-green-50/50 hover:bg-green-50 transition-colors border border-green-100/50"
          >
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Recycle className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  {scan.userName}
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(scan.scannedAt)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{categoryStr}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-green-600 font-medium">
                  {scan.totalWeightLbs} lbs
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {scan.locationName}, {scan.city}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
