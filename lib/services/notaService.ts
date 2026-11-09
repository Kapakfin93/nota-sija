import { ISheetRepository } from "../repositories/ISheetRepository";
import { Transaksi } from "../types/transaksi";

// Layer Business Logic — hanya bergantung pada INTERFACE repository
// (ISheetRepository), tidak pernah pada implementasi konkretnya.
// Implementasi konkret (sheetsRepository.ts / hybridRepository.ts) di-"suntik"
// dari luar (dependency injection) lewat constructor.

export class NotaService {
  constructor(private repo: ISheetRepository) {}

  async ambilDaftarBulan(): Promise<string[]> {
    return this.repo.ambilDaftarBulan();
  }

  async ambilSemuaTransaksi(bulan?: string): Promise<Transaksi[]> {
    return this.repo.ambilSemuaTransaksi(bulan);
  }

  async updateStatusTransaksi(
    noDokumen: string,
    status: Transaksi["status"]
  ): Promise<void> {
    await this.repo.updateStatus(noDokumen, status);
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
