"use client";

import React, { useState, useMemo } from "react";
import { Transaksi } from "@/lib/types/transaksi";
import { formatRupiah, formatAngka } from "@/lib/utils/format";

interface TransactionTableProps {
  transaksiList: Transaksi[];
  onOpenDetail: (transaksi: Transaksi) => void;
  onUpdateStatus: (noDokumen: string, status: Transaksi["status"]) => Promise<void>;
  isUpdatingStatus?: string | null;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transaksiList,
  onOpenDetail,
  onUpdateStatus,
  isUpdatingStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredData = useMemo(() => {
    return transaksiList.filter((item) => {
      // 1. Filter status
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // 2. Filter search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const matchNo = (item.noDokumen || "").toLowerCase().includes(term);
      const matchCust = (item.namaCustomer || "").toLowerCase().includes(term);
      const matchBarang = (item.items || []).some((i) =>
        (i.namaBarang || "").toLowerCase().includes(term)
      );

      return matchNo || matchCust || matchBarang;
    });
  }, [transaksiList, searchTerm, statusFilter]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Controls Bar: Search & Status Filter */}
      <div className="p-3.5 border-b border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor nota, customer, atau barang..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-gray-800 placeholder-gray-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <span className="text-xs text-gray-500 font-medium mr-1">Status:</span>
          {(["all", "tertagih", "lunas"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-blue-900 text-white font-semibold"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              {st === "all" ? "Semua" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card List (<640px) — menghindari scroll horizontal 8 kolom di layar HP */}
      <div className="sm:hidden divide-y divide-gray-200 bg-white">
        {filteredData.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-xs">
            <p className="font-medium text-gray-600">Tidak ada data transaksi yang sesuai.</p>
            <p className="text-[11px] text-gray-400 mt-1">
              {searchTerm ? "Coba kata kunci pencarian lain." : "Belum ada transaksi di periode bulan ini."}
            </p>
          </div>
        ) : (
          filteredData.map((tx) => {
            const isPending = isUpdatingStatus === tx.noDokumen;
            return (
              <div key={`mob-${tx.noDokumen}`} className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {tx.noDokumen}
                    </span>
                    <span className="text-[11px] text-gray-500">{tx.tanggalDokumen}</span>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      const nextStatus: Transaksi["status"] =
                        tx.status === "lunas" ? "tertagih" : "lunas";
                      onUpdateStatus(tx.noDokumen, nextStatus);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                      tx.status === "lunas"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-amber-50 text-amber-700 border-amber-300"
                    } ${isPending ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        tx.status === "lunas" ? "bg-emerald-600" : "bg-amber-600"
                      }`}
                    />
                    <span className="capitalize">{tx.status}</span>
                  </button>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-gray-900 truncate">
                      {tx.namaCustomer || "-"}
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5 space-y-0.5">
                      {tx.items && tx.items.length > 0 ? (
                        tx.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="truncate">
                            • {item.namaBarang}{" "}
                            <span className="text-gray-400">
                              ({formatAngka(item.qty)} {item.satuan || "pcs"})
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">Tanpa rincian item</span>
                      )}
                      {tx.items && tx.items.length > 2 && (
                        <div className="text-[10px] text-blue-800 font-medium">
                          +{tx.items.length - 2} item lainnya...
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-gray-900">
                      {formatRupiah(tx.total)}
                    </div>
                    <div className="mt-1">
                      {tx.modeBagianBawah === "kwitansi" ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          + Kwitansi
                        </span>
                      ) : tx.modeBagianBawah === "nota_kedua" ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Nota Rangkap 2
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                          Standar
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(tx)}
                    className="w-full justify-center inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Lihat Rincian / Kloning Nota</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop & Tablet Table Container (>=640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
          <thead className="bg-gray-100/80 text-gray-700 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="px-4 py-3">No. Dokumen</th>
              <th scope="col" className="px-3 py-3">Tanggal</th>
              <th scope="col" className="px-4 py-3">Customer</th>
              <th scope="col" className="px-4 py-3">Item Barang & Volume</th>
              <th scope="col" className="px-4 py-3 text-right">Total Nilai</th>
              <th scope="col" className="px-3 py-3 text-center">Bagian Bawah</th>
              <th scope="col" className="px-3 py-3 text-center">Status</th>
              <th scope="col" className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-medium text-gray-600">Tidak ada data transaksi yang sesuai.</p>
                    <p className="text-[11px] text-gray-400">
                      {searchTerm ? "Coba kata kunci pencarian lain." : "Belum ada transaksi di periode bulan ini."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((tx) => {
                const isPending = isUpdatingStatus === tx.noDokumen;
                return (
                  <tr key={tx.noDokumen} className="hover:bg-blue-50/40 transition-colors">
                    {/* No Dokumen */}
                    <td className="px-4 py-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {tx.noDokumen}
                    </td>

                    {/* Tanggal */}
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                      {tx.tanggalDokumen}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {tx.namaCustomer || "-"}
                    </td>

                    {/* Item Barang & Volume */}
                    <td className="px-4 py-3 text-gray-700">
                      <div className="space-y-1">
                        {tx.items && tx.items.length > 0 ? (
                          tx.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="font-medium text-gray-900">{item.namaBarang}</span>
                              <span className="text-gray-400">({formatAngka(item.qty)} {item.satuan || "pcs"})</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">Tanpa rincian item</span>
                        )}
                        {tx.items && tx.items.length > 2 && (
                          <span className="text-[10px] text-blue-800 font-medium">
                            +{tx.items.length - 2} item lainnya...
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Nilai */}
                    <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                      {formatRupiah(tx.total)}
                    </td>

                    {/* Mode Bagian Bawah */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {tx.modeBagianBawah === "kwitansi" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          + Kwitansi
                        </span>
                      ) : tx.modeBagianBawah === "nota_kedua" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Nota Rangkap 2
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                          Standar
                        </span>
                      )}

                    </td>

                    {/* Status Badge & Interactive Toggle */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          const nextStatus: Transaksi["status"] =
                            tx.status === "lunas" ? "tertagih" : "lunas";
                          onUpdateStatus(tx.noDokumen, nextStatus);
                        }}
                        title={`Klik untuk ubah status ke ${tx.status === "lunas" ? "tertagih" : "lunas"}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          tx.status === "lunas"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                        } ${isPending ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tx.status === "lunas" ? "bg-emerald-600" : "bg-amber-600"
                          }`}
                        />
                        <span className="capitalize">{tx.status}</span>
                        {isPending && (
                          <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin ml-0.5" />
                        )}
                      </button>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Audit / Klon</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer Info */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>Menampilkan {filteredData.length} dari {transaksiList.length} transaksi</span>
        <span className="italic text-[11px] text-gray-400">Tip: Klik badge status untuk mengubah status bayar seketika</span>
      </div>
    </div>
  );
};
