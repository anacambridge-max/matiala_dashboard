import type { OfficerSummaryRow } from "@/lib/types";

interface Props {
  rows: OfficerSummaryRow[];
  totals: OfficerSummaryRow;
}

function Cell({ children, strong, className = "" }: { children: React.ReactNode; strong?: boolean; className?: string }) {
  return (
    <td className={`px-3 py-3 text-right tabular-nums ${strong ? "font-semibold" : ""} ${className}`}>
      {children}
    </td>
  );
}

export default function OfficerSummaryTable({ rows, totals }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg shadow-black/10">
      <div className="px-4 sm:px-5 py-4 border-b border-border bg-[#162236]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-semibold text-white">
              Officer-wise Hearing Summary
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">Scheduled hearings and live ECI notice status</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto thin-scroll">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-[#0f1929] text-ink-soft text-[11px] uppercase tracking-wider">
              <th className="px-3 py-3 text-left font-semibold">Officer</th>
              <th className="px-3 py-3 text-left font-semibold">Hearing Centre</th>
              <th className="px-3 py-3 text-right font-semibold">No. of PS</th>
              <th className="px-3 py-3 text-right font-semibold">Scheduled</th>
              <th className="px-3 py-3 text-right font-semibold">Delivered</th>
              <th className="px-3 py-3 text-right font-semibold">Pending</th>
              <th className="px-3 py-3 text-right font-semibold">Hearings Held</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.officer}-${r.hearingCentre}-${i}`} className="border-t border-border hover:bg-[#18263a] transition-colors">
                <td className="px-3 py-3">
                  <div className="font-semibold text-slate-100">{r.officer}</div>
                  <div className="text-xs text-ink-soft mt-0.5">{r.officerMobile}</div>
                </td>
                <td className="px-3 py-3 text-slate-300">{r.hearingCentre}</td>
                <Cell>{r.noOfPs}</Cell>
                <Cell>{r.totalScheduled}</Cell>
                <Cell strong className="text-emerald-400">{r.totalDelivered}</Cell>
                <Cell strong className="text-red-400">{r.totalPending}</Cell>
                <Cell>{r.totalHearingsHeld}</Cell>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-accent/70 bg-[#0f1929] font-semibold">
              <td className="px-3 py-3 text-slate-100" colSpan={2}>TOTAL</td>
              <Cell>{totals.noOfPs}</Cell>
              <Cell>{totals.totalScheduled}</Cell>
              <Cell strong className="text-emerald-400">{totals.totalDelivered}</Cell>
              <Cell strong className="text-red-400">{totals.totalPending}</Cell>
              <Cell>{totals.totalHearingsHeld}</Cell>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
