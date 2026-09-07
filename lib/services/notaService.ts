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

  /**
   * Simpan (upsert) transaksi dengan nomor yang SUDAH ADA — tidak generate
   * nomor baru. Dipakai saat finalisasi/print supaya nomor di layar == nomor
   * yang tersimpan di repository.
   *
   * Penentuan status bisnis:
   * 1. Jika modeBagianBawah === "kwitansi", berarti transaksi sudah lunas bayar -> "lunas".
   * 2. Jika tanpa kwitansi:
   *    - Jika ini berasal dari Orderan (record lama mode "proyek" atau sudah "tertagih") -> "tertagih".
   *    - Jika nota biasa baru terbit tanpa kwitansi -> "tertagih" (nota sudah diterbitkan ke pelanggan).
   * 3. Jika record lama sudah "lunas", pertahankan "lunas".
   */
  async simpanTransaksiSaatIni(input: {
    noDokumen: string;          // pakai nomor yang sudah tampil di UI
    tanggalDokumen: string;     // format DD/MM/YY
    namaCustomer: string;
    items: Transaksi["items"];
    modeBagianBawah: Transaksi["modeBagianBawah"];
    keteranganKwitansi?: string;
  }): Promise<Transaksi> {
    const existing = await this.repo.ambilTransaksi(input.noDokumen);
    const total = input.items.reduce((sum, i) => sum + i.totalHarga, 0);

    let status: Transaksi["status"] = "tertagih";
    if (input.modeBagianBawah === "kwitansi") {
      status = "lunas";
    } else if (existing && existing.status === "lunas") {
      status = "lunas";
    } else {
      status = "tertagih";
    }

    const transaksi: Transaksi = {
      noDokumen: input.noDokumen,   // nomor tidak di-generate ulang
      mode: "normal",               // sudah final sebagai nota penagihan
      status,
      tanggalDokumen: input.tanggalDokumen,
      namaCustomer: input.namaCustomer,
      items: input.items,
      total,
      modeBagianBawah: input.modeBagianBawah,
      keteranganKwitansi: input.keteranganKwitansi,
    };
    await this.repo.simpanTransaksi(transaksi);
    return transaksi;
  }
}
