import * as XLSX from "xlsx";
import type { EciDataset, EciRow } from "./types";

const AC_NUMBER = 34;

// Column names as they appear in the official ECI "NOTICE_REPORT_PART_WISE" export.
// We match by header text (case/space tolerant) so small export variations don't break parsing.
const COLUMN_ALIASES: Record<string, string[]> = {
  acNumber: ["ac number", "acnumber", "ac no", "ac no."],
  pollingStation: ["polling station", "ps no", "ps no.", "part no", "part no."],
  noticeDelivered: ["notice delivered"],
  hearingsHeld: ["hearings held", "hearing held"],
};

function normalizeHeader(h: unknown): string {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findColumnIndex(headerRow: unknown[], aliases: string[]): number {
  const normalized = headerRow.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

export class EciParseError extends Error {}

export async function parseEciFile(file: File): Promise<EciDataset> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  // Use the first sheet that actually contains the expected columns; ECI exports
  // are usually single-sheet, but be defensive in case of extra summary tabs.
  let bestSheetRows: unknown[][] | null = null;
  let bestColIdx: Record<string, number> | null = null;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: null,
    });
    if (!rows.length) continue;

    // Find header row: scan first 5 rows for one containing "Notice Delivered"
    for (let r = 0; r < Math.min(5, rows.length); r++) {
      const headerRow = rows[r];
      const colIdx: Record<string, number> = {};
      let matchedAll = true;
      for (const key of Object.keys(COLUMN_ALIASES)) {
        const idx = findColumnIndex(headerRow, COLUMN_ALIASES[key]);
        if (idx === -1) {
          matchedAll = false;
          break;
        }
        colIdx[key] = idx;
      }
      if (matchedAll) {
        bestSheetRows = rows.slice(r + 1);
        bestColIdx = colIdx;
        break;
      }
    }
    if (bestSheetRows) break;
  }

  if (!bestSheetRows || !bestColIdx) {
    throw new EciParseError(
      "Yeh file ECI ka NOTICE_REPORT_PART_WISE format nahi lag rahi. Kripya sahi ECI export file upload karein (columns: AC Number, POLLING STATION, Notice Delivered, Hearings Held)."
    );
  }

  const rows: EciRow[] = [];
  for (const row of bestSheetRows) {
    if (!row || row.every((c) => c === null || c === undefined || c === "")) continue;
    const acRaw = row[bestColIdx.acNumber];
    const psRaw = row[bestColIdx.pollingStation];
    const deliveredRaw = row[bestColIdx.noticeDelivered];
    const heldRaw = row[bestColIdx.hearingsHeld];

    const ac = Number(acRaw);
    const ps = Number(psRaw);
    if (!Number.isFinite(ac) || !Number.isFinite(ps)) continue;

    rows.push({
      acNumber: ac,
      pollingStation: ps,
      noticeDelivered: Number(deliveredRaw) || 0,
      hearingsHeld: Number(heldRaw) || 0,
    });
  }

  if (rows.length === 0) {
    throw new EciParseError(
      "File parse ho gayi lekin AC-34 (Matiala) ke liye koi valid rows nahi mile. File check karein."
    );
  }

  const ac34Count = rows.filter((r) => r.acNumber === AC_NUMBER).length;
  if (ac34Count === 0) {
    throw new EciParseError(
      "Is file mein AC Number 34 (Matiala) ka data nahi mila. Kripya AC-34 Matiala ki ECI file upload karein."
    );
  }

  return {
    rows,
    uploadedAt: new Date().toISOString(),
    fileName: file.name,
  };
}

/** Sum Notice Delivered / Hearings Held for a given PS No. within AC 34, mirroring the sheet's SUMIFS logic. */
export function buildEciLookup(dataset: EciDataset): Map<number, { delivered: number; held: number }> {
  const map = new Map<number, { delivered: number; held: number }>();
  for (const row of dataset.rows) {
    if (row.acNumber !== AC_NUMBER) continue;
    const existing = map.get(row.pollingStation) ?? { delivered: 0, held: 0 };
    existing.delivered += row.noticeDelivered;
    existing.held += row.hearingsHeld;
    map.set(row.pollingStation, existing);
  }
  return map;
}
