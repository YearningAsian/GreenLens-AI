"use client";

import { Sidebar } from "@/components/Sidebar";
import { useStateSelection, StateName } from "@/context/StateContext";
import { ScanLine, Layers, MapPin, Filter } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ─── Per-state city data ─── */
interface CityData {
  name: string;
  lat: number;
  lng: number;
  scans: number;
}

const CITY_DATA: Record<StateName, CityData[]> = {
  Georgia: [
    { name: "Atlanta",  lat: 33.749,  lng: -84.388, scans: 1240 },
    { name: "Augusta",  lat: 33.474,  lng: -81.975, scans: 520  },
    { name: "Columbus", lat: 32.461,  lng: -84.988, scans: 410  },
    { name: "Macon",    lat: 32.841,  lng: -83.632, scans: 340  },
    { name: "Savannah", lat: 32.081,  lng: -81.091, scans: 280  },
    { name: "Athens",   lat: 33.961,  lng: -83.378, scans: 150  },
  ],
  Tennessee: [
    { name: "Nashville",   lat: 36.163, lng: -86.781, scans: 980 },
    { name: "Memphis",     lat: 35.150, lng: -90.049, scans: 720 },
    { name: "Knoxville",   lat: 35.961, lng: -83.921, scans: 460 },
    { name: "Chattanooga", lat: 35.046, lng: -85.309, scans: 350 },
    { name: "Clarksville", lat: 36.530, lng: -87.359, scans: 180 },
  ],
};

/* ─── Individual scan markers around each city ─── */
interface ScanPoint {
  lat: number;
  lng: number;
  material: string;
  category: "recyclable" | "organic" | "non-recyclable";
  weight: number;
  date: string;
}

function generateScans(state: StateName): ScanPoint[] {
  const cities = CITY_DATA[state] || [];
  const materials: Record<string, { category: ScanPoint["category"]; names: string[] }> = {
    recyclable: { category: "recyclable", names: ["Concrete", "Steel Rebar", "Copper Wire", "Aluminum Siding", "Glass Panel", "Brick"] },
    organic: { category: "organic", names: ["Wood Framing", "Cardboard", "Drywall (paper)", "Mulch", "Sawdust"] },
    "non-recyclable": { category: "non-recyclable", names: ["Mixed Debris", "Asbestos Tile", "Treated Lumber", "Painted Drywall", "Fiberglass Insulation"] },
  };

  const scans: ScanPoint[] = [];
  const seed = state === "Georgia" ? 42 : 99;
  let idx = seed;
  const pseudoRandom = () => {
    idx = (idx * 16807 + 7) % 2147483647;
    return (idx % 10000) / 10000;
  };

  cities.forEach((city) => {
    const count = Math.floor(city.scans / 30);
    for (let i = 0; i < count; i++) {
      const spread = 0.15;
      const lat = city.lat + (pseudoRandom() - 0.5) * spread * 2;
      const lng = city.lng + (pseudoRandom() - 0.5) * spread * 2;
      const catKeys = Object.keys(materials);
      const catKey = catKeys[Math.floor(pseudoRandom() * catKeys.length)];
      const mat = materials[catKey];
      const name = mat.names[Math.floor(pseudoRandom() * mat.names.length)];
      const weight = Math.floor(pseudoRandom() * 500) + 20;
      const daysAgo = Math.floor(pseudoRandom() * 60);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      scans.push({
        lat,
        lng,
        material: name,
        category: mat.category,
        weight,
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
  });
  return scans;
}

const CATEGORY_COLORS: Record<string, string> = {
  recyclable: "#22c55e",
  organic: "#f59e0b",
  "non-recyclable": "#ef4444",
};

const US_GEOJSON_URL =
  "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

export default function HeatmapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [showScans, setShowScans] = useState(true);
  const [showHeat, setShowHeat] = useState(true);
  const { selectedState, stateConfig } = useStateSelection();
  const scans = generateScans(selectedState);
  const cities = CITY_DATA[selectedState] || [];
  const totalScans = cities.reduce((a, c) => a + c.scans, 0);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      /* leaflet.heat plugin – inject if not present */
      if (!(L as any).heatLayer) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      if (cancelled || !mapRef.current) return;

      if ((mapRef.current as any)._leafletMap) {
        (mapRef.current as any)._leafletMap.remove();
      }

      const map = L.map(mapRef.current, {
        center: [stateConfig.center.lat, stateConfig.center.lng],
        zoom: stateConfig.zoom,
        zoomControl: true,
        attributionControl: false,
      });
      (mapRef.current as any)._leafletMap = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      /* ── State outline ── */
      try {
        const res = await fetch(US_GEOJSON_URL);
        const usStates = await res.json();
        const feat = usStates.features?.find(
          (f: any) => f.properties?.name === selectedState
        );
        if (feat && !cancelled) {
          const layer = L.geoJSON(feat, {
            style: { color: "#4ade80", weight: 2, fillColor: "#22c55e", fillOpacity: 0.05, dashArray: "6 4" },
          }).addTo(map);
          map.fitBounds(layer.getBounds(), { padding: [30, 30] });
        }
      } catch {}

      /* ── Heat layer ── */
      if (showHeat && (L as any).heatLayer) {
        const heatPoints = scans.map((s) => [s.lat, s.lng, 0.6] as [number, number, number]);
        (L as any)
          .heatLayer(heatPoints, {
            radius: 30,
            blur: 25,
            maxZoom: 12,
            max: 1.0,
            gradient: {
              0.0: "#064e3b",
              0.25: "#065f46",
              0.4: "#16a34a",
              0.6: "#facc15",
              0.8: "#f97316",
              1.0: "#ef4444",
            },
          })
          .addTo(map);
      }

      /* ── Individual scan markers ── */
      if (showScans) {
        scans.forEach((scan) => {
          const color = CATEGORY_COLORS[scan.category];
          const icon = L.divIcon({
            className: "",
            html: `<div style="width:8px;height:8px;border-radius:50%;background:${color};border:1.5px solid rgba(255,255,255,0.7);box-shadow:0 0 4px ${color};"></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          });

          L.marker([scan.lat, scan.lng], { icon })
            .addTo(map)
            .bindPopup(
              `<div style="font-family:system-ui;font-size:12px;min-width:140px;">
                <strong style="color:${color};">● ${scan.material}</strong><br/>
                <span style="color:#9ca3af;">Category:</span> <span style="text-transform:capitalize;">${scan.category}</span><br/>
                <span style="color:#9ca3af;">Weight:</span> ${scan.weight} lbs<br/>
                <span style="color:#9ca3af;">Date:</span> ${scan.date}
              </div>`,
              { className: "gl-popup" }
            );
        });
      }

      /* ── City labels ── */
      cities.forEach((city) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="font-family:system-ui;text-align:center;pointer-events:none;">
            <div style="font-size:11px;font-weight:700;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.8);">${city.name}</div>
            <div style="font-size:9px;color:#4ade80;text-shadow:0 1px 3px rgba(0,0,0,0.8);">${city.scans.toLocaleString()} scans</div>
          </div>`,
          iconSize: [100, 30],
          iconAnchor: [50, -8],
        });
        L.marker([city.lat, city.lng], { icon, interactive: false }).addTo(map);
      });

      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current && (mapRef.current as any)._leafletMap) {
        (mapRef.current as any)._leafletMap.remove();
        (mapRef.current as any)._leafletMap = null;
      }
    };
  }, [selectedState, stateConfig, showScans, showHeat]);

  return (
    <div className="flex min-h-screen bg-[#0f1714]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-30 bg-[#0f1714]/90 backdrop-blur-lg border-b border-green-900/40 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Heatmap</h1>
              <p className="text-sm text-green-400/70 mt-0.5">
                Scan activity density across {selectedState}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHeat(!showHeat)}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                  showHeat
                    ? "bg-green-500/20 border-green-500/40 text-green-400"
                    : "bg-gray-800 border-gray-700 text-gray-400"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Heat Layer
              </button>
              <button
                onClick={() => setShowScans(!showScans)}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                  showScans
                    ? "bg-green-500/20 border-green-500/40 text-green-400"
                    : "bg-gray-800 border-gray-700 text-gray-400"
                }`}
              >
                <ScanLine className="w-3.5 h-3.5" /> Scan Points
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-[#1a2420] rounded-xl p-4 border border-green-900/30">
              <p className="text-[10px] uppercase tracking-wider text-green-500/60">Total Scans</p>
              <p className="text-xl font-bold text-white mt-1">{totalScans.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a2420] rounded-xl p-4 border border-green-900/30">
              <p className="text-[10px] uppercase tracking-wider text-green-500/60">Active Cities</p>
              <p className="text-xl font-bold text-white mt-1">{cities.length}</p>
            </div>
            <div className="bg-[#1a2420] rounded-xl p-4 border border-green-900/30">
              <p className="text-[10px] uppercase tracking-wider text-green-500/60">Scan Points</p>
              <p className="text-xl font-bold text-white mt-1">{scans.length}</p>
            </div>
            <div className="bg-[#1a2420] rounded-xl p-4 border border-green-900/30">
              <p className="text-[10px] uppercase tracking-wider text-green-500/60">Hottest Zone</p>
              <p className="text-xl font-bold text-white mt-1">{cities[0]?.name || "—"}</p>
            </div>
          </div>

          {/* Map */}
          <div className="relative w-full h-[calc(100vh-220px)] rounded-2xl overflow-hidden border border-green-900/30">
            <div ref={mapRef} className="w-full h-full" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0f1714]">
                <span className="text-sm text-green-400/50 animate-pulse">Loading heatmap…</span>
              </div>
            )}

            {/* Gradient legend */}
            <div className="absolute bottom-4 left-4 bg-[#1a2420]/95 backdrop-blur-sm rounded-xl px-4 py-3 z-[999] border border-green-900/30">
              <p className="text-[10px] uppercase tracking-wider text-green-400/60 mb-2">Activity Density</p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500">Low</span>
                <div className="w-32 h-2.5 rounded-full" style={{
                  background: "linear-gradient(to right, #064e3b, #16a34a, #facc15, #f97316, #ef4444)"
                }} />
                <span className="text-[9px] text-gray-500">High</span>
              </div>
            </div>

            {/* Category legend */}
            <div className="absolute bottom-4 right-4 bg-[#1a2420]/95 backdrop-blur-sm rounded-xl px-4 py-3 z-[999] border border-green-900/30">
              <p className="text-[10px] uppercase tracking-wider text-green-400/60 mb-2">Scan Categories</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
                  <span className="text-[10px] text-gray-400">Recyclable</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f59e0b" }} />
                  <span className="text-[10px] text-gray-400">Organic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
                  <span className="text-[10px] text-gray-400">Non-Recyclable</span>
                </div>
              </div>
            </div>
          </div>

          {/* City breakdown table */}
          <div className="bg-[#1a2420] rounded-2xl border border-green-900/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-green-900/30">
              <h3 className="text-sm font-semibold text-white">City Breakdown</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-green-900/20">
                  <th className="text-left text-[10px] uppercase tracking-wider text-green-500/50 px-6 py-3">City</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-green-500/50 px-6 py-3">Scans</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-green-500/50 px-6 py-3">Activity</th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-green-500/50 px-6 py-3">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((city) => {
                  const pct = ((city.scans / totalScans) * 100).toFixed(1);
                  const barPct = (city.scans / cities[0].scans) * 100;
                  return (
                    <tr key={city.name} className="border-b border-green-900/10 hover:bg-green-900/10 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-green-500/50" />
                          <span className="text-sm text-white font-medium">{city.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-green-400">{city.scans.toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <div className="w-full bg-green-900/30 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${barPct}%`,
                              background:
                                barPct > 70
                                  ? "linear-gradient(to right, #22c55e, #ef4444)"
                                  : barPct > 40
                                  ? "linear-gradient(to right, #22c55e, #facc15)"
                                  : "#22c55e",
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-400">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global styles for popups */}
        <style jsx global>{`
          .gl-popup .leaflet-popup-content-wrapper {
            background: #1a2420 !important;
            color: #fff !important;
            border: 1px solid rgba(34,197,94,0.2) !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
          }
          .gl-popup .leaflet-popup-tip {
            background: #1a2420 !important;
          }
        `}</style>
      </main>
    </div>
  );
}
