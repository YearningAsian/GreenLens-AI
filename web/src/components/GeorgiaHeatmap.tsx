"use client";

import { useEffect, useRef, useState } from "react";
import { useStateSelection, StateName } from "@/context/StateContext";

/* ─── City data per state ─── */
type Intensity = "high" | "medium" | "low";

interface CityData {
  name: string;
  lat: number;
  lng: number;
  scans: number;
  intensity: Intensity;
}

const CITY_DATA: Record<StateName, CityData[]> = {
  Georgia: [
    { name: "Atlanta",   lat: 33.749,  lng: -84.388, scans: 1240, intensity: "high" },
    { name: "Augusta",   lat: 33.474,  lng: -81.975, scans: 520,  intensity: "medium" },
    { name: "Columbus",  lat: 32.461,  lng: -84.988, scans: 410,  intensity: "medium" },
    { name: "Macon",     lat: 32.841,  lng: -83.632, scans: 340,  intensity: "medium" },
    { name: "Savannah",  lat: 32.081,  lng: -81.091, scans: 280,  intensity: "low" },
    { name: "Athens",    lat: 33.961,  lng: -83.378, scans: 150,  intensity: "low" },
  ],
  Tennessee: [
    { name: "Nashville",    lat: 36.163,  lng: -86.781, scans: 980,  intensity: "high" },
    { name: "Memphis",      lat: 35.150,  lng: -90.049, scans: 720,  intensity: "high" },
    { name: "Knoxville",    lat: 35.961,  lng: -83.921, scans: 460,  intensity: "medium" },
    { name: "Chattanooga",  lat: 35.046,  lng: -85.309, scans: 350,  intensity: "medium" },
    { name: "Clarksville",  lat: 36.530,  lng: -87.359, scans: 180,  intensity: "low" },
  ],
};

const pulseColor = { high: "#22c55e", medium: "#4ade80", low: "#86efac" };
const dotSize    = { high: 10, medium: 8, low: 7 };

/* We fetch the real US GeoJSON at runtime from a public API */
const US_GEOJSON_URL =
  "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

export function GeorgiaHeatmap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const { selectedState, stateConfig } = useStateSelection();

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current) return;

      /* Prevent double-init */
      if ((mapRef.current as any)._leafletMap) {
        (mapRef.current as any)._leafletMap.remove();
      }

      const map = L.map(mapRef.current, {
        center: [stateConfig.center.lat, stateConfig.center.lng],
        zoom: stateConfig.zoom,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      });
      (mapRef.current as any)._leafletMap = map;

      /* CartoDB Positron – clean, light, free, no key */
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      /* ── Fetch US states GeoJSON & highlight selected state ── */
      try {
        const res = await fetch(US_GEOJSON_URL);
        const usStates = await res.json();
        const stateFeature = usStates.features?.find(
          (f: any) => f.properties?.name === selectedState
        );
        if (stateFeature && !cancelled) {
          const stateLayer = L.geoJSON(stateFeature, {
            style: {
              color: "#16a34a",
              weight: 3,
              fillColor: "#22c55e",
              fillOpacity: 0.10,
            },
          }).addTo(map);
          map.fitBounds(stateLayer.getBounds(), { padding: [12, 12] });
        }
      } catch {
        /* Graceful fallback – map still shows tiles & markers */
      }

      /* ── City markers with pulsing dots ── */
      const cities = CITY_DATA[selectedState] || [];
      cities.forEach((city) => {
        const sz = dotSize[city.intensity];
        const cl = pulseColor[city.intensity];

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:${sz * 3}px;height:${sz * 3}px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:${sz * 2.5}px;height:${sz * 2.5}px;border-radius:50%;background:${cl};opacity:0.25;animation:leaflet-pulse 2s ease-out infinite;"></div>
              <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${cl};border:2px solid #fff;box-shadow:0 0 6px ${cl};z-index:2;"></div>
            </div>`,
          iconSize: [sz * 3, sz * 3],
          iconAnchor: [sz * 1.5, sz * 1.5],
        });

        L.marker([city.lat, city.lng], { icon })
          .addTo(map)
          .bindTooltip(
            `<div style="text-align:center;font-family:system-ui;"><strong>${city.name}</strong><br/><span style="color:#16a34a;font-size:11px;">${city.scans} scans</span></div>`,
            { direction: "top", offset: [0, -sz], className: "gl-tooltip" }
          );
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
  }, [selectedState, stateConfig]);

  return (
    <div className="relative w-full h-[340px] rounded-xl overflow-hidden border border-green-100">
      <div ref={mapRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-50/50">
          <span className="text-sm text-gray-400 animate-pulse">Loading map…</span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-[10px] space-y-1 z-[999] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: pulseColor.high }} />
          <span className="text-gray-600">High Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: pulseColor.medium }} />
          <span className="text-gray-600">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: pulseColor.low }} />
          <span className="text-gray-600">Emerging</span>
        </div>
      </div>

      {/* Inject pulse + tooltip styles */}
      <style jsx global>{`
        @keyframes leaflet-pulse {
          0%   { transform: scale(0.6); opacity: 0.4; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .gl-tooltip {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
          padding: 6px 10px !important;
          font-size: 12px !important;
        }
        .gl-tooltip::before {
          border-top-color: white !important;
        }
      `}</style>
    </div>
  );
}
