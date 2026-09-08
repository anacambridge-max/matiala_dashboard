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

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\.0$/, "");
}

/**
 * AUTHORITATIVE AC-34 hearing allocation.
 *
 * The PS-wise allocation is the source of truth for Officer + Hearing Centre.
 * This intentionally overrides stale/mistyped officer/centre values that may
 * exist in the schedule snapshot. In particular, PS 123 and PS 340 belong to
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
    const live = eciLookup.get(psNo);
    const scheduled = r["Scheduled Notices for Hearing"] || 0;
    const delivered = live ? live.delivered : 0;
    const held = live ? live.held : 0;
    const pending = scheduled - delivered;
    const assignment = getAuthoritativeAssignment(psNo);

    return {
      // Always use the authoritative PS allocation when one exists.
      officer: assignment?.officer ?? r.Officer,
      officerMobile: assignment?.officerMobile ?? toStr(r["Officer Mobile"]),
      hearingCentre: assignment?.hearingCentre ?? r["Hearing Centre"],
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

  // Build the summary from the actual PS rows for the selected date.
  // This prevents empty/stale Officer + Hearing Centre combinations from
  // appearing as zero rows (the previous cause of the duplicate Parul Gupta row).
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
