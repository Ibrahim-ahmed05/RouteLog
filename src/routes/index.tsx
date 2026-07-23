import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Download,
  FileCheck,
  Zap,
  CheckCircle,
  Truck,
  ArrowRight,
  UserCheck,
  Shield,
} from "lucide-react";
import { Hero } from "@/components/routelog/Hero";
import { TripForm } from "@/components/routelog/TripForm";
import { Results } from "@/components/routelog/Results";
import { LoadingState } from "@/components/routelog/LoadingState";
import { getTripPlanningErrorMessage, planTrip, type PlanTripInput, type PlanTripResult } from "@/lib/planTrip";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RouteLog — Plan Your Route. Stay Compliant." },
      {
        name: "description",
        content:
          "Plan compliant trucking trips and auto-generate FMCSA-ready daily log sheets. Route optimization, rest & fuel stops, HOS compliance.",
      },
      { property: "og:title", content: "RouteLog — Plan Your Route. Stay Compliant." },
      {
        property: "og:description",
        content:
          "Plan compliant trucking trips and auto-generate FMCSA-ready daily log sheets. Route optimization, rest & fuel stops, HOS compliance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [data, setData] = useState<PlanTripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const planRef = useRef<HTMLDivElement>(null);

  async function handlePlan(input: PlanTripInput) {
    const loadingStartedAt = Date.now();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await planTrip(input);
      setData(result);
      requestAnimationFrame(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (e) {
      setError(getTripPlanningErrorMessage(e));
    } finally {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, 1800 - (Date.now() - loadingStartedAt))),
      );
      setLoading(false);
    }
  }

  function scrollToPlan() {
    planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <Nav onStart={scrollToPlan} />
      <Hero onStart={scrollToPlan} />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Interactive Trip Planner Form */}
      <div ref={planRef}>
        <TripForm onSubmit={handlePlan} loading={loading} error={error} />
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingState />
          </motion.div>
        )}
        {data && !loading && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Results data={data} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Benefits & Social Proof */}
      <BenefitsSection />

      {/* CTA Banner */}
      <CtaBanner onStart={scrollToPlan} />

      <Footer />
    </main>
  );
}

function Nav({ onStart }: { onStart: () => void }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-transparent backdrop-blur-md" style={{ background: "color-mix(in oklab, var(--background) 82%, transparent)" }}>
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo (2).png" alt="RouteLog Logo" className="h-9 w-auto object-contain sm:h-10" />
          <span className="hidden text-lg font-bold tracking-tight min-[390px]:inline">RouteLog</span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <a href="#how-it-works" className="hidden rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-block">
            How it works
          </a>
          <a href="#features" className="hidden rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-block">
            Features
          </a>

          {user ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/login"
                className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-foreground hairline transition-colors hover:bg-secondary min-[470px]:inline-flex"
              >
                Sign In
              </Link>
              <button
                onClick={onStart}
                className="rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-transform hover:scale-[1.02] sm:px-5"
              >
                Plan Trip
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: MapPin,
      title: "Input Trip Locations",
      desc: "Enter your starting location, pickup location, dropoff destination, and current 70-hour cycle used.",
    },
    {
      num: "02",
      icon: Zap,
      title: "Engine Calculates HOS",
      desc: "OpenRouteService routes the miles while our Django engine calculates mandatory 30-min breaks, fuel stops, and sleeper berth periods.",
    },
    {
      num: "03",
      icon: Download,
      title: "Generate PDF Logs",
      desc: "View auto-drawn daily grid sheets and download report-ready FMCSA PDF log sheets instantly.",
    },
  ];

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Simple 3-Step Process
        </span>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          How RouteLog keeps you compliant
        </h2>
      </div>

      <div className="mt-10 grid gap-5 sm:gap-6 md:mt-14 md:grid-cols-3 md:gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="relative rounded-3xl bg-card p-6 hairline shadow-soft sm:p-8"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-accent">{step.num}</span>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-foreground">
                <step.icon className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-6 text-lg font-bold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="mx-auto max-w-6xl border-t border-border px-4 py-14 sm:px-6 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            FMCSA Rulebook Engine
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Never worry about HOS log violations again.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Our Python backend handles every detail of the property-carrying driver rulebook:
          </p>

          <div className="mt-8 space-y-4">
            {[
              "11-Hour Driving Limit enforcement",
              "14-Hour On-Duty Window calculation",
              "Mandatory 30-Minute Break after 8 hours of driving",
              "10-Hour Off-Duty Reset scheduling",
              "Fuel stops scheduled every 1,000 miles (30 min)",
              "Pickup & Dropoff 1-hour on-duty allocations",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 hairline shadow-lift sm:p-8">
          <div className="flex items-center gap-3 border-b border-border pb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-background">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Driver Daily Log Grid</h4>
              <p className="text-xs text-muted-foreground">ReportLab PDF & Pillow Canvas Rendering</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Duty Status</span>
              <span>Total Hours</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between rounded-lg bg-secondary p-2.5">
                <span>1. OFF DUTY</span>
                <span className="font-bold">6.00 hrs</span>
              </div>
              <div className="flex justify-between rounded-lg bg-secondary p-2.5">
                <span>2. SLEEPER BERTH</span>
                <span className="font-bold">10.00 hrs</span>
              </div>
              <div className="flex justify-between rounded-lg bg-secondary p-2.5">
                <span>3. DRIVING</span>
                <span className="font-bold font-semibold text-accent">6.00 hrs</span>
              </div>
              <div className="flex justify-between rounded-lg bg-secondary p-2.5">
                <span>4. ON DUTY (NOT DRIVING)</span>
                <span className="font-bold">2.00 hrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaBanner({ onStart }: { onStart: () => void }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-foreground px-5 py-12 text-center text-background sm:px-16 sm:py-16">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/30 blur-[80px]" />
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ready to plan your compliant route?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-background/80 sm:text-base">
          Get started in seconds. No credit card required. Auto-calculate rest stops and print FMCSA logs.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 text-sm font-bold text-foreground transition-transform hover:scale-[1.02]"
          >
            Start Planning Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <img src="/logo (2).png" alt="RouteLog Logo" className="h-6 w-auto object-contain" />
          <span className="font-semibold text-foreground">RouteLog</span>
          <span>· Built for property-carrying truck drivers.</span>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <span>FMCSA § 395</span>
          <span>Django DRF + Supabase</span>
          <span>OpenRouteService</span>
        </div>
      </div>
    </footer>
  );
}
