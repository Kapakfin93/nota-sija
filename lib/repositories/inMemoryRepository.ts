import { Transaksi } from "../types/transaksi";
import { ISheetRepository } from "./ISheetRepository";

export class InMemoryRepository implements ISheetRepository {
  private data: Map<string, Transaksi> = new Map();

  async simpanTransaksi(transaksi: Transaksi): Promise<void> {
    this.data.set(transaksi.noDokumen, transaksi);
  }

  async ambilTransaksi(noDokumen: string): Promise<Transaksi | null> {
    return this.data.get(noDokumen) || null;
  }

  async ambilSemuaTransaksi(bulan?: string): Promise<Transaksi[]> {
    const semua = Array.from(this.data.values());
    if (bulan) {
      // Filter berdasar format tanggal dokumen "DD/MM/YY" terhadap bulan "MM_YY" atau "MM"
      return semua.filter(t => {
        const parts = t.tanggalDokumen.split("/");
        if (parts.length < 2) return false;
        const mmYy = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : parts[1];
        return mmYy === bulan || parts[1] === bulan;
      });
    }
    return semua;
  }

  async ambilDaftarBulan(): Promise<string[]> {
    const semua = Array.from(this.data.values());
    const months = new Set<string>();
    for (const t of semua) {
      const parts = (t.tanggalDokumen || "").split("/");
      if (parts.length >= 3) {
        months.add(`${parts[1]}_${parts[2]}`);
      }
    }
    return Array.from(months).sort().reverse();
  }

  async updateStatus(noDokumen: string, status: Transaksi["status"]): Promise<void> {
    const transaksi = this.data.get(noDokumen);
    if (transaksi) {
      transaksi.status = status;
      this.data.set(noDokumen, transaksi);
    } else {
        throw new Error(`Transaksi dengan noDokumen ${noDokumen} tidak ditemukan`);
    }
  }
}
