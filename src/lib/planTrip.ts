// Trip planning API client with a self-contained fallback.
// If VITE_API_URL is set, POST to `${VITE_API_URL}/api/plan-trip/`.
// Otherwise, geocode with Nominatim + route with OSRM (both free, no key)
// and compute HOS-compliant logs client-side.

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
  route: RoutePayload;
  daily_logs: DailyLog[];
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

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
  if (!res.ok) throw new Error("Routing failed");
  const data = await res.json();
  const r = data.routes?.[0];
  if (!r) throw new Error("No route found");
  return {
    distance_m: r.distance as number,
    duration_s: r.duration as number,
    geometry: (r.geometry.coordinates as [number, number][]).map(
      ([lng, lat]) => [lat, lng] as [number, number],
    ),
  };
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

// Build HOS-compliant daily logs from total drive hours + cycle used.
// FMCSA property-carrying rules (simplified):
// - 11 hrs driving per day
// - 14 hrs on-duty window
// - 30-min break after 8 hrs driving
// - 10 hrs off duty between shifts
// - 70 hrs / 8 days cycle
// - 1 hr on-duty for pickup, 1 hr on-duty for dropoff
// - 30 min fuel stop every ~1000 miles
function buildLogs(driveHours: number, distanceMiles: number, cycleUsed: number): DailyLog[] {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const fuelStops = Math.max(0, Math.floor(distanceMiles / 1000));
  // Total on-duty work = drive + 1 pickup + 1 dropoff + 0.5 per fuel
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
    // Shift starts at 06:00
    let cursor = 6 * 60;
    const shiftStart = cursor;

    // Sleeper berth before the shift: 00:00 -> 06:00 = off_duty for day 1, sleeper_berth after
    if (day === 0) {
      segments.push({ status: "off_duty", start: "00:00", end: fmtHM(shiftStart) });
    } else {
      segments.push({ status: "sleeper_berth", start: "00:00", end: fmtHM(shiftStart) });
    }

    // Pickup (day 1 only, first thing)
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

    // Driving loop with mandatory 30-min break after 8 hrs driving
    while (
      driveToday < maxDriveToday &&
      cursor < shiftEndCap &&
      driveRemaining > 0
    ) {
      // Insert 30-min break if approaching 8h continuous drive
      if (driveSinceBreak >= 8 * 60) {
        const breakEnd = Math.min(cursor + 30, shiftEndCap);
        segments.push({ status: "off_duty", start: fmtHM(cursor), end: fmtHM(breakEnd) });
        cursor = breakEnd;
        driveSinceBreak = 0;
        if (cursor >= shiftEndCap) break;
      }

      const chunk = Math.min(
        4 * 60, // drive in 4h chunks so we can interleave a fuel stop
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

      // Fuel stop if remaining
      if (onDutyExtraRemaining >= 30 && driveRemaining > 0 && cursor + 30 <= shiftEndCap) {
        // reserve fuel time only if we have fuel stops beyond pickup/dropoff
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

    // Dropoff (last day only, when drive is exhausted)
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

    // Rest of day: sleeper berth
    if (cursor < 24 * 60) {
      segments.push({ status: "sleeper_berth", start: fmtHM(cursor), end: "24:00" });
    }

    // Totals
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
    if (day > 14) break; // safety
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

  // Rest stops at the end of each day (except last)
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

  // Fuel stops every ~1000 miles
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
  if (API_URL) {
    const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/plan-trip/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return (await res.json()) as PlanTripResult;
  }

  // Client-side fallback
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
  // Add starting point as first stop
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
