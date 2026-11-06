"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Transaksi } from "@/lib/types/transaksi";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { DetailModal } from "@/components/dashboard/DetailModal";

export default function DashboardPage() {
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [allTransaksi, setAllTransaksi] = useState<Transaksi[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingDocNo, setUpdatingDocNo] = useState<string | null>(null);

  // Modal State
  const [selectedTransaksi, setSelectedTransaksi] = useState<Transaksi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 1. Fetch daftar bulan yang tersedia di Google Sheets
  const fetchMonths = useCallback(async () => {
    try {
      const res = await fetch("/api/transaksi?action=daftarBulan");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMonths(json.data);
          // Set default bulan pertama jika ada dan selectedMonth belum di-set
          if (json.data.length > 0 && selectedMonth === "") {
            setSelectedMonth(json.data[0]);
          }
        }
      }
    } catch (e) {
      console.warn("Gagal memuat daftar bulan:", e);
    }
  }, [selectedMonth]);

  // 2. Fetch transaksi (semua atau per bulan)
  const fetchTransaksi = useCallback(async (monthToFetch?: string) => {
    setIsLoading(true);
    try {
      const targetMonth = monthToFetch !== undefined ? monthToFetch : selectedMonth;
      const url = targetMonth
        ? `/api/transaksi?bulan=${encodeURIComponent(targetMonth)}`
        : "/api/transaksi";

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTransaksiList(json.data);
          if (!targetMonth) {
            setAllTransaksi(json.data);
          }
        }
      }
    } catch (e) {
      console.error("Gagal memuat data transaksi:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  // Initial load: ambil daftar bulan dan data transaksi
  useEffect(() => {
    fetchMonths();
    // Tarik metadata count seluruh arsip di background
    fetch("/api/transaksi")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setAllTransaksi(res.data);
        }
      })
      .catch((err) => console.warn("Background count fetch failed:", err));
  }, [fetchMonths]);

  useEffect(() => {
    fetchTransaksi(selectedMonth);
  }, [selectedMonth, fetchTransaksi]);


  // Hitung jumlah nota per bulan untuk badge di tab selector
  const countsPerMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tx of allTransaksi) {
      const parts = (tx.tanggalDokumen || "").split("/");
      if (parts.length === 3) {
        const key = `${parts[1]}_${parts[2]}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    return counts;
  }, [allTransaksi]);

  // Hitung agregasi metrik finansial
  const metrics = useMemo(() => {
    let totalOmzet = 0;
    let totalLunas = 0;
    let totalTertagih = 0;
    let nominalLunas = 0;
    let nominalTertagih = 0;

    for (const tx of transaksiList) {
      const amount = Number(tx.total) || 0;
      totalOmzet += amount;
      if (tx.status === "lunas") {
        totalLunas += 1;
        nominalLunas += amount;
      } else {
        totalTertagih += 1;
        nominalTertagih += amount;
      }
    }

    return {
      totalOmzet,
      totalTransaksi: transaksiList.length,
      totalLunas,
      totalTertagih,
      nominalLunas,
      nominalTertagih,
    };
  }, [transaksiList]);

  // Update status transaksi langsung ke server & Google Sheets
  const handleUpdateStatus = async (noDokumen: string, newStatus: Transaksi["status"]) => {
    setUpdatingDocNo(noDokumen);
    try {
      const res = await fetch("/api/transaksi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noDokumen, status: newStatus }),
      });

      if (res.ok) {
        // Optimistic UI update
        setTransaksiList((prev) =>
          prev.map((t) => (t.noDokumen === noDokumen ? { ...t, status: newStatus } : t))
        );
        if (selectedTransaksi && selectedTransaksi.noDokumen === noDokumen) {
          setSelectedTransaksi({ ...selectedTransaksi, status: newStatus });
        }
      } else {
        const err = await res.json();
        alert(`Gagal mengubah status: ${err.error || "Terjadi kesalahan"}`);
      }
    } catch (e: any) {
      alert(`Gagal koneksi ke server: ${e.message}`);
    } finally {
      setUpdatingDocNo(null);
    }
  };

  const handleOpenDetail = (tx: Transaksi) => {
    setSelectedTransaksi(tx);
    setIsModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsModalOpen(false);
    setSelectedTransaksi(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col text-gray-900">
      {/* 1. Header Modular */}
      <DashboardHeader
        onRefresh={() => {
          fetchMonths();
          fetchTransaksi(selectedMonth);
        }}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* 2. Month Selector Tabs */}
        <MonthSelector
          months={months}
          selectedMonth={selectedMonth}
          onSelectMonth={(m) => setSelectedMonth(m)}
          countsPerMonth={countsPerMonth}
          totalAll={allTransaksi.length > 0 ? allTransaksi.length : undefined}
        />

        {/* 3. Summary Financial Cards */}
        <SummaryCards
          totalOmzet={metrics.totalOmzet}
          totalTransaksi={metrics.totalTransaksi}
          totalLunas={metrics.totalLunas}
          totalTertagih={metrics.totalTertagih}
          nominalLunas={metrics.nominalLunas}
          nominalTertagih={metrics.nominalTertagih}
        />

        {/* 4. Transaction Audit Table */}
        <TransactionTable
          transaksiList={transaksiList}
          onOpenDetail={handleOpenDetail}
          onUpdateStatus={handleUpdateStatus}
          isUpdatingStatus={updatingDocNo}
        />
      </main>

      {/* 5. Detail & Cloning Modal */}
      <DetailModal
        transaksi={selectedTransaksi}
        isOpen={isModalOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
