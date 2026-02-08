import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../src/constants/theme";
import ProfileHeader from "../../src/components/ProfileHeader";
import { useAuth } from "../../src/context/AuthContext";
import { fetchUserScans } from "../../src/services/api";
import AnimatedNumber from "../../src/components/AnimatedNumber";

const { width } = Dimensions.get("window");

const badges = [
  { id: "first-scan", label: "First Scan", emoji: "🌱", threshold: 1, description: "Completed your very first waste scan. Every green journey starts with a single step!" },
  { id: "100-lbs", label: "100 lbs Club", emoji: "💪", threshold: 100, description: "Diverted over 100 pounds of waste from landfills. That's real impact!" },
  { id: "zero-waste-week", label: "Zero Waste Week", emoji: "🏆", threshold: 0, description: "Achieved a full week where 100% of scanned materials were diverted from landfills." },
  { id: "eco-champion", label: "Eco Champion", emoji: "🌍", threshold: 0, description: "Reached top 10% of all volunteers in CO₂ savings. You're leading the charge!" },
  { id: "ton-diverted", label: "2K Diverted", emoji: "🎉", threshold: 2000, description: "Divert 2,000 lbs of waste from landfills. Keep going — you're almost there!" },
  { id: "team-player", label: "Team Player", emoji: "🤝", threshold: 50, description: "Complete 50 scans across at least 3 different locations. Collaboration makes the difference." },
];

/* ── Flip Badge Card Component ── */
function FlipBadge({ badge, earned }: { badge: typeof badges[0]; earned: boolean }) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);
  const animating = useRef(false);

  const flip = useCallback(() => {
    if (animating.current) return; // block taps while animating
    animating.current = true;
    const toValue = flipped ? 0 : 1;
    Animated.timing(flipAnim, {
      toValue,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setFlipped(!flipped);
      animating.current = false;
    });
  }, [flipped, flipAnim]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "90deg", "180deg"],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["180deg", "270deg", "360deg"],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  const cardW = (width - 60) / 2;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={flip} style={{ width: cardW }}>
      <View style={{ width: cardW, height: cardW * 0.7 }}>
        {/* Front face */}
        <Animated.View
          style={[
            styles.badgeCard,
            !earned && styles.badgeLocked,
            {
              width: cardW,
              height: cardW * 0.7,
              position: "absolute",
              backfaceVisibility: "hidden",
              transform: [{ perspective: 800 }, { rotateY: frontInterpolate }],
              opacity: frontOpacity,
            },
          ]}
        >
          <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
          <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>
            {badge.label}
          </Text>
          {!earned && (
            <Ionicons name="lock-closed" size={10} color={COLORS.textLight} />
          )}
        </Animated.View>

        {/* Back face */}
        <Animated.View
          style={[
            styles.badgeCardBack,
            !earned && { backgroundColor: "#f3f4f6" },
            {
              width: cardW,
              height: cardW * 0.7,
              position: "absolute",
              backfaceVisibility: "hidden",
              transform: [{ perspective: 800 }, { rotateY: backInterpolate }],
              opacity: backOpacity,
            },
          ]}
        >
          <Text style={styles.badgeBackDescription} numberOfLines={4}>
            {badge.description}
          </Text>
          {earned ? (
            <View style={styles.earnedTagSmall}>
              <Ionicons name="checkmark-circle" size={11} color="#22c55e" />
              <Text style={styles.earnedTagSmallText}>Earned</Text>
            </View>
          ) : (
            <View style={styles.lockedTagSmall}>
              <Ionicons name="lock-closed" size={10} color={COLORS.textLight} />
              <Text style={styles.lockedTagSmallText}>Locked</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

export default function ImpactScreen() {
  const { completeTask, user } = useAuth();

  // Derive stats from DB user
  const totalWeight = user?.totalWeightDiverted ?? 0;
  const totalCo2 = user?.totalCo2Saved ?? 0;
  const totalScans = user?.totalScans ?? 0;
  const streakDays = user?.streakDays ?? 0;

  // Fetch user scans to compute material breakdown
  const [scanCategories, setScanCategories] = useState<{ recyclable: number; organic: number; "non-recyclable": number }>({
    recyclable: 0, organic: 0, "non-recyclable": 0,
  });

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      try {
        const scans = await fetchUserScans(user.email);
        const agg = { recyclable: 0, organic: 0, "non-recyclable": 0 };
        if (scans && Array.isArray(scans)) {
          for (const s of scans) {
            for (const c of s.categories || []) {
              const key = c.name as keyof typeof agg;
              if (key in agg) agg[key] += c.weight_estimate_lbs || 0;
            }
          }
        }
        setScanCategories(agg);
      } catch (e) {
        // Fall back: approximate from total weight
        setScanCategories({
          recyclable: Math.round(totalWeight * 0.52),
          organic: Math.round(totalWeight * 0.32),
          "non-recyclable": Math.round(totalWeight * 0.16),
        });
      }
    })();
  }, [user?.email, totalWeight]);

  const materialBreakdown = useMemo(() => {
    const total = scanCategories.recyclable + scanCategories.organic + scanCategories["non-recyclable"];
    if (total === 0) return [
      { name: "Recyclable", lbs: 0, percent: 0, color: "#22c55e" },
      { name: "Organic", lbs: 0, percent: 0, color: "#f59e0b" },
      { name: "Non-Recyclable", lbs: 0, percent: 0, color: "#ef4444" },
    ];
    return [
      { name: "Recyclable", lbs: Math.round(scanCategories.recyclable), percent: Math.round((scanCategories.recyclable / total) * 100), color: "#22c55e" },
      { name: "Organic", lbs: Math.round(scanCategories.organic), percent: Math.round((scanCategories.organic / total) * 100), color: "#f59e0b" },
      { name: "Non-Recyclable", lbs: Math.round(scanCategories["non-recyclable"]), percent: Math.round((scanCategories["non-recyclable"] / total) * 100), color: "#ef4444" },
    ];
  }, [scanCategories]);

  // Determine earned badges from DB data
  const badgesWithStatus = useMemo(() => badges.map(b => {
    let earned = false;
    switch (b.id) {
      case "first-scan": earned = totalScans >= 1; break;
      case "100-lbs": earned = totalWeight >= 100; break;
      case "zero-waste-week": earned = streakDays >= 7; break;
      case "eco-champion": earned = totalCo2 >= 1000; break;
      case "ton-diverted": earned = totalWeight >= 2000; break;
      case "team-player": earned = totalScans >= 50; break;
    }
    return { ...b, earned };
  }), [totalScans, totalWeight, streakDays, totalCo2]);

  // Auto-complete "Check impact" task on mount
  useEffect(() => {
    completeTask("impact");
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <ProfileHeader title="My Impact" subtitle="Your sustainability footprint" />

        {/* Personal stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#f0fdf4" }]}>
            <Ionicons name="scale-outline" size={24} color={COLORS.primary} />
            <AnimatedNumber value={totalWeight} style={styles.statValue} />
            <Text style={styles.statLabel}>lbs diverted</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#f5f3ff" }]}>
            <Ionicons name="cloud-outline" size={24} color={COLORS.violet} />
            <AnimatedNumber value={totalCo2} style={[styles.statValue, { color: COLORS.violet }]} />
            <Text style={styles.statLabel}>kg CO₂ saved</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#eff6ff" }]}>
            <Ionicons name="camera-outline" size={24} color={COLORS.info} />
            <AnimatedNumber value={totalScans} style={[styles.statValue, { color: COLORS.info }]} />
            <Text style={styles.statLabel}>total scans</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}>
            <Ionicons name="flame-outline" size={24} color={COLORS.warning} />
            <AnimatedNumber value={streakDays} style={[styles.statValue, { color: COLORS.warning }]} />
            <Text style={styles.statLabel}>day streak</Text>
          </View>
        </View>

        {/* Material breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waste Categories</Text>
          {materialBreakdown.map((mat) => (
            <View key={mat.name} style={styles.materialRow}>
              <View
                style={[styles.materialDot, { backgroundColor: mat.color }]}
              />
              <Text style={styles.materialName}>{mat.name}</Text>
              <Text style={styles.materialLbs}>{mat.lbs.toLocaleString()} lbs</Text>
              <View style={styles.materialBarBg}>
                <View
                  style={[
                    styles.materialBar,
                    { width: `${mat.percent}%`, backgroundColor: mat.color },
                  ]}
                />
              </View>
              <Text style={styles.materialPercent}>{mat.percent}%</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges Earned</Text>
          <View style={styles.badgesGrid}>
            {badgesWithStatus.map((badge) => (
              <FlipBadge key={badge.id} badge={badge} earned={badge.earned} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 14,
  },
  materialRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  materialDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  materialName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    width: 80,
  },
  materialLbs: {
    fontSize: 12,
    color: COLORS.textSecondary,
    width: 70,
    textAlign: "right",
  },
  materialBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginLeft: 8,
  },
  materialBar: {
    height: 6,
    borderRadius: 3,
  },
  materialPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    width: 36,
    textAlign: "right",
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  badgeCard: {
    width: (width - 60) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeLocked: {
    opacity: 0.45,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 4,
    textAlign: "center",
  },
  badgeLabelLocked: {
    color: COLORS.textLight,
  },
  /* ── Flip card back ── */
  badgeCardBack: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeBackDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 6,
  },
  earnedTagSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  earnedTagSmallText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#22c55e",
  },
  lockedTagSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lockedTagSmallText: {
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.textLight,
  },
});
