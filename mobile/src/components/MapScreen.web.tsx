import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import ProfileHeader from "./ProfileHeader";

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ProfileHeader title="Center Map" subtitle="Find & navigate to drop-offs" />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="map-outline" size={64} color={COLORS.textLight} />
        </View>
        <Text style={styles.title}>Map View</Text>
        <Text style={styles.subtitle}>
          The interactive map with route directions is available on the mobile app.
          Open GreenLens AI on your phone to view recycling centers on the map and
          get turn-by-turn directions.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
