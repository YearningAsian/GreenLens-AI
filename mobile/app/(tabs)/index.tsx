import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../src/constants/theme";
import { useToast } from "../../src/components/Toast";
import { useAuth } from "../../src/context/AuthContext";
import ProfileHeader from "../../src/components/ProfileHeader";

const { width } = Dimensions.get("window");

const initialTasks = [
  { id: 1, title: "Scan morning debris pile", done: true, icon: "checkmark-circle" as const },
  { id: 2, title: "Route recyclables to SA Recycling", done: false, icon: "navigate-circle-outline" as const },
  { id: 3, title: "Log afternoon concrete haul", done: false, icon: "camera-outline" as const },
  { id: 4, title: "Check diversion leaderboard", done: false, icon: "trophy-outline" as const },
];

export default function HomeScreen() {
  const greeting = getGreeting();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState(initialTasks);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newDone = !t.done;
          if (newDone) {
            showToast(`Task completed: ${t.title}`, "checkmark-circle");
          }
          return { ...t, done: newDone };
        }
        return t;
      })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <ProfileHeader
          title={`${greeting},`}
          subtitle={`${firstName} 🌿`}
          variant="greeting"
        />

        <View style={styles.header}>
          {/* Day tracker */}
          <View style={styles.dayTracker}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day, i) => (
                <View
                  key={day}
                  style={[
                    styles.dayPill,
                    i < 4 && styles.dayPillActive,
                    i === 3 && styles.dayPillCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      i < 4 && styles.dayPillTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                  {i < 4 && (
                    <Ionicons
                      name="checkmark"
                      size={10}
                      color="#fff"
                      style={{ marginTop: 2 }}
                    />
                  )}
                </View>
              )
            )}
          </View>
        </View>

        {/* Impact summary card */}
        <View style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <Ionicons name="leaf" size={20} color="#fff" />
            <Text style={styles.impactTitle}>Today's Impact</Text>
          </View>
          <View style={styles.impactStats}>
            <View style={styles.impactStat}>
              <Text style={styles.impactValue}>320</Text>
              <Text style={styles.impactLabel}>lbs diverted</Text>
            </View>
            <View style={styles.impactDivider} />
            <View style={styles.impactStat}>
              <Text style={styles.impactValue}>48.2</Text>
              <Text style={styles.impactLabel}>kg CO₂ saved</Text>
            </View>
            <View style={styles.impactDivider} />
            <View style={styles.impactStat}>
              <Text style={styles.impactValue}>5</Text>
              <Text style={styles.impactLabel}>scans today</Text>
            </View>
          </View>
          <View style={styles.streakBanner}>
            <Text style={styles.streakText}>🔥 28-day streak! Keep going!</Text>
          </View>
        </View>

        {/* New Scan Button */}
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
                Classify waste as organic, recyclable, or non-recyclable
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
          </View>
        </TouchableOpacity>

        {/* Today's Tasks */}
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
        <View style={styles.taskList}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskItem, task.done && styles.taskDone]}
              onPress={() => toggleTask(task.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.taskCheck,
                  task.done && styles.taskCheckDone,
                ]}
              >
                {task.done && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text
                style={[
                  styles.taskText,
                  task.done && styles.taskTextDone,
                ]}
              >
                {task.title}
              </Text>
              <Ionicons
                name={task.icon}
                size={20}
                color={task.done ? COLORS.textLight : COLORS.primary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Job site info */}
        <Text style={styles.sectionTitle}>Current Job Site</Text>
        <View style={styles.siteCard}>
          <View style={styles.siteInfo}>
            <Text style={styles.siteName}>Midtown Tower Phase 2</Text>
            <View style={styles.siteLocation}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.siteCity}>Atlanta, GA</Text>
            </View>
          </View>
          <View style={styles.siteStats}>
            <View style={styles.siteStat}>
              <Text style={styles.siteStatValue}>12,450</Text>
              <Text style={styles.siteStatLabel}>lbs total</Text>
            </View>
            <View style={styles.siteStat}>
              <Text style={styles.siteStatValue}>#2</Text>
              <Text style={styles.siteStatLabel}>site rank</Text>
            </View>
            <View style={styles.siteStat}>
              <Text style={styles.siteStatValue}>85</Text>
              <Text style={styles.siteStatLabel}>green score</Text>
            </View>
          </View>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  dayTracker: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 6,
  },
  dayPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  dayPillActive: {
    backgroundColor: COLORS.primary,
  },
  dayPillCurrent: {
    backgroundColor: COLORS.primaryDark,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dayPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  dayPillTextActive: {
    color: "#fff",
  },
  impactCard: {
    marginHorizontal: 20,
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
  impactTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  impactStats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  impactStat: {
    flex: 1,
    alignItems: "center",
  },
  impactValue: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },
  impactLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginTop: 2,
  },
  impactDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 4,
  },
  streakBanner: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingVertical: 10,
    alignItems: "center",
  },
  streakText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
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
  scanButtonText: {
    flex: 1,
  },
  scanButtonTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  scanButtonDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 3,
  },
  taskList: {
    paddingHorizontal: 20,
    gap: 8,
  },
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
  taskDone: {
    opacity: 0.6,
  },
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
  taskText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  taskTextDone: {
    textDecorationLine: "line-through",
    color: COLORS.textLight,
  },
  siteCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  siteInfo: {
    marginBottom: 14,
  },
  siteName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  siteLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  siteCity: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  siteStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
    gap: 12,
  },
  siteStat: {
    flex: 1,
    alignItems: "center",
  },
  siteStatValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },
  siteStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
