"use client";

import { useState, useMemo } from "react";
import { formatBulanLabel } from "@/lib/utils/format";

interface MonthSelectorProps {
  months: string[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  countsPerMonth?: Record<string, number>;
  totalAll?: number;
}

interface MonthItem {
  code: string;       // e.g. "11_26"
  monthNum: number;   // 11
  label: string;      // "November 2026"
  monthOnly: string;  // "November"
  count?: number;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  months,
  selectedMonth,
  onSelectMonth,
  countsPerMonth = {},
  totalAll,
}) => {
  // Kelompokkan bulan berdasarkan Tahun (contoh: "2026")
  const groupedByYear = useMemo(() => {
    const map: Record<string, MonthItem[]> = {};

    for (const m of months) {
      const parts = m.split("_");
      if (parts.length === 2) {
        const mm = parseInt(parts[0], 10);
        const yy = parseInt(parts[1], 10);
        const fullYear = `20${yy}`;

        const monthNames = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const monthOnly = monthNames[mm - 1] || `Bulan ${mm}`;

        if (!map[fullYear]) {
          map[fullYear] = [];
        }

        map[fullYear].push({
          code: m,
          monthNum: mm,
          label: formatBulanLabel(m),
          monthOnly,
          count: countsPerMonth[m],
        });
      }
    }

    // Urutkan tahun terbaru di atas dan bulan terbaru di kiri/atas
    const sortedYears: Record<string, MonthItem[]> = {};
    const years = Object.keys(map).sort().reverse();
    for (const y of years) {
      sortedYears[y] = map[y].sort((a, b) => b.monthNum - a.monthNum);
    }
    return sortedYears;
  }, [months, countsPerMonth]);

  const years = useMemo(() => Object.keys(groupedByYear), [groupedByYear]);

  // Default: buka tahun dari bulan terpilih, atau tahun pertama
  const initialYear = useMemo(() => {
    if (selectedMonth) {
      const parts = selectedMonth.split("_");
      if (parts.length === 2) return `20${parts[1]}`;
    }
    return years[0] || "2026";
  }, [selectedMonth, years]);

  const [expandedYear, setExpandedYear] = useState<string | null>(initialYear);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleYear = (year: string) => {
    setExpandedYear((prev) => (prev === year ? null : year));
  };

  const activeLabel = useMemo(() => {
    if (!selectedMonth) return "Semua Arsip";
    return formatBulanLabel(selectedMonth);
  }, [selectedMonth]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* ── Top Bar: Active Indicator & Mobile Toggle ── */}
      <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-900 flex items-center justify-center text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Periode Arsip:
            </span>
            <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-700 animate-pulse" />
              {activeLabel}
            </span>
          </div>
        </div>

        {/* Toggle Burger untuk Mobile / Tampilan Ringkas */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="sm:hidden px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-2xs hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Pilih Tahun & Bulan</span>
        </button>
      </div>

      {/* ── Main Navigation: Tahun Accordion Breakdown Bulan ── */}
      <div className={`p-3 space-y-2.5 ${isMobileMenuOpen ? "block" : "hidden sm:block"}`}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Semua Arsip */}
          <button
            type="button"
            onClick={() => {
              onSelectMonth("");
              setIsMobileMenuOpen(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
              selectedMonth === ""
                ? "bg-blue-900 text-white border-blue-900 shadow-xs"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span>Semua Arsip</span>
            {typeof totalAll === "number" && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedMonth === ""
                    ? "bg-blue-800 text-blue-100"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {totalAll}
              </span>
            )}
          </button>

          {/* Tahun Accordion Buttons */}
          {years.map((year) => {
            const isExpanded = expandedYear === year;
            const monthsInYear = groupedByYear[year] || [];
            const hasSelectedMonthInYear = monthsInYear.some((m) => m.code === selectedMonth);
            const totalYearTransactions = monthsInYear.reduce((acc, m) => acc + (m.count || 0), 0);

            return (
              <div key={year} className="relative inline-block">
                <button
                  type="button"
                  onClick={() => toggleYear(year)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                    hasSelectedMonthInYear
                      ? "bg-blue-50 text-blue-900 border-blue-300 shadow-2xs"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Tahun {year}</span>
                  {totalYearTransactions > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-700 font-bold">
                      {totalYearTransactions}
                    </span>
                  )}
                  {/* Panah Chevron Indikator Breakdown */}
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-blue-900" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Sub-level: Breakdown Bulan dari Tahun yang Sedang Terbuka ── */}
        {expandedYear && groupedByYear[expandedYear] && (
          <div className="pt-2 pb-1 px-3 bg-gray-50/70 border border-gray-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <svg className="w-3 h-3 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>Pilih Bulan ({expandedYear}):</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {groupedByYear[expandedYear].map((item) => {
                const isSelected = selectedMonth === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      onSelectMonth(item.code);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? "bg-blue-900 text-white border-blue-900 shadow-2xs"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span>{item.monthOnly}</span>
                    {typeof item.count === "number" && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isSelected
                            ? "bg-blue-800 text-blue-100"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
