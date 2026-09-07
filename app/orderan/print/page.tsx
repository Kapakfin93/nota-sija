"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPdfFileName } from "../../../lib/services/documentNumber";
import { ItemBarang } from "../../../lib/types/transaksi";
import {
  PrintStyles,
  PrintControlBar,
  DocumentHeader,
  DocumentTable,
  DocumentSignature,
} from "../../../components/print";

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
  sertakanStempel?: boolean;
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y.slice(-2)}`;
}

export default function OrderanPrintPage() {
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
            ← Kembali ke Form Orderan
          </Link>
        </div>
      </div>
    );
  }

  const items = data.items || [];

  return (
    <div className="min-h-screen bg-[#525659] py-0 lg:py-8 flex flex-col items-center">
      <title>{dynamicFileName}</title>

      <PrintControlBar
        backHref="/orderan"
        backText="Kembali ke Form"
        targetFileName={`${dynamicFileName}.pdf`}
        fileHint="Nama otomatis tersugesti saat Save as PDF"
      />

      <PrintStyles />

      <div className="print-container">
        <div className="nota-wrapper">
          <DocumentHeader
            documentTitle="SURAT ORDERAN"
            noDokumen={data.no || "-"}
            tanggalStr={fmtDate(data.date)}
            namaCustomer={data.cust || "-"}
            recipientLabel="KEPADA"
            layoutType="inline_date"
          />

          <div style={{ fontSize: "9.5pt", marginBottom: "6px" }}>
            <b>Paket Pesanan:</b> <span>{data.desk || "-"}</span>
          </div>
          <div style={{ fontSize: "9.5pt", marginBottom: "8px" }}>
            <b>Waktu Pengerjaan:</b> <span>{data.kerja || "-"}</span> &nbsp;&nbsp;|&nbsp;&nbsp;{" "}
            <b>Waktu Pengiriman:</b> <span>{data.kirim || "-"}</span>
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
            tanggalStr={fmtDate(data.date)}
            kota="Semarang"
            sertakanStempel={Boolean(data.sertakanStempel)}
          />
        </div>
      </div>
    </div>
  );
}
