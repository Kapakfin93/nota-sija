"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { terbilang } from "../../lib/services/terbilang";
import { generateNoDokumen, formatPdfFileName, updateNoDokumenTanggal } from "../../lib/services/documentNumber";
import { DocumentHeader } from "../../components/print/DocumentHeader";
import { DocumentTable } from "../../components/print/DocumentTable";
import { DocumentSignature } from "../../components/print/DocumentSignature";
import { OrderanService } from "../../lib/services/orderanService";
import { LocalStorageRepository } from "../../lib/repositories/localStorageRepository";
import { ItemBarang } from "../../lib/types/transaksi";

const _repo = new LocalStorageRepository();
const orderanService = new OrderanService(_repo);

const DRAFT_STORAGE_KEY = "eOrderanDraft";

function fmtDate(dateStr: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "-";
  const [y, m, d] = parts;
  return `${d}/${m}/${y.slice(-2)}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function OrderanPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  // Form State
  const [noDokumen, setNoDokumen] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [namaCustomer, setNamaCustomer] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [waktuPengerjaan, setWaktuPengerjaan] = useState("");
  const [waktuPengiriman, setWaktuPengiriman] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [sertakanStempel, setSertakanStempel] = useState(false);

  // Items State (6 Kolom: Nama, Qty, Satuan, Harga, Total)
  const [items, setItems] = useState<ItemBarang[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState<number | "">("");
  const [itemSatuan, setItemSatuan] = useState("");
  const [itemPrice, setItemPrice] = useState<number | "">("");
  const [editIdx, setEditIdx] = useState<number | null>(null);

  // Mobile Tabs & Scaling
  const [activeTab, setActiveTab] = useState("input");
  const [fitToScreen, setFitToScreen] = useState(true);

  // 1. Mount: Load dari draft localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setNoDokumen(d.no || generateNoDokumen());
        setTanggal(d.date || todayStr());
        setNamaCustomer(d.cust || "");
        setDeskripsi(d.desk || "");
        setWaktuPengerjaan(d.kerja || "");
        setWaktuPengiriman(d.kirim || "");
        setFileLabel(d.fileLabel || "");
        setSertakanStempel(Boolean(d.sertakanStempel));
        setItems(d.items || []);
      } else {
        setNoDokumen(generateNoDokumen());
        setTanggal(todayStr());
        setSertakanStempel(false);
      }
    } catch {
      setNoDokumen(generateNoDokumen());
      setTanggal(todayStr());
      setSertakanStempel(false);
    }
    setIsLoaded(true);
  }, []);

  // 2. Simpan Draft form setiap kali ada perubahan
  useEffect(() => {
    if (!isLoaded || !noDokumen) return;
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          no: noDokumen,
          date: tanggal,
          cust: namaCustomer,
          desk: deskripsi,
          kerja: waktuPengerjaan,
          kirim: waktuPengiriman,
          fileLabel,
          sertakanStempel,
          items,
        })
      );
    } catch (e) {
      console.error("Gagal simpan draft orderan:", e);
    }
  }, [isLoaded, noDokumen, tanggal, namaCustomer, deskripsi, waktuPengerjaan, waktuPengiriman, fileLabel, sertakanStempel, items]);

  const total = items.reduce((s, i) => s + (i.totalHarga || i.qty * i.hargaSatuan), 0);
  const formatRp = (n: number) => n.toLocaleString("id-ID");

  const dynamicFileName = formatPdfFileName({
    customLabel: fileLabel || namaCustomer,
    noDokumen: noDokumen || "draft",
  });

  // CRUD Item
  const addItem = () => {
    if (!itemName.trim()) {
      alert("Isi uraian barang/jasa!");
      return;
    }
    const q = Number(itemQty) || 1;
    const p = Number(itemPrice) || 0;
    const newItem: ItemBarang = {
      namaBarang: itemName.trim(),
      qty: q,
      satuan: itemSatuan.trim(),
      hargaSatuan: p,
      totalHarga: q * p,
    };

    if (editIdx !== null) {
      const updated = [...items];
      updated[editIdx] = newItem;
      setItems(updated);
      cancelEdit();
    } else {
      setItems([...items, newItem]);
      setItemName("");
      setItemQty("");
      setItemSatuan("");
      setItemPrice("");
    }
  };

  const startEdit = (idx: number) => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) setActiveTab("input");
    const d = items[idx];
    setItemName(d.namaBarang);
    setItemQty(d.qty);
    setItemSatuan(d.satuan || "");
    setItemPrice(d.hargaSatuan);
    setEditIdx(idx);
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setItemName("");
    setItemQty("");
    setItemSatuan("");
    setItemPrice("");
  };

  const removeItem = (idx: number) => {
    if (!confirm("Hapus item orderan?")) return;
    const updated = [...items];
    updated.splice(idx, 1);
    setItems(updated);
    if (editIdx === idx) cancelEdit();
  };

  const resetAll = () => {
    if (!confirm("Buat Surat Orderan baru? Draft saat ini akan di-reset.")) return;
    setNoDokumen(generateNoDokumen());
    setTanggal(todayStr());
    setNamaCustomer("");
    setDeskripsi("");
    setWaktuPengerjaan("");
    setWaktuPengiriman("");
    setFileLabel("");
    setItems([]);
    cancelEdit();
  };

  // Finalisasi: Simpan ke repository universal (eSijaTransaksi) lalu buka /orderan/print
  const handlePrint = async () => {
    try {
      await orderanService.buatSuratOrderan({
        noDokumen,
        tanggalDokumen: fmtDate(tanggal),
        namaCustomer: namaCustomer.trim() || "-",
        deskripsi: deskripsi.trim() || "-",
        waktuPengerjaan: waktuPengerjaan.trim() || "-",
        waktuPengiriman: waktuPengiriman.trim() || "-",
        items,
      });
    } catch (e) {
      console.error("[OrderanService] Gagal simpan orderan:", e);
    }
    router.push("/orderan/print");
  };

  return (
    <div className="flex h-screen overflow-hidden flex-col lg:flex-row">
      <title>{dynamicFileName}</title>

      {/* ================================================================ */}
      {/* TAB 1: INPUT DATA ORDERAN                                        */}
      {/* ================================================================ */}
      <div
        className={`no-print ${
          activeTab === "input" ? "block" : "hidden"
        } lg:block w-full lg:w-[420px] h-full overflow-y-auto border-r border-gray-300 bg-white pb-20 lg:pb-0 shrink-0`}
      >
        {/* Header sticky */}
        <div className="p-4 sticky top-0 z-10 shadow-md flex justify-between items-center text-white bg-blue-900">
          <div className="flex items-center gap-2">
            <Link href="/nota" className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded flex items-center gap-1">
              <i className="fa-solid fa-receipt" /> Nota
            </Link>
            <h1 className="font-bold text-base sm:text-lg truncate">
              <i className="fa-solid fa-file-signature mr-1" /> Surat Orderan
            </h1>
          </div>
          <button
            onClick={resetAll}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition active:scale-95"
          >
            Reset
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Metadata Orderan */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">No. Orderan</label>
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
                placeholder="Nama Instansi / Pelanggan..."
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Paket Pesanan / Deskripsi Pekerjaan</label>
              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded text-sm placeholder-gray-400"
                placeholder="Contoh: Pengadaan cetak buku panduan dan seminar kit..."
              />
            </div>

            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Waktu Pengerjaan</label>
                <input
                  type="text"
                  value={waktuPengerjaan}
                  onChange={(e) => setWaktuPengerjaan(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="Contoh: 3 Hari"
                />
              </div>
              <div className="w-1/2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Waktu Pengiriman</label>
                <input
                  type="text"
                  value={waktuPengiriman}
                  onChange={(e) => setWaktuPengiriman(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="Contoh: 1 Hari"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Label PDF (opsional)</label>
              <input
                type="text"
                value={fileLabel}
                onChange={(e) => setFileLabel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm placeholder-gray-400 font-mono text-xs"
                placeholder={namaCustomer ? `Default: ${namaCustomer.split("\n")[0].trim()}` : "misal: unimus / dinas..."}
              />
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
              Otomatis menampilkan stempel CV. Sinar Ilmu Jaya pada kolom tanda tangan Penyedia.
            </p>
          </div>

          {/* Form Tambah Item 6 Kolom */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-blue-900">Tambah Item Pekerjaan</h3>
              {editIdx !== null && (
                <span className="text-[10px] bg-orange-500 text-white px-2 rounded animate-pulse">Sedang Edit</span>
              )}
            </div>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full mb-2 p-2 border border-gray-300 rounded text-sm outline-none"
              placeholder="Uraian Barang / Jasa..."
            />
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value ? Number(e.target.value) : "")}
                className="w-16 p-2 border border-gray-300 rounded text-sm text-center"
                placeholder="Qty"
              />
              <input
                type="text"
                value={itemSatuan}
                onChange={(e) => setItemSatuan(e.target.value)}
                className="w-20 p-2 border border-gray-300 rounded text-sm text-center"
                placeholder="Satuan"
              />
              <input
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value ? Number(e.target.value) : "")}
                className="flex-1 p-2 border border-gray-300 rounded text-sm text-right"
                placeholder="Harga Satuan"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addItem}
                className={`flex-1 text-white py-2 rounded font-bold shadow active:scale-95 transition ${
                  editIdx !== null ? "bg-orange-500" : "bg-blue-900"
                }`}
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

          {/* List Item */}
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase">
              <span>Daftar Item</span>
              <span>{items.length} Item</span>
            </div>
            <div className="space-y-2 pb-10">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2 rounded border border-gray-200 flex justify-between items-center text-xs shadow-sm"
                >
                  <div className="flex-1 truncate pr-2">
                    <div className="font-bold text-gray-700">{item.namaBarang}</div>
                    <div className="text-gray-500">
                      {item.qty} {item.satuan || ""} × {formatRp(item.hargaSatuan)}
                    </div>
                  </div>
                  <div className="font-bold text-gray-800 mr-3">{formatRp(item.totalHarga)}</div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(idx)} className="text-orange-500 p-1" title="Edit">
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button onClick={() => removeItem(idx)} className="text-red-500 p-1" title="Hapus">
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* TAB 2: PREVIEW SURAT ORDERAN (A4)                                */}
      {/* ================================================================ */}
      <div
        className={`${
          activeTab === "preview" ? "block" : "hidden"
        } lg:flex flex-1 h-full overflow-y-auto flex-col items-center bg-[#525659] p-0 lg:p-10 gap-5`}
      >
        <style>{`
          .nota-wrapper { background: white; width: 210mm; min-height: 297mm; padding: 10mm 12mm; box-sizing: border-box; color: black; font-family: sans-serif; position: relative; flex-shrink: 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          .nota-table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 10px; }
          .nota-table th { background: #1e3a8a; color: white; border: 1px solid #1e3a8a; padding: 7px 6px; font-size: 9pt; font-weight: bold; text-align: center; text-transform: uppercase; }
          .nota-table td { border: 1px solid #1e3a8a; padding: 7px 6px; font-size: 10pt; vertical-align: top; }
          .nota-table tfoot td { border: 1px solid #1e3a8a; font-weight: bold; }
          .header-title { font-size: 15pt; font-weight: 900; color: #1e3a8a; line-height: 1.2; letter-spacing: -0.2px; font-family: "Times New Roman", serif; white-space: nowrap; }
          .header-sub { font-size: 10pt; font-weight: bold; color: #b91c1c; }
          .header-small { font-size: 9pt; color: #b91c1c; }

          @media (max-width: 1023px) {
            .fit-screen-container {
              width: 100%;
              overflow: hidden;
              display: flex;
              justify-content: center;
              padding: 8px 0;
            }
            .fit-screen-wrapper {
              transform: scale(calc((100vw - 20px) / 794));
              transform-origin: top center;
              margin-bottom: calc(-1 * (1123px - (1123px * (100vw - 20px) / 794)));
            }
          }
        `}</style>

        {/* Mobile Action Bar */}
        <div className="flex lg:hidden w-full px-3 py-2 bg-gray-900/90 backdrop-blur text-white justify-between items-center text-xs sticky top-0 z-20 shadow">
          <span className="text-gray-300 font-mono text-[11px] truncate max-w-[140px]">
            {noDokumen || "Orderan"}
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
            <i className="fa-solid fa-eye mr-1.5" /> Live Preview Surat Orderan (A4)
          </span>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded flex items-center gap-1.5 transition shadow active:scale-95"
          >
            <i className="fa-solid fa-print" /> Cetak Surat Orderan (Approach B)
          </button>
        </div>

        {/* Kertas A4 */}
        <div className={`w-full ${fitToScreen ? "fit-screen-container" : "overflow-x-auto flex justify-start sm:justify-center p-2"} pb-24 lg:pb-0`}>
          <div className={`nota-wrapper ${fitToScreen ? "fit-screen-wrapper" : ""}`}>
            <DocumentHeader
              documentTitle="SURAT ORDERAN"
              noDokumen={noDokumen || "-"}
              tanggalStr={fmtDate(tanggal)}
              namaCustomer={namaCustomer || "-"}
              recipientLabel="KEPADA"
              layoutType="inline_date"
            />

            <div style={{ fontSize: "9.5pt", marginBottom: "6px" }}>
              <b>Paket Pesanan:</b> <span>{deskripsi || "-"}</span>
            </div>
            <div style={{ fontSize: "9.5pt", marginBottom: "8px" }}>
              <b>Waktu Pengerjaan:</b> <span>{waktuPengerjaan || "-"}</span> &nbsp;&nbsp;|&nbsp;&nbsp;{" "}
              <b>Waktu Pengiriman:</b> <span>{waktuPengiriman || "-"}</span>
            </div>

            <DocumentTable
              mode="orderan"
              items={items}
              minRows={5}
              showTerbilang={true}
              terbilangKapital={true}
              terbilangStyle="inline"
            />

            <DocumentSignature
              variant="orderan"
              tanggalStr={fmtDate(tanggal)}
              kota="Semarang"
              sertakanStempel={sertakanStempel}
            />
          </div>
        </div>
      </div>

      {/* Bottom Nav — mobile */}
      <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 flex justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.625rem)] z-50 lg:hidden no-print">
        <button
          onClick={() => setActiveTab("input")}
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[11px] font-medium transition active:scale-95 ${
            activeTab === "input" ? "text-blue-900 font-bold" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <i className="fa-solid fa-pen-to-square text-lg mb-1" />
          <span>Input Form</span>
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[11px] font-medium transition active:scale-95 ${
            activeTab === "preview" ? "text-blue-900 font-bold" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <i className="fa-solid fa-file-signature text-lg mb-1" />
          <span>Surat Orderan</span>
        </button>
      </nav>

      {/* Print FAB — mobile */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-5 lg:hidden z-40 no-print">
        <button
          onClick={handlePrint}
          aria-label="Cetak Orderan"
          title="Cetak Orderan"
          className="bg-blue-900 hover:bg-blue-800 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition transform"
        >
          <i className="fa-solid fa-print text-xl" />
        </button>
      </div>
    </div>
  );
}

