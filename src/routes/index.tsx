import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Hero } from "@/components/routelog/Hero";
import { TripForm } from "@/components/routelog/TripForm";
import { Results } from "@/components/routelog/Results";
import { LoadingState } from "@/components/routelog/LoadingState";
import { planTrip, type PlanTripInput, type PlanTripResult } from "@/lib/planTrip";

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
      setError(
        e instanceof Error
          ? `${e.message}. Try full city names, e.g. "Chicago, IL".`
          : "Something went wrong.",
      );
    } finally {
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

      <Footer />
    </main>
  );
}

function Nav({ onStart }: { onStart: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent backdrop-blur-md" style={{ background: "color-mix(in oklab, var(--background) 78%, transparent)" }}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-foreground">
            <span className="block h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <span className="text-sm font-semibold tracking-tight">RouteLog</span>
        </a>
        <nav className="flex items-center gap-1">
          <a href="#features" className="hidden rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block">Features</a>
          <button
            onClick={onStart}
            className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            Plan a trip
          </button>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded bg-foreground">
            <span className="block h-1 w-1 rounded-full bg-accent" />
          </span>
          <span>RouteLog · Built for drivers.</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
