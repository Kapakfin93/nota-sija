import { ItemBarang } from "../types/transaksi";

export function formatRupiah(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export function formatAngka(val: number | undefined | null): string {
  return new Intl.NumberFormat("id-ID").format(Number(val) || 0);
}

export function formatBulanLabel(bulanStr: string): string {
  // bulanStr format: "MM_YY" contoh "09_26"
  const parts = bulanStr.split("_");
  if (parts.length !== 2) return bulanStr;
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const mIndex = parseInt(parts[0], 10) - 1;
  const year = 2000 + parseInt(parts[1], 10);
  if (mIndex >= 0 && mIndex < 12) {
    return `${monthNames[mIndex]} ${year}`;
  }
  return bulanStr;
}

// Helper: YYYY-MM-DD -> DD/MM/YY (split string, aman dari timezone shift)
export function fmtDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y.slice(-2)}`;
}

// Helper: DD/MM/YY atau DD/MM/YY/NN -> YYYY-MM-DD (untuk input date HTML5)
export function parseShortDateToIso(shortDate?: string): string | null {
  if (!shortDate) return null;
  const parts = shortDate.split("/");
  if (parts.length < 3) return null;
  const [d, m, y] = parts;
  const fullYear = y.length === 2 ? `20${y}` : y;
  return `${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function todayIsoStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function normalizeItemBarang(raw: any): ItemBarang {
  const qty = Number(raw?.qty ?? raw?.volume ?? 1) || 1;
  const hargaSatuan = Number(raw?.hargaSatuan ?? raw?.harga ?? 0) || 0;
  const totalHarga = Number(raw?.totalHarga ?? qty * hargaSatuan) || qty * hargaSatuan;
  return {
    namaBarang: String(raw?.namaBarang || raw?.barang || "").trim(),
    qty,
    satuan: raw?.satuan ? String(raw.satuan).trim() : undefined,
    hargaSatuan,
    totalHarga,
  };
}
