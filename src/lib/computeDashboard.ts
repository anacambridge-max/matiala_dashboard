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
 * AUTHORITATIVE AC-34 hearing allocation.
 *
 * The PS-wise allocation is the source of truth for Officer + Hearing Centre.
 * This intentionally overrides stale/mistyped officer/centre values that may
 * exist in schedule snapshots. In particular, PS 123 and PS 340 belong to
 * SH. RAKESH KUMAR at GCSSC SEC-22 DWARKA(R), not SMT. PARUL GUPTA.
 */
const AUTHORITATIVE_PS_ALLOCATION = [
  {
    officer: "SH. PARVEEN KUMAR",
    officerMobile: "9953601073",
    hearingCentre: "GCSSS, SEC-3 DWARKA(P)",
    ranges: [[1, 50], [55, 60], [78, 79], [91, 96]],
  },
  {
    officer: "SMT. SHASHI BALA",
    officerMobile: "9953312984",
    hearingCentre: "GCSSS, SEC-3 DWARKA(S)",
    ranges: [[51, 54], [61, 77], [80, 90], [97, 109], [135, 145]],
  },
  {
    officer: "SH. RAKESH KUMAR",
    officerMobile: "7011971522",
    hearingCentre: "GCSSC SEC-22 DWARKA(R)",
    ranges: [[110, 134], [331, 341], [343, 344], [347, 349]],
  },
  {
    officer: "SMT. PARUL GUPTA",
    officerMobile: "9667881989",
    hearingCentre: "VREC MATIALA",
    ranges: [[146, 234], [276, 288]],
  },
  {
    officer: "SH. SUBHASHISH",
    officerMobile: "9868252144",
    hearingCentre: "MCD Boys PRIMARY SCHOOL, QUTUB VIHAR",
    ranges: [[235, 275], [289, 330]],
  },
  {
    officer: "SH. VIRENDER",
    officerMobile: "9868252144",
    hearingCentre: "GCSSS SEC 22 DWARKA(V)",
    ranges: [[342, 342], [345, 346], [350, 374]],
  },
  {
    officer: "SH. VIRENDER",
    officerMobile: "9868252144",
    hearingCentre: "GGSSS GHUMANHERA",
    ranges: [[375, 430]],
  },
] as const;

type AuthoritativeAssignment = {
  officer: string;
  officerMobile: string;
  hearingCentre: string;
};

function getAuthoritativeAssignment(psNo: number): AuthoritativeAssignment | null {
  for (const allocation of AUTHORITATIVE_PS_ALLOCATION) {
    if (allocation.ranges.some(([from, to]) => psNo >= from && psNo <= to)) {
      return {
        officer: allocation.officer,
        officerMobile: allocation.officerMobile,
        hearingCentre: allocation.hearingCentre,
      };
    }
  }
  return null;
}

const MASTER_BY_PS = new Map<number, PsMasterRow>();
for (const row of psMaster) {
  MASTER_BY_PS.set(row["PS No."], row);
}

// The current hearing_data.json is the dashboard's imported PS/date schedule.
// Deriving dates from it means newly added hearing dates automatically appear
// in the dashboard when the schedule database is refreshed.
export const HEARING_DATES = Array.from(
  new Set(hearingData.map((r) => r.Date))
).sort();

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
  const eciLookup = eciDataset
    ? buildEciLookup(eciDataset)
    : new Map<number, { delivered: number; held: number }>();

  const rowsForDate = hearingData.filter((r) => r.Date === selectedDate);

  const psDetails: PsDetailRow[] = rowsForDate.map((r) => {
    const psNo = r["PS No."];
    const master = MASTER_BY_PS.get(psNo) ?? r;
    const live = eciLookup.get(psNo);
    const scheduled = Number(r["Scheduled Notices for Hearing"]) || 0;
    const delivered = live ? live.delivered : 0;
    const held = live ? live.held : 0;
    // ECI Notice Delivered is a live PS-level value. Never show a negative
    // pending count when that cumulative delivered value exceeds a particular
    // date's scheduled hearing quantity.
    const pending = Math.max(scheduled - delivered, 0);
    const assignment = getAuthoritativeAssignment(psNo);

    return {
      officer: assignment?.officer ?? master.Officer ?? "",
      officerMobile: assignment?.officerMobile ?? toStr(master["Officer Mobile"]),
      hearingCentre: assignment?.hearingCentre ?? master["Hearing Centre"] ?? "",
      psNo,
      oldPsNo: master["Old PS No."] ?? null,
      blo: master.BLO ?? "",
      bloMobile: toStr(master["BLO Mobile"]),
      supervisor: master.Supervisor ?? "",
      supervisorMobile: toStr(master["Supervisor Mobile"]),
      scheduledNotices: scheduled,
      noticeGenerated: scheduled,
      noticeDelivered: delivered,
      noticePendingDelivery: pending,
      hearingsHeld: held,
    };
  });

  // Build the summary from the actual PS rows for the selected date.
  // This keeps each Officer + Hearing Centre combination separate, including
  // Sh. Virender's two official hearing centres.
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
