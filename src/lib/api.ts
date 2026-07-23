import { supabase } from "./supabase";

function getApiBaseUrl(): string {
  const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8000/api";
    }

    return `${window.location.origin}/api`;
  }

  return "http://localhost:8000/api";
}

function normalizeApiBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

const API_BASE_URL = getApiBaseUrl();
const NORMALIZED_API_BASE_URL = normalizeApiBaseUrl(API_BASE_URL);

async function getAuthHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const user = data.session?.user;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (user?.id) {
    headers["X-Supabase-Uid"] = user.id;
  }

  if (user?.email) {
    headers["X-Supabase-Email"] = user.email;
  }

  return headers;
}

export interface TripHistoryItem {
  id: string;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  total_distance_miles: number;
  total_duration_hours: number;
  status: string;
  created_at: string;
}

export async function fetchTripHistory(): Promise<TripHistoryItem[]> {
  const headers = await getAuthHeader();
  const res = await fetch(`${NORMALIZED_API_BASE_URL}/trips/history/`, {
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to load history (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.results)) {
    return data.results;
  }
  if (Array.isArray(data?.items)) {
    return data.items;
  }
  return [];
}

export async function fetchTripDetails(tripId: string) {
  const headers = await getAuthHeader();
  const res = await fetch(`${NORMALIZED_API_BASE_URL}/trips/${tripId}/`, {
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to load trip (${res.status})`);
  }

  return res.json();
}

export async function fetchUserProfile() {
  const headers = await getAuthHeader();
  const res = await fetch(`${NORMALIZED_API_BASE_URL}/auth/profile/`, {
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to load profile (${res.status})`);
  }

  return res.json();
}

export async function updateUserProfile(profileData: Record<string, any>) {
  const headers = await getAuthHeader();
  const res = await fetch(`${NORMALIZED_API_BASE_URL}/auth/profile/`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(profileData),
  });

  if (!res.ok) {
    throw new Error(`Failed to update profile (${res.status})`);
  }

  return res.json();
}

export function getPdfDownloadUrl(tripId: string): string {
  return `${NORMALIZED_API_BASE_URL}/logs/pdf/${tripId}/`;
}
