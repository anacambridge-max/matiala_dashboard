"use client";

import { formatDateLabel } from "@/lib/formatDate";

interface Props {
  dates: string[];
  selected: string;
  onSelect: (date: string) => void;
  hearingCountByDate: Record<string, number>;
}

export default function DateSelector({ dates, selected, onSelect, hearingCountByDate }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto thin-scroll pb-2 -mx-1 px-1">
      {dates.map((date) => {
        const { day, date: d, month } = formatDateLabel(date);
        const isActive = date === selected;
        const count = hearingCountByDate[date] ?? 0;
        return (
          <button
            key={date}
            onClick={() => onSelect(date)}
            className={`flex flex-col items-center justify-center min-w-[64px] rounded-md border px-2.5 py-2 shrink-0 transition-colors ${
              isActive
                ? "bg-navy border-navy text-white"
                : "bg-card border-border text-ink hover:border-navy-light"
            }`}
          >
            <span className={`text-[11px] uppercase tracking-wide ${isActive ? "text-white/70" : "text-ink-soft"}`}>
              {day}
            </span>
            <span className="text-lg font-semibold leading-tight">{d}</span>
            <span className={`text-[11px] ${isActive ? "text-white/70" : "text-ink-soft"}`}>{month}</span>
            {count > 0 && (
              <span
                className={`mt-1 text-[10px] px-1.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-warning-bg text-warning"
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
