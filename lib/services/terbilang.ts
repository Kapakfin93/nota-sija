// Layer Business Logic — konversi angka ke teks Bahasa Indonesia sesuai EYD.

const BILANGAN = [
  "", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan",
  "sembilan", "sepuluh", "sebelas",
];

function terbilangRaw(a: number): string {
  if (a < 12) return " " + BILANGAN[a];
  if (a < 20) return terbilangRaw(a - 10) + " belas";
  if (a < 100) return terbilangRaw(Math.floor(a / 10)) + " puluh" + terbilangRaw(a % 10);
  if (a < 200) return " seratus" + terbilangRaw(a - 100);
  if (a < 1000) return terbilangRaw(Math.floor(a / 100)) + " ratus" + terbilangRaw(a % 100);
  if (a < 2000) return " seribu" + terbilangRaw(a - 1000);
  if (a < 1000000) return terbilangRaw(Math.floor(a / 1000)) + " ribu" + terbilangRaw(a % 1000);
  if (a < 1000000000) return terbilangRaw(Math.floor(a / 1000000)) + " juta" + terbilangRaw(a % 1000000);
  if (a < 1000000000000) return terbilangRaw(Math.floor(a / 1000000000)) + " miliar" + terbilangRaw(a % 1000000000);
  return terbilangRaw(Math.floor(a / 1000000000000)) + " triliun" + terbilangRaw(a % 1000000000000);
}

export interface TerbilangOptions {
  kapital?: boolean;
  style?: "title" | "upper" | "sentence";
}

/**
 * Mengonversi nominal angka ke kalimat terbilang rupiah baku EYD.
 * Default: Title Case ("Enam Puluh Delapan Juta Tiga Ratus Tujuh Puluh Tujuh Ribu Lima Ratus Rupiah")
 * Jika kapital: true atau style: "upper": ALL CAPS ("ENAM PULUH DELAPAN JUTA ... RUPIAH")
 */
export function terbilang(nominal: number, opts?: TerbilangOptions): string {
  const n = Math.floor(Math.abs(nominal || 0));
  const isUpper = opts?.kapital === true || opts?.style === "upper";
  const isSentence = opts?.style === "sentence";

  if (n === 0) {
    if (isUpper) return "NOL RUPIAH";
    if (isSentence) return "Nol rupiah";
    return "Nol Rupiah";
  }

  const teks = terbilangRaw(n).replace(/\s+/g, " ").trim();

  if (isUpper) {
    return `${teks} rupiah`.toUpperCase();
  }

  if (isSentence) {
    return `${teks.charAt(0).toUpperCase()}${teks.slice(1)} rupiah`;
  }

  // Format default: Title Case (Setiap Awal Kata Huruf Kapital)
  return `${teks} rupiah`
    .split(" ")
    .map((kata) => (kata.length > 0 ? kata.charAt(0).toUpperCase() + kata.slice(1) : ""))
    .join(" ");
}
