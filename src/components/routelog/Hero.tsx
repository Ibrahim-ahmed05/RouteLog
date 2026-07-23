import { motion } from "framer-motion";
import { ArrowRight, Route, ClipboardCheck, ShieldCheck, Zap, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAuth } from "@/lib/auth";

export function Hero({ onStart }: { onStart: () => void }) {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden bg-background pt-10 pb-16 sm:pt-20 sm:pb-28">
      {/* Dynamic Background Ambient Glow Orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-accent/20 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -left-48 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top Floating Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-4 py-1.5 backdrop-blur-md"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            FMCSA 49 CFR § 395 Compliant
          </span>
          <Sparkles className="h-3.5 w-3.5 text-accent" />
        </motion.div>

        <div className="mt-6 grid items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)] lg:gap-4">
          <div>
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl font-extrabold tracking-[-0.03em] text-foreground"
          style={{ fontSize: "clamp(2.75rem, 6.5vw, 5.25rem)", lineHeight: 1.02 }}
        >
          Plan your trip.
          <br />
          Stay compliant.
          <span className="bg-gradient-to-r from-accent via-indigo-400 to-sky-400 bg-clip-text text-transparent">
            {" "}Automatically.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Enter your current location, pickup, and dropoff. RouteLog maps the shortest legal path,
          places mandatory rest and fuel stops, and draws FMCSA paper log grids — in seconds.
        </motion.p>

        {/* Call To Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          {user ? (
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] shadow-soft"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <button
              onClick={onStart}
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] shadow-soft"
            >
              Calculate Route & Logs
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}

          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-foreground hairline transition-colors hover:bg-secondary"
          >
            How it works
          </a>
        </motion.div>

        {/* Quick Feature Chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 70hr / 8-Day Cycle Rules
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant PDF Generation
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> OpenRouteService API
          </span>
        </motion.div>

          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-xl lg:max-w-none lg:scale-105"
          >
            <DotLottieReact
              src="https://lottie.host/1b1a62a1-e5fb-4d6f-940d-943e67b9613b/wSIbO4G81L.lottie"
              loop
              autoplay
              className="h-auto w-full"
              aria-label="Animated RouteLog illustration"
            />
          </motion.div>
        </div>

        {/* Animated Graphic Preview Box */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 overflow-hidden rounded-3xl bg-card hairline shadow-lift"
        >
          <RouteLineGraphic />
        </motion.div>
      </div>

      {/* Feature Highlight Cards */}
      <div id="features" className="mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 sm:pt-24">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Built for Property-Carrying Drivers
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need for HOS compliance
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
          {[
            {
              icon: Route,
              title: "Route Optimization",
              body: "OpenRouteService driving routes with accurate mileage, duration, and geometry coordinates.",
            },
            {
              icon: ClipboardCheck,
              title: "Auto-Drawn Daily Logs",
              body: "ReportLab & Pillow draw clean FMCSA 24-hour log grids with duty status breakdown.",
            },
            {
              icon: ShieldCheck,
              title: "FMCSA Rule Validation",
              body: "11-hr driving limit, 14-hr duty window, 30-min break after 8 hrs, 10-hr off-duty resets.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-2xl bg-card p-7 hairline transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-background">
                <f.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RouteLineGraphic() {
  return (
    <div className="relative p-4 sm:p-6">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 font-mono">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Chicago, IL → Dallas, TX</span>
        </div>
        <span className="font-semibold text-foreground">920.5 Miles | 2 Daily Logs</span>
      </div>

      <svg
        viewBox="0 0 1200 300"
        className="h-auto w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rl-fade" x1="0" x2="1">
            <stop offset="0" stopColor="var(--foreground)" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="var(--accent)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--foreground)" stopOpacity="0.9" />
          </linearGradient>
          <pattern id="rl-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--hairline)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width="1200" height="300" fill="url(#rl-grid)" />

        <motion.path
          d="M 60 220 C 240 220, 280 70, 480 90 S 780 240, 960 160 S 1080 70, 1140 90"
          fill="none"
          stroke="url(#rl-fade)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1600"
          initial={{ strokeDashoffset: 1600 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 2.2, ease: "easeInOut", delay: 0.4 }}
        />

        {[
          { x: 60, y: 220, label: "Start (Chicago)" },
          { x: 480, y: 90, label: "Pickup (St. Louis)" },
          { x: 720, y: 190, label: "Fuel Stop" },
          { x: 960, y: 160, label: "Overnight Rest" },
          { x: 1140, y: 90, label: "Dropoff (Dallas)" },
        ].map((p, i) => (
          <motion.g
            key={p.label}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 + i * 0.25 }}
          >
            <circle cx={p.x} cy={p.y} r="8" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2.5" />
            <circle cx={p.x} cy={p.y} r="3" fill="var(--accent)" />
            <text
              x={p.x}
              y={p.y + 24}
              textAnchor="middle"
              fill="var(--muted-foreground)"
              fontSize="12"
              fontFamily="Inter"
              fontWeight="500"
            >
              {p.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
