import hearingDataRaw from "@/data/hearing_data.json";
import listsRaw from "@/data/lists.json";
import type {
  EciDataset,
  HearingDataRow,
  OfficerSummaryRow,
  PsDetailRow,
} from "./types";
import { buildEciLookup } from "./eciParser";

const hearingData = hearingDataRaw as unknown as HearingDataRow[];
const lists = listsRaw as unknown as {
  dates: string[];
  officerVenues: { Officer: string; "Officer Mobile": number; "Hearing Centre": string }[];
};

export const HEARING_DATES = lists.dates;
export const OFFICER_VENUES = lists.officerVenues;

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\.0$/, "");
}

export interface DashboardResult {
  officerSummary: OfficerSummaryRow[];
  officerTotals: OfficerSummaryRow;
  psDetails: PsDetailRow[];
  hasHearingsOnDate: boolean;
}

export function computeDashboard(
  selectedDate: string,
  eciDataset: EciDataset | null
): DashboardResult {
  const eciLookup = eciDataset ? buildEciLookup(eciDataset) : new Map<number, { delivered: number; held: number }>();

  const rowsForDate = hearingData.filter((r) => r.Date === selectedDate);

  const psDetails: PsDetailRow[] = rowsForDate.map((r) => {
    const psNo = r["PS No."];
    const live = eciLookup.get(psNo);
    const scheduled = r["Scheduled Notices for Hearing"] || 0;
    const delivered = live ? live.delivered : 0;
    const held = live ? live.held : 0;
    const pending = scheduled - delivered;

    return {
      officer: r.Officer,
      officerMobile: toStr(r["Officer Mobile"]),
      hearingCentre: r["Hearing Centre"],
      psNo,
      oldPsNo: r["Old PS No."] ?? null,
      blo: r.BLO ?? "",
      bloMobile: toStr(r["BLO Mobile"]),
      supervisor: r.Supervisor ?? "",
      supervisorMobile: toStr(r["Supervisor Mobile"]),
      scheduledNotices: scheduled,
      noticeGenerated: r["Notice Generated"] || 0,
      noticeDelivered: delivered,
      noticePendingDelivery: pending,
      hearingsHeld: held,
    };
  });

  // Officer-wise summary, grouped by Officer + Hearing Centre (matches DASHBOARD sheet's officer/venue rows)
  const officerSummary: OfficerSummaryRow[] = OFFICER_VENUES.map((ov) => {
    const matching = psDetails.filter(
      (d) => d.officer === ov.Officer && d.hearingCentre === ov["Hearing Centre"]
    );
    return {
      officer: ov.Officer,
      officerMobile: toStr(ov["Officer Mobile"]),
      hearingCentre: ov["Hearing Centre"],
      noOfPs: matching.length,
      totalScheduled: matching.reduce((s, m) => s + m.scheduledNotices, 0),
      totalDelivered: matching.reduce((s, m) => s + m.noticeDelivered, 0),
      totalPending: matching.reduce((s, m) => s + m.noticePendingDelivery, 0),
      totalHearingsHeld: matching.reduce((s, m) => s + m.hearingsHeld, 0),
    };
  });

  const officerTotals: OfficerSummaryRow = {
    officer: "TOTAL",
    officerMobile: "",
    hearingCentre: "",
    noOfPs: officerSummary.reduce((s, o) => s + o.noOfPs, 0),
    totalScheduled: officerSummary.reduce((s, o) => s + o.totalScheduled, 0),
    totalDelivered: officerSummary.reduce((s, o) => s + o.totalDelivered, 0),
    totalPending: officerSummary.reduce((s, o) => s + o.totalPending, 0),
    totalHearingsHeld: officerSummary.reduce((s, o) => s + o.totalHearingsHeld, 0),
  };

  // Sort PS details: officer, then hearing centre, then PS No (matches sheet's grouped order via RankInDate)
  psDetails.sort((a, b) => {
    if (a.officer !== b.officer) return a.officer.localeCompare(b.officer);
    if (a.hearingCentre !== b.hearingCentre) return a.hearingCentre.localeCompare(b.hearingCentre);
    return a.psNo - b.psNo;
  });

  return {
    officerSummary,
    officerTotals,
    psDetails,
    hasHearingsOnDate: rowsForDate.length > 0,
  };
}
