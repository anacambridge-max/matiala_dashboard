"use client";

import * as XLSX from "xlsx";
import type { PsDetailRow } from "@/lib/types";
import { formatDateLabel } from "@/lib/formatDate";

interface Props {
  selectedDate: string;
  rows: PsDetailRow[];
}

export default function DownloadReportButton({ selectedDate, rows }: Props) {
  function downloadReport() {
    if (rows.length === 0) return;

    const sortedRows = [...rows].sort(
      (a, b) =>
        a.officer.localeCompare(b.officer) ||
        a.hearingCentre.localeCompare(b.hearingCentre) ||
        a.psNo - b.psNo
    );

    const reportRows = sortedRows.map((r, index) => ({
      "S. No.": index + 1,
      Officer: r.officer,
      "Officer Mobile": r.officerMobile,
      "Hearing Centre": r.hearingCentre,
      "PS No.": r.psNo,
      "Old PS No.": r.oldPsNo ?? "",
      BLO: r.blo,
      "BLO Mobile": r.bloMobile,
      Supervisor: r.supervisor,
      "Supervisor Mobile": r.supervisorMobile,
      Scheduled: r.scheduledNotices,
      Generated: r.noticeGenerated,
      Delivered: r.noticeDelivered,
      Pending: r.noticePendingDelivery,
      "Hearings Held": r.hearingsHeld,
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportRows);
    worksheet["!cols"] = [
      { wch: 7 }, { wch: 24 }, { wch: 15 }, { wch: 38 }, { wch: 9 },
      { wch: 11 }, { wch: 28 }, { wch: 15 }, { wch: 28 }, { wch: 17 },
      { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PS-wise Report");

    const safeDate = selectedDate.replaceAll("-", "_");
    XLSX.writeFile(workbook, `AC34_Matiala_Officer_PS_Report_${safeDate}.xlsx`);
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
      title={disabled ? "No PS are scheduled for this date" : `Download ${displayDate} report`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
      </svg>
      Download Officer-wise PS Report
    </button>
  );
}
