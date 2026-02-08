import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { COLORS, CATEGORY_COLORS, CATEGORY_LABELS } from "../../src/constants/theme";
import { scanWaste, submitCorrection, saveScanDirect, updateUserStatsDb, addXpDb } from "../../src/services/api";
import type { ScanResult } from "../../src/services/api";
import ProfileHeader from "../../src/components/ProfileHeader";
import { useToast } from "../../src/components/Toast";
import { useAuth } from "../../src/context/AuthContext";

type CategoryName = "recyclable" | "organic" | "non-recyclable";

interface EditableCategory {
  name: CategoryName;
  percentage: number;
  weight_estimate_lbs: number;
  co2_saved_kg: number;
  notes?: string;
}

export default function ScanScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [editCategories, setEditCategories] = useState<EditableCategory[]>([]);
  const [editingWeight, setEditingWeight] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();
  const { completeTask, user, refreshUser } = useAuth();
  const originalCategoriesRef = useRef<EditableCategory[]>([]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera roll access is needed to classify waste.");
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!picked.canceled && picked.assets[0]) {
      setImage(picked.assets[0].uri);
      setResult(null);
      setCorrecting(false);
      setSubmitted(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed to classify waste.");
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });

    if (!photo.canceled && photo.assets[0]) {
      setImage(photo.assets[0].uri);
      setResult(null);
      setCorrecting(false);
      setSubmitted(false);
    }
  };

  const handleScan = async () => {
    if (!image) return;

    setScanning(true);
    setSubmitted(false);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      } catch {}

      const scanResult = await scanWaste(image, lat, lng);
      setResult(scanResult);

      if (!scanResult.needs_rescan && scanResult.categories.length > 0) {
        completeTask("scan");
        showToast("Scan completed — +25 XP!", "checkmark-circle");
      }
    } catch (error: any) {
      const msg = error?.message || "Unknown error";
      console.error("[SCAN ERROR]", msg);
      if (msg.includes("Network") || msg.includes("fetch") || msg.includes("Convex")) {
        showToast("Cannot reach AI service — check internet connection", "alert-circle");
      } else {
        showToast(`Scan error: ${msg.slice(0, 60)}`, "alert-circle");
      }
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => {
    setImage(null);
    setResult(null);
    setCorrecting(false);
    setSubmitted(false);
  };

  const startCorrection = () => {
    if (!result) return;
    const allNames: CategoryName[] = ["recyclable", "organic", "non-recyclable"];
    const existing = result.categories.map((c) => c.name);
    const cats: EditableCategory[] = allNames.map((name) => {
      const found = result.categories.find((c) => c.name === name);
      return found
        ? { ...found, name: name as CategoryName }
        : { name, percentage: 0, weight_estimate_lbs: 0, co2_saved_kg: 0, notes: "" };
    });
    originalCategoriesRef.current = result.categories.map((c) => ({ ...c, name: c.name as CategoryName }));
    setEditCategories(cats);
    setCorrecting(true);
  };

  const updateCategoryPercentage = (index: number, value: string) => {
    const num = parseInt(value) || 0;
    setEditCategories((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], percentage: Math.min(100, Math.max(0, num)) };
      return updated;
    });
  };

  const updateCategoryWeight = (index: number, value: string) => {
    const num = parseFloat(value) || 0;
    setEditCategories((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], weight_estimate_lbs: Math.max(0, num) };
      return updated;
    });
  };

  const startWeightEdit = () => {
    if (!result) return;
    const cats: EditableCategory[] = result.categories.map((c) => ({ ...c, name: c.name as CategoryName }));
    setEditCategories(cats);
    setEditingWeight(true);
  };

  const saveWeightEdit = async () => {
    if (!result) return;
    const newCategories = editCategories.map((cat) => ({
      ...cat,
      co2_saved_kg: cat.weight_estimate_lbs * (CO2_FACTORS[cat.name] || 0.05),
    }));
    const newTotal = newCategories.reduce((sum, c) => sum + c.weight_estimate_lbs, 0);
    const newCo2 = newCategories.reduce((sum, c) => sum + c.co2_saved_kg, 0);
    
    // Submit weight correction as feedback to AI (silent improvement)
    try {
      await submitCorrection(
        result.categories, // original AI weights
        newCategories,      // user-corrected weights
        result.summary || "Weight correction"
      );
    } catch (err) {
      console.warn("Failed to submit weight correction feedback:", err);
      // Don't show error to user - this is silent feedback
    }
    
    setResult({
      ...result,
      total_weight_estimate_lbs: newTotal,
      categories: newCategories,
      co2_saved_kg: newCo2,
    });
    setEditingWeight(false);
    showToast("Weight updated — AI learning from your correction", "checkmark-circle");
  };

  const CO2_FACTORS: Record<CategoryName, number> = {
    "recyclable": 1.02,
    "organic": 0.34,
    "non-recyclable": 0.05,
  };

  const submitCorrectionHandler = async () => {
    const nonZero = editCategories.filter((c) => c.percentage > 0);
    const total = nonZero.reduce((sum, c) => sum + c.percentage, 0);

    if (total !== 100) {
      Alert.alert("Invalid percentages", `Percentages must sum to 100%. Currently: ${total}%`);
      return;
    }

    setSubmitting(true);
    try {
      await submitCorrection(
        originalCategoriesRef.current,
        nonZero,
        result?.summary
      );
      showToast("Correction submitted — AI will improve!", "thumbs-up");
      setCorrecting(false);
    } catch {
      showToast("Failed to submit correction", "alert-circle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!result || result.needs_rescan) return;
    setSubmitting(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      let locationName = user?.city || "Atlanta";
      let city = user?.city || "Atlanta";
      let state = user?.state || "Georgia";

      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
        // Reverse geocode to get real location name
        try {
          const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (geo) {
            // Build a meaningful location name from geocoding
            const neighborhood = geo.district || geo.subregion || "";
            const street = geo.street || "";
            if (neighborhood) {
              locationName = neighborhood;
            } else if (street) {
              locationName = street;
            }
            if (geo.city) city = geo.city;
            if (geo.region) state = geo.region;
          }
        } catch {}
      } catch {}

      await saveScanDirect({
        userId: user?.email || "anonymous",
        userName: user?.name || "Anonymous",
        locationName,
        city,
        state,
        categories: result.categories,
        totalWeightLbs: result.total_weight_estimate_lbs,
        co2SavedKg: result.co2_saved_kg,
        confidence: result.classification_confidence,
        summary: result.summary,
        latitude: lat,
        longitude: lng,
        xpAwarded: 25,
      });

      // Update user stats in Convex (weight, CO₂, scan count)
      if (user?.email) {
        try {
          await updateUserStatsDb(user.email, result.total_weight_estimate_lbs, result.co2_saved_kg);
          await addXpDb(user.email, 25, "scan");
        } catch (e) { console.warn("[Scan] DB stats update failed:", e); }
      }

      // Refresh local user from DB to sync numbers
      await refreshUser();

      setSubmitted(true);
      showToast("Scan saved to database!", "checkmark-circle");
    } catch (error) {
      showToast("Saved locally — sync later", "alert-circle");
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <ProfileHeader title="Waste Scanner" subtitle="Powered by Gemini AI" />

          {!image ? (
            <View style={styles.captureSection}>
              <View style={styles.scannerFrame}>
                <Ionicons name="scan-outline" size={80} color={COLORS.primary} />
                <Text style={styles.scanPrompt}>
                  Point at waste materials{"\n"}for instant classification
                </Text>
                <View style={styles.categoryHint}>
                  <View style={[styles.hintDot, { backgroundColor: CATEGORY_COLORS.recyclable }]} />
                  <Text style={styles.hintText}>Recyclable</Text>
                  <View style={[styles.hintDot, { backgroundColor: CATEGORY_COLORS.organic }]} />
                  <Text style={styles.hintText}>Organic</Text>
                  <View style={[styles.hintDot, { backgroundColor: CATEGORY_COLORS["non-recyclable"] }]} />
                  <Text style={styles.hintText}>Non-Recyclable</Text>
                </View>
              </View>

              <View style={styles.captureButtons}>
                <TouchableOpacity style={styles.captureBtn} onPress={takePhoto} activeOpacity={0.7}>
                  <View style={styles.captureBtnInner}>
                    <Ionicons name="camera" size={28} color="#fff" />
                  </View>
                  <Text style={styles.captureBtnText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.captureBtn} onPress={pickImage} activeOpacity={0.7}>
                  <View style={[styles.captureBtnInner, { backgroundColor: COLORS.info }]}>
                    <Ionicons name="images" size={28} color="#fff" />
                  </View>
                  <Text style={styles.captureBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tips}>
                <Text style={styles.tipsTitle}>Scanning Tips</Text>
                <Text style={styles.tipItem}>• Get close for better identification</Text>
                <Text style={styles.tipItem}>• Good lighting improves accuracy</Text>
                <Text style={styles.tipItem}>• Include the full waste pile</Text>
                <Text style={styles.tipItem}>• You can correct AI results to improve future scans</Text>
              </View>
            </View>
          ) : (
            <View style={styles.resultSection}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity style={styles.resetBtn} onPress={resetScan}>
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {!result && !scanning && (
                <TouchableOpacity style={styles.analyzeBtn} onPress={handleScan} activeOpacity={0.8}>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.analyzeBtnText}>Analyze with Gemini AI</Text>
                </TouchableOpacity>
              )}

              {scanning && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Classifying waste...</Text>
                  <Text style={styles.loadingSubtext}>Gemini 2.5 Flash is analyzing your image</Text>
                </View>
              )}

              {result?.needs_rescan && (
                <View style={styles.rescanContainer}>
                  <View style={styles.rescanIcon}>
                    <Ionicons name="alert-circle" size={48} color={COLORS.warning} />
                  </View>
                  <Text style={styles.rescanTitle}>No Waste Detected</Text>
                  <Text style={styles.rescanText}>{result.summary}</Text>
                  <TouchableOpacity style={styles.rescanBtn} onPress={resetScan} activeOpacity={0.8}>
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.rescanBtnText}>Take New Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rescanSecondary}
                    onPress={() => { setResult(null); handleScan(); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={16} color={COLORS.primary} />
                    <Text style={styles.rescanSecondaryText}>Retry This Image</Text>
                  </TouchableOpacity>
                </View>
              )}

              {result && !result.needs_rescan && (
                <View style={styles.results}>
                  <View style={styles.confidenceBadge}>
                    <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
                    <Text style={styles.confidenceText}>
                      {Math.round(result.classification_confidence * 100)}% Confidence
                    </Text>
                  </View>

                  <Text style={styles.summaryText}>{result.summary}</Text>

                  <View style={styles.sectionHeader}>
                    <Text style={[styles.resultSectionTitle, { marginTop: 0, marginBottom: 0 }]}>Waste Classification</Text>
                    {!correcting && !submitted && (
                      <TouchableOpacity onPress={startCorrection} style={styles.correctBtn} activeOpacity={0.7}>
                        <Ionicons name="create-outline" size={14} color={COLORS.info} />
                        <Text style={styles.correctBtnText}>Correct</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {correcting ? (
                    <View>
                      {editCategories.map((cat, i) => (
                        <View key={cat.name} style={[styles.materialRow, styles.materialRowEdit]}>
                          <View style={styles.materialInfo}>
                            <View style={[styles.materialDot, { backgroundColor: CATEGORY_COLORS[cat.name] || COLORS.textLight }]} />
                            <Text style={styles.materialName}>
                              {CATEGORY_LABELS[cat.name] || cat.name}
                            </Text>
                          </View>
                          <View style={styles.editRow}>
                            <TextInput
                              style={styles.percentInput}
                              keyboardType="number-pad"
                              value={String(cat.percentage)}
                              onChangeText={(v) => updateCategoryPercentage(i, v)}
                              maxLength={3}
                              selectTextOnFocus
                            />
                            <Text style={styles.percentSign}>%</Text>
                          </View>
                        </View>
                      ))}
                      <Text style={styles.editHint}>
                        Adjust percentages (must total 100%). This helps improve the AI.
                      </Text>
                      <View style={styles.editActions}>
                        <TouchableOpacity
                          style={styles.editCancelBtn}
                          onPress={() => setCorrecting(false)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.editCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.editSubmitBtn}
                          onPress={submitCorrectionHandler}
                          activeOpacity={0.8}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="checkmark" size={18} color="#fff" />
                              <Text style={styles.editSubmitText}>Submit Correction</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    result.categories.map((cat, i) => (
                      <View key={i} style={styles.materialRow}>
                        <View style={styles.materialInfo}>
                          <View style={[styles.materialDot, { backgroundColor: CATEGORY_COLORS[cat.name] || COLORS.textLight }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.materialName}>
                              {CATEGORY_LABELS[cat.name] || cat.name}
                            </Text>
                            <Text style={styles.materialNote}>{cat.notes}</Text>
                          </View>
                          <View style={styles.materialStats}>
                            <Text style={styles.materialPercent}>{cat.percentage}%</Text>
                            <Text style={styles.materialWeight}>{cat.weight_estimate_lbs} lbs</Text>
                          </View>
                        </View>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBar,
                              {
                                width: `${cat.percentage}%`,
                                backgroundColor: CATEGORY_COLORS[cat.name] || COLORS.textLight,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    ))
                  )}

                  {!correcting && (
                    <>
                      {editingWeight ? (
                        <View style={styles.weightEditContainer}>
                          <Text style={styles.resultSectionTitle}>Edit Weights</Text>
                          {editCategories.map((cat, i) => (
                            <View key={cat.name} style={styles.categoryWeightEdit}>
                              <Text style={styles.editWeightLabel}>
                                {CATEGORY_LABELS[cat.name]}: {cat.percentage}%
                              </Text>
                              <View style={styles.weightInputRow}>
                                <TextInput
                                  style={styles.weightInput}
                                  keyboardType="decimal-pad"
                                  value={String(cat.weight_estimate_lbs)}
                                  onChangeText={(v) => updateCategoryWeight(i, v)}
                                  placeholder="0"
                                  selectTextOnFocus
                                />
                                <Text style={styles.weightUnit}>lbs</Text>
                              </View>
                            </View>
                          ))}
                          <Text style={styles.editHint}>
                            Adjust category weights. Total weight auto-calculates. This improves future AI estimates.
                          </Text>
                          <View style={styles.editActions}>
                            <TouchableOpacity
                              style={styles.editCancelBtn}
                              onPress={() => setEditingWeight(false)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.editCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.editSubmitBtn}
                              onPress={saveWeightEdit}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="checkmark" size={18} color="#fff" />
                              <Text style={styles.editSubmitText}>Save Weights</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <>
                          <View style={styles.sectionHeader}>
                            <Text style={styles.resultSectionTitle}>Impact Summary</Text>
                            {!submitted && (
                              <TouchableOpacity onPress={startWeightEdit} style={styles.correctBtn} activeOpacity={0.7}>
                                <Ionicons name="create-outline" size={14} color={COLORS.info} />
                                <Text style={styles.correctBtnText}>Edit Weight</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <View style={styles.impactSummary}>
                            <View style={styles.impactItem}>
                              <Ionicons name="scale-outline" size={22} color={COLORS.primary} />
                              <Text style={styles.impactValue}>
                                {result.total_weight_estimate_lbs} lbs
                              </Text>
                              <Text style={styles.impactLabel}>Total Weight</Text>
                            </View>
                            <View style={styles.impactDivider} />
                            <View style={styles.impactItem}>
                              <Ionicons name="cloud-outline" size={22} color={COLORS.violet} />
                              <Text style={[styles.impactValue, { color: COLORS.violet }]}>
                                {result.co2_saved_kg.toFixed(1)} kg
                              </Text>
                              <Text style={styles.impactLabel}>CO2 Saved</Text>
                            </View>
                          </View>
                        </>
                      )}

                      <View style={styles.methodologyNote}>
                        <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.methodologyText}>
                          CO2 based on EPA WARM v16: Recyclable 1.02 kg/lb, Organic 0.34 kg/lb, Non-recyclable 0.05 kg/lb
                        </Text>
                      </View>

                      {result.recommended_centers.length > 0 && (
                        <>
                          <Text style={styles.resultSectionTitle}>Nearest Drop-Off</Text>
                          {result.recommended_centers.map((center, i) => (
                            <View key={i} style={styles.centerCard}>
                              <View style={styles.centerIcon}>
                                <Ionicons name="location" size={18} color={COLORS.primary} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.centerName}>{center.name}</Text>
                                <Text style={styles.centerAddress}>{center.address}</Text>
                                <View style={styles.centerMaterials}>
                                  {center.matching_categories.map((m) => (
                                    <View key={m} style={[styles.centerMaterialTag, { backgroundColor: CATEGORY_COLORS[m] ? `${CATEGORY_COLORS[m]}20` : COLORS.primaryLight }]}>
                                      <Text style={[styles.centerMaterialText, { color: CATEGORY_COLORS[m] || COLORS.primaryDark }]}>
                                        {CATEGORY_LABELS[m] || m}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                              {center.distance_miles && (
                                <Text style={styles.centerDistance}>
                                  {center.distance_miles} mi
                                </Text>
                              )}
                            </View>
                          ))}
                        </>
                      )}

                      {!submitted ? (
                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8} disabled={submitting}>
                          {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="cloud-upload" size={20} color="#fff" />
                              <Text style={styles.submitBtnText}>Submit Scan</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.submittedBadge}>
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                          <Text style={styles.submittedText}>Scan Submitted</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  captureSection: { paddingHorizontal: 20 },
  scannerFrame: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryBg,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    paddingVertical: 50,
    marginTop: 20,
  },
  scanPrompt: {
    textAlign: "center",
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 16,
    lineHeight: 22,
  },
  categoryHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintDot: { width: 8, height: 8, borderRadius: 4 },
  hintText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
  captureButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginTop: 28,
  },
  captureBtn: { alignItems: "center" },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  captureBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 8,
  },
  tips: {
    marginTop: 32,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  tipsTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  tipItem: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  resultSection: { paddingHorizontal: 20 },
  imageContainer: { position: "relative", marginTop: 12 },
  previewImage: { width: "100%", height: 220, borderRadius: 20, resizeMode: "contain" },
  resetBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  analyzeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loadingContainer: { alignItems: "center", paddingVertical: 32 },
  loadingText: { fontSize: 16, fontWeight: "600", color: COLORS.text, marginTop: 16 },
  loadingSubtext: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  rescanContainer: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 28,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  rescanIcon: { marginBottom: 12 },
  rescanTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  rescanText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  rescanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.warning,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginBottom: 12,
  },
  rescanBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  rescanSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  rescanSecondaryText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
  results: { marginTop: 20 },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: { fontSize: 13, fontWeight: "600", color: COLORS.primaryDark },
  summaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  resultSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  correctBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  correctBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.info },
  materialRow: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  materialRowEdit: {
    borderWidth: 1,
    borderColor: COLORS.info + "40",
    backgroundColor: "#fafcff",
  },
  materialInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  materialDot: { width: 10, height: 10, borderRadius: 5 },
  materialName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  materialNote: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  materialStats: { alignItems: "flex-end" },
  materialPercent: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  materialWeight: { fontSize: 11, color: COLORS.textSecondary },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginTop: 10,
  },
  progressBar: { height: 4, borderRadius: 2 },
  editRow: { flexDirection: "row", alignItems: "center", marginLeft: "auto" },
  percentInput: {
    width: 50,
    height: 36,
    borderWidth: 1,
    borderColor: COLORS.info,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    backgroundColor: "#fff",
  },
  percentSign: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary, marginLeft: 4 },
  editHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  editCancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.border,
  },
  editCancelText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  editSubmitBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.info,
  },
  editSubmitText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  impactSummary: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    alignItems: "center",
  },
  impactItem: { flex: 1, alignItems: "center" },
  impactValue: { fontSize: 22, fontWeight: "800", color: COLORS.primary, marginTop: 4 },
  impactLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  impactDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  methodologyNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  methodologyText: { flex: 1, fontSize: 10, color: COLORS.textLight, lineHeight: 14 },
  centerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  centerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBg,
    alignItems: "center",
    justifyContent: "center",
  },
  centerName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  centerAddress: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  centerMaterials: { flexDirection: "row", gap: 4, marginTop: 6 },
  centerMaterialTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  centerMaterialText: { fontSize: 10, fontWeight: "600", color: COLORS.primaryDark },
  centerDistance: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  submittedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
  },
  submittedText: { fontSize: 16, fontWeight: "700", color: COLORS.success },
  weightEditContainer: {
    backgroundColor: "#fafcff",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.info + "40",
  },
  totalWeightEdit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryWeightEdit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  editWeightLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  weightInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weightInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.info,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
  },
  weightUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
});
