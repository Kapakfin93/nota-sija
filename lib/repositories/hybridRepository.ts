import { Transaksi } from "../types/transaksi";
import { ISheetRepository } from "./ISheetRepository";
import { LocalStorageRepository } from "./localStorageRepository";

export class HybridRepository implements ISheetRepository {
  private localRepo: LocalStorageRepository;

  constructor() {
    this.localRepo = new LocalStorageRepository();
  }

  async simpanTransaksi(data: Transaksi): Promise<void> {
    // 1. Simpan ke LocalStorage seketika (garansi kecepatan UI & offline safety)
    await this.localRepo.simpanTransaksi(data);

    // 2. Sinkronisasi ke Google Sheets via Server API
    if (typeof window !== "undefined") {
      try {
        fetch("/api/transaksi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }).catch(err => {
          console.warn("[HybridRepository] Gagal sinkronisasi background ke Google Sheets:", err);
        });
      } catch (err) {
        console.warn("[HybridRepository] Error trigger sync ke Google Sheets:", err);
      }
    }
  }

  async ambilTransaksi(noDokumen: string): Promise<Transaksi | null> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/transaksi?noDokumen=${encodeURIComponent(noDokumen)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            // Update cache lokal
            await this.localRepo.simpanTransaksi(json.data);
            return json.data;
          }
        }
      } catch (e) {
        console.warn("[HybridRepository] Gagal fetch dari API, fallback ke LocalStorage:", e);
      }
    }
    return this.localRepo.ambilTransaksi(noDokumen);
  }

  async ambilSemuaTransaksi(bulan?: string): Promise<Transaksi[]> {
    if (typeof window !== "undefined") {
      try {
        const url = bulan ? `/api/transaksi?bulan=${encodeURIComponent(bulan)}` : "/api/transaksi";
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            // Update cache lokal untuk setiap transaksi yang ditarik
            for (const t of json.data) {
              await this.localRepo.simpanTransaksi(t);
            }
            return json.data;
          }
        }
      } catch (e) {
        console.warn("[HybridRepository] Gagal fetch semua transaksi, fallback ke LocalStorage:", e);
      }
    }
    return this.localRepo.ambilSemuaTransaksi(bulan);
  }

  async ambilDaftarBulan(): Promise<string[]> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/transaksi?action=daftarBulan");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
        }
      } catch (e) {
        console.warn("[HybridRepository] Gagal fetch daftarBulan, fallback ke LocalStorage:", e);
      }
    }
    return this.localRepo.ambilDaftarBulan();
  }

  async updateStatus(noDokumen: string, status: Transaksi["status"]): Promise<void> {
    // 1. Update lokal
    await this.localRepo.updateStatus(noDokumen, status);

    // 2. Update Google Sheets
    if (typeof window !== "undefined") {
      try {
        fetch("/api/transaksi", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noDokumen, status }),
        }).catch(err => {
          console.warn("[HybridRepository] Gagal sync update status ke Google Sheets:", err);
        });
      } catch (e) {
        console.warn("[HybridRepository] Error trigger updateStatus API:", e);
      }
    }
  }
}
