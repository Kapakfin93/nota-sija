"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  generateNoDokumen,
  formatPdfFileName,
  updateNoDokumenTanggal,
  formatRupiahInput,
  parseRupiahInput,
} from "../../lib/services/documentNumber";
import {
  formatAngka,
  fmtDate,
  parseShortDateToIso,
  todayIsoStr,
  normalizeItemBarang,
} from "../../lib/utils/format";
import {
  PrintStyles,
  DocumentHeader,
  DocumentTable,
  DocumentSignature,
  KwitansiBlock,
} from "../../components/print";
import { NotaService } from "../../lib/services/notaService";
import { OrderanService } from "../../lib/services/orderanService";
import { HybridRepository } from "../../lib/repositories/hybridRepository";
import { ItemBarang, Transaksi } from "../../lib/types/transaksi";

// --- Module-level singleton: satu instance per session browser ---
// Sesuai 3-layer: Presentation layer hanya boleh panggil Service, tidak repo langsung.
const _repo = new HybridRepository();
const notaService = new NotaService(_repo);
const orderanService = new OrderanService(_repo);

const STORAGE_KEY = "eNotaSija";

// Mapping UI mode string → Transaksi["modeBagianBawah"] type
function toModeBagianBawah(mode: string): Transaksi["modeBagianBawah"] {
  if (mode === "kwitansi") return "kwitansi";
  if (mode === "nota2") return "nota_kedua";
  return "kosong";
}

const SATUAN_OPSI = ["pcs", "rim", "lembar", "unit", "M2", "buku"];

export default function NotaPage() {
  const router = useRouter();
  // ─── State ───────────────────────────────────────────────────────────────
  const [isLoaded, setIsLoaded] = useState(false); // guard: jangan save sebelum load selesai

  // Modal Tarik dari Orderan Proyek
  const [isOrderanModalOpen, setIsOrderanModalOpen] = useState(false);
  const [orderanList, setOrderanList] = useState<Transaksi[]>([]);
  const [sourceOrderanNo, setSourceOrderanNo] = useState<string | null>(null);

  // Nota 1
  const [noDokumen, setNoDokumen] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [namaCustomer, setNamaCustomer] = useState("");
  const [fileLabel, setFileLabel] = useState(""); // label penyesuaian nama file PDF
  const [bottomMode, setBottomMode] = useState("none");
  const [ketKwitansi, setKetKwitansi] = useState("");
  const [sertakanStempel, setSertakanStempel] = useState(false);

  const [items, setItems] = useState<ItemBarang[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState<number | "">("");
  const [itemSatuan, setItemSatuan] = useState("");
  const [itemPrice, setItemPrice] = useState<string>("");
  const [editIdx, setEditIdx] = useState<number | null>(null); // null = mode tambah

  // Nota 2
  const [noDokumen2, setNoDokumen2] = useState("");
  const [tanggal2, setTanggal2] = useState("");
  const [namaCustomer2, setNamaCustomer2] = useState("");
  const [items2, setItems2] = useState<ItemBarang[]>([]);
  const [item2Name, setItem2Name] = useState("");
  const [item2Qty, setItem2Qty] = useState<number | "">("");
  const [item2Satuan, setItem2Satuan] = useState("");
  const [item2Price, setItem2Price] = useState<string>("");
  const [editIdx2, setEditIdx2] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState("input");
  const [fitToScreen, setFitToScreen] = useState(true); // mode pas layar untuk mobile preview

  // ─── Mount: load dari localStorage (sekali) ───────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const loadedItems = Array.isArray(d.items) ? d.items.map(normalizeItemBarang) : [];
        setItems(loadedItems);
        setNoDokumen(d.no || d.noDokumen || generateNoDokumen());
        setTanggal(d.date || d.tanggal || todayIsoStr());
        setNamaCustomer(d.cust || d.customer || d.namaCustomer || "");
        setFileLabel(d.fileLabel || "");
        // Kompatibel data lama (field 'kwitansi' boolean dari versi sebelumnya)
        const mode = d.bottomMode || (d.kwitansi ? "kwitansi" : "none");
        setBottomMode(mode);
        setKetKwitansi(d.ket || d.kwitansiKet || d.keteranganKwitansi || "");
        setSertakanStempel(Boolean(d.sertakanStempel || d.showStempel));
        const loadedItems2 = Array.isArray(d.items2) ? d.items2.map(normalizeItemBarang) : [];
        setItems2(loadedItems2);
        setNoDokumen2(d.no2 || d.noDokumen2 || generateNoDokumen());
        setTanggal2(d.date2 || d.tanggal2 || todayIsoStr());
        setNamaCustomer2(d.cust2 || d.customer2 || d.namaCustomer2 || "");
      } else {
        // Nota baru — generate nomor pertama kali
        setNoDokumen(generateNoDokumen());
        setNoDokumen2(generateNoDokumen());
        setTanggal(todayIsoStr());
        setTanggal2(todayIsoStr());
        setFileLabel("");
        setSertakanStempel(false);
      }
    } catch {
      // localStorage corrupt — mulai bersih
      setNoDokumen(generateNoDokumen());
      setNoDokumen2(generateNoDokumen());
      setTanggal(todayIsoStr());
      setTanggal2(todayIsoStr());
      setFileLabel("");
      setSertakanStempel(false);
    }
    setIsLoaded(true);
  }, []);


  // ─── Simpan ke localStorage setiap kali state berubah (setelah load) ─────
  useEffect(() => {
    if (!isLoaded || !noDokumen) return; // tunggu sampai load selesai
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items,
        no: noDokumen,
        date: tanggal,
        cust: namaCustomer,
        fileLabel,
        bottomMode,
        ket: ketKwitansi,
        sertakanStempel,
        items2,
        no2: noDokumen2,
        date2: tanggal2,
        cust2: namaCustomer2,
      })
    );
  }, [
    isLoaded, items, noDokumen, tanggal, namaCustomer, fileLabel,
    bottomMode, ketKwitansi, sertakanStempel, items2, noDokumen2, tanggal2, namaCustomer2,
  ]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const total = items.reduce(
    (s, i) => s + (Number(i.totalHarga) || (Number(i.qty) * Number(i.hargaSatuan)) || 0),
    0
  );

  // Nama file PDF dinamis: sija-[label]-[nomor]. Digunakan untuk <title> dan "Save as PDF"
  const dynamicFileName = formatPdfFileName({
    customLabel: fileLabel || namaCustomer,
    noDokumen: noDokumen || "draft",
  });

  // Sinkronisasi document.title dan listener sebelum dialog print dipicu
  useEffect(() => {
    if (noDokumen) {
      document.title = dynamicFileName;
    }
    const onBeforePrint = () => {
      document.title = dynamicFileName;
    };
    window.addEventListener("beforeprint", onBeforePrint);
    return () => window.removeEventListener("beforeprint", onBeforePrint);
  }, [dynamicFileName, noDokumen]);

  // ─── Reset Nota Baru ──────────────────────────────────────────────────────
  const resetAll = () => {
    if (!confirm("Buat nota baru? Semua data saat ini akan dihapus.")) return;
    const today = todayIsoStr();
    setItems([]);
    setItems2([]);
    setNoDokumen(generateNoDokumen()); // nomor baru hanya di sini & mount
    setNoDokumen2(generateNoDokumen());
    setTanggal(today);
    setTanggal2(today);
    setNamaCustomer("");
    setNamaCustomer2("");
    setFileLabel("");
    setBottomMode("none");
    setKetKwitansi("");
    // Clear form draft
    setEditIdx(null);
    setItemName(""); setItemQty(""); setItemSatuan(""); setItemPrice("");
    setEditIdx2(null);
    setItem2Name(""); setItem2Qty(""); setItem2Satuan(""); setItem2Price("");
    localStorage.removeItem(STORAGE_KEY);
  };

  // ─── CRUD Items — Nota 1 ──────────────────────────────────────────────────
  const addItem = () => {
    const hargaNum = parseRupiahInput(itemPrice);
    if (!itemName.trim() || itemQty === "" || hargaNum <= 0) return;
    const q = Number(itemQty) || 1;
    const newItem: ItemBarang = {
      namaBarang: itemName.trim(),
      qty: q,
      satuan: itemSatuan.trim() || undefined,
      hargaSatuan: hargaNum,
      totalHarga: q * hargaNum,
    };
    if (editIdx !== null) {
      // Mode edit: replace item di posisi yang sama
      const updated = [...items];
      updated[editIdx] = newItem;
      setItems(updated);
      cancelEdit();
    } else {
      setItems([...items, newItem]);
      setItemName(""); setItemQty(""); setItemSatuan(""); setItemPrice("");
    }
  };

  const startEdit = (i: number) => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) setActiveTab("input");
    const d = items[i];
    setItemName(d.namaBarang);
    setItemQty(d.qty);
    setItemSatuan(d.satuan || "");
    setItemPrice(formatRupiahInput(d.hargaSatuan));
    setEditIdx(i);
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setItemName(""); setItemQty(""); setItemSatuan(""); setItemPrice("");
  };

  const removeItem = (i: number) => {
    if (!confirm("Hapus item?")) return;
    const updated = [...items];
    updated.splice(i, 1);
    setItems(updated);
    if (editIdx === i) cancelEdit();
  };

  // ─── CRUD Items — Nota 2 ──────────────────────────────────────────────────
  const addItem2 = () => {
    const hargaNum = parseRupiahInput(item2Price);
    if (!item2Name.trim() || item2Qty === "" || hargaNum <= 0) return;
    const q = Number(item2Qty) || 1;
    const newItem: ItemBarang = {
      namaBarang: item2Name.trim(),
      qty: q,
      satuan: item2Satuan.trim() || undefined,
      hargaSatuan: hargaNum,
      totalHarga: q * hargaNum,
    };
    if (editIdx2 !== null) {
      const updated = [...items2];
      updated[editIdx2] = newItem;
      setItems2(updated);
      cancelEdit2();
    } else {
      setItems2([...items2, newItem]);
      setItem2Name(""); setItem2Qty(""); setItem2Satuan(""); setItem2Price("");
    }
  };

  const startEdit2 = (i: number) => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) setActiveTab("input");
    const d = items2[i];
    setItem2Name(d.namaBarang);
    setItem2Qty(d.qty);
    setItem2Satuan(d.satuan || "");
    setItem2Price(formatRupiahInput(d.hargaSatuan));
    setEditIdx2(i);
  };

  const cancelEdit2 = () => {
    setEditIdx2(null);
    setItem2Name(""); setItem2Qty(""); setItem2Satuan(""); setItem2Price("");
  };

  const removeItem2 = (i: number) => {
    if (!confirm("Hapus item?")) return;
    const updated = [...items2];
    updated.splice(i, 1);
    setItems2(updated);
    if (editIdx2 === i) cancelEdit2();
  };

  // ─── Modal Tarik Orderan Handler ──────────────────────────────────────────
  const bukaModalOrderan = async () => {
    try {
      const list = await orderanService.ambilOrderanBerjalan();
      setOrderanList(list);
      setIsOrderanModalOpen(true);
    } catch (e) {
      console.error("Gagal mengambil daftar orderan berjalan:", e);
      alert("Gagal memuat daftar orderan aktif.");
    }
  };

  const pilihOrderan = (orderan: Transaksi) => {
    // Option B: Tarik data ke form HANYA mengisi state input UI (tanpa side-effects ke ledger)
    setNoDokumen(orderan.noDokumen);
    const orderanIsoDate = parseShortDateToIso(orderan.tanggalDokumen) || parseShortDateToIso(orderan.noDokumen);
    if (orderanIsoDate) {
      setTanggal(orderanIsoDate);
    }
    setNamaCustomer(orderan.namaCustomer);
    setFileLabel(orderan.namaCustomer.split("\n")[0].trim());
    setItems(
      orderan.items.map((it) => ({
        namaBarang: it.namaBarang,
        qty: it.qty,
        satuan: it.satuan || "",
        hargaSatuan: it.hargaSatuan,
        totalHarga: it.totalHarga,
      }))
    );
    setSourceOrderanNo(orderan.noDokumen);
    setIsOrderanModalOpen(false);
  };

  const batalHubungkanOrderan = () => {
    setSourceOrderanNo(null);
  };

  // ─── Print: validasi input, konfirmasi simpan, upsert ke repository & redirect ke /nota/print ───
  const handlePrint = async () => {
    // 1. Validasi Input Kredibilitas Data
    if (!namaCustomer.trim()) {
      alert("Nama Customer belum diisi. Mohon lengkapi sebelum melanjutkan.");
      return;
    }
    if (items.length === 0) {
      alert("Daftar barang masih kosong. Mohon tambahkan minimal 1 barang.");
      return;
    }
    if (bottomMode === "nota2" && items2.length === 0) {
      const lanjut = window.confirm(
        "Mode 'Nota Kedua' aktif tetapi barang di Nota Kedua masih kosong.\nLanjutkan cetak?"
      );
      if (!lanjut) return;
    }

    // 2. Simpan state terkini ke localStorage secara sinkron sebelum navigasi
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          items,
          no: noDokumen,
          date: tanggal,
          cust: namaCustomer,
          fileLabel,
          bottomMode,
          ket: ketKwitansi,
          sertakanStempel,
          items2,
          no2: noDokumen2,
          date2: tanggal2,
          cust2: namaCustomer2,
        })
      );
    } catch (e) {
      console.error("Gagal simpan ke localStorage:", e);
    }

    // 3. Validasi Opsi Simpan ke Arsip (Google Sheets & Local Ledger)
    const simpanKeArsip = window.confirm(
      "Apakah Anda ingin menyimpan transaksi ini ke Buku Arsip Bulanan?\n\n• [OK] = Simpan ke Arsip & Buka Cetak\n• [Cancel] = Cetak Saja (Tanpa Simpan ke Arsip)"
    );

    if (simpanKeArsip) {
      try {
        // Option B: Transisi status Orderan ("berjalan" -> "tertagih") HANYA terjadi saat print/finalisasi nota
        if (sourceOrderanNo) {
          await orderanService.terbitkanNotaDariOrderan(sourceOrderanNo);
        }

        // Simpan Nota Utama (Atas)
        await notaService.simpanTransaksiSaatIni({
          noDokumen,
          tanggalDokumen: fmtDate(tanggal),
          namaCustomer,
          items,
          modeBagianBawah: toModeBagianBawah(bottomMode),
          keteranganKwitansi:
            bottomMode === "nota2"
              ? `Pasangan Cetak A4: ${noDokumen2 || "-"}`
              : ketKwitansi,
        });

        // Jika mode nota2 aktif dan ada item di nota kedua, simpan Nota Kedua juga sebagai transaksi independen
        if (bottomMode === "nota2" && items2.length > 0) {
          await notaService.simpanTransaksiSaatIni({
            noDokumen: noDokumen2,
            tanggalDokumen: fmtDate(tanggal2),
            namaCustomer: namaCustomer2.trim() || namaCustomer,
            items: items2,
            modeBagianBawah: "nota_kedua",
            keteranganKwitansi: `Pasangan Cetak A4: ${noDokumen}`,
          });
        }
      } catch (e) {
        console.error("[notaService] Gagal simpan ke arsip:", e);
        alert("Peringatan: Gagal menyimpan ke arsip cloud. Dokumen tetap dicetak.");
      }
    }

    // 4. Beralih ke halaman cetak murni tanpa UI input
    router.push("/nota/print");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden flex-col lg:flex-row">
      <title>{dynamicFileName}</title>

      {/* ================================================================ */}
      {/* TAB 1: INPUT                                                      */}
      {/* ================================================================ */}
      <div
        className={`no-print ${
          activeTab === "input" ? "block" : "hidden"
        } lg:block w-full lg:w-[400px] h-full overflow-y-auto border-r border-gray-300 bg-white pb-20 lg:pb-0 shrink-0`}
      >
        {/* Header sticky */}
        <div className="p-3 sm:p-4 sticky top-0 z-10 shadow-md flex flex-wrap justify-between items-center gap-2 text-white bg-blue-900">
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            <h1 className="font-bold text-sm sm:text-lg truncate mr-1">
              <i className="fa-solid fa-pen-to-square mr-1" /> Input Nota
            </h1>
            <Link
              href="/dashboard"
              className="text-[11px] sm:text-xs bg-emerald-600/80 hover:bg-emerald-600 px-2 py-1 rounded flex items-center gap-1 transition active:scale-95 text-white font-medium shadow-xs"
            >
              <i className="fa-solid fa-chart-line" /> Dashboard
            </Link>
            <Link
              href="/orderan"
              className="text-[11px] sm:text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded flex items-center gap-1 transition active:scale-95"
            >
              <i className="fa-solid fa-file-signature" /> Orderan
            </Link>
          </div>
          <button
            onClick={resetAll}
            className="text-[11px] sm:text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded transition active:scale-95"
          >
            Reset
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* Info Nota */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
            {/* Tombol Tarik dari Orderan Proyek */}
            <div className="flex items-center justify-between pb-1 border-b border-gray-200">
              <span className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1.5">
                <i className="fa-solid fa-file-invoice text-blue-900" /> Dokumen Nota
              </span>
              <button
                type="button"
                onClick={bukaModalOrderan}
                className="text-[11px] bg-blue-900 hover:bg-blue-800 text-white px-2.5 py-1 rounded font-medium flex items-center gap-1 transition shadow-sm active:scale-95"
              >
                <i className="fa-solid fa-file-import" /> Tarik dari Orderan Proyek
              </button>
            </div>

            {/* Indikator Orderan Terhubung */}
            {sourceOrderanNo && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-900 text-xs px-2.5 py-1.5 rounded">
                <div className="flex items-center gap-1.5 truncate">
                  <i className="fa-solid fa-link text-amber-700" />
                  <span className="truncate">
                    Terhubung ke Orderan: <strong className="font-mono">{sourceOrderanNo}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={batalHubungkanOrderan}
                  title="Lepas koneksi orderan"
                  className="text-amber-700 hover:text-red-700 ml-2 text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">No. Nota</label>
                <input
                  type="text"
                  value={noDokumen}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-100 font-mono"
                />
              </div>
              <div className="w-1/2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTanggal(val);
                    setNoDokumen((prevNo) => updateNoDokumenTanggal(prevNo, val));
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Kepada Yth.</label>
              <textarea
                value={namaCustomer}
                onChange={(e) => setNamaCustomer(e.target.value)}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded text-sm placeholder-gray-400"
                placeholder="Nama Pelanggan..."
              />
            </div>

            {/* Label Penyesuaian Nama File PDF */}
            <div className="pt-1 border-t border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Label File PDF (Opsional)
                </label>
                <span className="text-[10px] text-blue-800 font-mono font-semibold truncate max-w-[200px]" title="Nama file yang disarankan browser saat Save as PDF">
                  {formatPdfFileName({ customLabel: fileLabel || namaCustomer, noDokumen })}.pdf
                </span>
              </div>
              <input
                type="text"
                value={fileLabel}
                onChange={(e) => setFileLabel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm placeholder-gray-400 font-mono text-xs"
                placeholder={namaCustomer ? `Default: ${namaCustomer.split('\n')[0].trim()}` : "misal: unimus / souvenir..."}
              />
              <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                Otomatis disarankan browser saat memilih <em>Save as PDF</em> (format: <code>sija-[label]-[nomor].pdf</code>).
              </p>
            </div>
          </div>

          {/* Mode Bagian Bawah */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <span className="text-sm font-bold text-gray-700 block mb-2">
              <i className="fa-solid fa-layer-group mr-1 text-blue-900" /> Bagian Bawah Kertas
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="bottomMode" value="none" checked={bottomMode === "none"} onChange={() => setBottomMode("none")} />
                Kosongkan
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="bottomMode" value="kwitansi" checked={bottomMode === "kwitansi"} onChange={() => setBottomMode("kwitansi")} />
                Sertakan Kwitansi
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="bottomMode" value="nota2" checked={bottomMode === "nota2"} onChange={() => setBottomMode("nota2")} />
                Nota Kedua (pekerjaan lain, hemat kertas)
              </label>
            </div>
          </div>

          {/* Opsi Stempel Toko */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sertakanStempel}
                onChange={(e) => setSertakanStempel(e.target.checked)}
                className="w-4 h-4 text-blue-900 rounded border-gray-300 focus:ring-blue-900"
              />
              <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                <i className="fa-solid fa-stamp text-blue-900" /> Sertakan Stempel Basah
              </span>
            </label>
            <p className="text-[11px] text-gray-400 mt-1 ml-6 leading-tight">
              Otomatis menampilkan stempel CV. Sinar Ilmu Jaya pada kolom tanda tangan Nota & Kwitansi.
            </p>
          </div>

          {/* Keterangan Kwitansi */}
          {bottomMode === "kwitansi" && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase">
                Keterangan Kwitansi (isi manual)
              </label>
              <textarea
                value={ketKwitansi}
                onChange={(e) => setKetKwitansi(e.target.value)}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded text-sm mt-1"
                placeholder="Contoh: Pelunasan pesanan tumbler..."
              />
            </div>
          )}

          {/* ── Nota Kedua ─────────────────────────────────────────────── */}
          {bottomMode === "nota2" && (
            <div className="space-y-3">
              {/* Data Nota 2 */}
              <div className="bg-gray-50 border border-orange-200 rounded-lg p-3 space-y-3">
                <div className="text-xs font-bold uppercase text-orange-700">Data Nota Kedua</div>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">No. Nota 2</label>
                    <input type="text" value={noDokumen2} readOnly className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-100 font-mono" />
                  </div>
                  <div className="w-1/2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Tanggal</label>
                    <input
                      type="date"
                      value={tanggal2}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTanggal2(val);
                        setNoDokumen2((prevNo) => updateNoDokumenTanggal(prevNo, val));
                      }}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Kepada Yth.</label>
                  <textarea
                    value={namaCustomer2}
                    onChange={(e) => setNamaCustomer2(e.target.value)}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="Nama Pelanggan (pekerjaan lain)..."
                  />
                </div>
              </div>

              {/* Form Tambah Barang Nota 2 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-orange-700">Tambah Barang (Nota 2)</h3>
                  {editIdx2 !== null && (
                    <span className="text-[10px] bg-orange-500 text-white px-2 rounded animate-pulse">Sedang Edit</span>
                  )}
                </div>
                <input
                  type="text" value={item2Name} onChange={(e) => setItem2Name(e.target.value)}
                  className="w-full mb-2 p-2 border border-gray-300 rounded text-sm outline-none"
                  placeholder="Nama Barang..."
                />
                <div className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="any"
                      value={item2Qty}
                      onChange={(e) => setItem2Qty(e.target.value ? Number(e.target.value) : "")}
                      className="w-full min-w-0 p-2 border border-gray-300 rounded text-sm text-center outline-none focus:border-orange-500"
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={item2Satuan}
                      onChange={(e) => setItem2Satuan(e.target.value)}
                      className="w-full min-w-0 p-2 border border-gray-300 rounded text-sm text-center outline-none focus:border-orange-500"
                      placeholder="Satuan"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item2Price}
                      onChange={(e) => setItem2Price(formatRupiahInput(e.target.value))}
                      className="w-full min-w-0 p-2 border border-gray-300 rounded text-sm text-right outline-none focus:border-orange-500 font-mono"
                      placeholder="Harga (Rp)"
                    />
                  </div>
                </div>
                {/* Quick Toggle Pills Satuan */}
                <div className="flex flex-wrap gap-1 mb-2 items-center">
                  <span className="text-[10px] text-gray-500 font-semibold mr-0.5">Satuan:</span>
                  {SATUAN_OPSI.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setItem2Satuan(item2Satuan === s ? "" : s)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition ${
                        item2Satuan === s
                          ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-orange-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addItem2}
                    className={`flex-1 text-white py-2 rounded font-bold shadow active:scale-95 transition ${editIdx2 !== null ? "bg-orange-500" : "bg-orange-700"}`}
                  >
                    <i className={`fa-solid ${editIdx2 !== null ? "fa-check" : "fa-plus"} mr-1`} />
                    {editIdx2 !== null ? "Simpan" : "Tambah"}
                  </button>
                  {editIdx2 !== null && (
                    <button onClick={cancelEdit2} className="w-20 bg-gray-400 text-white py-2 rounded font-bold">
                      Batal
                    </button>
                  )}
                </div>
              </div>

              {/* Daftar Item Nota 2 */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase">
                  <span>Daftar Item (Nota 2)</span>
                  <span>{items2.length} Item</span>
                </div>
                <div className="space-y-2 pb-4">
                  {items2.map((item, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border border-gray-200 flex justify-between items-center text-xs shadow-sm">
                      <div className="flex-1 truncate pr-2">
                        <div className="font-bold text-gray-700">{item.namaBarang}</div>
                        <div className="text-gray-500">{item.qty} {item.satuan || ""} × {formatAngka(item.hargaSatuan)}</div>
                      </div>
                      <div className="font-bold text-gray-800 mr-3">{formatAngka(item.totalHarga)}</div>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit2(idx)} className="text-orange-500 p-1" title="Edit"><i className="fa-solid fa-pen" /></button>
                        <button onClick={() => removeItem2(idx)} className="text-red-500 p-1" title="Hapus"><i className="fa-solid fa-trash" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tambah Barang Nota 1 ────────────────────────────────────── */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-blue-900">Tambah Barang</h3>
              {editIdx !== null && (
                <span className="text-[10px] bg-orange-500 text-white px-2 rounded animate-pulse">Sedang Edit</span>
              )}
            </div>
            <input
              type="text" value={itemName} onChange={(e) => setItemName(e.target.value)}
              className="w-full mb-2 p-2 border border-gray-300 rounded text-sm outline-none"
              placeholder="Nama Barang..."
            />
            <div className="grid grid-cols-12 gap-2 mb-2">
              <div className="col-span-3">
                <input
                  type="number"
                  step="any"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value ? Number(e.target.value) : "")}
                  className="w-full min-w-0 p-2 border border-gray-300 rounded text-sm text-center outline-none focus:border-blue-900"
                  placeholder="Qty"
                />
              </div>
              <div className="col-span-4">
                <input
                  type="text"
                  value={itemSatuan}
                  onChange={(e) => setItemSatuan(e.target.value)}
                  className="w-full min-w-0 p-2 border border-gray-300 rounded text-sm text-center outline-none focus:border-blue-900"
                  placeholder="Satuan"
                />
              </div>
              <div className="col-span-5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(formatRupiahInput(e.target.value))}
                  className="w-full min-w-0 p-2 border border-gray-300 rounded text-sm text-right outline-none focus:border-blue-900 font-mono"
                  placeholder="Harga (Rp)"
                />
              </div>
            </div>
            {/* Quick Toggle Pills Satuan */}
            <div className="flex flex-wrap gap-1 mb-2 items-center">
              <span className="text-[10px] text-gray-500 font-semibold mr-0.5">Satuan:</span>
              {SATUAN_OPSI.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setItemSatuan(itemSatuan === s ? "" : s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition ${
                    itemSatuan === s
                      ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-blue-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={addItem}
                className={`flex-1 text-white py-2 rounded font-bold shadow active:scale-95 transition ${editIdx !== null ? "bg-orange-500" : "bg-blue-900"}`}
              >
                <i className={`fa-solid ${editIdx !== null ? "fa-check" : "fa-plus"} mr-1`} />
                {editIdx !== null ? "Simpan" : "Tambah"}
              </button>
              {editIdx !== null && (
                <button onClick={cancelEdit} className="w-20 bg-gray-400 text-white py-2 rounded font-bold">
                  Batal
                </button>
              )}
            </div>
          </div>

          {/* Daftar Item Nota 1 */}
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase">
              <span>Daftar Item</span>
              <span>{items.length} Item</span>
            </div>
            <div className="space-y-2 pb-10">
              {items.map((item, idx) => (
                <div key={idx} className="bg-white p-2 rounded border border-gray-200 flex justify-between items-center text-xs shadow-sm">
                  <div className="flex-1 truncate pr-2">
                    <div className="font-bold text-gray-700">{item.namaBarang}</div>
                    <div className="text-gray-500">{item.qty} {item.satuan || ""} × {formatAngka(item.hargaSatuan)}</div>
                  </div>
                  <div className="font-bold text-gray-800 mr-3">{formatAngka(item.totalHarga)}</div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(idx)} className="text-orange-500 p-1" title="Edit"><i className="fa-solid fa-pen" /></button>
                    <button onClick={() => removeItem(idx)} className="text-red-500 p-1" title="Hapus"><i className="fa-solid fa-trash" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ================================================================ */}
      {/* TAB 2: PREVIEW (cetak)                                           */}
      {/* ================================================================ */}
      <div
        className={`${
          activeTab === "preview" ? "block" : "hidden"
        } lg:flex flex-1 h-full overflow-y-auto flex-col items-center bg-[#525659] p-0 lg:p-10 gap-5`}
      >
        <PrintStyles />

        {/* Mobile Action Bar di atas Preview */}
        <div className="flex lg:hidden w-full px-3 py-2 bg-gray-900/90 backdrop-blur text-white justify-between items-center text-xs sticky top-0 z-20 shadow">
          <span className="text-gray-300 font-mono text-[11px] truncate max-w-[140px]">
            {noDokumen || "Nota"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFitToScreen(!fitToScreen)}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 active:scale-95 transition"
            >
              <i className={`fa-solid ${fitToScreen ? "fa-arrows-left-right" : "fa-compress"}`} />
              {fitToScreen ? "Skala Asli" : "Fit Layar"}
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-[11px] flex items-center gap-1 active:scale-95 transition shadow"
            >
              <i className="fa-solid fa-print" /> Cetak
            </button>
          </div>
        </div>

        {/* Desktop Action Header */}
        <div className="hidden lg:flex w-full max-w-[210mm] justify-between items-center bg-gray-800/80 backdrop-blur px-4 py-2.5 rounded-lg text-white text-xs shadow">
          <span className="text-gray-300">
            <i className="fa-solid fa-eye mr-1.5" /> Live Preview (Format A4)
          </span>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded flex items-center gap-1.5 transition shadow active:scale-95"
          >
            <i className="fa-solid fa-print" /> Cetak Nota (Approach B)
          </button>
        </div>

        <div className={`w-full ${fitToScreen ? "fit-screen-container" : "overflow-x-auto flex justify-start sm:justify-center p-2"} pb-24 lg:pb-0`}>
          <div className={`nota-wrapper ${fitToScreen ? "fit-screen-wrapper" : ""}`}>

            {/* ─────────────── NOTA UTAMA ─────────────── */}
            <div className="doc-half">
              <DocumentHeader
                documentTitle="NOTA"
                noDokumen={noDokumen || "-"}
                tanggalStr={fmtDate(tanggal)}
                namaCustomer={namaCustomer || "-"}
                recipientLabel="KEPADA YTH."
                layoutType="split_header"
              />

              <DocumentTable
                mode="nota"
                items={items}
                minRows={5}
                showTerbilang={true}
                terbilangKapital={false}
                terbilangStyle="default"
              />

              <DocumentSignature variant="nota" sertakanStempel={sertakanStempel} />
            </div>

            {/* ─────────────── KWITANSI ─────────────── */}
            {bottomMode === "kwitansi" && (
              <KwitansiBlock
                noDokumen={noDokumen}
                tanggalStr={fmtDate(tanggal)}
                namaCustomer={namaCustomer}
                nominal={total}
                keterangan={ketKwitansi}
                kota="Semarang"
                sertakanStempel={sertakanStempel}
              />
            )}

            {/* ─────────────── NOTA KEDUA ─────────────── */}
            {bottomMode === "nota2" && (
              <div className="doc-half kwitansi-half">
                <DocumentHeader
                  documentTitle="NOTA"
                  noDokumen={noDokumen2 || "-"}
                  tanggalStr={fmtDate(tanggal2)}
                  namaCustomer={namaCustomer2 || "-"}
                  recipientLabel="KEPADA YTH."
                  layoutType="split_header"
                />

                <DocumentTable
                  mode="nota"
                  items={items2}
                  minRows={3}
                  showTerbilang={true}
                  terbilangKapital={false}
                  terbilangStyle="default"
                />

                <DocumentSignature variant="nota" sertakanStempel={sertakanStempel} />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Bottom Nav — mobile (no-print + bottom-nav: kedua class dihide saat print) */}
      <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 flex justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.625rem)] z-50 lg:hidden no-print">
        <button
          onClick={() => setActiveTab("input")}
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[11px] font-medium transition active:scale-95 ${activeTab === "input" ? "text-blue-900 font-bold" : "text-gray-400 hover:text-gray-600"}`}
        >
          <i className="fa-solid fa-pen-to-square text-lg mb-1" />
          <span>Input Form</span>
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[11px] font-medium transition active:scale-95 ${activeTab === "preview" ? "text-blue-900 font-bold" : "text-gray-400 hover:text-gray-600"}`}
        >
          <i className="fa-solid fa-receipt text-lg mb-1" />
          <span>Lihat Nota</span>
        </button>
      </nav>

      {/* Print FAB — mobile (posisi di atas bottom nav dengan jarak safe area) */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-5 lg:hidden z-40 no-print">
        <button
          onClick={handlePrint}
          aria-label="Cetak Nota"
          title="Cetak Nota"
          className="bg-blue-900 hover:bg-blue-800 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition transform"
        >
          <i className="fa-solid fa-print text-xl" />
        </button>
      </div>

      {/* Modal Dialog: Tarik dari Orderan Proyek */}
      {isOrderanModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-blue-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-file-import text-lg" />
                <h2 className="font-bold text-base sm:text-lg">Tarik dari Orderan Proyek</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderanModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded transition"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              <p className="text-xs sm:text-sm text-gray-600">
                Pilih surat orderan aktif (status: <strong className="text-blue-900">berjalan</strong>) yang akan diterbitkan nota penagihannya. Data customer dan uraian item akan disalin otomatis.
              </p>

              {orderanList.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                  <i className="fa-solid fa-inbox text-3xl mb-2 text-gray-400" />
                  <p className="text-sm font-medium">Tidak ada Surat Orderan dengan status "berjalan".</p>
                  <p className="text-xs text-gray-400 mt-1">Semua orderan telah diterbitkan notanya atau belum dibuat.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orderanList.map((ord) => (
                    <div
                      key={ord.noDokumen}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-900 hover:bg-blue-50/40 transition flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                            {ord.noDokumen}
                          </span>
                          <span className="text-xs text-gray-500">
                            {ord.tanggalDokumen}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                            {ord.status}
                          </span>
                        </div>
                        <div className="font-bold text-gray-800 text-sm">{ord.namaCustomer}</div>
                        <div className="text-xs text-gray-500">
                          {ord.items.length} item • Total: <strong className="text-gray-800">Rp {formatAngka(ord.total)}</strong>
                        </div>
                        {ord.deskripsi && (
                          <div className="text-xs text-gray-600 italic">
                            "{ord.deskripsi}"
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => pilihOrderan(ord)}
                        className="bg-blue-900 hover:bg-blue-800 text-white text-xs px-3.5 py-2 rounded font-medium transition shadow-sm self-end sm:self-center shrink-0 active:scale-95"
                      >
                        Pilih & Salin ke Nota
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOrderanModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
