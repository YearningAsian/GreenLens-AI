import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { COLORS, CATEGORY_COLORS, CATEGORY_LABELS } from "../constants/theme";
import { getRecyclingCenters, getDirections } from "../services/api";
import ProfileHeader from "./ProfileHeader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Center {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  accepts: string[];
  lat?: number;
  lng?: number;
}

// Decode Google's encoded polyline into lat/lng pairs
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

type CategoryFilter = "all" | "recyclable" | "organic" | "non-recyclable";

const filters: { label: string; key: CategoryFilter }[] = [
  { label: "All", key: "all" },
  { label: "Recyclable", key: "recyclable" },
  { label: "Organic", key: "organic" },
  { label: "Non-Recyclable", key: "non-recyclable" },
];

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLat(loc.coords.latitude);
        setUserLng(loc.coords.longitude);
      } catch {}
    })();
  }, []);

  // Fetch centers
  const fetchCenters = useCallback(async (filter: CategoryFilter) => {
    setLoading(true);
    try {
      const category = filter === "all" ? undefined : filter;
      const data = await getRecyclingCenters(category);
      setCenters(data.centers ?? []);
    } catch {
      setCenters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCenters(activeFilter);
  }, [activeFilter, fetchCenters]);

  // When a center is tapped, fetch route
  const handleSelectCenter = async (center: Center) => {
    setSelectedCenter(center);
    setRouteCoords([]);
    setRouteInfo(null);

    if (!center.lat || !center.lng || userLat == null || userLng == null) return;

    setLoadingRoute(true);
    try {
      const dirs = await getDirections(userLat, userLng, center.lat, center.lng);
      const coords = decodePolyline(dirs.polyline);
      setRouteCoords(coords);
      setRouteInfo({ distance: dirs.distance, duration: dirs.duration });

      // Fit map to route
      if (mapRef.current && coords.length > 0) {
        const allPoints = [
          { latitude: userLat, longitude: userLng },
          ...coords,
          { latitude: center.lat, longitude: center.lng },
        ];
        mapRef.current.fitToCoordinates(allPoints, {
          edgePadding: { top: 80, right: 60, bottom: 200, left: 60 },
          animated: true,
        });
      }
    } catch {
      // Route fetch failed — just show marker
    } finally {
      setLoadingRoute(false);
    }
  };

  const clearRoute = () => {
    setSelectedCenter(null);
    setRouteCoords([]);
    setRouteInfo(null);
  };

  const getMarkerColor = (accepts: string[]): string => {
    if (accepts.includes("recyclable")) return CATEGORY_COLORS.recyclable;
    if (accepts.includes("organic")) return CATEGORY_COLORS.organic;
    return CATEGORY_COLORS["non-recyclable"];
  };

  const initialRegion = {
    latitude: userLat ?? 33.749,
    longitude: userLng ?? -84.388,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ProfileHeader title="Center Map" subtitle="Find & navigate to drop-offs" />

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {filters.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => { setActiveFilter(f.key); clearRoute(); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        >
          {centers
            .filter((c) => c.lat && c.lng)
            .map((center) => (
              <Marker
                key={center.id}
                coordinate={{ latitude: center.lat!, longitude: center.lng! }}
                title={center.name}
                description={center.address}
                pinColor={getMarkerColor(center.accepts)}
                onPress={() => handleSelectCenter(center)}
              />
            ))}

          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={COLORS.primary}
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* My location button */}
        {userLat && userLng && (
          <TouchableOpacity
            style={styles.myLocationBtn}
            onPress={() => {
              mapRef.current?.animateToRegion({
                latitude: userLat,
                longitude: userLng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }, 500);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="locate" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
      </View>

      {/* Bottom card for selected center */}
      {selectedCenter && (
        <View style={styles.bottomCard}>
          <TouchableOpacity style={styles.closeCard} onPress={clearRoute}>
            <Ionicons name="close" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.cardName}>{selectedCenter.name}</Text>
          <Text style={styles.cardAddress}>{selectedCenter.address}</Text>

          <View style={styles.acceptsRow}>
            {selectedCenter.accepts.map((cat) => (
              <View
                key={cat}
                style={[styles.acceptTag, { backgroundColor: (CATEGORY_COLORS[cat] || COLORS.textLight) + "18" }]}
              >
                <View style={[styles.acceptDot, { backgroundColor: CATEGORY_COLORS[cat] || COLORS.textLight }]} />
                <Text style={[styles.acceptText, { color: CATEGORY_COLORS[cat] || COLORS.textLight }]}>
                  {CATEGORY_LABELS[cat] || cat}
                </Text>
              </View>
            ))}
          </View>

          {loadingRoute && (
            <View style={styles.routeLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.routeLoadingText}>Loading route...</Text>
            </View>
          )}

          {routeInfo && (
            <View style={styles.routeInfoRow}>
              <View style={styles.routeChip}>
                <Ionicons name="car" size={14} color={COLORS.primary} />
                <Text style={styles.routeChipText}>{routeInfo.duration}</Text>
              </View>
              <View style={styles.routeChip}>
                <Ionicons name="navigate" size={14} color={COLORS.violet} />
                <Text style={[styles.routeChipText, { color: COLORS.violet }]}>{routeInfo.distance}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  filterTextActive: { color: "#fff" },
  mapContainer: { flex: 1, position: "relative" },
  map: { flex: 1 },
  myLocationBtn: {
    position: "absolute",
    bottom: 20,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  loadingOverlay: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  closeCard: {
    position: "absolute",
    top: 12,
    right: 16,
    padding: 4,
  },
  cardName: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 4, paddingRight: 30 },
  cardAddress: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
  acceptsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  acceptTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  acceptDot: { width: 7, height: 7, borderRadius: 4 },
  acceptText: { fontSize: 12, fontWeight: "600" },
  routeLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  routeLoadingText: { fontSize: 13, color: COLORS.textSecondary },
  routeInfoRow: {
    flexDirection: "row",
    gap: 10,
  },
  routeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  routeChipText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
});
