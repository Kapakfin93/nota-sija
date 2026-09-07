import { ISheetRepository } from "../repositories/ISheetRepository";
import { Transaksi } from "../types/transaksi";
import { generateNoDokumen, formatTanggalPendek } from "./documentNumber";

// Layer Business Logic — Mode Proyek: Surat Orderan diterbitkan dulu,
// nomor dokumennya dipakai LAGI saat Nota final diterbitkan untuk
// pekerjaan yang sama (lihat PRD bagian "Alur Data & Penomoran").

export class OrderanService {
  constructor(private repo: ISheetRepository) {}

  async buatSuratOrderan(input: {
    noDokumen?: string; // bisa pakai nomor yang sudah di-generate UI
    tanggalDokumen?: string; // bisa diedit di UI
    namaCustomer: string;
    deskripsi: string;
    waktuPengerjaan: string;
    waktuPengiriman: string;
    items: Transaksi["items"];
  }): Promise<Transaksi> {
    const total = input.items.reduce((sum, i) => sum + i.totalHarga, 0);
    const transaksi: Transaksi = {
      noDokumen: input.noDokumen || generateNoDokumen(),
      mode: "proyek",
      status: "berjalan",
      tanggalDokumen: input.tanggalDokumen || formatTanggalPendek(new Date()),
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

  // Mengambil semua Surat Orderan yang masih berstatus 'berjalan'
  // Logika filter bisnis berada di Layer 2 (Service), repository tetap murni.
  async ambilOrderanBerjalan(): Promise<Transaksi[]> {
    const semua = await this.repo.ambilSemuaTransaksi();
    return semua.filter(t => t.mode === "proyek" && t.status === "berjalan");
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
