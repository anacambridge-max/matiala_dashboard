import type { OfficerSummaryRow } from "@/lib/types";

interface Props {
  rows: OfficerSummaryRow[];
  totals: OfficerSummaryRow;
}

function Cell({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <td className={`px-3 py-2.5 text-right tabular-nums ${strong ? "font-semibold text-navy" : ""}`}>
      {children}
    </td>
  );
}

export default function OfficerSummaryTable({ rows, totals }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-border">
        <h2 className="font-serif text-base font-semibold text-navy">
          Officer-wise Hearing Summary
        </h2>
      </div>
      <div className="overflow-x-auto thin-scroll">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-paper text-ink-soft text-xs uppercase tracking-wide">
              <th className="px-3 py-2.5 text-left font-medium">Officer</th>
              <th className="px-3 py-2.5 text-left font-medium">Hearing Centre</th>
              <th className="px-3 py-2.5 text-right font-medium">No. of PS</th>
              <th className="px-3 py-2.5 text-right font-medium">Scheduled</th>
              <th className="px-3 py-2.5 text-right font-medium">Delivered</th>
              <th className="px-3 py-2.5 text-right font-medium">Pending</th>
              <th className="px-3 py-2.5 text-right font-medium">Hearings Held</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.officer}-${r.hearingCentre}-${i}`} className="border-t border-border">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-ink">{r.officer}</div>
                  <div className="text-xs text-ink-soft">{r.officerMobile}</div>
                </td>
                <td className="px-3 py-2.5 text-ink-soft">{r.hearingCentre}</td>
                <Cell>{r.noOfPs}</Cell>
                <Cell>{r.totalScheduled}</Cell>
                <Cell strong>{r.totalDelivered}</Cell>
                <Cell>
                  <span className={r.totalPending > 0 ? "text-warning font-medium" : ""}>
                    {r.totalPending}
                  </span>
                </Cell>
                <Cell>{r.totalHearingsHeld}</Cell>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-navy bg-paper font-semibold">
              <td className="px-3 py-2.5" colSpan={2}>
                TOTAL
              </td>
              <Cell strong>{totals.noOfPs}</Cell>
              <Cell strong>{totals.totalScheduled}</Cell>
              <Cell strong>{totals.totalDelivered}</Cell>
              <Cell strong>{totals.totalPending}</Cell>
              <Cell strong>{totals.totalHearingsHeld}</Cell>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
