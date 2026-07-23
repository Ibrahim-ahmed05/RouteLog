import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, MapPin, Package, Flag, Loader2 } from "lucide-react";
import type { PlanTripInput } from "@/lib/planTrip";
import { LocationInput } from "./LocationInput";

interface Props {
  onSubmit: (input: PlanTripInput) => void;
  loading: boolean;
  error: string | null;
}

export function TripForm({ onSubmit, loading, error }: Props) {
  const [current, setCurrent] = useState("Chicago, IL");
  const [pickup, setPickup] = useState("St. Louis, MO");
  const [dropoff, setDropoff] = useState("Dallas, TX");
  const [cycle, setCycle] = useState(12);
  const [touched, setTouched] = useState(false);

  const missing = !current.trim() || !pickup.trim() || !dropoff.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (missing) return;
    onSubmit({
      current_location: current,
      pickup_location: pickup,
      dropoff_location: dropoff,
      current_cycle_used: cycle,
    });
  }

  return (
    <section id="plan" className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55 }}
        className="text-center"
      >
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Trip planner
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Where are you headed?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Type to search locations with instant autocomplete suggestions.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="mt-8 rounded-3xl bg-card p-5 shadow-soft hairline sm:mt-10 sm:p-8"
      >
        <div className="grid gap-5">
          <LocationInput
            label="Current location"
            icon={MapPin}
            value={current}
            onChange={setCurrent}
            placeholder="Search city, e.g. Chicago, IL"
            invalid={touched && !current.trim()}
          />
          <LocationInput
            label="Pickup location"
            icon={Package}
            value={pickup}
            onChange={setPickup}
            placeholder="Search pickup city, e.g. St. Louis, MO"
            invalid={touched && !pickup.trim()}
          />
          <LocationInput
            label="Dropoff location"
            icon={Flag}
            value={dropoff}
            onChange={setDropoff}
            placeholder="Search destination city, e.g. Dallas, TX"
            invalid={touched && !dropoff.trim()}
          />

          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium text-foreground">
                Current cycle used
              </label>
              <span className="text-sm tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{cycle}</span> / 70 hrs
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={70}
              step={0.5}
              value={cycle}
              onChange={(e) => setCycle(parseFloat(e.target.value))}
              className="mt-3 w-full accent-[color:var(--accent)]"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">We couldn’t calculate this route</p>
              <p className="mt-1 leading-relaxed text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-4 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 shadow-soft"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculating route & daily logs…
            </>
          ) : (
            "Calculate route & logs"
          )}
        </button>
      </motion.form>
    </section>
  );
}
