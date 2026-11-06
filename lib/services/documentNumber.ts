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
 * dan secara otomatis membuat 2-digit nomor unik baru (NN) agar fleksibel maju/mundur
 * serta tidak menimpa nota lama di arsip.
 * Contoh: ("04/09/26/53", "2026-09-10") -> "10/09/26/78" (angka acak baru)
 */
export function updateNoDokumenTanggal(
  noDokumen: string,
  dateStr: string,
  regenerateUniq: boolean = true
): string {
  if (!dateStr) return noDokumen;
  const parts = dateStr.split("-"); // format standar input HTML5 date: YYYY-MM-DD
  if (parts.length !== 3) return noDokumen;
  const [y, m, d] = parts;
  const newDatePrefix = `${d}/${m}/${y.slice(-2)}`;

  let uniq = Math.floor(10 + Math.random() * 90).toString();
  if (!regenerateUniq && noDokumen) {
    const noParts = noDokumen.split("/");
    if (noParts.length >= 4) {
      uniq = noParts[noParts.length - 1];
    }
  }

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

/**
 * Format angka dengan separator ribuan titik (contoh: 1401 -> "1.401")
 * dan desimal koma jika ada pecahan (contoh: 1.5 -> "1,5").
 */
export function formatAngkaId(val: number | string): string {
  if (val === undefined || val === null || val === "") return "";
  const num = typeof val === "string" ? parseFloat(val.replace(/,/g, ".")) : val;
  if (isNaN(num)) return String(val);
  return num.toLocaleString("id-ID", { maximumFractionDigits: 3 });
}

/**
 * Format volume beserta satuan untuk tampilan kolom Nota (contoh: 1401 + "pcs" -> "1.401 pcs")
 */
export function formatVolume(qty: number | string, satuan?: string): string {
  const angkaStr = formatAngkaId(qty);
  if (!angkaStr) return "";
  return satuan && satuan.trim() ? `${angkaStr} ${satuan.trim()}` : angkaStr;
}

/**
 * Format string input harga saat user mengetik:
 * Membersihkan karakter non-digit dan titik, memformat digit bulat dengan ribuan titik (id-ID),
 * dan mempertahankan koma desimal jika ada (contoh: "6500" -> "6.500", "22500,5" -> "22.500,5").
 */
export function formatRupiahInput(raw: string | number): string {
  if (raw === undefined || raw === null || raw === "") return "";
  const str = String(raw).trim();
  if (!str) return "";

  // Hapus semua karakter kecuali angka dan koma
  const clean = str.replace(/\./g, "").replace(/[^0-9,]/g, "");
  if (!clean) return "";

  const parts = clean.split(",");
  const bulat = parts[0] ? Number(parts[0]).toLocaleString("id-ID") : "";
  const desimal = parts.length > 1 ? "," + parts.slice(1).join("").slice(0, 2) : "";

  return bulat + desimal;
}

/**
 * Parsing string berformat rupiah (contoh: "6.500" atau "22.500,5") menjadi angka number JavaScript.
 */
export function parseRupiahInput(formattedStr: string | number): number {
  if (typeof formattedStr === "number") return isNaN(formattedStr) ? 0 : formattedStr;
  if (!formattedStr) return 0;
  const normalized = String(formattedStr)
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .trim();
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}


