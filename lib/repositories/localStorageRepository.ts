import { Transaksi } from "../types/transaksi";
import { ISheetRepository } from "./ISheetRepository";

const STORAGE_KEY = "eSijaTransaksi";

export class LocalStorageRepository implements ISheetRepository {
  private getStorageData(): Transaksi[] {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("[LocalStorageRepository] Gagal parse eSijaTransaksi, fallback ke []:", e);
      return [];
    }
  }

  private saveStorageData(list: Transaksi[]): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("[LocalStorageRepository] Gagal simpan ke eSijaTransaksi:", e);
    }
  }

  async simpanTransaksi(transaksi: Transaksi): Promise<void> {
    const list = this.getStorageData();
    const idx = list.findIndex(t => t.noDokumen === transaksi.noDokumen);
    if (idx >= 0) {
      list[idx] = transaksi; // upsert timpa data lama jika noDokumen sama
    } else {
      list.push(transaksi);
    }
    this.saveStorageData(list);
  }

  async ambilTransaksi(noDokumen: string): Promise<Transaksi | null> {
    const list = this.getStorageData();
    const item = list.find(t => t.noDokumen === noDokumen);
    return item || null;
  }

  async ambilSemuaTransaksi(bulan?: string): Promise<Transaksi[]> {
    const list = this.getStorageData();
    if (!bulan) return list;

    // Format tanggalDokumen adalah "DD/MM/YY"
    return list.filter(t => {
      if (!t.tanggalDokumen) return false;
      const parts = t.tanggalDokumen.split("/");
      return parts.length >= 2 && parts[1] === bulan;
    });
  }

  async updateStatus(noDokumen: string, status: Transaksi["status"]): Promise<void> {
    const list = this.getStorageData();
    const item = list.find(t => t.noDokumen === noDokumen);
    if (item) {
      item.status = status;
      this.saveStorageData(list);
    } else {
      throw new Error(`Transaksi dengan noDokumen ${noDokumen} tidak ditemukan di repository`);
    }
  }
}

