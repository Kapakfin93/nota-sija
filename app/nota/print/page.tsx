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
  KwitansiBlock,
} from "../../../components/print";

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
  kwitansi?: boolean;
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y.slice(-2)}`;
}

export default function NotaPrintPage() {
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

  return (
    <div className="min-h-screen bg-[#525659] py-0 lg:py-8 flex flex-col items-center">
      <title>{dynamicFileName}</title>

      <PrintControlBar
        backHref="/nota"
        backText="Kembali ke Form"
        targetFileName={`${dynamicFileName}.pdf`}
        fileHint="Nama ini otomatis tersugesti saat Save as PDF"
      />

      <PrintStyles />

      <div className="print-container">
        <div className="nota-wrapper">
          <div className="doc-half">
            <DocumentHeader
              documentTitle="NOTA"
              noDokumen={data.no || "-"}
              tanggalStr={fmtDate(data.date)}
              namaCustomer={data.cust || "-"}
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

            <DocumentSignature variant="nota" />
          </div>

          {bottomMode === "kwitansi" && (
            <KwitansiBlock
              noDokumen={data.no || "-"}
              tanggalStr={fmtDate(data.date)}
              namaCustomer={data.cust || "-"}
              nominal={grandTotal}
              keterangan={data.ket}
              kota="Semarang"
            />
          )}

          {bottomMode === "nota2" && (
            <div className="doc-half kwitansi-half">
              <DocumentHeader
                documentTitle="NOTA"
                noDokumen={data.no2 || "-"}
                tanggalStr={fmtDate(data.date2)}
                namaCustomer={data.cust2 || "-"}
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

              <DocumentSignature variant="nota" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
