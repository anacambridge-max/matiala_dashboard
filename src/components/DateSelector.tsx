"use client";

import { formatDateLabel } from "@/lib/formatDate";

interface Props {
  dates: string[];
  selected: string;
  onSelect: (date: string) => void;
  hearingCountByDate: Record<string, number>;
}

const ADDITIONAL_HEARING_DATES = [
  "2026-10-01",
  "2026-10-03",
  "2026-10-05",
  "2026-10-06",
];

export default function DateSelector({ dates, selected, onSelect, hearingCountByDate }: Props) {
  const allDates = Array.from(new Set([...dates, ...ADDITIONAL_HEARING_DATES])).sort();
  const additionalCounts: Record<string, number> = {
    "2026-10-01": 7,
    "2026-10-03": 7,
    "2026-10-05": 6,
    "2026-10-06": 3,
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(68px,68px))] gap-2 pb-1">
      {allDates.map((date) => {
        const { day, date: d, month } = formatDateLabel(date);
        const isActive = date === selected;
        const count = hearingCountByDate[date] ?? additionalCounts[date] ?? 0;
        return (
          <button
            key={date}
            onClick={() => onSelect(date)}
            aria-pressed={isActive}
            className={`flex flex-col items-center justify-center w-[68px] rounded-lg border px-2.5 py-2.5 shrink-0 transition-all ${
              isActive
                ? "bg-accent border-accent text-slate-950 shadow-md shadow-black/20 scale-[1.02]"
                : "bg-card border-border text-ink hover:border-navy-light hover:bg-navy"
            }`}
          >
            <span className={`text-[10px] uppercase tracking-[0.12em] font-semibold ${isActive ? "text-slate-950/70" : "text-ink-soft"}`}>
              {day}
            </span>
            <span className="text-xl font-bold leading-tight mt-0.5">{d}</span>
            <span className={`text-[11px] font-medium ${isActive ? "text-slate-950/70" : "text-ink-soft"}`}>{month}</span>
            {count > 0 && (
              <span
                className={`mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-slate-950/15 text-slate-950" : "bg-warning-bg text-warning"
                }`}
              >
                {count} PS
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
