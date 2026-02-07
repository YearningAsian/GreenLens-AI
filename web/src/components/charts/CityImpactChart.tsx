"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useStateSelection, StateName } from "@/context/StateContext";

const stateData: Record<StateName, { city: string; diverted: number; co2: number; sites: number }[]> = {
  Georgia: [
    { city: "Atlanta", diverted: 78500, co2: 18200, sites: 14 },
    { city: "Augusta", diverted: 42200, co2: 9800, sites: 8 },
    { city: "Columbus", diverted: 35800, co2: 8100, sites: 6 },
    { city: "Macon", diverted: 21800, co2: 4900, sites: 4 },
    { city: "Savannah", diverted: 31500, co2: 7100, sites: 5 },
    { city: "Athens", diverted: 18300, co2: 4100, sites: 3 },
  ],
  Tennessee: [
    { city: "Nashville", diverted: 68200, co2: 15800, sites: 12 },
    { city: "Memphis", diverted: 52400, co2: 12100, sites: 9 },
    { city: "Knoxville", diverted: 31200, co2: 7200, sites: 6 },
    { city: "Chattanooga", diverted: 24800, co2: 5700, sites: 5 },
    { city: "Clarksville", diverted: 15600, co2: 3600, sites: 3 },
  ],
};

export function CityImpactChart() {
  const { selectedState } = useStateSelection();
  const data = stateData[selectedState];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="city" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        />
        <Legend />
        <Bar
          dataKey="diverted"
          name="Diverted (lbs)"
          fill="#22c55e"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="co2"
          name="CO₂ Saved (kg)"
          fill="#8b5cf6"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
