import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  LogOut,
  Plus,
  Route as RouteIcon,
  User as UserIcon,
  Download,
  Calendar,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchTripHistory, getPdfDownloadUrl, type TripHistoryItem } from "@/lib/api";
import { TripForm } from "@/components/routelog/TripForm";
import { Results } from "@/components/routelog/Results";
import { LoadingState } from "@/components/routelog/LoadingState";
import { getTripPlanningErrorMessage, planTrip, type PlanTripInput, type PlanTripResult } from "@/lib/planTrip";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<"planner" | "history">("planner");
  const [history, setHistory] = useState<TripHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [planResult, setPlanResult] = useState<PlanTripResult | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  async function loadHistory() {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const items = await fetchTripHistory();
      setHistory(items);
    } catch (e: any) {
      console.warn("Failed to load history:", e.message);
      setHistoryError(e.message || "Unable to load trip history.");
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handlePlanTrip(input: PlanTripInput) {
    const loadingStartedAt = Date.now();
    setPlanning(true);
    setPlanError(null);
    setPlanResult(null);

    try {
      const result = await planTrip(input);
      setPlanResult(result);
      toast.success("Trip calculated and saved to Django backend!");
      loadHistory();
      requestAnimationFrame(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      });
    } catch (e: any) {
      const errorMessage = getTripPlanningErrorMessage(e);
      setPlanError(errorMessage);
      toast.error("Trip planning unavailable", { description: errorMessage });
    } finally {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, 1800 - (Date.now() - loadingStartedAt))),
      );
      setPlanning(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  if (authLoading || (!user && typeof window !== "undefined")) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Dashboard Top Nav */}
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-md" style={{ background: "color-mix(in oklab, var(--background) 85%, transparent)" }}>
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground">
                <span className="block h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="text-base font-bold tracking-tight">RouteLog</span>
            </Link>
            <span className="hidden h-4 w-px bg-border sm:block" />
            <div className="hidden items-center gap-1 sm:flex">
              <button
                onClick={() => setActiveTab("planner")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "planner"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Trip Planner
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "history"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Trip History ({history.length})
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 text-xs font-medium text-foreground md:flex">
              <UserIcon className="h-3.5 w-3.5 text-accent" />
              <span className="font-semibold">
                {user?.user_metadata?.full_name ||
                  user?.user_metadata?.name ||
                  user?.email?.split("@")[0] ||
                  "Driver"}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold hairline transition-colors hover:bg-destructive/10 hover:text-destructive sm:px-3.5 sm:py-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Mobile Tab Switcher */}
        <div className="mb-6 flex rounded-xl bg-secondary p-1 sm:hidden">
          <button
            onClick={() => setActiveTab("planner")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              activeTab === "planner" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Planner
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              activeTab === "history" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            History ({history.length})
          </button>
        </div>

        {activeTab === "planner" ? (
          <div>
            <TripForm onSubmit={handlePlanTrip} loading={planning} error={planError} />

            <AnimatePresence mode="wait">
              {planning && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LoadingState />
                </motion.div>
              )}
              {planResult && !planning && (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Results data={planResult} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* History View */
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Saved Trips</h1>
              <p className="text-sm text-muted-foreground">
                All FMCSA trip logs calculated and stored in your Django backend.
              </p>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading saved trips…
              </div>
            ) : historyError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
                <p className="font-semibold">Unable to load trip history</p>
                <p className="mt-2 text-xs opacity-90">{historyError}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center sm:p-12">
                <RouteIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-3 text-base font-semibold">No trips saved yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the trip planner to calculate your first FMCSA compliant route.
                </p>
                <button
                  onClick={() => setActiveTab("planner")}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background"
                >
                  <Plus className="h-4 w-4" />
                  Plan a Trip
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {history.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex flex-col justify-between rounded-2xl bg-card p-5 hairline transition-all hover:shadow-soft sm:p-6"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(trip.created_at).toLocaleDateString()}
                        </span>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 uppercase">
                          {trip.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <MapPin className="h-4 w-4 text-accent shrink-0" />
                          <span className="truncate">{trip.current_location}</span>
                        </div>
                        <div className="ml-2 border-l-2 border-dotted border-border pl-4 py-1 text-xs text-muted-foreground">
                          Via {trip.pickup_location}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <MapPin className="h-4 w-4 text-foreground shrink-0" />
                          <span className="truncate">{trip.dropoff_location}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                        <span>{trip.total_distance_miles?.toFixed(1)} miles</span>
                        <span>{trip.total_duration_hours?.toFixed(1)} hrs drive</span>
                      </div>
                    </div>

                    <a
                      href={getPdfDownloadUrl(trip.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PDF Log Sheet
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
