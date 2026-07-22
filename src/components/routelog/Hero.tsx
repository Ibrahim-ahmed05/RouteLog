import { motion } from "framer-motion";
import { ArrowRight, Route, ClipboardCheck, ShieldCheck } from "lucide-react";

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          RouteLog · v1
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-4xl font-semibold tracking-[-0.03em] text-foreground"
          style={{ fontSize: "clamp(2.5rem, 6.5vw, 4.75rem)", lineHeight: 1.02 }}
        >
          Plan your route.
          <br />
          Stay compliant.
          <span className="text-muted-foreground"> Automatically.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Enter your trip. We map the route, schedule rest and fuel stops, and draw
          FMCSA-ready daily logs — in seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <button
            onClick={onStart}
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
          >
            Plan a trip
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-foreground hairline transition-colors hover:bg-secondary"
          >
            How it works
          </a>
        </motion.div>

        {/* Animated route-line graphic */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-20 rounded-3xl bg-card hairline shadow-soft"
        >
          <RouteLine />
        </motion.div>
      </div>

      <div id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Route,
              title: "Route optimization",
              body: "The shortest legal path with fuel stops planned in.",
            },
            {
              icon: ClipboardCheck,
              title: "Auto-drawn logs",
              body: "One log per day, drawn exactly like the FMCSA grid.",
            },
            {
              icon: ShieldCheck,
              title: "HOS compliance",
              body: "11-hour driving, 14-hour window, 30-min break — handled.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl bg-card p-6 hairline"
            >
              <f.icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
              <h3 className="mt-4 text-base font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RouteLine() {
  return (
    <svg
      viewBox="0 0 1200 320"
      className="h-auto w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rl-fade" x1="0" x2="1">
          <stop offset="0" stopColor="var(--foreground)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="1" />
        </linearGradient>
        <pattern id="rl-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--hairline)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="1200" height="320" fill="url(#rl-grid)" />
      <motion.path
        d="M 60 240 C 220 240, 260 80, 440 100 S 720 260, 900 180 S 1080 80, 1140 100"
        fill="none"
        stroke="url(#rl-fade)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1600"
        initial={{ strokeDashoffset: 1600 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 2.2, ease: "easeInOut", delay: 0.4 }}
      />
      {[
        { x: 60, y: 240, label: "Start" },
        { x: 440, y: 100, label: "Pickup" },
        { x: 900, y: 180, label: "Rest" },
        { x: 1140, y: 100, label: "Dropoff" },
      ].map((p, i) => (
        <motion.g
          key={p.label}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.9 + i * 0.35 }}
        >
          <circle cx={p.x} cy={p.y} r="7" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2" />
          <circle cx={p.x} cy={p.y} r="2.5" fill="var(--accent)" />
        </motion.g>
      ))}
    </svg>
  );
}
