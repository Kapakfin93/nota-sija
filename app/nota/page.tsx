"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { terbilang } from "../../lib/services/terbilang";
import { generateNoDokumen, formatPdfFileName } from "../../lib/services/documentNumber";
import { NotaService } from "../../lib/services/notaService";
import { InMemoryRepository } from "../../lib/repositories/inMemoryRepository";
import { ItemBarang, Transaksi } from "../../lib/types/transaksi";

// --- Module-level singleton: satu instance per session browser ---
// Sesuai 3-layer: Presentation layer hanya boleh panggil Service, tidak repo langsung.
const _repo = new InMemoryRepository();
const notaService = new NotaService(_repo);

const STORAGE_KEY = "eNotaSija";

// Helper: YYYY-MM-DD → DD/MM/YY (split string, aman dari timezone shift)
function fmtDate(dateStr: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "-";
  const [y, m, d] = parts;
  return `${d}/${m}/${y.slice(-2)}`;
}

// Mapping UI mode string → Transaksi["modeBagianBawah"] type
function toModeBagianBawah(mode: string): Transaksi["modeBagianBawah"] {
  if (mode === "kwitansi") return "kwitansi";
  if (mode === "nota2") return "nota_kedua";
  return "kosong";
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function NotaPage() {
  const router = useRouter();
  // ─── State ───────────────────────────────────────────────────────────────
  const [isLoaded, setIsLoaded] = useState(false); // guard: jangan save sebelum load selesai

  // Nota 1
  const [noDokumen, setNoDokumen] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [namaCustomer, setNamaCustomer] = useState("");
  const [fileLabel, setFileLabel] = useState(""); // label penyesuaian nama file PDF
  const [bottomMode, setBottomMode] = useState("none");
  const [ketKwitansi, setKetKwitansi] = useState("");

  const [items, setItems] = useState<ItemBarang[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState<number | "">("");
  const [itemPrice, setItemPrice] = useState<number | "">("");
  const [editIdx, setEditIdx] = useState<number | null>(null); // null = mode tambah

  // Nota 2
  const [noDokumen2, setNoDokumen2] = useState("");
  const [tanggal2, setTanggal2] = useState("");
  const [namaCustomer2, setNamaCustomer2] = useState("");
  const [items2, setItems2] = useState<ItemBarang[]>([]);
  const [item2Name, setItem2Name] = useState("");
  const [item2Qty, setItem2Qty] = useState<number | "">("");
  const [item2Price, setItem2Price] = useState<number | "">("");
  const [editIdx2, setEditIdx2] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState("input");

  // ─── Mount: load dari localStorage (sekali) ───────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setItems(d.items || []);
        setNoDokumen(d.no || generateNoDokumen());
        setTanggal(d.date || todayStr());
        setNamaCustomer(d.cust || "");
        setFileLabel(d.fileLabel || "");
        // Kompatibel data lama (field 'kwitansi' boolean dari versi sebelumnya)
        const mode = d.bottomMode || (d.kwitansi ? "kwitansi" : "none");
        setBottomMode(mode);
        setKetKwitansi(d.ket || "");
        setItems2(d.items2 || []);
        setNoDokumen2(d.no2 || generateNoDokumen());
        setTanggal2(d.date2 || todayStr());
        setNamaCustomer2(d.cust2 || "");
      } else {
        // Nota baru — generate nomor pertama kali
        setNoDokumen(generateNoDokumen());
        setNoDokumen2(generateNoDokumen());
        setTanggal(todayStr());
        setTanggal2(todayStr());
        setFileLabel("");
      }
    } catch {
      // localStorage corrupt — mulai bersih
      setNoDokumen(generateNoDokumen());
      setNoDokumen2(generateNoDokumen());
      setTanggal(todayStr());
      setTanggal2(todayStr());
      setFileLabel("");
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
        items2,
        no2: noDokumen2,
        date2: tanggal2,
        cust2: namaCustomer2,
      })
    );
  }, [
    isLoaded, items, noDokumen, tanggal, namaCustomer, fileLabel,
    bottomMode, ketKwitansi, items2, noDokumen2, tanggal2, namaCustomer2,
  ]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const total = items.reduce((s, i) => s + i.totalHarga, 0);
  const total2 = items2.reduce((s, i) => s + i.totalHarga, 0);

  const formatRp = (n: number) => n.toLocaleString("id-ID");

  // ─── Reset Nota Baru ──────────────────────────────────────────────────────
  const resetAll = () => {
    if (!confirm("Buat nota baru? Semua data saat ini akan dihapus.")) return;
    const today = todayStr();
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
    setItemName(""); setItemQty(""); setItemPrice("");
    setEditIdx2(null);
    setItem2Name(""); setItem2Qty(""); setItem2Price("");
    localStorage.removeItem(STORAGE_KEY);
  };

  // ─── CRUD Items — Nota 1 ──────────────────────────────────────────────────
  const addItem = () => {
    if (!itemName || itemQty === "" || itemPrice === "") return;
    const newItem: ItemBarang = {
      namaBarang: itemName,
      qty: Number(itemQty),
      hargaSatuan: Number(itemPrice),
      totalHarga: Number(itemQty) * Number(itemPrice),
    };
    if (editIdx !== null) {
      // Mode edit: replace item di posisi yang sama
      const updated = [...items];
      updated[editIdx] = newItem;
      setItems(updated);
      cancelEdit();
    } else {
      setItems([...items, newItem]);
      setItemName(""); setItemQty(""); setItemPrice("");
    }
  };

  const startEdit = (i: number) => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) setActiveTab("input");
    const d = items[i];
    setItemName(d.namaBarang);
    setItemQty(d.qty);
    setItemPrice(d.hargaSatuan);
    setEditIdx(i);
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setItemName(""); setItemQty(""); setItemPrice("");
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
    if (!item2Name || item2Qty === "" || item2Price === "") return;
    const newItem: ItemBarang = {
      namaBarang: item2Name,
      qty: Number(item2Qty),
      hargaSatuan: Number(item2Price),
      totalHarga: Number(item2Qty) * Number(item2Price),
    };
    if (editIdx2 !== null) {
      const updated = [...items2];
      updated[editIdx2] = newItem;
      setItems2(updated);
      cancelEdit2();
    } else {
      setItems2([...items2, newItem]);
      setItem2Name(""); setItem2Qty(""); setItem2Price("");
    }
  };

  const startEdit2 = (i: number) => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) setActiveTab("input");
    const d = items2[i];
    setItem2Name(d.namaBarang);
    setItem2Qty(d.qty);
    setItem2Price(d.hargaSatuan);
    setEditIdx2(i);
  };

  const cancelEdit2 = () => {
    setEditIdx2(null);
    setItem2Name(""); setItem2Qty(""); setItem2Price("");
  };

  const removeItem2 = (i: number) => {
    if (!confirm("Hapus item?")) return;
    const updated = [...items2];
    updated.splice(i, 1);
    setItems2(updated);
    if (editIdx2 === i) cancelEdit2();
  };

  // ─── Print: upsert ke repository dengan nomor yang SUDAH ADA & redirect ke /nota/print ───
  const handlePrint = async () => {
    // 1. Simpan state terkini ke localStorage secara sinkron sebelum navigasi
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
          items2,
          no2: noDokumen2,
          date2: tanggal2,
          cust2: namaCustomer2,
        })
      );
    } catch (e) {
      console.error("Gagal simpan ke localStorage:", e);
    }

    // 2. Simpan ke service
    try {
      await notaService.simpanTransaksiSaatIni({
        noDokumen,                              // nomor dari UI state (tidak berubah)
        tanggalDokumen: fmtDate(tanggal),
        namaCustomer,
        items,
        modeBagianBawah: toModeBagianBawah(bottomMode),
        keteranganKwitansi: ketKwitansi,
      });
    } catch (e) {
      console.error("[notaService] Gagal simpan sebelum print:", e);
    }

    // 3. Approach B: Beralih ke halaman cetak murni tanpa UI input
    router.push("/nota/print");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden flex-col lg:flex-row">

      {/* ================================================================ */}
      {/* TAB 1: INPUT                                                      */}
      {/* ================================================================ */}
      <div
        className={`no-print ${
          activeTab === "input" ? "block" : "hidden"
        } lg:block w-full lg:w-[400px] h-full overflow-y-auto border-r border-gray-300 bg-white pb-20 lg:pb-0 shrink-0`}
      >
        {/* Header sticky */}
        <div className="p-4 sticky top-0 z-10 shadow-md flex justify-between items-center text-white bg-blue-900">
          <h1 className="font-bold text-lg">
            <i className="fa-solid fa-pen-to-square mr-1" /> Input Nota
          </h1>
          <button
            onClick={resetAll}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded"
          >
            Reset
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* Info Nota */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
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
                  onChange={(e) => setTanggal(e.target.value)}
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
                    <input type="date" value={tanggal2} onChange={(e) => setTanggal2(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" />
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
                <div className="flex gap-2 mb-2">
                  <input
                    type="number" value={item2Qty}
                    onChange={(e) => setItem2Qty(e.target.value ? Number(e.target.value) : "")}
                    className="w-20 p-2 border border-gray-300 rounded text-sm text-center"
                    placeholder="Qty"
                  />
                  <input
                    type="number" value={item2Price}
                    onChange={(e) => setItem2Price(e.target.value ? Number(e.target.value) : "")}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm text-right"
                    placeholder="Harga Satuan"
                  />
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
                        <div className="text-gray-500">{item.qty} × {formatRp(item.hargaSatuan)}</div>
                      </div>
                      <div className="font-bold text-gray-800 mr-3">{formatRp(item.totalHarga)}</div>
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
            <div className="flex gap-2 mb-2">
              <input
                type="number" value={itemQty}
                onChange={(e) => setItemQty(e.target.value ? Number(e.target.value) : "")}
                className="w-20 p-2 border border-gray-300 rounded text-sm text-center"
                placeholder="Qty"
              />
              <input
                type="number" value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value ? Number(e.target.value) : "")}
                className="flex-1 p-2 border border-gray-300 rounded text-sm text-right"
                placeholder="Harga Satuan"
              />
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
                    <div className="text-gray-500">{item.qty} × {formatRp(item.hargaSatuan)}</div>
                  </div>
                  <div className="font-bold text-gray-800 mr-3">{formatRp(item.totalHarga)}</div>
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
        <style>{`
          .nota-wrapper { background: white; width: 210mm; min-height: 297mm; padding: 10mm 12mm; box-sizing: border-box; color: black; font-family: sans-serif; position: relative; flex-shrink: 0; }
          .doc-half { min-height: 128mm; }
          .doc-half.kwitansi-half { border-top: 2px dashed #999; margin-top: 8mm; padding-top: 8mm; }
          .nota-table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 10px; }
          .nota-table th { background: #1e3a8a; color: white; border: 1px solid #1e3a8a; padding: 6px 5px; font-size: 8.5pt; font-weight: bold; text-align: center; text-transform: uppercase; }
          .nota-table td { border: 1px solid #1e3a8a; padding: 6px 5px; font-size: 9.5pt; vertical-align: top; }
          .nota-table tfoot td { border: 1px solid #1e3a8a; font-weight: bold; }
          .header-title { font-size: 15pt; font-weight: 900; color: #1e3a8a; line-height: 1.2; letter-spacing: -0.2px; font-family: 'Times New Roman', serif; white-space: nowrap; }
          .header-sub { font-size: 10pt; font-weight: bold; color: #b91c1c; }
          .header-small { font-size: 9pt; color: #b91c1c; }
        `}</style>

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

        <div className="w-full overflow-x-auto flex justify-center pb-20 lg:pb-0">
          <div className="nota-wrapper">

            {/* ─────────────── NOTA UTAMA ─────────────── */}
            <div className="doc-half">
              {/* HEADER */}
              <div className="flex justify-between items-start mb-2">
                <div style={{ width: "74%", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, marginTop: "2px" }}>
                    <Image src="/logo.png" alt="Logo CV Sinar Ilmu Jaya" width={42} height={42} style={{ width: "42px", height: "auto" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="header-title">CV. SINAR ILMU JAYA</div>
                    <div className="header-sub">Percetakan - Digital Printing - Souvenir</div>
                    <div className="header-small mt-1">Jl. Kapas Tengah II Blok F No.721 / 0822 30563792</div>
                  </div>
                </div>
                <div style={{ width: "26%", textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "8pt", color: "#555" }}>TANGGAL</div>
                  <div className="font-bold mb-2" style={{ fontSize: "9.5pt" }}>{fmtDate(tanggal)}</div>
                  <div style={{ fontSize: "8pt", color: "#555" }}>KEPADA YTH.</div>
                  <div className="font-bold text-black" style={{ fontSize: "9.5pt", minHeight: "18px" }}>{namaCustomer || "-"}</div>
                </div>
              </div>

              <div className="w-full" style={{ height: "2px", background: "#1e3a8a", margin: "6px 0 8px" }} />

              <div className="flex items-end mb-2">
                <span style={{ background: "#1e3a8a", color: "white", padding: "2px 8px", fontWeight: "bold", fontSize: "9pt", borderRadius: "2px" }}>NOTA</span>
                <span style={{ fontWeight: "bold", fontSize: "10.5pt", marginLeft: "8px", fontFamily: "monospace" }}>{noDokumen}</span>
              </div>

              {/* TABEL */}
              <table className="nota-table">
                <thead>
                  <tr>
                    <th style={{ width: "28px" }}>NO</th>
                    <th style={{ textAlign: "left" }}>NAMA BARANG</th>
                    <th style={{ width: "55px" }}>VOLUME</th>
                    <th style={{ width: "105px" }}>HARGA</th>
                    <th style={{ width: "130px" }}>JUMLAH</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td>{item.namaBarang}</td>
                      <td style={{ textAlign: "center" }}>{item.qty}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{formatRp(item.hargaSatuan)}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{formatRp(item.totalHarga)}</td>
                    </tr>
                  ))}
                  {/* Padding baris kosong — minimal 5 baris (sesuai v8) */}
                  {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, k) => (
                    <tr key={`e-${k}`}>
                      <td>&nbsp;</td><td /><td /><td /><td />
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right" }}>TOTAL</td>
                    <td style={{ textAlign: "right", fontSize: "11pt", whiteSpace: "nowrap" }}>Rp {formatRp(total)}</td>
                  </tr>
                </tfoot>
              </table>

              <div style={{ fontSize: "8.5pt" }}>
                <b>Keterangan :</b><br />
                <b>Terbilang :</b> <span style={{ fontStyle: "italic" }}>{terbilang(total)}</span>
              </div>

              {/* FOOTER: pembayaran + tanda tangan */}
              <div className="flex mt-6" style={{ fontSize: "8.5pt" }}>
                <div style={{ width: "55%", paddingRight: "10px" }}>
                  <div style={{ borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "4px", fontWeight: "bold" }}>Info Pembayaran:</div>
                  <div>Transfer Via BCA</div>
                  <div className="font-bold" style={{ color: "#1e3a8a" }}>a/n MUHTARUDIN NURUL HABIBI</div>
                  <div className="font-mono text-xs mt-1">No. 009-7085-203</div>
                </div>
                <div style={{ width: "45%", display: "flex", justifyContent: "space-between" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ marginBottom: "40px" }}>Diterima oleh,</div>
                    <div style={{ borderTop: "1px solid #aaa", paddingTop: "2px", fontWeight: "bold" }}>( ................. )</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ marginBottom: "40px" }}>Hormat kami,</div>
                    <div style={{ borderTop: "1px solid #aaa", paddingTop: "2px", fontWeight: "bold" }}>&nbsp;</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─────────────── KWITANSI ─────────────── */}
            {bottomMode === "kwitansi" && (
              <div className="doc-half kwitansi-half">
                <div className="flex justify-between items-start" style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flexShrink: 0 }}>
                      <Image src="/logo.png" alt="Logo" width={42} height={42} style={{ width: "42px", height: "auto" }} />
                    </div>
                    <div>
                      <div className="header-title">CV. SINAR ILMU JAYA</div>
                      <div className="header-sub">Percetakan - Digital Printing - Souvenir</div>
                      <div className="header-small mt-1">Jl. Kapas Tengah II Blok F No.721 / 0822 30563792</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "8pt", color: "#555" }}>NOTA NOMOR</div>
                    <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "monospace" }}>{noDokumen}</div>
                  </div>
                </div>
                <div style={{ textAlign: "center", fontSize: "18pt", fontWeight: 900, letterSpacing: "2px", color: "#1e3a8a", margin: "10px 0" }}>
                  KWITANSI
                </div>
                <div style={{ fontSize: "10pt", lineHeight: 2 }}>
                  <b>Sudah diterima dari</b><br />
                  Nama &nbsp;&nbsp;&nbsp;&nbsp;: <span className="font-bold">{namaCustomer || "-"}</span><br />
                  {/* terbilang kapital: value-nya uppercase, bukan hanya CSS — aman saat print */}
                  Jumlah &nbsp;&nbsp;: <span className="font-bold" style={{ fontStyle: "italic" }}>{terbilang(total, { kapital: true })}</span><br />
                  Keterangan : <span className="italic" style={{ fontSize: "9pt" }}>{ketKwitansi || "-"}</span>
                </div>
                <div style={{ border: "2px solid #1e3a8a", marginTop: "14px", padding: "10px", textAlign: "center", fontWeight: "bold", fontSize: "13pt", whiteSpace: "nowrap" }}>
                  Rp {formatRp(total)}
                </div>
                <div style={{ textAlign: "right", marginTop: "30px", fontSize: "9.5pt" }}>Semarang, {fmtDate(tanggal)}</div>
                <div style={{ textAlign: "right", marginTop: "45px", fontSize: "9.5pt" }}>( ................................... )</div>
              </div>
            )}

            {/* ─────────────── NOTA KEDUA ─────────────── */}
            {bottomMode === "nota2" && (
              <div className="doc-half kwitansi-half">
                <div className="flex justify-between items-start mb-2">
                  <div style={{ width: "74%", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{ flexShrink: 0, marginTop: "2px" }}>
                      <Image src="/logo.png" alt="Logo" width={42} height={42} style={{ width: "42px", height: "auto" }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="header-title">CV. SINAR ILMU JAYA</div>
                      <div className="header-sub">Percetakan - Digital Printing - Souvenir</div>
                      <div className="header-small mt-1">Jl. Kapas Tengah II Blok F No.721 / 0822 30563792</div>
                    </div>
                  </div>
                  <div style={{ width: "26%", textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "8pt", color: "#555" }}>TANGGAL</div>
                    <div className="font-bold mb-2" style={{ fontSize: "9.5pt" }}>{fmtDate(tanggal2)}</div>
                    <div style={{ fontSize: "8pt", color: "#555" }}>KEPADA YTH.</div>
                    <div className="font-bold text-black" style={{ fontSize: "9.5pt", minHeight: "18px" }}>{namaCustomer2 || "-"}</div>
                  </div>
                </div>

                <div className="w-full" style={{ height: "2px", background: "#1e3a8a", margin: "6px 0 8px" }} />

                <div className="flex items-end mb-2">
                  <span style={{ background: "#1e3a8a", color: "white", padding: "2px 8px", fontWeight: "bold", fontSize: "9pt", borderRadius: "2px" }}>NOTA</span>
                  <span style={{ fontWeight: "bold", fontSize: "10.5pt", marginLeft: "8px", fontFamily: "monospace" }}>{noDokumen2}</span>
                </div>

                <table className="nota-table">
                  <thead>
                    <tr>
                      <th style={{ width: "28px" }}>NO</th>
                      <th style={{ textAlign: "left" }}>NAMA BARANG</th>
                      <th style={{ width: "55px" }}>VOLUME</th>
                      <th style={{ width: "105px" }}>HARGA</th>
                      <th style={{ width: "130px" }}>JUMLAH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items2.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: "center" }}>{idx + 1}</td>
                        <td>{item.namaBarang}</td>
                        <td style={{ textAlign: "center" }}>{item.qty}</td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{formatRp(item.hargaSatuan)}</td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{formatRp(item.totalHarga)}</td>
                      </tr>
                    ))}
                    {/* Padding baris kosong — minimal 3 baris (sesuai v8) */}
                    {Array.from({ length: Math.max(0, 3 - items2.length) }).map((_, k) => (
                      <tr key={`e2-${k}`}>
                        <td>&nbsp;</td><td /><td /><td /><td />
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ textAlign: "right" }}>TOTAL</td>
                      <td style={{ textAlign: "right", fontSize: "11pt", whiteSpace: "nowrap" }}>Rp {formatRp(total2)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div style={{ fontSize: "8.5pt" }}>
                  <b>Keterangan :</b><br />
                  <b>Terbilang :</b> <span style={{ fontStyle: "italic" }}>{terbilang(total2)}</span>
                </div>

                <div className="flex mt-6" style={{ fontSize: "8.5pt" }}>
                  <div style={{ width: "55%", paddingRight: "10px" }}>
                    <div style={{ borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "4px", fontWeight: "bold" }}>Info Pembayaran:</div>
                    <div>Transfer Via BCA</div>
                    <div className="font-bold" style={{ color: "#1e3a8a" }}>a/n MUHTARUDIN NURUL HABIBI</div>
                    <div className="font-mono text-xs mt-1">No. 009-7085-203</div>
                  </div>
                  <div style={{ width: "45%", display: "flex", justifyContent: "space-between" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ marginBottom: "40px" }}>Diterima oleh,</div>
                      <div style={{ borderTop: "1px solid #aaa", paddingTop: "2px", fontWeight: "bold" }}>( ................. )</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ marginBottom: "40px" }}>Hormat kami,</div>
                      <div style={{ borderTop: "1px solid #aaa", paddingTop: "2px", fontWeight: "bold" }}>&nbsp;</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Bottom Nav — mobile (no-print + bottom-nav: kedua class dihide saat print) */}
      <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-50 lg:hidden no-print">
        <button
          onClick={() => setActiveTab("input")}
          className={`flex-1 text-center text-[10px] ${activeTab === "input" ? "text-blue-900 font-bold" : "text-gray-400"}`}
        >
          <i className="fa-solid fa-pen-to-square block text-xl mb-1" /> Input
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 text-center text-[10px] ${activeTab === "preview" ? "text-blue-900 font-bold" : "text-gray-400"}`}
        >
          <i className="fa-solid fa-receipt block text-xl mb-1" /> Nota
        </button>
      </nav>

      {/* Print FAB — mobile */}
      <div className="fixed bottom-20 right-5 lg:hidden no-print">
        <button
          onClick={handlePrint}
          className="bg-gray-900 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center animate-bounce"
        >
          <i className="fa-solid fa-print text-xl" />
        </button>
      </div>

    </div>
  );
}
