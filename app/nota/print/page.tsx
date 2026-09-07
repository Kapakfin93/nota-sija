"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { terbilang } from "../../../lib/services/terbilang";
import { formatPdfFileName } from "../../../lib/services/documentNumber";
import { ItemBarang } from "../../../lib/types/transaksi";

const STORAGE_KEY = "eNotaSija";

interface StoredNotaData {
  items?: ItemBarang[];
  no?: string;
  date?: string;
  cust?: string;
  fileLabel?: string;
  bottomMode?: "none" | "kwitansi" | "nota2";
  ket?: string;
  items2?: ItemBarang[];
  no2?: string;
  date2?: string;
  cust2?: string;
  kwitansi?: boolean; // legacy compatibility
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y.slice(-2)}`;
}

export default function NotaPrintPage() {
  const router = useRouter();
  const [data, setData] = useState<StoredNotaData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData(parsed);
      }
    } catch (e) {
      console.error("Gagal membaca data nota dari localStorage:", e);
    } finally {
      setIsReady(true);
    }
  }, []);

  const dynamicFileName = data
    ? formatPdfFileName({
        customLabel: data.fileLabel || data.cust,
        noDokumen: data.no || "draft",
      })
    : "sija-nota";

  // Update document.title dinamis & auto-trigger dialog print
  useEffect(() => {
    if (isReady && data) {
      document.title = dynamicFileName;

      // Event listener sebelum dialog browser print terbuka
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
        Memuat data cetak...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded shadow max-w-md text-center">
          <p className="text-gray-700 font-medium mb-4">Tidak ada data nota yang ditemukan untuk dicetak.</p>
          <Link
            href="/nota"
            className="inline-block bg-blue-900 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-800"
          >
            ← Kembali ke Form Input Nota
          </Link>
        </div>
      </div>
    );
  }

  const items = data.items || [];
  const items2 = data.items2 || [];
  const bottomMode = data.bottomMode || (data.kwitansi ? "kwitansi" : "none");
  const grandTotal = items.reduce((s, i) => s + (i.totalHarga || i.qty * i.hargaSatuan || 0), 0);
  const grandTotal2 = items2.reduce((s, i) => s + (i.totalHarga || i.qty * i.hargaSatuan || 0), 0);

  const formatRp = (n: number) => n.toLocaleString("id-ID");

  return (
    <div className="min-h-screen bg-[#525659] py-0 lg:py-8 flex flex-col items-center">
      <title>{dynamicFileName}</title>
      {/* ── BAR KONTROL (HANYA TAMPIL DI LAYAR, OTOMATIS DISSEMBUNYIKAN SAAT PRINT) ── */}
      <div className="no-print w-full max-w-[210mm] mb-4 px-3 flex items-center justify-between text-white text-sm">
        <button
          onClick={() => router.push("/nota")}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded flex items-center gap-1.5 transition"
        >
          <i className="fa-solid fa-arrow-left" /> Kembali ke Form
        </button>

        <div className="hidden sm:flex flex-col items-center text-xs text-gray-300">
          <span>Target File: <strong className="text-white font-mono">{formatPdfFileName({ customLabel: data.fileLabel || data.cust, noDokumen: data.no || "draft" })}.pdf</strong></span>
          <span className="text-[10px] text-gray-400">Nama ini otomatis tersugesti saat Save as PDF</span>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded shadow flex items-center gap-1.5 transition"
        >
          <i className="fa-solid fa-print" /> Cetak Sekarang (Ctrl+P)
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
        .doc-half {
          min-height: 128mm;
        }
        .doc-half.kwitansi-half {
          border-top: 2px dashed #999;
          margin-top: 8mm;
          padding-top: 8mm;
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
          padding: 6px 5px;
          font-size: 8.5pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
        }
        .nota-table td {
          border: 1px solid #1e3a8a;
          padding: 6px 5px;
          font-size: 9.5pt;
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
          font-family: 'Times New Roman', serif;
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

      {/* ── KERTAS A4 ── */}
      <div className="print-container">
        <div className="nota-wrapper">
          {/* ─────────────── NOTA UTAMA ─────────────── */}
          <div className="doc-half">
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
                <div style={{ fontSize: "8pt", color: "#555" }}>TANGGAL</div>
                <div className="font-bold mb-2" style={{ fontSize: "9.5pt" }}>
                  {fmtDate(data.date)}
                </div>
                <div style={{ fontSize: "8pt", color: "#555" }}>KEPADA YTH.</div>
                <div className="font-bold text-black" style={{ fontSize: "9.5pt", minHeight: "18px" }}>
                  {data.cust || "-"}
                </div>
              </div>
            </div>

            <div className="w-full" style={{ height: "2px", background: "#1e3a8a", margin: "6px 0 8px" }} />

            <div className="flex items-end mb-2">
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
                NOTA
              </span>
              <span style={{ fontWeight: "bold", fontSize: "10.5pt", marginLeft: "8px", fontFamily: "monospace" }}>
                {data.no || "-"}
              </span>
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
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: "center" }}>{idx + 1}</td>
                    <td>{item.namaBarang}</td>
                    <td style={{ textAlign: "center" }}>{item.qty}</td>
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
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: "right" }}>
                    TOTAL
                  </td>
                  <td style={{ textAlign: "right", fontSize: "11pt", whiteSpace: "nowrap" }}>
                    Rp {formatRp(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style={{ fontSize: "8.5pt" }}>
              <b>Keterangan :</b>
              <br />
              <b>Terbilang :</b>{" "}
              <span style={{ fontStyle: "italic" }}>
                {terbilang(grandTotal)}
              </span>
            </div>

            <div className="flex mt-6" style={{ fontSize: "8.5pt" }}>
              <div style={{ width: "55%", paddingRight: "10px" }}>
                <div
                  style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: "4px",
                    marginBottom: "4px",
                    fontWeight: "bold",
                  }}
                >
                  Info Pembayaran:
                </div>
                <div>Transfer Via BCA</div>
                <div className="font-bold" style={{ color: "#1e3a8a" }}>
                  a/n MUHTARUDIN NURUL HABIBI
                </div>
                <div className="font-mono text-xs mt-1">No. 009-7085-203</div>
              </div>
              <div style={{ width: "45%", display: "flex", justifyContent: "space-between" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ marginBottom: "40px" }}>Diterima oleh,</div>
                  <div style={{ borderTop: "1px solid #aaa", paddingTop: "2px", fontWeight: "bold" }}>
                    ( ................. )
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ marginBottom: "40px" }}>Hormat kami,</div>
                  <div style={{ borderTop: "1px solid #aaa", paddingTop: "2px", fontWeight: "bold" }}>
                    &nbsp;
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────── BAGIAN BAWAH: KWITANSI ─────────────── */}
          {bottomMode === "kwitansi" && (
            <div className="doc-half kwitansi-half">
              <div className="flex justify-between items-start" style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flexShrink: 0 }}>
                    <img
                      src="/logo.png"
                      alt="Logo CV Sinar Ilmu Jaya"
                      style={{ width: "42px", height: "auto", display: "block" }}
                    />
                  </div>
                  <div>
                    <div className="header-title">CV. SINAR ILMU JAYA</div>
                    <div className="header-sub">Percetakan - Digital Printing - Souvenir</div>
                    <div className="header-small mt-1">Jl. Kapas Tengah II Blok F No.721 / 0822 30563792</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "8pt", color: "#555" }}>NOTA NOMOR</div>
                  <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "monospace" }}>
                    {data.no || "-"}
                  </div>
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "18pt",
                  fontWeight: 900,
                  letterSpacing: "2px",
                  color: "#1e3a8a",
                  margin: "10px 0",
                }}
              >
                KWITANSI
              </div>
              <div style={{ fontSize: "10pt", lineHeight: 2 }}>
                <b>Sudah diterima dari</b>
                <br />
                Nama &nbsp;&nbsp;&nbsp;&nbsp;: <span className="font-bold">{data.cust || "-"}</span>
                <br />
                Jumlah &nbsp;&nbsp;:{" "}
                <span className="font-bold italic uppercase">
                  {terbilang(grandTotal, { kapital: true })}
                </span>
                <br />
                Keterangan : <span className="italic" style={{ fontSize: "9pt" }}>{data.ket || "-"}</span>
              </div>
              <div
                style={{
                  border: "2px solid #1e3a8a",
                  marginTop: "14px",
                  padding: "10px",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "13pt",
                  whiteSpace: "nowrap",
                }}
              >
                Rp {formatRp(grandTotal)}
              </div>
              <div style={{ textAlign: "right", marginTop: "30px", fontSize: "9.5pt" }}>
                Semarang, {fmtDate(data.date)}
              </div>
              <div style={{ textAlign: "right", marginTop: "45px", fontSize: "9.5pt" }}>
                ( ................................... )
              </div>
            </div>
          )}

          {/* ─────────────── BAGIAN BAWAH: NOTA KEDUA ─────────────── */}
          {bottomMode === "nota2" && (
            <div className="doc-half kwitansi-half">
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
                  <div style={{ fontSize: "8pt", color: "#555" }}>TANGGAL</div>
                  <div className="font-bold mb-2" style={{ fontSize: "9.5pt" }}>
                    {fmtDate(data.date2)}
                  </div>
                  <div style={{ fontSize: "8pt", color: "#555" }}>KEPADA YTH.</div>
                  <div className="font-bold text-black" style={{ fontSize: "9.5pt", minHeight: "18px" }}>
                    {data.cust2 || "-"}
                  </div>
                </div>
              </div>

              <div className="w-full" style={{ height: "2px", background: "#1e3a8a", margin: "6px 0 8px" }} />

              <div className="flex items-end mb-2">
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
                  NOTA
                </span>
                <span style={{ fontWeight: "bold", fontSize: "10.5pt", marginLeft: "8px", fontFamily: "monospace" }}>
                  {data.no2 || "-"}
                </span>
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
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {formatRp(item.hargaSatuan)}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {formatRp(item.totalHarga || item.qty * item.hargaSatuan)}
                      </td>
                    </tr>
                  ))}
                  {items2.length < 3 &&
                    Array.from({ length: 3 - items2.length }).map((_, k) => (
                      <tr key={`empty2-${k}`}>
                        <td style={{ textAlign: "center" }}>&nbsp;</td>
                        <td />
                        <td />
                        <td />
                        <td />
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right" }}>
                      TOTAL
                    </td>
                    <td style={{ textAlign: "right", fontSize: "11pt", whiteSpace: "nowrap" }}>
                      Rp {formatRp(grandTotal2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div style={{ fontSize: "8.5pt" }}>
                <b>Keterangan :</b>
                <br />
                <b>Terbilang :</b>{" "}
                <span style={{ fontStyle: "italic" }}>
                  {terbilang(grandTotal2)}
                </span>
              </div>

              <div className="flex mt-6" style={{ fontSize: "8.5pt" }}>
                <div style={{ width: "55%", paddingRight: "10px" }}>
                  <div
                    style={{
                      borderBottom: "1px solid #ddd",
                      paddingBottom: "4px",
                      marginBottom: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    Info Pembayaran:
                  </div>
                  <div>Transfer Via BCA</div>
                  <div className="font-bold" style={{ color: "#1e3a8a" }}>
                    a/n MUHTARUDIN NURUL HABIBI
                  </div>
                  <div className="font-mono text-xs mt-1">No. 009-7085-203</div>
                </div>
                <div style={{ width: "45%", display: "flex", justifyContent: "space-between" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ marginBottom: "40px" }}>Diterima oleh,</div>
                    <div style={{ borderTop: "1px solid #aaa", paddingTop: "2px", fontWeight: "bold" }}>
                      ( ................. )
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ marginBottom: "40px" }}>Hormat kami,</div>
                    <div style={{ borderTop: "1px solid #aaa", paddingTop: "2px", fontWeight: "bold" }}>
                      &nbsp;
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
