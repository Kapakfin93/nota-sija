export function formatRupiah(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export function formatAngka(val: number): string {
  return new Intl.NumberFormat("id-ID").format(val || 0);
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
