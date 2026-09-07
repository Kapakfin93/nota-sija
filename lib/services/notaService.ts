import { ISheetRepository } from "../repositories/ISheetRepository";
import { Transaksi } from "../types/transaksi";
import { generateNoDokumen, formatTanggalPendek } from "./documentNumber";
import { terbilang } from "./terbilang";

// Layer Business Logic — hanya bergantung pada INTERFACE repository
// (ISheetRepository), tidak pernah pada implementasi konkretnya.
// Implementasi konkret (sheetsRepository.ts) di-"suntik" dari luar
// (dependency injection) lewat constructor. Ini yang membuat service
// ini bisa dites tanpa Google Sheets asli, dan bisa pindah ke DB lain
// tanpa mengubah kode di file ini sama sekali.

export class NotaService {
  constructor(private repo: ISheetRepository) {}

  async buatNotaBaru(input: {
    namaCustomer: string;
    items: Transaksi["items"];
    modeBagianBawah: Transaksi["modeBagianBawah"];
    keteranganKwitansi?: string;
  }): Promise<Transaksi> {
    const total = input.items.reduce((sum, i) => sum + i.totalHarga, 0);
    const transaksi: Transaksi = {
      noDokumen: generateNoDokumen(),
      mode: "normal",
      status: "berjalan",
      tanggalDokumen: formatTanggalPendek(new Date()),
      namaCustomer: input.namaCustomer,
      items: input.items,
      total,
      modeBagianBawah: input.modeBagianBawah,
      keteranganKwitansi: input.keteranganKwitansi,
    };
    await this.repo.simpanTransaksi(transaksi);
    return transaksi;
  }

  terbilangTotal(transaksi: Transaksi, kapital = false): string {
    return terbilang(transaksi.total, { kapital });
  }
}
