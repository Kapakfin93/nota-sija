// Tipe data bersama — dipakai di semua layer (presentation, service, repository)

export type ModeTransaksi = "normal" | "proyek";
export type StatusTransaksi = "berjalan" | "tertagih" | "lunas";
export type ModeBagianBawah = "kosong" | "kwitansi" | "nota_kedua";

export interface ItemBarang {
  namaBarang: string;
  qty: number;
  satuan?: string; // dipakai di Surat Orderan
  hargaSatuan: number;
  totalHarga: number;
}

export interface Transaksi {
  noDokumen: string; // format: DD/MM/YY/NN
  mode: ModeTransaksi;
  status: StatusTransaksi;
  tanggalDokumen: string; // DD/MM/YY, bisa diedit manual
  namaCustomer: string;
  deskripsi?: string; // Paket Pesanan (khusus Surat Orderan)
  waktuPengerjaan?: string;
  waktuPengiriman?: string;
  items: ItemBarang[];
  total: number;
  modeBagianBawah: ModeBagianBawah;
  keteranganKwitansi?: string; // isian manual
  linkFoto?: string; // referensi ke file di Google Drive
}
