import { Transaksi } from "../types/transaksi";

// Kontrak layer Data Access. Layer Service (lib/services) hanya boleh
// bergantung pada interface ini, TIDAK PERNAH pada implementasi konkretnya
// (sheetsRepository.ts). Ini yang bikin nanti gampang pindah dari Google
// Sheets ke database lain tanpa mengubah satu baris pun di lib/services/.

export interface ISheetRepository {
  simpanTransaksi(data: Transaksi): Promise<void>;
  ambilTransaksi(noDokumen: string): Promise<Transaksi | null>;
  ambilSemuaTransaksi(bulan?: string): Promise<Transaksi[]>; // filter per bulan, lihat PRD
  updateStatus(noDokumen: string, status: Transaksi["status"]): Promise<void>;
}
