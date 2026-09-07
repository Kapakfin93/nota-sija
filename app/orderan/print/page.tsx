"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { terbilang } from "../../../lib/services/terbilang";
import { formatPdfFileName } from "../../../lib/services/documentNumber";
import { ItemBarang } from "../../../lib/types/transaksi";

const DRAFT_STORAGE_KEY = "eOrderanDraft";

interface StoredOrderanData {
  no?: string;
  date?: string;
  cust?: string;
  desk?: string;
  kerja?: string;
  kirim?: string;
  fileLabel?: string;
  items?: ItemBarang[];
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y.slice(-2)}`;
}

export default function OrderanPrintPage() {
  const router = useRouter();
  const [data, setData] = useState<StoredOrderanData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData(parsed);
      }
    } catch (e) {
      console.error("Gagal membaca data orderan dari localStorage:", e);
    } finally {
      setIsReady(true);
    }
  }, []);

  const dynamicFileName = data
    ? formatPdfFileName({
        customLabel: data.fileLabel || data.cust,
        noDokumen: data.no || "draft",
      })
    : "sija-orderan";

  // Update document.title dinamis & auto-trigger dialog print
  useEffect(() => {
    if (isReady && data) {
      document.title = dynamicFileName;

      const onBeforePrint = () => {
        document.title = dynamicFileName;
      };
      window.addEventListener("beforeprint", onBeforePrint);

      const timer = setTimeout(() => {
        window.print();
      }, 400);

      return () => {
        window.removeEventListener("beforeprint", onBeforePrint);
        clearTimeout(timer);
      };
    }
  }, [isReady, data, dynamicFileName]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600">
        Memuat data Surat Orderan...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded shadow max-w-md text-center">
          <p className="text-gray-700 font-medium mb-4">Tidak ada data Surat Orderan yang ditemukan untuk dicetak.</p>
          <Link
            href="/orderan"
            className="inline-block bg-blue-900 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-800"
          >
            ? Kembali ke Form Orderan
          </Link>
        </div>
      </div>
    );
  }

  const items = data.items || [];
  const grandTotal = items.reduce((s, i) => s + (i.totalHarga || i.qty * i.hargaSatuan || 0), 0);
  const formatRp = (n: number) => n.toLocaleString("id-ID");

  return (
    <div className="min-h-screen bg-[#525659] py-0 lg:py-8 flex flex-col items-center">
      <title>{dynamicFileName}</title>

      {/* -- BAR KONTROL (HANYA TAMPIL DI LAYAR, OTOMATIS DISEMBUNYIKAN SAAT PRINT) -- */}
      <div className="no-print w-full max-w-[210mm] mb-3 px-3 pt-[max(env(safe-area-inset-top),0.75rem)] flex flex-wrap items-center justify-between gap-2 text-white text-sm">
        <button
          onClick={() => router.push("/orderan")}
          className="min-h-[40px] bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition active:scale-95 text-xs sm:text-sm"
        >
          <i className="fa-solid fa-arrow-left" /> Kembali ke Form
        </button>

        <div className="hidden sm:flex flex-col items-center text-xs text-gray-300">
          <span>Target File: <strong className="text-white font-mono">{formatPdfFileName({ customLabel: data.fileLabel || data.cust, noDokumen: data.no || "draft" })}.pdf</strong></span>
          <span className="text-[10px] text-gray-400">Nama otomatis tersugesti saat Save as PDF</span>
        </div>

        <button
          onClick={() => window.print()}
          className="min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow flex items-center gap-1.5 transition active:scale-95 text-xs sm:text-sm"
        >
          <i className="fa-solid fa-print" /> Cetak Sekarang
        </button>
      </div>

      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            background: transparent !important;
          }
          .nota-wrapper {
            box-shadow: none !important;
            margin: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
          }
        }
        .nota-wrapper {
          background: white;
          width: 210mm;
          min-height: 297mm;
          padding: 10mm 12mm;
          box-sizing: border-box;
          color: black;
          font-family: sans-serif;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          flex-shrink: 0;
        }
        .nota-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          margin-bottom: 10px;
        }
        .nota-table th {
          background: #1e3a8a;
          color: white;
          border: 1px solid #1e3a8a;
          padding: 7px 6px;
          font-size: 9pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
        }
        .nota-table td {
          border: 1px solid #1e3a8a;
          padding: 7px 6px;
          font-size: 10pt;
          vertical-align: top;
        }
        .nota-table tfoot td {
          border: 1px solid #1e3a8a;
          font-weight: bold;
        }
        .header-title {
          font-size: 15pt;
          font-weight: 900;
          color: #1e3a8a;
          line-height: 1.2;
          letter-spacing: -0.2px;
          font-family: "Times New Roman", serif;
          white-space: nowrap;
        }
        .header-sub {
          font-size: 10pt;
          font-weight: bold;
          color: #b91c1c;
        }
        .header-small {
          font-size: 9pt;
          color: #b91c1c;
        }
      `}</style>

      {/* -- KERTAS A4 SURAT ORDERAN (6 KOLOM) -- */}
      <div className="print-container">
        <div className="nota-wrapper">
          {/* HEADER */}
          <div className="flex justify-between items-start mb-2">
            <div style={{ width: "74%", display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, marginTop: "2px" }}>
                <img
                  src="/logo.png"
                  alt="Logo CV Sinar Ilmu Jaya"
                  style={{ width: "42px", height: "auto", display: "block" }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="header-title">CV. SINAR ILMU JAYA</div>
                <div className="header-sub">Percetakan - Digital Printing - Souvenir</div>
                <div className="header-small mt-1">Jl. Kapas Tengah II Blok F No.721 / 0822 30563792</div>
              </div>
            </div>
            <div style={{ width: "26%", textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "8pt", color: "#555" }}>KEPADA</div>
              <div className="font-bold text-black" style={{ fontSize: "9.5pt", minHeight: "18px" }}>
                {data.cust || "-"}
              </div>
            </div>
          </div>

          <div className="w-full" style={{ height: "2px", background: "#1e3a8a", margin: "6px 0 8px" }} />

          <div className="flex items-end justify-between mb-2">
            <div className="flex items-end">
              <span
                style={{
                  background: "#1e3a8a",
                  color: "white",
                  padding: "2px 8px",
                  fontWeight: "bold",
                  fontSize: "9pt",
                  borderRadius: "2px",
                }}
              >
                SURAT ORDERAN
              </span>
              <span style={{ fontWeight: "bold", fontSize: "10.5pt", marginLeft: "8px", fontFamily: "monospace" }}>
                {data.no || "-"}
              </span>
            </div>
            <div style={{ textAlign: "right", fontSize: "9pt" }}>
              <span style={{ color: "#555" }}>Tanggal:</span>{" "}
              <span className="font-bold">{fmtDate(data.date)}</span>
            </div>
          </div>

          <div style={{ fontSize: "9.5pt", marginBottom: "6px" }}>
            <b>Paket Pesanan:</b> <span>{data.desk || "-"}</span>
          </div>
          <div style={{ fontSize: "9.5pt", marginBottom: "8px" }}>
            <b>Waktu Pengerjaan:</b> <span>{data.kerja || "-"}</span> &nbsp;&nbsp;|&nbsp;&nbsp;{" "}
            <b>Waktu Pengiriman:</b> <span>{data.kirim || "-"}</span>
          </div>

          {/* TABEL 6 KOLOM */}
          <table className="nota-table">
            <thead>
              <tr>
                <th style={{ width: "26px" }}>NO</th>
                <th style={{ textAlign: "left" }}>URAIAN BARANG/JASA</th>
                <th style={{ width: "50px" }}>QTY</th>
                <th style={{ width: "60px" }}>SATUAN</th>
                <th style={{ width: "100px" }}>HARGA SATUAN</th>
                <th style={{ width: "120px" }}>TOTAL HARGA</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: "center" }}>{idx + 1}</td>
                  <td>{item.namaBarang}</td>
                  <td style={{ textAlign: "center" }}>{item.qty}</td>
                  <td style={{ textAlign: "center" }}>{item.satuan || "-"}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {formatRp(item.hargaSatuan)}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {formatRp(item.totalHarga || item.qty * item.hargaSatuan)}
                  </td>
                </tr>
              ))}
              {items.length < 5 &&
                Array.from({ length: 5 - items.length }).map((_, k) => (
                  <tr key={`empty-${k}`}>
                    <td style={{ textAlign: "center" }}>&nbsp;</td>
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ textAlign: "right" }}>
                  TOTAL
                </td>
                <td style={{ textAlign: "right", fontSize: "11pt", whiteSpace: "nowrap" }}>
                  Rp {formatRp(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style={{ fontSize: "8.5pt" }}>
            <b>Terbilang :</b>{" "}
            <span style={{ fontStyle: "italic" }}>
              {terbilang(grandTotal, { kapital: true })}
            </span>
          </div>

          {/* TANDA TANGAN TUNGGAL PENYEDIA */}
          <div className="flex justify-end mt-10" style={{ fontSize: "9pt" }}>
            <div style={{ textAlign: "center", width: "220px" }}>
              <div style={{ marginBottom: "4px" }}>Semarang, {fmtDate(data.date)}</div>
              <div style={{ marginBottom: "4px" }}>Penyedia,</div>
              <div style={{ height: "60px" }} />
              <div style={{ borderTop: "1px solid #333", paddingTop: "4px", fontWeight: "bold" }}>
                CV. SINAR ILMU JAYA
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

