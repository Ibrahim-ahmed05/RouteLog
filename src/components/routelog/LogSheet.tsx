import { motion } from "framer-motion";
import { Download } from "lucide-react";
import type { DailyLog, DutyStatus } from "@/lib/planTrip";
import { useMemo } from "react";

const ROWS: { key: DutyStatus; label: string }[] = [
  { key: "off_duty", label: "1. Off Duty" },
  { key: "sleeper_berth", label: "2. Sleeper Berth" },
  { key: "driving", label: "3. Driving" },
  { key: "on_duty_not_driving", label: "4. On Duty (not driving)" },
];

const W = 960;
const H = 260;
const PAD_L = 180;
const PAD_R = 100;
const PAD_T = 40;
const PAD_B = 30;
const GRID_W = W - PAD_L - PAD_R;
const GRID_H = H - PAD_T - PAD_B;
const ROW_H = GRID_H / 4;

function timeToX(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  const mins = h === 24 ? 24 * 60 : h * 60 + m;
  return PAD_L + (mins / (24 * 60)) * GRID_W;
}

function rowY(status: DutyStatus): number {
  const idx = ROWS.findIndex((r) => r.key === status);
  return PAD_T + idx * ROW_H + ROW_H / 2;
}

export function LogSheet({ log, index }: { log: DailyLog; index: number }) {
  const path = useMemo(() => {
    if (!log.segments.length) return "";
    let d = "";
    let prevY: number | null = null;
    for (const seg of log.segments) {
      const x1 = timeToX(seg.start);
      const x2 = timeToX(seg.end);
      const y = rowY(seg.status);
      if (prevY === null) {
        d += `M ${x1} ${y} `;
      } else if (prevY !== y) {
        d += `L ${x1} ${prevY} L ${x1} ${y} `;
      }
      d += `L ${x2} ${y} `;
      prevY = y;
    }
    return d;
  }, [log]);

  const dateLabel = new Date(log.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      key={log.day}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 * index }}
      className="rounded-2xl bg-card p-5 hairline sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Day {log.day}
          </div>
          <div className="mt-0.5 text-base font-semibold">{dateLabel}</div>
        </div>
        <button
          onClick={() => downloadLogPdf(log)}
          title="Download PDF"
          aria-label="Download PDF"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hairline transition-colors hover:bg-secondary"
        >
          <Download className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[720px]">
          {/* Row labels */}
          {ROWS.map((r, i) => (
            <g key={r.key}>
              <text
                x={PAD_L - 12}
                y={PAD_T + i * ROW_H + ROW_H / 2 + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--muted-foreground)"
                fontFamily="Inter"
              >
                {r.label}
              </text>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={PAD_T + (i + 1) * ROW_H}
                y2={PAD_T + (i + 1) * ROW_H}
                stroke="var(--hairline)"
                strokeWidth={1}
              />
            </g>
          ))}
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={PAD_T}
            y2={PAD_T}
            stroke="var(--hairline)"
            strokeWidth={1}
          />

          {/* Hour ticks */}
          {Array.from({ length: 25 }).map((_, h) => {
            const x = PAD_L + (h / 24) * GRID_W;
            const major = h % 6 === 0;
            const label =
              h === 0 ? "Mid" : h === 12 ? "Noon" : h === 24 ? "Mid" : String(h % 12 || 12);
            return (
              <g key={h}>
                <line
                  x1={x}
                  x2={x}
                  y1={PAD_T}
                  y2={PAD_T + GRID_H}
                  stroke={major ? "var(--border)" : "var(--hairline)"}
                  strokeWidth={major ? 1 : 0.5}
                  opacity={major ? 1 : 0.6}
                />
                {(major || h % 3 === 0) && (
                  <text
                    x={x}
                    y={PAD_T + GRID_H + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                    fontFamily="Inter"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Totals column headers */}
          <text
            x={W - PAD_R + 12}
            y={PAD_T - 12}
            fontSize="10"
            fill="var(--muted-foreground)"
            fontFamily="Inter"
            fontWeight={500}
          >
            Total hrs
          </text>
          {ROWS.map((r, i) => (
            <text
              key={r.key}
              x={W - PAD_R + 12}
              y={PAD_T + i * ROW_H + ROW_H / 2 + 4}
              fontSize="12"
              fill="var(--foreground)"
              fontFamily="Inter"
              fontWeight={600}
            >
              {log.totals[r.key].toFixed(2)}
            </text>
          ))}

          {/* Duty status line */}
          <motion.path
            d={path}
            fill="none"
            stroke="var(--foreground)"
            strokeWidth={2.25}
            strokeLinecap="square"
            strokeLinejoin="miter"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </svg>
      </div>
    </motion.div>
  );
}

async function downloadLogPdf(log: DailyLog) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`RouteLog · Daily Log — Day ${log.day}`, 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date(log.date + "T00:00:00").toDateString(), 40, 68);

  const gx = 180;
  const gy = 110;
  const gw = pageW - gx - 100;
  const gh = 200;
  const rh = gh / 4;

  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  ROWS.forEach((r, i) => {
    doc.text(r.label, gx - 10, gy + i * rh + rh / 2 + 3, { align: "right" });
    doc.line(gx, gy + (i + 1) * rh, gx + gw, gy + (i + 1) * rh);
  });
  doc.line(gx, gy, gx + gw, gy);
  for (let h = 0; h <= 24; h++) {
    const x = gx + (h / 24) * gw;
    doc.setDrawColor(h % 6 === 0 ? 180 : 230);
    doc.line(x, gy, x, gy + gh);
    if (h % 3 === 0) {
      doc.setFontSize(8);
      doc.setTextColor(120);
      const label = h === 0 || h === 24 ? "Mid" : h === 12 ? "Noon" : String(h % 12 || 12);
      doc.text(label, x, gy + gh + 12, { align: "center" });
      doc.setTextColor(0);
    }
  }

  // Duty line
  doc.setDrawColor(10);
  doc.setLineWidth(1.4);
  let prevY: number | null = null;
  for (const seg of log.segments) {
    const [sh, sm] = seg.start.split(":").map(Number);
    const eh = seg.end === "24:00" ? 24 : Number(seg.end.split(":")[0]);
    const em = seg.end === "24:00" ? 0 : Number(seg.end.split(":")[1]);
    const x1 = gx + ((sh * 60 + sm) / (24 * 60)) * gw;
    const x2 = gx + ((eh * 60 + em) / (24 * 60)) * gw;
    const idx = ROWS.findIndex((r) => r.key === seg.status);
    const y = gy + idx * rh + rh / 2;
    if (prevY !== null && prevY !== y) {
      doc.line(x1, prevY, x1, y);
    }
    doc.line(x1, y, x2, y);
    prevY = y;
  }

  // Totals
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Total hrs", pageW - 90, gy - 6);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  ROWS.forEach((r, i) => {
    doc.text(log.totals[r.key].toFixed(2), pageW - 90, gy + i * rh + rh / 2 + 3);
  });

  doc.save(`routelog-day-${log.day}.pdf`);
}
