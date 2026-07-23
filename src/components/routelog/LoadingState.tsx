import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function LoadingState() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <div className="rounded-3xl bg-card p-10 hairline">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Planning your trip
        </div>
        <div className="mt-2 text-lg font-medium">Charting the route…</div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-5 h-40 w-full max-w-sm sm:h-48"
        >
          <DotLottieReact
            src="https://lottie.host/52c5fcb9-7ce1-4d3c-a08d-3b243dbdf45f/ndBR8CYt0E.lottie"
            loop
            autoplay
            className="h-full w-full"
            aria-label="Route calculation in progress"
          />
        </motion.div>
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
