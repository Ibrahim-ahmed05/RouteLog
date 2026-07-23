import { useEffect, useRef } from "react";
import type { RoutePayload, Stop } from "@/lib/planTrip";

export function RouteMap({ route }: { route: RoutePayload }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
      }

      const map = L.map(ref.current, {
        zoomControl: false,
        attributionControl: false,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
        { maxZoom: 19 },
      ).addTo(map);

      const line = L.polyline(route.geometry as [number, number][], {
        color: "#0A0A0B",
        weight: 3.5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      route.stops.forEach((s) => {
        const marker = L.marker([s.lat, s.lng], { icon: stopIcon(L, s) }).addTo(map);
        marker.bindTooltip(labelFor(s), { direction: "top", offset: [0, -12] });
      });

      map.fitBounds(line.getBounds(), { padding: [40, 40] });
      L.control.zoom({ position: "bottomright" }).addTo(map);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [route]);

  return (
    <div
      ref={ref}
      className="h-[300px] w-full overflow-hidden rounded-2xl hairline sm:h-[380px] lg:h-[440px]"
      style={{ background: "var(--muted)" }}
    />
  );
}

function labelFor(s: Stop) {
  const map: Record<string, string> = {
    start: "Start",
    pickup: "Pickup",
    dropoff: "Dropoff",
    rest: "Rest stop",
    fuel: "Fuel stop",
  };
  return `${map[s.type] ?? s.type} — ${s.location}`;
}

function stopIcon(L: any, s: Stop) {
  const colors: Record<string, string> = {
    start: "#0A0A0B",
    pickup: "#3B5BFF",
    dropoff: "#0A0A0B",
    rest: "#94a3b8",
    fuel: "#f59e0b",
  };
  const fill = colors[s.type] ?? "#0A0A0B";
  const size = s.type === "start" || s.type === "pickup" || s.type === "dropoff" ? 22 : 16;
  const inner = size - 8;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#fff;border:2px solid ${fill};display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,0.12)"><div style="width:${inner}px;height:${inner}px;border-radius:50%;background:${fill}"></div></div>`,
  });
}
