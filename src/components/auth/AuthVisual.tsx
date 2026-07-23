import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface AuthVisualProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function AuthVisual({ eyebrow, title, description }: AuthVisualProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-border bg-card px-5 py-6 text-center shadow-soft sm:rounded-3xl sm:px-8 sm:py-8 lg:px-10 lg:py-9"
    >
      <div>
        <div className="mb-4 flex items-center justify-center gap-2.5 sm:mb-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-foreground">
            <span className="block h-2.5 w-2.5 rounded-full bg-accent" />
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">RouteLog</span>
        </div>
        <div className="mx-auto h-40 w-full max-w-xs sm:h-52 sm:max-w-sm lg:h-64">
          <DotLottieReact
            src="https://lottie.host/e96a190a-2e8a-4d09-9a60-e54450f79c0f/uJr8572NXL.lottie"
            loop
            autoplay
            className="h-full w-full"
            aria-label="RouteLog trip planning illustration"
          />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </motion.aside>
  );
}
