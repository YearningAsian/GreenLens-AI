import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { COLORS, CATEGORY_COLORS } from "../../src/constants/theme";
import ProfileHeader from "../../src/components/ProfileHeader";
import { getRecyclingCenters } from "../../src/services/api";

type CategoryFilter = "all" | "recyclable" | "organic" | "non-recyclable";

const filters: { label: string; key: CategoryFilter; icon: string }[] = [
  { label: "All", key: "all", icon: "apps" },
  { label: "Recyclable", key: "recyclable", icon: "refresh-circle" },
  { label: "Organic", key: "organic", icon: "leaf" },
  { label: "Non-Recyclable", key: "non-recyclable", icon: "close-circle" },
];

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

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CentersScreen() {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  // Request location once on mount (permission already asked in _layout)
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLat(loc.coords.latitude);
        setUserLng(loc.coords.longitude);
      } catch {
        // Location unavailable — centers still load without distance sorting
      }
    })();
  }, []);

  const fetchCenters = useCallback(
    async (filter: CategoryFilter, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(false);

      try {
        const category = filter === "all" ? undefined : filter;
        const data = await getRecyclingCenters(category);
        let list: Center[] = data.centers ?? [];

        // Sort by distance if we have user location
        if (userLat != null && userLng != null) {
          list = list
            .map((c) => ({
              ...c,
              _dist:
                c.lat && c.lng
                  ? haversineDistance(userLat, userLng, c.lat, c.lng)
                  : Infinity,
            }))
            .sort((a, b) => a._dist - b._dist);
        }

        setCenters(list);
      } catch {
        setError(true);
        setCenters([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userLat, userLng]
  );

  // Always fetch centers on mount + re-fetch when filter or location changes
  useEffect(() => {
    fetchCenters(activeFilter);
  }, [activeFilter, fetchCenters]);

  const onFilterChange = (key: CategoryFilter) => {
    setActiveFilter(key);
  };

  const onRefresh = () => {
    fetchCenters(activeFilter, true);
  };

  const openPhone = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`);
  };

  const openDirections = (center: Center) => {
    // Use lat/lng for precise Google Maps navigation, fall back to address
    const dest =
      center.lat && center.lng
        ? `${center.lat},${center.lng}`
        : encodeURIComponent(center.address);

    if (Platform.OS === "ios") {
      // Try Google Maps first, fall back to Apple Maps
      const gUrl = `comgooglemaps://?daddr=${dest}&directionsmode=driving`;
      Linking.canOpenURL(gUrl).then((ok) => {
        if (ok) {
          Linking.openURL(gUrl);
        } else {
          Linking.openURL(`maps://maps.apple.com/?daddr=${dest}&dirflg=d`);
        }
      });
    } else {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
      );
    }
  };

  const getDistance = (center: Center): string | null => {
    if (userLat == null || userLng == null || !center.lat || !center.lng)
      return null;
    const d = haversineDistance(userLat, userLng, center.lat, center.lng);
    return d < 1 ? `${(d * 5280).toFixed(0)} ft` : `${d.toFixed(1)} mi`;
  };

  const getCategoryColor = (cat: string) => {
    return CATEGORY_COLORS[cat] ?? COLORS.textLight;
  };

  const renderCenter = ({ item: center }: { item: Center }) => {
    const distance = getDistance(center);

    return (
      <View style={styles.centerCard}>
        <View style={styles.centerHeader}>
          <View style={styles.centerIcon}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.centerInfo}>
            <Text style={styles.centerName}>{center.name}</Text>
            <Text style={styles.centerCity}>{center.city}, GA</Text>
          </View>
          {distance && (
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate-outline" size={12} color={COLORS.primary} />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          )}
        </View>

        {center.address ? (
          <TouchableOpacity
            style={styles.centerAddressRow}
            onPress={() => openDirections(center)}
            activeOpacity={0.7}
          >
            <Ionicons name="map-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.centerAddress} numberOfLines={2}>{center.address}</Text>
            <Ionicons name="open-outline" size={12} color={COLORS.textLight} />
          </TouchableOpacity>
        ) : null}

        {/* Accepted materials */}
        <View style={styles.materialsRow}>
          {center.accepts.map((mat) => (
            <View
              key={mat}
              style={[
                styles.materialTag,
                { backgroundColor: getCategoryColor(mat) + "18" },
              ]}
            >
              <View
                style={[
                  styles.materialDot,
                  { backgroundColor: getCategoryColor(mat) },
                ]}
              />
              <Text
                style={[styles.materialTagText, { color: getCategoryColor(mat) }]}
              >
                {mat.charAt(0).toUpperCase() + mat.slice(1)}
              </Text>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openDirections(center)}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate" size={16} color={COLORS.primary} />
            <Text style={styles.actionText}>Directions</Text>
          </TouchableOpacity>
          {center.phone ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnCall]}
              onPress={() => openPhone(center.phone)}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={16} color={COLORS.info} />
              <Text style={[styles.actionText, { color: COLORS.info }]}>
                {center.phone}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionBtn, styles.actionBtnDisabled]}>
              <Ionicons name="call-outline" size={16} color={COLORS.textLight} />
              <Text style={[styles.actionText, { color: COLORS.textLight }]}>
                No phone
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={styles.filterSection}>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.key;
        return (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterPill, isActive && styles.filterPillActive]}
            onPress={() => onFilterChange(filter.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={filter.icon as any}
              size={14}
              color={isActive ? "#fff" : COLORS.textSecondary}
            />
            <Text
              style={[styles.filterText, isActive && styles.filterTextActive]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Loading centers...</Text>
        </>
      ) : error ? (
        <>
          <Ionicons name="cloud-offline-outline" size={40} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Unable to load centers</Text>
          <Text style={styles.emptyText}>
            Check your connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchCenters(activeFilter)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Ionicons name="search-outline" size={40} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>No centers found</Text>
          <Text style={styles.emptyText}>
            No recycling centers match this filter. Try a different category.
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader
        title="Recycling Centers"
        subtitle="Georgia drop-off locations"
      />

      <FlatList
        data={centers}
        keyExtractor={(item) => item.id}
        renderItem={renderCenter}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  filterSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: "#fff",
  },
  centerCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  centerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  centerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primaryBg,
    alignItems: "center",
    justifyContent: "center",
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  centerCity: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  centerAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingLeft: 2,
  },
  centerAddress: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  materialsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  materialTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  materialDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  materialTagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBg,
  },
  actionBtnCall: {
    backgroundColor: "#eff6ff",
  },
  actionBtnDisabled: {
    backgroundColor: COLORS.border + "60",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
