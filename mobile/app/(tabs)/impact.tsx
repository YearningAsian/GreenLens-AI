import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../src/constants/theme";
import ProfileHeader from "../../src/components/ProfileHeader";
import { useAuth } from "../../src/context/AuthContext";

const { width } = Dimensions.get("window");

const badges = [
  { id: "first-scan", label: "First Scan", emoji: "🌱", earned: true, description: "Completed your very first waste scan. Every green journey starts with a single step!" },
  { id: "100-lbs", label: "100 lbs Club", emoji: "💪", earned: true, description: "Diverted over 100 pounds of construction waste from landfills. That's real impact!" },
  { id: "zero-waste-week", label: "Zero Waste Week", emoji: "🏆", earned: true, description: "Achieved a full week where 100% of scanned materials were diverted from landfills." },
  { id: "eco-champion", label: "Eco Champion", emoji: "🌍", earned: true, description: "Reached top 10% of all volunteers in CO₂ savings. You're leading the charge!" },
  { id: "ton-diverted", label: "Ton Diverted", emoji: "🎉", earned: false, description: "Divert a full ton (2,000 lbs) of waste from landfills. Keep going — you're almost there!" },
  { id: "team-player", label: "Team Player", emoji: "🤝", earned: false, description: "Complete 50 scans across at least 3 different job sites. Collaboration makes the difference." },
];

const materialBreakdown = [
  { name: "Recyclable", lbs: 6400, percent: 52, color: "#22c55e" },
  { name: "Organic", lbs: 3950, percent: 32, color: "#f59e0b" },
  { name: "Non-Recyclable", lbs: 2100, percent: 16, color: "#ef4444" },
];

export default function ImpactScreen() {
  const [selectedBadge, setSelectedBadge] = useState<typeof badges[0] | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const { completeTask } = useAuth();

  // Auto-complete "Check impact" task on mount
  useEffect(() => {
    completeTask("impact");
  }, []);

  useEffect(() => {
    if (selectedBadge) {
      spinAnim.setValue(0);
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();
    }
  }, [selectedBadge]);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const scaleInterpolation = spinAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1.15, 1],
  });

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
              <TouchableOpacity
                key={badge.id}
                activeOpacity={0.7}
                onPress={() => setSelectedBadge(badge)}
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
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Badge Detail Modal */}
        <Modal
          visible={!!selectedBadge}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedBadge(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedBadge(null)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
              <Animated.Text
                style={[
                  styles.modalEmoji,
                  {
                    transform: [
                      { rotate: spinInterpolation },
                      { scale: scaleInterpolation },
                    ],
                  },
                ]}
              >
                {selectedBadge?.emoji}
              </Animated.Text>
              <Text style={styles.modalTitle}>{selectedBadge?.label}</Text>
              {selectedBadge && !selectedBadge.earned && (
                <View style={styles.lockedTag}>
                  <Ionicons name="lock-closed" size={11} color={COLORS.textLight} />
                  <Text style={styles.lockedTagText}>Locked</Text>
                </View>
              )}
              <Text style={styles.modalDescription}>
                {selectedBadge?.description}
              </Text>
              {selectedBadge?.earned && (
                <View style={styles.earnedTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                  <Text style={styles.earnedTagText}>Earned</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedBadge(null)}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 16,
  },
  earnedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  earnedTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#22c55e",
  },
  lockedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  lockedTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  modalCloseBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
