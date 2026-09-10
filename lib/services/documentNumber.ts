// Layer Business Logic — tidak tahu apa-apa soal Sheets/Drive maupun UI.
// Format final (disepakati): DD/MM/YY/NN — nomor unik random, TANPA slug
// customer, TANPA prefix "NOTA-" (label dokumen sudah terwakili terpisah
// di badge tampilan). Sengaja random (bukan sequential) karena tanggal
// dokumen kadang perlu dimundurkan sesuai permintaan customer.

export function generateNoDokumen(tanggal: Date = new Date()): string {
  const dd = String(tanggal.getDate()).padStart(2, "0");
  const mm = String(tanggal.getMonth() + 1).padStart(2, "0");
  const yy = String(tanggal.getFullYear()).slice(-2);
  const uniq = Math.floor(10 + Math.random() * 90); // 2 digit
  return `${dd}/${mm}/${yy}/${uniq}`;
}

export function formatTanggalPendek(tanggal: Date): string {
  const dd = String(tanggal.getDate()).padStart(2, "0");
  const mm = String(tanggal.getMonth() + 1).padStart(2, "0");
  const yy = String(tanggal.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/**
 * Memperbarui segmen tanggal (DD/MM/YY) pada nomor dokumen saat user mengubah input tanggal,
 * dengan tetap mempertahankan nomor unik (NN) 2-digit di bagian belakang.
 * Contoh: ("07/09/26/65", "2026-12-25") -> "25/12/26/65"
 */
export function updateNoDokumenTanggal(noDokumen: string, dateStr: string): string {
  if (!dateStr) return noDokumen;
  const parts = dateStr.split("-"); // format standar input HTML5 date: YYYY-MM-DD
  if (parts.length !== 3) return noDokumen;
  const [y, m, d] = parts;
  const newDatePrefix = `${d}/${m}/${y.slice(-2)}`;

  if (!noDokumen) {
    const uniq = Math.floor(10 + Math.random() * 90);
    return `${newDatePrefix}/${uniq}`;
  }

  const noParts = noDokumen.split("/");
  // Format standar: DD/MM/YY/NN (4 bagian) -> ambil bagian unik terakhir (NN)
  const uniq =
    noParts.length >= 4
      ? noParts[noParts.length - 1]
      : Math.floor(10 + Math.random() * 90).toString();

  return `${newDatePrefix}/${uniq}`;
}

/**
 * Format nama file PDF saat download/cetak.
 * Contoh output: sija-unimus-07-09-26-65
 * Menghilangkan karakter ilegal file system (/ \ : * ? " < > |)
 */
export function formatPdfFileName(options: {
  customLabel?: string;
  noDokumen: string;
  prefix?: string;
}): string {
  const prefix = options.prefix || "sija";

  // 1. Sanitasi label penyesuaian: buang karakter ilegal sistem file
  const rawLabel = options.customLabel?.trim() || "nota";
  const cleanLabel = rawLabel
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/gi, "")
    .replace(/\s+/g, "-") || "nota";

  // 2. Sanitasi nomor dokumen: ubah '/' menjadi '-'
  const cleanNo = options.noDokumen.replace(/\//g, "-");

  return `${prefix}-${cleanLabel}-${cleanNo}`;
}
