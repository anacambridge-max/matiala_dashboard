import hearingDataRaw from "@/data/hearing_data.json";
import psMasterRaw from "@/data/ps_master.json";
import type {
  EciDataset,
  HearingDataRow,
  OfficerSummaryRow,
  PsDetailRow,
  PsMasterRow,
} from "./types";
import { buildEciLookup } from "./eciParser";

const hearingData = hearingDataRaw as unknown as HearingDataRow[];
const psMaster = psMasterRaw as unknown as PsMasterRow[];

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\.0$/, "");
}

/**
 * Latest Part Wise Hearing Summary update.
 * The uploaded report has 431 schedule rows (excluding Grand Total).
 * Most rows are already present in hearing_data.json; this patch covers
 * the rows added/removed/changed by the latest report, while the complete
 * October schedule below is kept here because the base hearing data does
 * not contain the October schedule rows.
 */
const SCHEDULE_PATCHES: Array<{ psNo: number; date: string; scheduled: number | null }> = [
  { psNo: 1, date: "2026-09-07", scheduled: 1 },
  { psNo: 1, date: "2026-09-08", scheduled: 63 },
  { psNo: 1, date: "2026-09-17", scheduled: 1 },
  { psNo: 39, date: "2026-09-12", scheduled: null },
];

const OCTOBER_SCHEDULE = [
  { psNo: 38, date: "2026-10-01", scheduled: 85 },
  { psNo: 41, date: "2026-10-01", scheduled: 100 },
  { psNo: 60, date: "2026-10-01", scheduled: 100 },
  { psNo: 82, date: "2026-10-01", scheduled: 81 },
  { psNo: 134, date: "2026-10-01", scheduled: 126 },
  { psNo: 250, date: "2026-10-01", scheduled: 100 },
  { psNo: 263, date: "2026-10-01", scheduled: 100 },
  { psNo: 296, date: "2026-10-01", scheduled: 150 },
  { psNo: 347, date: "2026-10-01", scheduled: 119 },
  { psNo: 56, date: "2026-10-03", scheduled: 150 },
  { psNo: 57, date: "2026-10-03", scheduled: 136 },
  { psNo: 93, date: "2026-10-03", scheduled: 100 },
  { psNo: 247, date: "2026-10-03", scheduled: 50 },
  { psNo: 271, date: "2026-10-03", scheduled: 79 },
  { psNo: 303, date: "2026-10-03", scheduled: 61 },
  { psNo: 329, date: "2026-10-03", scheduled: 98 },
  { psNo: 91, date: "2026-10-05", scheduled: 152 },
  { psNo: 92, date: "2026-10-05", scheduled: 172 },
  { psNo: 238, date: "2026-10-05", scheduled: 104 },
  { psNo: 263, date: "2026-10-05", scheduled: 83 },
  { psNo: 296, date: "2026-10-05", scheduled: 80 },
  { psNo: 327, date: "2026-10-05", scheduled: 80 },
  { psNo: 28, date: "2026-10-06", scheduled: 150 },
  { psNo: 93, date: "2026-10-06", scheduled: 116 },
  { psNo: 95, date: "2026-10-06", scheduled: 102 },
  { psNo: 372, date: "2026-10-06", scheduled: 147 },
  { psNo: 373, date: "2026-10-06", scheduled: 50 },
  { psNo: 374, date: "2026-10-06", scheduled: 106 },
  { psNo: 5, date: "2026-10-07", scheduled: 146 },
  { psNo: 372, date: "2026-10-08", scheduled: 147 },
  { psNo: 373, date: "2026-10-08", scheduled: 62 },
  { psNo: 374, date: "2026-10-08", scheduled: 104 },
  { psNo: 28, date: "2026-10-16", scheduled: 13 },
] as const;

const PATCH_KEYS = new Set(SCHEDULE_PATCHES.map((r) => `${r.psNo}\u0000${r.date}`));
const OCTOBER_KEYS = new Set(OCTOBER_SCHEDULE.map((r) => `${r.psNo}\u0000${r.date}`));

const BASE_SCHEDULE_ROWS = hearingData
  .map((r) => ({ psNo: r["PS No."], date: r.Date, scheduled: Number(r["Scheduled Notices for Hearing"]) || 0 }))
  .filter((r) => !PATCH_KEYS.has(`${r.psNo}\u0000${r.date}`) && !OCTOBER_KEYS.has(`${r.psNo}\u0000${r.date}`));

const ALL_SCHEDULE_ROWS = [
  ...BASE_SCHEDULE_ROWS,
  ...SCHEDULE_PATCHES
    .filter((r) => r.scheduled !== null)
    .map((r) => ({ psNo: r.psNo, date: r.date, scheduled: r.scheduled as number })),
  ...OCTOBER_SCHEDULE,
];

export const HEARING_DATES = Array.from(new Set(ALL_SCHEDULE_ROWS.map((r) => r.date))).sort();

const AUTHORITATIVE_PS_ALLOCATION = [
  { officer: "SH. PARVEEN KUMAR", officerMobile: "9953601073", hearingCentre: "GCSSS, SEC-3 DWARKA(P)", ranges: [[1, 50], [55, 60], [78, 79], [91, 96]] },
  { officer: "SMT. SHASHI BALA", officerMobile: "9953312984", hearingCentre: "GCSSS, SEC-3 DWARKA(S)", ranges: [[51, 54], [61, 77], [80, 90], [97, 109], [135, 145]] },
  { officer: "SH. RAKESH KUMAR", officerMobile: "7011971522", hearingCentre: "GCSSC SEC-22 DWARKA(R)", ranges: [[110, 134], [331, 341], [343, 344], [347, 349]] },
  { officer: "SMT. PARUL GUPTA", officerMobile: "9667881989", hearingCentre: "VREC MATIALA", ranges: [[146, 234], [276, 288]] },
  { officer: "SH. SUBHASHISH", officerMobile: "9868252144", hearingCentre: "MCD Boys PRIMARY SCHOOL, QUTUB VIHAR", ranges: [[235, 275], [289, 330]] },
  { officer: "SH. VIRENDER", officerMobile: "9868252144", hearingCentre: "GCSSS SEC 22 DWARKA(V)", ranges: [[342, 342], [345, 346], [350, 374]] },
  { officer: "SH. VIRENDER", officerMobile: "9868252144", hearingCentre: "GGSSS GHUMANHERA", ranges: [[375, 430]] },
] as const;

type AuthoritativeAssignment = { officer: string; officerMobile: string; hearingCentre: string };

function getAuthoritativeAssignment(psNo: number): AuthoritativeAssignment | null {
  for (const allocation of AUTHORITATIVE_PS_ALLOCATION) {
    if (allocation.ranges.some(([from, to]) => psNo >= from && psNo <= to)) {
      return { officer: allocation.officer, officerMobile: allocation.officerMobile, hearingCentre: allocation.hearingCentre };
    }
  }
  return null;
}

const MASTER_BY_PS = new Map<number, PsMasterRow>();
for (const row of psMaster) MASTER_BY_PS.set(row["PS No."], row);

/**
 * ECI's Notice Delivered is cumulative at PS level. Consume it chronologically
 * across all hearing dates for that PS, so delivered notices are never counted
 * again on a later hearing date until earlier scheduled notices are filled.
 */
const SCHEDULE_BY_PS = new Map<number, Array<{ date: string; scheduled: number }>>();
for (const row of ALL_SCHEDULE_ROWS) {
  const existing = SCHEDULE_BY_PS.get(row.psNo) ?? [];
  existing.push({ date: row.date, scheduled: row.scheduled });
  SCHEDULE_BY_PS.set(row.psNo, existing);
}

const DATE_WISE_DELIVERED = new Map<string, number>();
for (const [psNo, rows] of SCHEDULE_BY_PS) {
  const byDate = new Map<string, number>();
  for (const row of rows) byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.scheduled);
  for (const [date] of Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    DATE_WISE_DELIVERED.set(`${psNo}\u0000${date}`, 0);
  }
}

function allocateDeliveredForPs(psNo: number, cumulativeDelivered: number): void {
  const rows = SCHEDULE_BY_PS.get(psNo) ?? [];
  const byDate = new Map<string, number>();
  for (const row of rows) byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.scheduled);

  let remaining = Math.max(Number(cumulativeDelivered) || 0, 0);
  for (const [date, scheduled] of Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    const allocated = Math.min(scheduled, remaining);
    DATE_WISE_DELIVERED.set(`${psNo}\u0000${date}`, allocated);
    remaining -= allocated;
  }
}

export interface DashboardResult {
  officerSummary: OfficerSummaryRow[];
  officerTotals: OfficerSummaryRow;
  psDetails: PsDetailRow[];
  hasHearingsOnDate: boolean;
}

export function computeDashboard(selectedDate: string, eciDataset: EciDataset | null): DashboardResult {
  const eciLookup = eciDataset ? buildEciLookup(eciDataset) : new Map<number, { delivered: number; held: number }>();

  for (const [psNo, live] of eciLookup) allocateDeliveredForPs(psNo, live.delivered);

  const rowsForDate = ALL_SCHEDULE_ROWS.filter((r) => r.date === selectedDate);

  const psDetails: PsDetailRow[] = rowsForDate.map((r) => {
    const psNo = r.psNo;
    const master = MASTER_BY_PS.get(psNo);
    const live = eciLookup.get(psNo);
    const scheduled = r.scheduled;
    const delivered = DATE_WISE_DELIVERED.get(`${psNo}\u0000${selectedDate}`) ?? 0;
    const held = live ? live.held : 0;
    const pending = Math.max(scheduled - delivered, 0);
    const assignment = getAuthoritativeAssignment(psNo);

    return {
      officer: assignment?.officer ?? master?.Officer ?? "",
      officerMobile: assignment?.officerMobile ?? toStr(master?.["Officer Mobile"]),
      hearingCentre: assignment?.hearingCentre ?? master?.["Hearing Centre"] ?? "",
      psNo,
      oldPsNo: master?.["Old PS No."] ?? null,
      blo: master?.BLO ?? "",
      bloMobile: toStr(master?.["BLO Mobile"]),
      supervisor: master?.Supervisor ?? "",
      supervisorMobile: toStr(master?.["Supervisor Mobile"]),
      scheduledNotices: scheduled,
      noticeGenerated: scheduled,
      noticeDelivered: delivered,
      noticePendingDelivery: pending,
      hearingsHeld: held,
    };
  });

  const summaryMap = new Map<string, OfficerSummaryRow>();
  for (const d of psDetails) {
    const key = `${d.officer}\u0000${d.hearingCentre}`;
    const existing = summaryMap.get(key);
    if (existing) {
      existing.noOfPs += 1;
      existing.totalScheduled += d.scheduledNotices;
      existing.totalDelivered += d.noticeDelivered;
      existing.totalPending += d.noticePendingDelivery;
      existing.totalHearingsHeld += d.hearingsHeld;
    } else {
      summaryMap.set(key, {
        officer: d.officer,
        officerMobile: d.officerMobile,
        hearingCentre: d.hearingCentre,
        noOfPs: 1,
        totalScheduled: d.scheduledNotices,
        totalDelivered: d.noticeDelivered,
        totalPending: d.noticePendingDelivery,
        totalHearingsHeld: d.hearingsHeld,
      });
    }
  }

  const officerSummary = Array.from(summaryMap.values());
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

  psDetails.sort((a, b) => a.officer !== b.officer ? a.officer.localeCompare(b.officer) : a.hearingCentre !== b.hearingCentre ? a.hearingCentre.localeCompare(b.hearingCentre) : a.psNo - b.psNo);

  return { officerSummary, officerTotals, psDetails, hasHearingsOnDate: rowsForDate.length > 0 };
}
