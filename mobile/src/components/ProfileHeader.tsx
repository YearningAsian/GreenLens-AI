import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../constants/theme";
import { useAuth, ROLES, RoleName } from "../context/AuthContext";

interface ProfileHeaderProps {
  title: string;
  subtitle?: string;
  variant?: "default" | "greeting";
}

export default function ProfileHeader({ title, subtitle, variant = "default" }: ProfileHeaderProps) {
  const { user, logout, updateProfileImage, updateRole, updateLeaderboardPrivacy } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const isGreeting = variant === "greeting";

  const pickImage = async () => {
    Alert.alert("Change Photo", "Choose a source", [
      {
        text: "Camera",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return;
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled) updateProfileImage(result.assets[0].uri);
        },
      },
      {
        text: "Photo Library",
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) return;
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled) updateProfileImage(result.assets[0].uri);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.header}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, isGreeting && styles.titleGreeting]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, isGreeting && styles.subtitleGreeting]}>
            {subtitle}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.profileBtn}
        activeOpacity={0.8}
        onPress={() => setShowMenu(true)}
      >
        {user?.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.profileImg} />
        ) : (
          <Text style={styles.profileInitial}>
            {user?.initial ?? "?"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Profile menu modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
                <View style={styles.menuAvatarWrap}>
                  <View style={styles.menuAvatar}>
                    {user?.profileImage ? (
                      <Image source={{ uri: user.profileImage }} style={styles.menuAvatarImg} />
                    ) : (
                      <Text style={styles.menuAvatarText}>
                        {user?.initial ?? "?"}
                      </Text>
                    )}
                  </View>
                  <View style={styles.cameraBadge}>
                    <Ionicons name="camera" size={12} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.menuInfo}>
                <Text style={styles.menuName}>{user?.name ?? "User"}</Text>
                <Text style={styles.menuEmail}>{user?.email ?? ""}</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <View style={styles.menuDetails}>
              <TouchableOpacity
                style={styles.menuDetailRow}
                activeOpacity={0.6}
                onPress={() => setShowRolePicker(true)}
              >
                <Ionicons name="people-outline" size={16} color={COLORS.violet} />
                <Text style={[styles.menuDetailText, { color: COLORS.violet, fontWeight: "600" }]}>
                  {user?.role ?? "—"}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.violet} style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
              <View style={styles.menuDetailRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.menuDetailText}>{user?.city ?? "—"}</Text>
              </View>
              <View style={styles.menuDetailRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.menuDetailText}>Joined {user?.joinedDate ?? "—"}</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <View style={styles.menuDetails}>
              <TouchableOpacity
                style={styles.menuDetailRow}
                activeOpacity={0.6}
                onPress={() => updateLeaderboardPrivacy(!(user?.leaderboardPrivacy ?? false))}
              >
                <Ionicons name="eye-off-outline" size={16} color={COLORS.violet} />
                <Text style={[styles.menuDetailText, { flex: 1 }]}>
                  Privacy
                </Text>
                <View style={[styles.toggleTrack, user?.leaderboardPrivacy && styles.toggleTrackActive]}>
                  <View style={[styles.toggleThumb, user?.leaderboardPrivacy && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
              <Text style={styles.privacyHint}>
                When enabled, your name appears as "M**** J****"
              </Text>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setShowMenu(false);
                logout();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Role picker modal */}
      <Modal
        visible={showRolePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRolePicker(false)}
      >
        <Pressable
          style={[styles.overlay, { justifyContent: "flex-end", alignItems: "stretch", paddingTop: 0, paddingRight: 0 }]}
          onPress={() => setShowRolePicker(false)}
        >
          <View style={styles.rolePicker}>
            <Text style={styles.rolePickerTitle}>Choose Your Role</Text>
            <Text style={styles.rolePickerSubtitle}>
              How do you contribute to the community?
            </Text>
            {ROLES.map((role) => {
              const isSelected = user?.role === role.name;
              return (
                <TouchableOpacity
                  key={role.name}
                  style={[styles.roleOption, isSelected && styles.roleOptionActive]}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateRole(role.name);
                    setShowRolePicker(false);
                  }}
                >
                  <View style={[styles.roleIconWrap, isSelected && styles.roleIconWrapActive]}>
                    <Ionicons
                      name={role.icon as any}
                      size={22}
                      color={isSelected ? "#fff" : COLORS.violet}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleOptionName, isSelected && styles.roleOptionNameActive]}>
                      {role.name}
                    </Text>
                    <Text style={styles.roleOptionDesc}>{role.description}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.violet} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  titleGreeting: {
    fontSize: 28,
    fontWeight: "300",
  },
  subtitleGreeting: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  profileImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  profileInitial: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: 20,
  },
  menu: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: 260,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  menuAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  menuAvatarWrap: {
    position: "relative",
  },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  menuAvatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  menuEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  menuDetails: {
    gap: 10,
  },
  menuDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.danger,
  },
  rolePicker: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  rolePickerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  rolePickerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  roleOptionActive: {
    borderColor: COLORS.violet,
    backgroundColor: "#f5f3ff",
  },
  roleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconWrapActive: {
    backgroundColor: COLORS.violet,
  },
  roleOptionName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  roleOptionNameActive: {
    color: COLORS.violet,
  },
  roleOptionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    padding: 2,
    justifyContent: "center",
  },
  toggleTrackActive: {
    backgroundColor: COLORS.violet,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  privacyHint: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
    marginLeft: 32,
    fontStyle: "italic",
  },
});
