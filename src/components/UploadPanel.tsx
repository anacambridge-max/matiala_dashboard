"use client";

import { useRef, useState } from "react";
import type { EciDataset } from "@/lib/types";
import { parseEciFile, EciParseError } from "@/lib/eciParser";
import { formatTimestamp } from "@/lib/formatDate";

interface Props {
  currentDataset: EciDataset | null;
  onLoaded: (dataset: EciDataset) => void;
}

export default function UploadPanel({ currentDataset, onLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const dataset = await parseEciFile(file);
      onLoaded(dataset);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setErrorMsg(
        e instanceof EciParseError
          ? e.message
          : "File padhne mein error aayi. Kripya valid ECI Excel file upload karein."
      );
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="font-serif text-base font-semibold text-navy">
            ECI Report Upload
          </h2>
          <p className="text-sm text-ink-soft mt-0.5">
            Har 2 ghante mein latest ECI &lsquo;NOTICE_REPORT_PART_WISE&rsquo; file upload
            karein — Notice Delivered aur Hearings Held apne aap update ho jayenge.
          </p>
        </div>
        {currentDataset && (
          <div className="text-right text-xs shrink-0">
            <div className="text-ink-soft">Last update</div>
            <div className="font-medium text-navy">
              {formatTimestamp(currentDataset.uploadedAt)}
            </div>
          </div>
        )}
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 cursor-pointer transition-colors ${
          dragOver ? "border-accent bg-warning-bg" : "border-border hover:border-navy-light"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-8 h-8 text-navy-light"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 8.25 12 3.75m0 0L7.5 8.25M12 3.75v13.5" />
        </svg>
        <div className="text-sm text-ink text-center">
          <span className="font-medium text-navy">ECI Excel file yahan drop karein</span>
          {" "}ya click karke chunein
        </div>
        <div className="text-xs text-ink-soft">.xlsx / .xls faaile supported</div>
      </label>

      {status === "loading" && (
        <div className="mt-3 text-sm text-navy-light">File process ho rahi hai…</div>
      )}
      {status === "error" && (
        <div className="mt-3 rounded-md bg-danger-bg text-danger text-sm px-3 py-2">
          {errorMsg}
        </div>
      )}
      {currentDataset && status === "idle" && (
        <div className="mt-3 rounded-md bg-success-bg text-success text-sm px-3 py-2">
          &lsquo;{currentDataset.fileName}&rsquo; se data load hai — dashboard is file ke
          hisaab se dikh raha hai.
        </div>
      )}
      {!currentDataset && status === "idle" && (
        <div className="mt-3 rounded-md bg-warning-bg text-warning text-sm px-3 py-2">
          Abhi tak koi ECI file upload nahi hui — Notice Delivered / Hearings Held 0 dikh
          rahe hain jab tak file upload na ho.
        </div>
      )}
    </div>
  );
}
