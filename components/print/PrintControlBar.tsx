"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface PrintControlBarProps {
  backHref: string;
  backText?: string;
  targetFileName: string;
  fileHint?: string;
}

export function PrintControlBar({
  backHref,
  backText = "Kembali ke Form",
  targetFileName,
  fileHint = "Nama otomatis tersugesti saat Save as PDF",
}: PrintControlBarProps) {
  const router = useRouter();

  return (
    <div className="no-print w-full max-w-[210mm] mb-3 px-3 pt-[max(env(safe-area-inset-top),0.75rem)] flex flex-wrap items-center justify-between gap-2 text-white text-sm">
      <button
        onClick={() => router.push(backHref)}
        className="min-h-[40px] bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition active:scale-95 text-xs sm:text-sm"
      >
        <i className="fa-solid fa-arrow-left" /> {backText}
      </button>

      <div className="hidden sm:flex flex-col items-center text-xs text-gray-300">
        <span>
          Target File:{" "}
          <strong className="text-white font-mono">{targetFileName}</strong>
        </span>
        <span className="text-[10px] text-gray-400">{fileHint}</span>
      </div>

      <button
        onClick={() => window.print()}
        className="min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow flex items-center gap-1.5 transition active:scale-95 text-xs sm:text-sm"
      >
        <i className="fa-solid fa-print" /> Cetak Sekarang
      </button>
    </div>
  );
}
