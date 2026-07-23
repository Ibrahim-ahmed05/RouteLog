import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, X, Navigation } from "lucide-react";

interface Suggestion {
  name: string;
  city?: string;
  state?: string;
  country?: string;
  formatted: string;
  lat: number;
  lng: number;
}

interface LocationInputProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  invalid?: boolean;
}

export function LocationInput({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder = "Search city or location…",
  invalid,
}: LocationInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query with external value if changed externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Fetch suggestions with 250ms debounce
  useEffect(() => {
    if (!hasUserTyped || !query.trim() || query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Query Photon Geocoding API (free, fast, no key needed, supports CORS)
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`
        );
        if (res.ok) {
          const data = await res.json();
          const items: Suggestion[] = (data.features || []).map((f: any) => {
            const props = f.properties || {};
            const parts = [];
            const name = props.name || props.city || props.town;
            const state = props.state;
            const country = props.country;

            if (name) parts.push(name);
            if (state && state !== name) parts.push(state);
            if (country) parts.push(country);

            const formatted = parts.join(", ") || query;
            const [lng, lat] = f.geometry?.coordinates || [0, 0];

            return {
              name: name || formatted,
              city: props.city || props.town,
              state: props.state,
              country: props.country,
              formatted,
              lat,
              lng,
            };
          });

          // Deduplicate suggestions
          const unique = items.filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.formatted === item.formatted)
          );

          if (!cancelled) {
            setSuggestions(unique);
            setIsOpen(unique.length > 0);
          }
        }
      } catch (e) {
        console.warn("Autocomplete fetch failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(item: Suggestion) {
    setQuery(item.formatted);
    onChange(item.formatted);
    setHasUserTyped(false);
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || !suggestions.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  function handleClear() {
    setQuery("");
    onChange("");
    setHasUserTyped(true);
    setSuggestions([]);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div
        className={`mt-2 flex items-center gap-3 rounded-xl bg-background px-4 py-3.5 transition-all duration-200 sm:py-4 ${
          invalid
            ? "shadow-[0_0_0_1px_var(--destructive)]"
            : "hairline focus-within:shadow-[0_0_0_1.5px_var(--ring)]"
        }`}
      >
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setHasUserTyped(true);
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}

        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Menu */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          className="absolute left-0 right-0 z-50 max-h-72 overflow-y-auto rounded-2xl bg-card p-1.5 shadow-lift hairline"
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Suggested Locations
            </div>
            {suggestions.map((item, idx) => (
              <button
                key={`${item.formatted}-${idx}`}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm transition-colors ${
                  selectedIndex === idx
                    ? "bg-foreground text-background"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <Navigation className={`h-3.5 w-3.5 shrink-0 ${selectedIndex === idx ? "text-accent" : "text-muted-foreground"}`} />
                <div className="truncate">
                  <span className="font-semibold">{item.name}</span>
                  {item.state || item.country ? (
                    <span className={`ml-1.5 ${selectedIndex === idx ? "text-background/80" : "text-muted-foreground"}`}>
                      {[item.state, item.country].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
