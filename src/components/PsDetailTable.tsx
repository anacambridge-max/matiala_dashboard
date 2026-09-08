"use client";

import { useMemo, useState } from "react";
import type { PsDetailRow } from "@/lib/types";

interface Props { rows: PsDetailRow[]; }

function statusColor(pending: number, scheduled: number) {
  if (scheduled === 0) return "text-ink-soft";
  if (pending === 0) return "text-emerald-400";
  return "text-red-400";
}

export default function PsDetailTable({ rows }: Props) {
  const [search, setSearch] = useState("");
  const [openOfficers, setOpenOfficers] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      String(r.psNo).includes(q) || r.blo.toLowerCase().includes(q) ||
      r.supervisor.toLowerCase().includes(q) || r.officer.toLowerCase().includes(q) ||
      r.hearingCentre.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, PsDetailRow[]>();
    for (const r of filtered) {
      const key = `${r.officer} — ${r.hearingCentre}`;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function toggle(key: string) {
    setOpenOfficers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg shadow-black/10">
      <div className="px-4 sm:px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-[#162236]">
        <h2 className="font-serif text-lg font-semibold text-white">PS-wise Details for Selected Date</h2>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="PS No. / BLO / Supervisor dhoondein…"
          className="w-full sm:w-72 rounded-lg border border-border bg-[#0f1929] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-navy-light"
        />
      </div>

      {grouped.length === 0 && (
        <div className="px-5 py-8 text-center text-ink-soft text-sm">Is date ke liye koi hearing schedule nahi hai, ya search se koi match nahi mila.</div>
      )}

      <div className="divide-y divide-border">
        {grouped.map(([key, groupRows]) => {
          const isOpen = openOfficers.has(key) || search.trim() !== "";
          return (
            <div key={key}>
              <button onClick={() => toggle(key)} className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-left hover:bg-[#18263a] transition-colors">
                <span className="font-semibold text-sm text-slate-100">{key}</span>
                <span className="flex items-center gap-2 text-xs text-ink-soft">{groupRows.length} PS
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div className="overflow-x-auto thin-scroll">
                  <table className="w-full text-sm min-w-[820px]">
                    <thead><tr className="bg-[#0f1929] text-ink-soft text-[11px] uppercase tracking-wider">
                      <th className="px-3 py-2.5 text-left font-semibold">PS No.</th><th className="px-3 py-2.5 text-left font-semibold">BLO</th><th className="px-3 py-2.5 text-left font-semibold">Supervisor</th><th className="px-3 py-2.5 text-right font-semibold">Scheduled</th><th className="px-3 py-2.5 text-right font-semibold">Generated</th><th className="px-3 py-2.5 text-right font-semibold">Delivered</th><th className="px-3 py-2.5 text-right font-semibold">Pending</th><th className="px-3 py-2.5 text-right font-semibold">Hearings Held</th>
                    </tr></thead>
                    <tbody>{[...groupRows].sort((a,b) => a.psNo-b.psNo).map((r) => (
                      <tr key={r.psNo} className="border-t border-border hover:bg-[#18263a] transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-slate-100">{r.psNo}{r.oldPsNo && r.oldPsNo !== r.psNo && <span className="text-xs text-ink-soft"> (old {r.oldPsNo})</span>}</td>
                        <td className="px-3 py-2.5 text-slate-300">{r.blo}{r.bloMobile && <div className="text-xs text-ink-soft">{r.bloMobile}</div>}</td>
                        <td className="px-3 py-2.5 text-slate-300">{r.supervisor}{r.supervisorMobile && <div className="text-xs text-ink-soft">{r.supervisorMobile}</div>}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{r.scheduledNotices}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{r.noticeGenerated}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-emerald-400">{r.noticeDelivered}</td>
                        <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${statusColor(r.noticePendingDelivery, r.scheduledNotices)}`}>{r.noticePendingDelivery}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{r.hearingsHeld}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
