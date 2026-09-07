import { ISheetRepository } from "../repositories/ISheetRepository";
import { Transaksi } from "../types/transaksi";
import { generateNoDokumen, formatTanggalPendek } from "./documentNumber";

// Layer Business Logic — Mode Proyek: Surat Orderan diterbitkan dulu,
// nomor dokumennya dipakai LAGI saat Nota final diterbitkan untuk
// pekerjaan yang sama (lihat PRD bagian "Alur Data & Penomoran").

export class OrderanService {
  constructor(private repo: ISheetRepository) {}

  async buatSuratOrderan(input: {
    namaCustomer: string;
    deskripsi: string;
    waktuPengerjaan: string;
    waktuPengiriman: string;
    items: Transaksi["items"];
  }): Promise<Transaksi> {
    const total = input.items.reduce((sum, i) => sum + i.totalHarga, 0);
    const transaksi: Transaksi = {
      noDokumen: generateNoDokumen(),
      mode: "proyek",
      status: "berjalan",
      tanggalDokumen: formatTanggalPendek(new Date()),
      namaCustomer: input.namaCustomer,
      deskripsi: input.deskripsi,
      waktuPengerjaan: input.waktuPengerjaan,
      waktuPengiriman: input.waktuPengiriman,
      items: input.items,
      total,
      modeBagianBawah: "kosong",
    };
    await this.repo.simpanTransaksi(transaksi);
    return transaksi;
  }

  // Dipanggil saat pekerjaan proyek selesai — nomor dokumen TIDAK berubah,
  // cuma status yang bergeser dari "berjalan" ke "tertagih".
  async terbitkanNotaDariOrderan(noDokumen: string): Promise<Transaksi> {
    const existing = await this.repo.ambilTransaksi(noDokumen);
    if (!existing) throw new Error(`Surat Orderan ${noDokumen} tidak ditemukan`);
    await this.repo.updateStatus(noDokumen, "tertagih");
    return { ...existing, status: "tertagih" };
  }
}
