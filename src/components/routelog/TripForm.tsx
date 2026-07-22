import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, MapPin, Package, Flag, Loader2 } from "lucide-react";
import type { PlanTripInput } from "@/lib/planTrip";

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
    <section id="plan" className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
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
          Enter your trip. We'll handle the rest stops.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="mt-10 rounded-3xl bg-card p-6 shadow-soft hairline sm:p-8"
      >
        <div className="grid gap-5">
          <Field
            label="Current location"
            icon={MapPin}
            value={current}
            onChange={setCurrent}
            placeholder="City, State"
            invalid={touched && !current.trim()}
          />
          <Field
            label="Pickup location"
            icon={Package}
            value={pickup}
            onChange={setPickup}
            placeholder="City, State"
            invalid={touched && !pickup.trim()}
          />
          <Field
            label="Dropoff location"
            icon={Flag}
            value={dropoff}
            onChange={setDropoff}
            placeholder="City, State"
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
          <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-destructive/8 p-3.5 text-sm text-destructive hairline">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-4 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculating…
            </>
          ) : (
            "Calculate route & logs"
          )}
        </button>
      </motion.form>
    </section>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div
        className={`mt-2 flex items-center gap-2.5 rounded-xl bg-background px-3.5 py-3 transition-all duration-200 ${
          invalid
            ? "shadow-[0_0_0_1px_var(--destructive)]"
            : "hairline focus-within:shadow-[0_0_0_1.5px_var(--ring)]"
        }`}
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </label>
  );
}
