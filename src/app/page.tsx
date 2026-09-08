"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import UploadPanel from "@/components/UploadPanel";
import DateSelector from "@/components/DateSelector";
import OfficerSummaryTable from "@/components/OfficerSummaryTable";
import PsDetailTable from "@/components/PsDetailTable";
import { computeDashboard, HEARING_DATES } from "@/lib/computeDashboard";
import {
  getEciDatasetServerSnapshot,
  getEciDatasetSnapshot,
  saveEciDataset,
  subscribeEciDataset,
} from "@/lib/storage";
import type { EciDataset } from "@/lib/types";
import hearingDataRaw from "@/data/hearing_data.json";
import type { HearingDataRow } from "@/lib/types";

const hearingData = hearingDataRaw as unknown as HearingDataRow[];

function todayOrFirstDate(): string {
  const today = new Date().toISOString().slice(0, 10);
  if (HEARING_DATES.includes(today)) return today;
  const upcoming = HEARING_DATES.find((d) => d >= today);
  return upcoming ?? HEARING_DATES[0];
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string>(() => todayOrFirstDate());
  // useSyncExternalStore safely reads localStorage: it renders the server
  // snapshot (null) on first paint and switches to the real value right after,
  // with no hydration-mismatch warning.
  const eciDataset = useSyncExternalStore(
    subscribeEciDataset,
    getEciDatasetSnapshot,
    getEciDatasetServerSnapshot
  );

  function handleLoaded(dataset: EciDataset) {
    saveEciDataset(dataset);
  }

  const hearingCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of hearingData) {
      map[row.Date] = (map[row.Date] ?? 0) + 1;
    }
    return map;
  }, []);

  const result = useMemo(
    () => computeDashboard(selectedDate, eciDataset),
    [selectedDate, eciDataset]
  );

  return (
    <div className="flex-1 flex flex-col bg-paper">
      <header className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="text-xs uppercase tracking-wider text-white/60 mb-1">
            SIR 2026 · NCT of Delhi · South West District
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold">
            AC-34 Matiala — Hearing &amp; Notice Dashboard
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">
        <UploadPanel currentDataset={eciDataset} onLoaded={handleLoaded} />

        <section>
          <h2 className="font-serif text-base font-semibold text-navy mb-2">
            Hearing Date Chunein
          </h2>
          <DateSelector
            dates={HEARING_DATES}
            selected={selectedDate}
            onSelect={setSelectedDate}
            hearingCountByDate={hearingCountByDate}
          />
        </section>

        {!result.hasHearingsOnDate && (
          <div className="rounded-md bg-warning-bg text-warning text-sm px-4 py-3">
            Is date ke liye koi hearing schedule nahi hai.
          </div>
        )}

        <OfficerSummaryTable rows={result.officerSummary} totals={result.officerTotals} />

        <PsDetailTable rows={result.psDetails} />
      </main>

      <footer className="mt-auto border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-ink-soft">
          Data source: AC34_Part_Wise_Hearing_Date_Summary (schedule) + latest uploaded ECI
          NOTICE_REPORT_PART_WISE (Notice Delivered / Hearings Held). Matching key: AC 34 +
          Polling Station No.
        </div>
      </footer>
    </div>
  );
}
