import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../src/constants/theme";
import { useAuth, getLevelInfo, POINTS } from "../../src/context/AuthContext";
import { fetchAllUsers, checkInDb } from "../../src/services/api";
import ProfileHeader from "../../src/components/ProfileHeader";
import AnimatedNumber from "../../src/components/AnimatedNumber";
import StreakFire from "../../src/components/StreakFire";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ── Leaderboard entry type ── */
interface LeaderEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  avatar: string;
  profileImage?: string;
}

const RANK_COLORS = ["#facc15", "#94a3b8", "#cd7f32"];

export default function HomeScreen() {
  const greeting = getGreeting();
  const { user, refreshUser, prefetched } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const levelInfo = user ? getLevelInfo(user.xp) : { level: 1, xp: 0, progress: 0, currentThreshold: 0, nextThreshold: 100 };
  const tasks = user?.dailyTasks ?? [];
  const tasksCompleted = tasks.filter((t) => t.completed).length;

  /* Check-in state */
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  // Auto-detect if already checked in today
  useEffect(() => {
    if (user?.lastActiveDate) {
      const today = new Date().toISOString().slice(0, 10);
      setCheckedIn(user.lastActiveDate === today);
    }
  }, [user?.lastActiveDate]);

  const handleCheckIn = async () => {
    if (!user?.email || checkingIn || checkedIn) return;
    setCheckingIn(true);
    try {
      const result = await checkInDb(user.email);
      if (result) {
        setCheckedIn(true);
        await refreshUser();
      }
    } catch (e) {
      console.warn("[CheckIn] Failed:", e);
    } finally {
      setCheckingIn(false);
    }
  };

  /* Fetch leaderboard from DB */
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const slideAnims = useRef<Animated.Value[]>([]).current;
  const fadeAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // Use prefetched data if available, otherwise fetch fresh
        const all = prefetched?.allUsers?.length
          ? prefetched.allUsers
          : await fetchAllUsers(user.state);
        const sorted = all
          .sort((a, b) => b.totalWeightDiverted - a.totalWeightDiverted)
          .slice(0, 5)
          .map((u, i) => {
            // Apply privacy masking if user opted in
            let displayName = u.name.split(" ")[0] + " " + u.name.split(" ").pop()?.charAt(0) + ".";
            if (u.leaderboardPrivacy) {
              const parts = u.name.trim().split(/\s+/);
              displayName = parts.map(p => p[0] + "*".repeat(Math.max(p.length - 1, 4))).join(" ");
            }
            return {
              rank: i + 1,
              name: displayName,
              xp: u.xp,
              level: u.level,
              avatar: u.name.charAt(0),
              profileImage: u.profileImageUrl
                ? u.profileImageUrl.replace("/svg?", "/png?")
                : undefined,
            };
          });

        // Initialize slide/fade animations for each row
        slideAnims.length = 0;
        fadeAnims.length = 0;
        sorted.forEach(() => {
          slideAnims.push(new Animated.Value(60));
          fadeAnims.push(new Animated.Value(0));
        });

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setLeaderboard(sorted);

        // Stagger slide-in animations
        const animations = sorted.map((_, i) =>
          Animated.parallel([
            Animated.timing(slideAnims[i], {
              toValue: 0,
              duration: 400,
              delay: i * 80,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnims[i], {
              toValue: 1,
              duration: 350,
              delay: i * 80,
              useNativeDriver: true,
            }),
          ])
        );
        Animated.stagger(0, animations).start();
      } catch (e) {
        console.warn("[Home] Failed to fetch leaderboard:", e);
      }
    })();
  }, [user?.state, user?.totalScans]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <ProfileHeader
          title={`${greeting},`}
          subtitle={`${firstName} 🌿`}
          variant="greeting"
        />

        {/* ── Level Card ── */}
        <View style={styles.levelCard}>
          <View style={styles.levelTop}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{levelInfo.level}</Text>
            </View>
            <View style={styles.levelMeta}>
              <Text style={styles.levelTitle}>Level {levelInfo.level}</Text>
              <Text style={styles.xpText}>
                {user?.xp?.toLocaleString() ?? 0} XP
              </Text>
            </View>
            <View style={styles.xpToNext}>
              <Text style={styles.xpToNextLabel}>Next level</Text>
              <Text style={styles.xpToNextValue}>{(levelInfo.nextThreshold - (user?.xp ?? 0)).toLocaleString()} XP</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={styles.levelBarBg}>
            <View
              style={[styles.levelBarFill, { width: `${Math.max(levelInfo.progress * 100, 2)}%` }]}
            />
          </View>
          <View style={styles.levelBarLabels}>
            <Text style={styles.levelBarLabel}>{levelInfo.currentThreshold.toLocaleString()}</Text>
            <Text style={styles.levelBarLabel}>{levelInfo.nextThreshold.toLocaleString()}</Text>
          </View>
        </View>

        {/* ── Impact Summary ── */}
        <View style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <Ionicons name="leaf" size={20} color="#fff" />
            <Text style={styles.impactTitle}>My Impact</Text>
          </View>
          <View style={styles.impactStats}>
            <View style={styles.impactStat}>
              <AnimatedNumber value={user?.totalWeightDiverted ?? 0} style={styles.impactValue} />
              <Text style={styles.impactLabel}>lbs diverted</Text>
            </View>
            <View style={styles.impactDivider} />
            <View style={styles.impactStat}>
              <AnimatedNumber value={user?.totalCo2Saved ?? 0} style={styles.impactValue} />
              <Text style={styles.impactLabel}>kg CO₂ saved</Text>
            </View>
            <View style={styles.impactDivider} />
            <View style={styles.impactStat}>
              <AnimatedNumber value={user?.totalScans ?? 0} style={styles.impactValue} />
              <Text style={styles.impactLabel}>total scans</Text>
            </View>
          </View>
          <View style={styles.streakBanner}>
            <StreakFire days={user?.streakDays ?? 0} size="small" />
            <TouchableOpacity
              style={[styles.checkInBtn, checkedIn && styles.checkInBtnDone]}
              onPress={handleCheckIn}
              disabled={checkedIn || checkingIn}
              activeOpacity={0.8}
            >
              <Ionicons
                name={checkedIn ? "checkmark-circle" : "hand-right"}
                size={16}
                color={checkedIn ? "#22c55e" : "#fff"}
              />
              <Text style={[styles.checkInText, checkedIn && styles.checkInTextDone]}>
                {(() => {
                  if (checkingIn) return "...";
                  if (checkedIn) return "Checked In";
                  return "Check In";
                })()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── New Scan Button ── */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push("/scan")}
          activeOpacity={0.85}
        >
          <View style={styles.scanButtonInner}>
            <View style={styles.scanButtonIcon}>
              <Ionicons name="scan" size={28} color="#fff" />
            </View>
            <View style={styles.scanButtonText}>
              <Text style={styles.scanButtonTitle}>New Scan</Text>
              <Text style={styles.scanButtonDesc}>
                Classify waste & earn {POINTS.SCAN} XP
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
          </View>
        </TouchableOpacity>

        {/* ── Daily Tasks ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <View style={styles.taskCounter}>
            <Text style={styles.taskCounterText}>{tasksCompleted}/{tasks.length}</Text>
          </View>
        </View>
        <View style={styles.taskList}>
          {tasks.map((task) => (
            <View
              key={task.id}
              style={[styles.taskItem, task.completed && styles.taskDone]}
            >
              <View style={[styles.taskCheck, task.completed && styles.taskCheckDone]}>
                {task.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskText, task.completed && styles.taskTextDone]}>
                  {task.title}
                </Text>
                <Text style={styles.taskPoints}>+{task.points} XP</Text>
              </View>
              <Ionicons
                name={task.icon as any}
                size={20}
                color={task.completed ? COLORS.textLight : COLORS.primary}
              />
            </View>
          ))}
        </View>

        {/* ── Leaderboard ── */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 24 }]}>
          Community Leaderboard
        </Text>
        <View style={styles.leaderboard}>
          {leaderboard.map((entry, i) => {
            const isUser = user?.name?.startsWith(entry.name.split(" ")[0]);
            const slideAnim = slideAnims[i];
            const fadeAnim = fadeAnims[i];
            return (
              <Animated.View
                key={entry.rank}
                style={[
                  styles.leaderRow,
                  isUser && styles.leaderRowSelf,
                  slideAnim && fadeAnim
                    ? { transform: [{ translateX: slideAnim }], opacity: fadeAnim }
                    : {},
                ]}
              >
                <Text style={[styles.leaderRank, i < 3 && { color: RANK_COLORS[i] }]}>
                  #{entry.rank}
                </Text>
                {entry.profileImage ? (
                  <Image
                    source={{ uri: entry.profileImage }}
                    style={[styles.leaderAvatar, i === 0 && { backgroundColor: "#fef3c7" }]}
                  />
                ) : (
                  <View style={[styles.leaderAvatar, i === 0 && { backgroundColor: "#fef3c7" }]}>
                    <Text style={[styles.leaderAvatarText, i === 0 && { color: "#b45309" }]}>
                      {entry.avatar}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaderName}>{entry.name}</Text>
                  <Text style={styles.leaderXp}>{entry.xp.toLocaleString()} XP · Lvl {entry.level}</Text>
                </View>
                {i === 0 && <Ionicons name="trophy" size={18} color="#facc15" />}
              </Animated.View>
            );
          })}
          {leaderboard.length === 0 && (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: COLORS.textLight, fontSize: 13 }}>Loading leaderboard...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  /* ── Level Card ── */
  levelCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  levelTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  levelBadgeText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
  levelMeta: {
    marginLeft: 14,
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  xpText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  xpToNext: {
    alignItems: "flex-end",
  },
  xpToNextLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  xpToNextValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 2,
  },
  levelBarBg: {
    height: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 5,
    overflow: "hidden",
  },
  levelBarFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  levelBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  levelBarLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: "500",
  },

  /* ── Impact Card ── */
  impactCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  impactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  impactTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  impactStats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  impactStat: { flex: 1, alignItems: "center" },
  impactValue: { color: "#fff", fontSize: 26, fontWeight: "800" },
  impactLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 },
  impactDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 4 },
  streakBanner: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  streakText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  checkInBtnDone: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  checkInText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  checkInTextDone: {
    color: "#22c55e",
  },

  /* ── Scan Button ── */
  scanButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  scanButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 14,
  },
  scanButtonIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanButtonText: { flex: 1 },
  scanButtonTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  scanButtonDesc: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3 },

  /* ── Section header ── */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  taskCounter: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskCounterText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  /* ── Tasks (read-only) ── */
  taskList: { paddingHorizontal: 20, gap: 8 },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  taskDone: { opacity: 0.55 },
  taskCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  taskText: { fontSize: 14, fontWeight: "500", color: COLORS.text },
  taskTextDone: { textDecorationLine: "line-through", color: COLORS.textLight },
  taskPoints: { fontSize: 11, color: COLORS.primary, fontWeight: "600", marginTop: 2 },

  /* ── Leaderboard ── */
  leaderboard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leaderRowSelf: {
    backgroundColor: "#f0fdf4",
  },
  leaderRank: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textSecondary,
    width: 28,
  },
  leaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  leaderAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  leaderName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  leaderXp: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});
