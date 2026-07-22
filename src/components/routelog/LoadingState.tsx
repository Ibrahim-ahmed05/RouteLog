import { motion } from "framer-motion";

export function LoadingState() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <div className="rounded-3xl bg-card p-10 hairline">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Planning your trip
        </div>
        <div className="mt-2 text-lg font-medium">Charting the route…</div>
        <svg viewBox="0 0 800 120" className="mt-6 w-full">
          <motion.path
            d="M 20 60 C 160 60, 220 20, 380 60 S 640 100, 780 60"
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="2"
            strokeDasharray="6 8"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -140 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle
            r="5"
            fill="var(--accent)"
            initial={{ offsetDistance: "0%" }}
            animate={{ offsetDistance: "100%" }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              offsetPath:
                "path('M 20 60 C 160 60, 220 20, 380 60 S 640 100, 780 60')",
            } as React.CSSProperties}
          />
        </svg>
      </div>
    </div>
  );
}
