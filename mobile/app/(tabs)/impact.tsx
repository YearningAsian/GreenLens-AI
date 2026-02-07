import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../src/constants/theme";
import ProfileHeader from "../../src/components/ProfileHeader";

const { width } = Dimensions.get("window");

const badges = [
  { id: "first-scan", label: "First Scan", emoji: "🌱", earned: true },
  { id: "100-lbs", label: "100 lbs Club", emoji: "💪", earned: true },
  { id: "zero-waste-week", label: "Zero Waste Week", emoji: "🏆", earned: true },
  { id: "eco-champion", label: "Eco Champion", emoji: "🌍", earned: true },
  { id: "ton-diverted", label: "Ton Diverted", emoji: "🎉", earned: false },
  { id: "team-player", label: "Team Player", emoji: "🤝", earned: false },
];

const materialBreakdown = [
  { name: "Recyclable", lbs: 6400, percent: 52, color: "#22c55e" },
  { name: "Organic", lbs: 3950, percent: 32, color: "#f59e0b" },
  { name: "Non-Recyclable", lbs: 2100, percent: 16, color: "#ef4444" },
];

export default function ImpactScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <ProfileHeader title="My Impact" subtitle="Your sustainability footprint" />

        {/* Personal stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#f0fdf4" }]}>
            <Ionicons name="scale-outline" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>12,450</Text>
            <Text style={styles.statLabel}>lbs diverted</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#f5f3ff" }]}>
            <Ionicons name="cloud-outline" size={24} color={COLORS.violet} />
            <Text style={[styles.statValue, { color: COLORS.violet }]}>2,840</Text>
            <Text style={styles.statLabel}>kg CO₂ saved</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#eff6ff" }]}>
            <Ionicons name="camera-outline" size={24} color={COLORS.info} />
            <Text style={[styles.statValue, { color: COLORS.info }]}>87</Text>
            <Text style={styles.statLabel}>total scans</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}>
            <Ionicons name="flame-outline" size={24} color={COLORS.warning} />
            <Text style={[styles.statValue, { color: COLORS.warning }]}>28</Text>
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
            {badges.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  !badge.earned && styles.badgeLocked,
                ]}
              >
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text
                  style={[
                    styles.badgeLabel,
                    !badge.earned && styles.badgeLabelLocked,
                  ]}
                >
                  {badge.label}
                </Text>
                {!badge.earned && (
                  <Ionicons name="lock-closed" size={10} color={COLORS.textLight} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Leaderboard position */}
        <View style={styles.leaderCard}>
          <View style={styles.leaderHeader}>
            <Ionicons name="trophy" size={24} color="#f59e0b" />
            <Text style={styles.leaderTitle}>Site Leaderboard</Text>
          </View>
          <View style={styles.leaderPosition}>
            <Text style={styles.leaderRank}>#1</Text>
            <Text style={styles.leaderRankLabel}>at Midtown Tower</Text>
          </View>
          <Text style={styles.leaderSubtext}>
            You're leading your job site! 2,200 lbs ahead of 2nd place.
          </Text>
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
    gap: 10,
    justifyContent: "center",
  },
  badgeCard: {
    width: (width - 60) / 3,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  badgeLocked: {
    opacity: 0.45,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 4,
    textAlign: "center",
  },
  badgeLabelLocked: {
    color: COLORS.textLight,
  },
  leaderCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  leaderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  leaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  leaderPosition: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 10,
  },
  leaderRank: {
    fontSize: 36,
    fontWeight: "900",
    color: "#f59e0b",
  },
  leaderRankLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  leaderSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
});
