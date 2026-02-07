"use client";

import { Recycle, MapPin, Clock } from "lucide-react";
import { useStateSelection, StateName } from "@/context/StateContext";

const stateScans: Record<StateName, {
  id: number;
  volunteer: string;
  area: string;
  category: string;
  weight: string;
  time: string;
  city: string;
}[]> = {
  Georgia: [
    {
      id: 1,
      volunteer: "Marcus J.",
      area: "Midtown",
      category: "Recyclable 85%, Non-Recyclable 15%",
      weight: "120 lbs",
      time: "2 min ago",
      city: "Atlanta",
    },
    {
      id: 2,
      volunteer: "Sarah C.",
      area: "Downtown",
      category: "Organic 60%, Recyclable 40%",
      weight: "450 lbs",
      time: "8 min ago",
      city: "Savannah",
    },
    {
      id: 3,
      volunteer: "David W.",
      area: "Harrisburg",
      category: "Recyclable 70%, Non-Recyclable 30%",
      weight: "85 lbs",
      time: "15 min ago",
      city: "Augusta",
    },
    {
      id: 4,
      volunteer: "Maria G.",
      area: "Ingleside",
      category: "Organic 90%, Non-Recyclable 10%",
      weight: "200 lbs",
      time: "22 min ago",
      city: "Macon",
    },
    {
      id: 5,
      volunteer: "James B.",
      area: "Five Points",
      category: "Recyclable 55%, Organic 30%, Non-Recyclable 15%",
      weight: "600 lbs",
      time: "35 min ago",
      city: "Athens",
    },
    {
      id: 6,
      volunteer: "Chris T.",
      area: "Uptown",
      category: "Organic 70%, Recyclable 30%",
      weight: "210 lbs",
      time: "42 min ago",
      city: "Columbus",
    },
  ],
  Tennessee: [
    {
      id: 1,
      volunteer: "Emily D.",
      area: "Music Row",
      category: "Recyclable 75%, Organic 25%",
      weight: "180 lbs",
      time: "3 min ago",
      city: "Nashville",
    },
    {
      id: 2,
      volunteer: "Robert W.",
      area: "South Main",
      category: "Organic 65%, Recyclable 35%",
      weight: "320 lbs",
      time: "11 min ago",
      city: "Memphis",
    },
    {
      id: 3,
      volunteer: "Ana M.",
      area: "Fort Sanders",
      category: "Recyclable 80%, Non-Recyclable 20%",
      weight: "95 lbs",
      time: "18 min ago",
      city: "Knoxville",
    },
    {
      id: 4,
      volunteer: "Lisa A.",
      area: "North Shore",
      category: "Organic 55%, Recyclable 30%, Non-Recyclable 15%",
      weight: "410 lbs",
      time: "25 min ago",
      city: "Chattanooga",
    },
    {
      id: 5,
      volunteer: "Chris T.",
      area: "Downtown",
      category: "Recyclable 60%, Organic 40%",
      weight: "150 lbs",
      time: "38 min ago",
      city: "Clarksville",
    },
  ],
};

export function RecentScans() {
  const { selectedState } = useStateSelection();
  const recentScans = stateScans[selectedState];

  return (
    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
      {recentScans.map((scan) => (
        <div
          key={scan.id}
          className="flex items-start gap-3 p-3 rounded-xl bg-green-50/50 hover:bg-green-50 transition-colors border border-green-100/50"
        >
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Recycle className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                {scan.volunteer}
              </span>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {scan.time}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{scan.category}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-green-600 font-medium">
                {scan.weight}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {scan.area}, {scan.city}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
