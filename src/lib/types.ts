export interface PsMasterRow {
  "PS No.": number;
  "Old PS No."?: number | null;
  Officer: string;
  "Officer Mobile"?: number | string | null;
  "Hearing Centre": string;
  "PS Address"?: string | null;
  BLO?: string | null;
  "BLO Mobile"?: number | string | null;
  Supervisor?: string | null;
  "Supervisor Mobile"?: number | string | null;
  Locality?: string | null;
  "Polling Area"?: string | null;
  "Total Anomaly/Discrepancy"?: number | null;
  "Total No Mapping"?: number | null;
  "Grand Total"?: number | null;
  "Total Voters"?: number | null;
}

export interface HearingDataRow {
  Date: string; // YYYY-MM-DD
  "PS No.": number;
  "Old PS No."?: number | null;
  Officer: string;
  "Officer Mobile"?: number | string | null;
  "Hearing Centre": string;
  BLO?: string | null;
  "BLO Mobile"?: number | string | null;
  Supervisor?: string | null;
  "Supervisor Mobile"?: number | string | null;
  "Scheduled Notices for Hearing": number;
  "Notice Generated": number;
  Locality?: string | null;
  "Polling Area"?: string | null;
  "Total Anomaly/Discrepancy"?: number | null;
  "Total No Mapping"?: number | null;
  "Grand Total"?: number | null;
  "Total Voters"?: number | null;
}

export interface EciRow {
  acNumber: number;
  pollingStation: number;
  noticeDelivered: number;
  hearingsHeld: number;
}

export interface EciDataset {
  rows: EciRow[];
  uploadedAt: string; // ISO timestamp
  fileName: string;
  reportLabel?: string; // e.g. inferred report date/time if present
}

export interface OfficerSummaryRow {
  officer: string;
  officerMobile: string;
  hearingCentre: string;
  noOfPs: number;
  totalScheduled: number;
  totalDelivered: number;
  totalPending: number;
  totalHearingsHeld: number;
}

export interface PsDetailRow {
  officer: string;
  officerMobile: string;
  hearingCentre: string;
  psNo: number;
  oldPsNo: number | null;
  blo: string;
  bloMobile: string;
  supervisor: string;
  supervisorMobile: string;
  scheduledNotices: number;
  noticeGenerated: number;
  noticeDelivered: number;
  noticePendingDelivery: number;
  hearingsHeld: number;
}
