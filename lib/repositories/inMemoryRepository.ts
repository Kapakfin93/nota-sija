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
      // Filter berdasar format tanggal dokumen "DD/MM/YY"
      return semua.filter(t => {
        const parts = t.tanggalDokumen.split('/');
        // parts[1] adalah bulan (MM)
        return parts.length >= 2 && parts[1] === bulan;
      });
    }
    return semua;
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
