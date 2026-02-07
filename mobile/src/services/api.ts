import { API_BASE_URL } from "../constants/theme";

interface ScanResult {
  categories: Array<{
    name: string;
    percentage: number;
    weight_estimate_lbs: number;
    co2_saved_kg: number;
    notes?: string;
  }>;
  total_weight_estimate_lbs: number;
  co2_saved_kg: number;
  recommended_centers: Array<{
    id: string;
    name: string;
    city: string;
    address: string;
    phone: string;
    matching_categories: string[];
    distance_miles?: number;
  }>;
  classification_confidence: number;
  timestamp: string;
  summary: string;
}

export async function scanWaste(
  imageUri: string,
  latitude?: number,
  longitude?: number
): Promise<ScanResult> {
  const formData = new FormData();

  const filename = imageUri.split("/").pop() || "scan.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("image", {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  let url = `${API_BASE_URL}/api/scan`;
  const params = new URLSearchParams();
  if (latitude) params.append("latitude", latitude.toString());
  if (longitude) params.append("longitude", longitude.toString());
  if (params.toString()) url += `?${params.toString()}`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (!response.ok) {
    throw new Error(`Scan failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getRecyclingCenters(category?: string, city?: string) {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (city) params.append("city", city);

  const url = `${API_BASE_URL}/api/centers?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch centers");
  }

  return response.json();
}
