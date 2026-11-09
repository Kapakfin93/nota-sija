"use client";

import React from "react";
import { formatRupiah, formatAngka } from "@/lib/utils/format";

interface SummaryCardsProps {
  totalOmzet: number;
  totalTransaksi: number;
  totalLunas: number;
  totalTertagih: number;
  nominalLunas: number;
  nominalTertagih: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalOmzet,
  totalTransaksi,
  totalLunas,
  totalTertagih,
  nominalLunas,
  nominalTertagih,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Card 1: Total Omzet */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs relative overflow-hidden sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Omzet Arsip
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {formatRupiah(totalOmzet)}
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-blue-900">{formatAngka(totalTransaksi)}</span>
            <span>transaksi terdata di periode ini</span>
          </p>
        </div>
      </div>

      {/* Card 2: Status Lunas */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Sudah Lunas
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatRupiah(nominalLunas)}
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-600">{formatAngka(totalLunas)}</span>
            <span>nota dengan bukti kwitansi / lunas</span>
          </p>
        </div>
      </div>

      {/* Card 3: Status Tertagih / Piutang */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
            Tertagih (Belum Lunas)
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-black text-amber-700 tracking-tight">
            {formatRupiah(nominalTertagih)}
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-amber-600">{formatAngka(totalTertagih)}</span>
            <span>nota menunggu konfirmasi pembayaran</span>
          </p>
        </div>
      </div>
    </div>
  );
};
