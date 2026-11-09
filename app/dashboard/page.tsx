"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Transaksi } from "@/lib/types/transaksi";
import { NotaService } from "@/lib/services/notaService";
import { HybridRepository } from "@/lib/repositories/hybridRepository";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { DetailModal } from "@/components/dashboard/DetailModal";

const _repo = new HybridRepository();
const notaService = new NotaService(_repo);

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

  // 1. Ambil daftar bulan yang tersedia melalui Layer 2 (NotaService)
  const fetchMonths = useCallback(async () => {
    try {
      const list = await notaService.ambilDaftarBulan();
      setMonths(list);
      if (list.length > 0 && selectedMonth === "") {
        setSelectedMonth(list[0]);
      }
    } catch (e) {
      console.warn("Gagal memuat daftar bulan:", e);
    }
  }, [selectedMonth]);

  // 2. Ambil transaksi (semua atau per bulan) melalui Layer 2 (NotaService)
  const fetchTransaksi = useCallback(async (monthToFetch?: string) => {
    setIsLoading(true);
    try {
      const targetMonth = monthToFetch !== undefined ? monthToFetch : selectedMonth;
      const list = await notaService.ambilSemuaTransaksi(targetMonth || undefined);
      setTransaksiList(list);
      if (!targetMonth) {
        setAllTransaksi(list);
      }
    } catch (e) {
      console.error("Gagal memuat data transaksi:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  // Initial load: ambil daftar bulan dan metadata count seluruh arsip via NotaService
  useEffect(() => {
    fetchMonths();
    notaService
      .ambilSemuaTransaksi()
      .then((list) => {
        setAllTransaksi(list);
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

  // Update status transaksi melalui Layer 2 (NotaService)
  const handleUpdateStatus = async (noDokumen: string, newStatus: Transaksi["status"]) => {
    setUpdatingDocNo(noDokumen);
    try {
      await notaService.updateStatusTransaksi(noDokumen, newStatus);
      setTransaksiList((prev) =>
        prev.map((t) => (t.noDokumen === noDokumen ? { ...t, status: newStatus } : t))
      );
      setAllTransaksi((prev) =>
        prev.map((t) => (t.noDokumen === noDokumen ? { ...t, status: newStatus } : t))
      );
      if (selectedTransaksi && selectedTransaksi.noDokumen === noDokumen) {
        setSelectedTransaksi({ ...selectedTransaksi, status: newStatus });
      }
    } catch (e: any) {
      alert(`Gagal mengubah status: ${e.message || "Terjadi kesalahan"}`);
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
