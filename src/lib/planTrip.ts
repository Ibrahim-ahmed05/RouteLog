// Trip planning API client with self-contained client-side fallback.
// If backend is running or user is authenticated, calls Django POST /api/trips/create/
// Otherwise, geocodes with Nominatim + routes with OSRM and computes HOS client-side.

import { supabase } from "./supabase";

export type StopType = "start" | "pickup" | "rest" | "fuel" | "dropoff";

export interface Stop {
  type: StopType;
  location: string;
  lat: number;
  lng: number;
  eta?: string;
  duration_hrs?: number;
}

export interface RoutePayload {
  distance_miles: number;
  duration_hours: number;
  geometry: [number, number][]; // [lat, lng]
  stops: Stop[];
}

export type DutyStatus =
  | "off_duty"
  | "sleeper_berth"
  | "driving"
  | "on_duty_not_driving";

export interface LogSegment {
  status: DutyStatus;
  start: string; // "HH:MM"
  end: string;
}

export interface DailyLog {
  day: number;
  date: string;
  segments: LogSegment[];
  totals: Record<DutyStatus, number>;
}

export interface PlanTripInput {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
}

export interface PlanTripResult {
  trip_id?: string;
  route: RoutePayload;
  daily_logs: DailyLog[];
}

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

const API_BASE_URL = getApiBaseUrl();
const NORMALIZED_API_BASE_URL = API_BASE_URL.replace(/\/$/, "");

async function geocode(q: string): Promise<{ lat: number; lng: number; label: string }> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Geocode failed for "${q}"`);
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data.length) throw new Error(`No match for "${q}"`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
}

async function osrmRoute(points: { lat: number; lng: number }[]) {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.code === "NoRoute") throw new Error("No drivable route found");
  const r = data.routes?.[0];
  if (!r) throw new Error("No drivable route found");
  return {
    distance_m: r.distance as number,
    duration_s: r.duration as number,
    geometry: (r.geometry.coordinates as [number, number][]).map(
      ([lng, lat]) => [lat, lng] as [number, number],
    ),
  };
}

export function getTripPlanningErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (/no drivable route|noroute|routing failed|no route found/i.test(message)) {
    return "We couldn’t find a continuous road route between these locations. Choose places connected by road; trips across oceans require separate transport.";
  }

  const noMatch = message.match(/No match for "(.+)"/i);
  if (noMatch) {
    return `We couldn’t find “${noMatch[1]}”. Check the spelling and include the city and country.`;
  }

  if (/geocode failed|failed to fetch|network/i.test(message)) {
    return "We couldn’t verify one or more locations right now. Check your connection and try again.";
  }

  return "We couldn’t calculate this route right now. Please review the locations and try again.";
}

function fmtHM(totalMin: number): string {
  const m = ((Math.round(totalMin) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function addISODays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildLogs(driveHours: number, distanceMiles: number, cycleUsed: number): DailyLog[] {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const fuelStops = Math.max(0, Math.floor(distanceMiles / 1000));
  const totalDriveMin = driveHours * 60;
  const totalOnDutyExtraMin = 60 + 60 + fuelStops * 30;

  const logs: DailyLog[] = [];
  let day = 0;
  let driveRemaining = totalDriveMin;
  let onDutyExtraRemaining = totalOnDutyExtraMin;
  let cycleRemaining = Math.max(0, 70 * 60 - cycleUsed * 60);
  let pickupDone = false;

  while (driveRemaining > 0 || onDutyExtraRemaining > 0) {
    const segments: LogSegment[] = [];
    let cursor = 6 * 60;
    const shiftStart = cursor;

    if (day === 0) {
      segments.push({ status: "off_duty", start: "00:00", end: fmtHM(shiftStart) });
    } else {
      segments.push({ status: "sleeper_berth", start: "00:00", end: fmtHM(shiftStart) });
    }

    if (!pickupDone && onDutyExtraRemaining >= 60) {
      segments.push({
        status: "on_duty_not_driving",
        start: fmtHM(cursor),
        end: fmtHM(cursor + 60),
      });
      cursor += 60;
      onDutyExtraRemaining -= 60;
      cycleRemaining -= 60;
      pickupDone = true;
    }

    let driveToday = 0;
    let driveSinceBreak = 0;
    const maxDriveToday = Math.min(11 * 60, driveRemaining, cycleRemaining);
    const shiftEndCap = shiftStart + 14 * 60;

    while (
      driveToday < maxDriveToday &&
      cursor < shiftEndCap &&
      driveRemaining > 0
    ) {
      if (driveSinceBreak >= 8 * 60) {
        const breakEnd = Math.min(cursor + 30, shiftEndCap);
        segments.push({ status: "off_duty", start: fmtHM(cursor), end: fmtHM(breakEnd) });
        cursor = breakEnd;
        driveSinceBreak = 0;
        if (cursor >= shiftEndCap) break;
      }

      const chunk = Math.min(
        4 * 60,
        maxDriveToday - driveToday,
        shiftEndCap - cursor,
        driveRemaining,
        8 * 60 - driveSinceBreak,
      );
      if (chunk <= 0) break;
      segments.push({ status: "driving", start: fmtHM(cursor), end: fmtHM(cursor + chunk) });
      cursor += chunk;
      driveToday += chunk;
      driveSinceBreak += chunk;
      driveRemaining -= chunk;
      cycleRemaining -= chunk;

      if (onDutyExtraRemaining >= 30 && driveRemaining > 0 && cursor + 30 <= shiftEndCap) {
        if (onDutyExtraRemaining > 60) {
          segments.push({
            status: "on_duty_not_driving",
            start: fmtHM(cursor),
            end: fmtHM(cursor + 30),
          });
          cursor += 30;
          onDutyExtraRemaining -= 30;
          cycleRemaining -= 30;
        }
      }
    }

    if (driveRemaining <= 0 && onDutyExtraRemaining >= 60 && cursor + 60 <= shiftEndCap) {
      segments.push({
        status: "on_duty_not_driving",
        start: fmtHM(cursor),
        end: fmtHM(cursor + 60),
      });
      cursor += 60;
      onDutyExtraRemaining -= 60;
      cycleRemaining -= 60;
    }

    if (cursor < 24 * 60) {
      segments.push({ status: "sleeper_berth", start: fmtHM(cursor), end: "24:00" });
    }

    const totals: Record<DutyStatus, number> = {
      off_duty: 0,
      sleeper_berth: 0,
      driving: 0,
      on_duty_not_driving: 0,
    };
    for (const s of segments) {
      const [sh, sm] = s.start.split(":").map(Number);
      const endStr = s.end === "24:00" ? "24:00" : s.end;
      const [eh, em] = endStr.split(":").map(Number);
      const mins = eh * 60 + em - (sh * 60 + sm);
      totals[s.status] += mins / 60;
    }

    logs.push({
      day: day + 1,
      date: addISODays(startDate, day),
      segments,
      totals: {
        off_duty: +totals.off_duty.toFixed(2),
        sleeper_berth: +totals.sleeper_berth.toFixed(2),
        driving: +totals.driving.toFixed(2),
        on_duty_not_driving: +totals.on_duty_not_driving.toFixed(2),
      },
    });

    day++;
    if (day > 14) break;
  }

  return logs;
}

function distributeStops(
  route: { geometry: [number, number][]; distance_m: number },
  logs: DailyLog[],
  pickup: { lat: number; lng: number; label: string },
  dropoff: { lat: number; lng: number; label: string },
): Stop[] {
  const stops: Stop[] = [];
  const geo = route.geometry;
  const totalMiles = route.distance_m / 1609.34;

  stops.push({
    type: "pickup",
    location: pickup.label.split(",")[0],
    lat: pickup.lat,
    lng: pickup.lng,
    eta: `Day 1 · 07:00`,
  });

  for (let i = 0; i < logs.length - 1; i++) {
    const frac = (i + 1) / logs.length;
    const idx = Math.min(geo.length - 1, Math.floor(geo.length * frac));
    const [lat, lng] = geo[idx];
    stops.push({
      type: "rest",
      location: `Overnight rest`,
      lat,
      lng,
      duration_hrs: 10,
    });
  }

  const fuelCount = Math.max(0, Math.floor(totalMiles / 1000));
  for (let i = 1; i <= fuelCount; i++) {
    const frac = i / (fuelCount + 1);
    const idx = Math.min(geo.length - 1, Math.floor(geo.length * frac));
    const [lat, lng] = geo[idx];
    stops.push({ type: "fuel", location: `Fuel stop`, lat, lng });
  }

  stops.push({
    type: "dropoff",
    location: dropoff.label.split(",")[0],
    lat: dropoff.lat,
    lng: dropoff.lng,
    eta: `Day ${logs.length}`,
  });

  return stops;
}

export async function planTrip(input: PlanTripInput): Promise<PlanTripResult> {
  // Try Django backend API first
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    if (session?.user?.id) {
      headers["X-Supabase-Uid"] = session.user.id;
    }
    if (session?.user?.email) {
      headers["X-Supabase-Email"] = session.user.email;
    }

    const res = await fetch(`${NORMALIZED_API_BASE_URL}/trips/create/`, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });

    if (res.ok) {
      return (await res.json()) as PlanTripResult;
    } else {
      const errText = await res.text();
      console.error(`Django API error (${res.status}):`, errText);
      if (session?.access_token) {
        throw new Error(`Server returned status ${res.status}: ${errText}`);
      }
    }
  } catch (e: any) {
    if (e.message && e.message.includes("Server returned")) {
      throw e;
    }
    console.warn("Backend API unavailable, falling back to client-side planning", e);
  }

  // Client-side fallback for unauthenticated users when backend is offline
  const [cur, pu, doff] = await Promise.all([
    geocode(input.current_location),
    geocode(input.pickup_location),
    geocode(input.dropoff_location),
  ]);
  const r = await osrmRoute([cur, pu, doff]);
  const distanceMiles = r.distance_m / 1609.34;
  const driveHours = r.duration_s / 3600;
  const logs = buildLogs(driveHours, distanceMiles, input.current_cycle_used);
  const stops = distributeStops(r, logs, pu, doff);

  stops.unshift({
    type: "start",
    location: cur.label.split(",")[0],
    lat: cur.lat,
    lng: cur.lng,
    eta: "Day 1 · 06:00",
  });

  return {
    route: {
      distance_miles: +distanceMiles.toFixed(1),
      duration_hours: +driveHours.toFixed(2),
      geometry: r.geometry,
      stops,
    },
    daily_logs: logs,
  };
}
