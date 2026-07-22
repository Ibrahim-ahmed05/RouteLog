import { useState } from "react";
import { motion } from "framer-motion";
import type { PlanTripResult } from "@/lib/planTrip";
import { RouteMap } from "./RouteMap";
import { LogSheet } from "./LogSheet";

export function Results({ data }: { data: PlanTripResult }) {
  const [activeDay, setActiveDay] = useState(0);
  const days = data.daily_logs.length;
  const stopsCount = data.route.stops.filter((s) => s.type === "rest" || s.type === "fuel").length;

  return (
    <motion.section
      id="results"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-6xl px-6 pb-24"
    >
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Trip plan
      </div>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your route.</h2>

      {/* Stat strip */}
      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-4">
        <Stat label="Distance" value={`${Math.round(data.route.distance_miles).toLocaleString()} mi`} />
        <Stat label="Drive time" value={`${data.route.duration_hours.toFixed(1)} hrs`} />
        <Stat label="Stops" value={String(stopsCount)} />
        <Stat label="Days" value={String(days)} />
      </div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-6"
      >
        <RouteMap route={data.route} />
      </motion.div>

      {/* Log sheets */}
      <div className="mt-14">
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-semibold tracking-tight">Daily logs</h3>
          <div className="hidden text-xs text-muted-foreground sm:block">
            FMCSA-style · auto-drawn
          </div>
        </div>

        <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1">
          {data.daily_logs.map((l, i) => (
            <button
              key={l.day}
              onClick={() => setActiveDay(i)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeDay === i
                  ? "bg-foreground text-background"
                  : "hairline text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              Day {l.day}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <LogSheet log={data.daily_logs[activeDay]} index={activeDay} />
        </div>
      </div>
    </motion.section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-5">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}
