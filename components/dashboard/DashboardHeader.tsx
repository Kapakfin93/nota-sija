"use client";

import React from "react";
import Link from "next/link";

interface DashboardHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onRefresh,
  isLoading,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-xl shadow-sm tracking-wider">
            SIJA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                Dashboard Arsip & Audit Nota
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Google Sheets
              </span>
            </div>
            <p className="text-xs text-gray-500">
              CV. Sinar Ilmu Jaya — Monitoring Pembukuan & Pelacakan Transaksi
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Muat ulang data dari Google Sheets"
          >
            <svg
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : "text-gray-500"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isLoading ? "Menyinkronkan..." : "Sinkronkan"}</span>
          </button>

          <Link
            href="/nota"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Buat Nota Baru</span>
          </Link>

          <Link
            href="/orderan"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-xs transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Buat Orderan</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
