// Layer Business Logic — konversi angka ke teks Bahasa Indonesia.
// Port langsung dari logic yang sudah teruji di baseline HTML (v8).

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
  return terbilangRaw(Math.floor(a / 1000000000)) + " miliar" + terbilangRaw(a % 1000000000);
}

export function terbilang(nominal: number, opts?: { kapital?: boolean }): string {
  const teks = terbilangRaw(Math.floor(nominal)).trim();
  const hasil = (teks.charAt(0).toUpperCase() + teks.slice(1) + " Rupiah");
  return opts?.kapital ? hasil.toUpperCase() : hasil;
}
