"use client";

import type { PsDetailRow } from "@/lib/types";
import { formatDateLabel } from "@/lib/formatDate";

interface Props {
  selectedDate: string;
  rows: PsDetailRow[];
}

const OFFICER_ORDER = [
  "SH. PARVEEN KUMAR",
  "SH. RAKESH KUMAR",
  "SH. SUBHASHISH",
  "SH. VIRENDER",
  "SMT. PARUL GUPTA",
  "SMT. SHASHI BALA",
];

const CENTRE_ORDER = [
  "GCSSS, SEC-3 DWARKA(P)",
  "GCSSC SEC-22 DWARKA(R)",
  "MCD Boys PRIMARY SCHOOL, QUTUB VIHAR",
  "GCSSS SEC 22 DWARKA(V)",
  "GGSSS GHUMANHERA",
  "VREC MATIALA",
  "GCSSS, SEC-3 DWARKA(S)",
];

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const ROW_HEIGHT = 17;
const HEADER_HEIGHT = 20;
const SECTION_HEIGHT = 31;
const FOOTER_Y = 18;

function ascii(value: string) {
  return String(value ?? "").replace(/[^\x20-\x7E]/g, "?");
}

function pdfEscape(value: string) {
  return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function textOp(
  text: string,
  x: number,
  y: number,
  size = 8,
  font = "F1",
  color = "0.12 0.15 0.18"
) {
  return `${color} rg BT /${font} ${size} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${pdfEscape(text)}) Tj ET`;
}

function fitText(value: string, maxChars: number) {
  const clean = ascii(String(value ?? "").replace(/\s+/g, " ").trim());
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(1, maxChars - 3))}...`;
}

function makePdf(pageStreams: string[]) {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    "<< /Type /Pages /Kids [" +
      pageStreams.map((_, i) => `${6 + i * 2} 0 R`).join(" ") +
      `] /Count ${pageStreams.length} >>`
  );
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pageStreams.forEach((stream) => {
    const contentObject = objects.length + 1;
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`
    );
  });

  let pdf = "%PDF-1.4\n%\xFF\xFF\xFF\xFF\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

export default function DownloadReportButton({ selectedDate, rows }: Props) {
  function downloadReport() {
    if (rows.length === 0) return;

    const officerRank = (officer: string) => {
      const index = OFFICER_ORDER.indexOf(officer);
      return index === -1 ? OFFICER_ORDER.length : index;
    };
    const centreRank = (centre: string) => {
      const index = CENTRE_ORDER.indexOf(centre);
      return index === -1 ? CENTRE_ORDER.length : index;
    };

    const sortedRows = [...rows].sort(
      (a, b) =>
        officerRank(a.officer) - officerRank(b.officer) ||
        centreRank(a.hearingCentre) - centreRank(b.hearingCentre) ||
        a.psNo - b.psNo
    );

    const label = formatDateLabel(selectedDate);
    const displayDate = `${label.day} ${label.date} ${label.month}`;

    const col = {
      sno: MARGIN,
      officer: MARGIN + 29,
      centre: MARGIN + 132,
      ps: MARGIN + 307,
      blo: MARGIN + 346,
      supervisor: MARGIN + 454,
      scheduled: MARGIN + 590,
      delivered: MARGIN + 651,
      pending: MARGIN + 713,
    };

    const buildPage = (pageRows: PsDetailRow[], pageNumber: number, totalPages: number, firstPage: boolean) => {
      const ops: string[] = [];
      let y = PAGE_HEIGHT - 32;

      if (firstPage) {
        ops.push(textOp("AC-34 MATIALA", MARGIN, y, 17, "F2", "0.10 0.16 0.22"));
        ops.push(textOp("OFFICER-WISE HEARING & NOTICE DELIVERY REPORT", MARGIN, y - 21, 10, "F2", "0.20 0.24 0.28"));
        ops.push(textOp(`Hearing Date: ${displayDate}`, MARGIN, y - 38, 9, "F1", "0.30 0.34 0.38"));
        y -= 58;
      } else {
        ops.push(textOp(`AC-34 MATIALA  |  ${displayDate}`, MARGIN, y, 11, "F2", "0.12 0.16 0.20"));
        y -= 27;
      }

      const headerY = y;
      ops.push("0.12 0.17 0.23 rg");
      ops.push(`${MARGIN} ${headerY - HEADER_HEIGHT + 4} ${CONTENT_WIDTH} ${HEADER_HEIGHT} re f`);
      const hy = headerY - 14;
      ops.push(textOp("S.No.", col.sno + 3, hy, 7.5, "F2", "1 1 1"));
      ops.push(textOp("OFFICER", col.officer, hy, 7.5, "F2", "1 1 1"));
      ops.push(textOp("HEARING CENTRE", col.centre, hy, 7.5, "F2", "1 1 1"));
      ops.push(textOp("PS", col.ps, hy, 7.5, "F2", "1 1 1"));
      ops.push(textOp("BLO", col.blo, hy, 7.5, "F2", "1 1 1"));
      ops.push(textOp("SUPERVISOR", col.supervisor, hy, 7.5, "F2", "1 1 1"));
      ops.push(textOp("SCHEDULED", col.scheduled, hy, 7.5, "F2", "1 1 1"));
      ops.push(textOp("DELIVERED", col.delivered, hy, 7.5, "F2", "1 1 1"));
      ops.push(textOp("PENDING DELIVERY", col.pending, hy, 7.5, "F2", "1 1 1"));
      y = headerY - HEADER_HEIGHT;

      let previousOfficer = "";
      let previousCentre = "";
      let index = 0;

      for (const r of pageRows) {
        if (r.officer !== previousOfficer || r.hearingCentre !== previousCentre) {
          if (y - SECTION_HEIGHT < 45) break;
          ops.push("0.92 0.94 0.96 rg");
          ops.push(`${MARGIN} ${y - SECTION_HEIGHT + 5} ${CONTENT_WIDTH} ${SECTION_HEIGHT} re f`);
          ops.push(textOp(r.officer, MARGIN + 8, y - 13, 9, "F2", "0.10 0.16 0.22"));
          ops.push(textOp(r.hearingCentre, MARGIN + 8, y - 26, 7.5, "F1", "0.28 0.32 0.36"));
          y -= SECTION_HEIGHT;
          previousOfficer = r.officer;
          previousCentre = r.hearingCentre;
        }

        if (y - ROW_HEIGHT < 43) break;
        const baseY = y - 12;
        if (index % 2 === 1) {
          ops.push("0.975 0.98 0.985 rg");
          ops.push(`${MARGIN} ${y - ROW_HEIGHT + 2} ${CONTENT_WIDTH} ${ROW_HEIGHT} re f`);
        }
        ops.push(textOp(String(r.psNo), col.sno + 6, baseY, 8, "F1"));
        ops.push(textOp(fitText(r.officer.replace(/^SH\. |^SMT\. /, ""), 18), col.officer, baseY, 7.2));
        ops.push(textOp(fitText(r.hearingCentre, 28), col.centre, baseY, 7.2));
        ops.push(textOp(String(r.psNo), col.ps, baseY, 8));
        ops.push(textOp(fitText(r.blo, 18), col.blo, baseY, 7.2));
        ops.push(textOp(fitText(r.supervisor, 21), col.supervisor, baseY, 7.2));
        ops.push(textOp(String(r.scheduledNotices), col.scheduled + 10, baseY, 8, "F2"));
        ops.push(textOp(String(r.noticeDelivered), col.delivered + 10, baseY, 8, "F2", "0.08 0.42 0.18"));
        const pending = Number(r.noticePendingDelivery ?? 0);
        ops.push(textOp(String(pending), col.pending + 10, baseY, 8.5, "F2", pending > 0 ? "0.72 0.08 0.08" : "0.18 0.45 0.22"));
        index += 1;
        y -= ROW_HEIGHT;
      }

      if (pageNumber === totalPages) {
        y = Math.max(y, 52);
        ops.push("0.12 0.17 0.23 rg");
        ops.push(`${MARGIN} ${y - 23} ${CONTENT_WIDTH} 23 re f`);
        ops.push(textOp("TOTAL", MARGIN + 8, y - 16, 8.5, "F2", "1 1 1"));
        ops.push(textOp(String(sortedRows.length), col.ps, y - 16, 8.5, "F2", "1 1 1"));
        ops.push(textOp(String(sortedRows.reduce((s, r) => s + Number(r.scheduledNotices ?? 0), 0)), col.scheduled + 10, y - 16, 8.5, "F2", "1 1 1"));
        ops.push(textOp(String(sortedRows.reduce((s, r) => s + Number(r.noticeDelivered ?? 0), 0)), col.delivered + 10, y - 16, 8.5, "F2", "1 1 1"));
        ops.push(textOp(String(sortedRows.reduce((s, r) => s + Number(r.noticePendingDelivery ?? 0), 0)), col.pending + 10, y - 16, 8.5, "F2", "1 1 1"));
      }

      ops.push("0.78 0.80 0.83 RG 0.6 w");
      ops.push(`${MARGIN} ${FOOTER_Y + 12} ${CONTENT_WIDTH} 0 l S`);
      ops.push(textOp("Pending Delivery = notices still awaiting delivery as reported by ECI", MARGIN, FOOTER_Y, 6.5, "F1", "0.35 0.38 0.42"));
      ops.push(textOp(`Page ${pageNumber} of ${totalPages}`, PAGE_WIDTH - 90, FOOTER_Y, 6.5, "F1", "0.35 0.38 0.42"));
      return ops.join("\n");
    };

    const pages: PsDetailRow[][] = [];
    let current: PsDetailRow[] = [];
    let currentHeight = PAGE_HEIGHT - 135;
    let lastSection = "";
    for (const row of sortedRows) {
      const section = `${row.officer}\u0000${row.hearingCentre}`;
      const extra = section !== lastSection ? SECTION_HEIGHT : 0;
      if (current.length > 0 && currentHeight - ROW_HEIGHT - extra < 55) {
        pages.push(current);
        current = [];
        currentHeight = PAGE_HEIGHT - 85;
      }
      current.push(row);
      currentHeight -= ROW_HEIGHT + extra;
      lastSection = section;
    }
    if (current.length) pages.push(current);

    if (pages.length > 0) {
      const final = pages[pages.length - 1];
      if (final.length > 1 && final.length > 20) {
        pages[pages.length - 1] = final.slice(0, -1);
        pages.push(final.slice(-1));
      }
    }

    const totalPages = pages.length;
    const streams = pages.map((page, i) => buildPage(page, i + 1, totalPages, i === 0));
    const pdf = makePdf(streams);
    const blob = new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `AC34_Matiala_Hearing_Report_${selectedDate}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const disabled = rows.length === 0;
  const label = formatDateLabel(selectedDate);
  const displayDate = `${label.day} ${label.date} ${label.month}`;

  return (
    <button
      type="button"
      onClick={downloadReport}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-md border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      title={disabled ? "No PS are scheduled for this date" : `Download ${displayDate} PDF report`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
      </svg>
      Download PDF Report
    </button>
  );
}
