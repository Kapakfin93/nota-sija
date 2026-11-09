"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Transaksi } from "@/lib/types/transaksi";
import { formatRupiah, formatAngka } from "@/lib/utils/format";
import { terbilang } from "@/lib/services/terbilang";
import { updateNoDokumenTanggal } from "@/lib/services/documentNumber";

interface DetailModalProps {
  transaksi: Transaksi | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  transaksi,
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [useTodayDate, setUseTodayDate] = useState<boolean>(true);

  if (!isOpen || !transaksi) return null;

  const handleDuplicateToNota = () => {
    // Siapkan draft untuk localStorage eNotaSija
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    let targetDate = todayStr;
    let targetNo = updateNoDokumenTanggal(transaksi.noDokumen, todayStr, true);

    if (!useTodayDate) {
      // Pertahankan tanggal dokumen asli (konversi DD/MM/YY ke YYYY-MM-DD jika memungkinkan)
      const parts = (transaksi.tanggalDokumen || "").split("/");
      if (parts.length === 3) {
        const [d, m, y] = parts;
        targetDate = `20${y}-${m}-${d}`;
        targetNo = transaksi.noDokumen;
      }
    }

    const modeForm =
      transaksi.modeBagianBawah === "nota_kedua"
        ? "nota2"
        : transaksi.modeBagianBawah === "kwitansi"
        ? "kwitansi"
        : "none";

    const normalizedItems = (transaksi.items || []).map((i) => {
      const q = Number(i.qty) || 1;
      const h = Number(i.hargaSatuan) || 0;
      const t = Number(i.totalHarga) || q * h;
      return {
        namaBarang: i.namaBarang || "",
        qty: q,
        satuan: i.satuan || "",
        hargaSatuan: h,
        totalHarga: t,
      };
    });

    const draftData = {
      no: targetNo,
      noDokumen: targetNo,
      date: targetDate,
      tanggal: targetDate,
      cust: transaksi.namaCustomer || "",
      customer: transaksi.namaCustomer || "",
      bottomMode: modeForm,
      ket: transaksi.keteranganKwitansi || "",
      kwitansiKet: transaksi.keteranganKwitansi || "",
      sertakanStempel: true,
      items: normalizedItems,
      items2: [],
      no2: "",
      date2: targetDate,
      cust2: "",
    };


    try {
      localStorage.setItem("eNotaSija", JSON.stringify(draftData));
      router.push("/nota");
    } catch (e) {
      console.error("Gagal menyimpan draft duplikasi:", e);
      alert("Gagal menduplikat ke formulir Nota.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
              SIJA
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Rincian Nota</span>
                <span className="font-mono text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-xs">
                  {transaksi.noDokumen}
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                Tanggal: {transaksi.tanggalDokumen} • Pelanggan: {transaksi.namaCustomer}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-200 text-xs">
            <div>
              <span className="text-gray-500 block text-[11px]">Kepada Yth</span>
              <span className="font-semibold text-gray-900">{transaksi.namaCustomer || "-"}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Status Bayar</span>
              <span
                className={`inline-flex items-center gap-1 font-bold capitalize mt-0.5 ${
                  transaksi.status === "lunas" ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                ● {transaksi.status}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Format Bawah</span>
              <span className="font-medium text-gray-800 capitalize mt-0.5 block">
                {transaksi.modeBagianBawah === "kwitansi"
                  ? "Sertakan Kwitansi"
                  : transaksi.modeBagianBawah === "nota_kedua"
                  ? "Nota Kedua (Rangkap)"
                  : "Standar (Kosong)"}

              </span>
            </div>
          </div>

          {/* Table Items */}
          <div>
            <span className="text-xs font-bold text-gray-700 block mb-1.5 uppercase tracking-wider">
              Rincian Item Barang / Jasa
            </span>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold text-[11px]">
                  <tr>
                    <th className="px-3 py-2 text-center w-10">No</th>
                    <th className="px-3 py-2 text-left">Nama Barang</th>
                    <th className="px-3 py-2 text-center">Banyaknya</th>
                    <th className="px-3 py-2 text-right">Harga Satuan</th>
                    <th className="px-3 py-2 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transaksi.items && transaksi.items.length > 0 ? (
                    transaksi.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-center text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{item.namaBarang}</td>
                        <td className="px-3 py-2 text-center text-gray-700 whitespace-nowrap">
                          {formatAngka(item.qty)} {item.satuan || ""}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                          {formatRupiah(item.hargaSatuan)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900 whitespace-nowrap">
                          {formatRupiah(item.totalHarga)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-gray-400 italic">
                        Tidak ada rincian item
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right">
                      Total Nominal:
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-blue-900 whitespace-nowrap">
                      {formatRupiah(transaksi.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Terbilang Box */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs">
            <span className="font-semibold text-blue-900 block text-[11px] mb-0.5">
              Terbilang:
            </span>
            <p className="italic text-gray-700 font-medium">
              # {terbilang(transaksi.total, { kapital: true })} Rupiah #
            </p>
          </div>

          {/* Clone / Duplication Options */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-2">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span>Fitur Kloning / Edit Fleksibel Cepat:</span>
            </span>
            <p className="text-gray-600">
              Muat data nota ini ke formulir Nota untuk edit tanggal atau item tanpa perlu ketik ulang dari awal.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-gray-800">
                <input
                  type="radio"
                  name="cloneDateMode"
                  checked={useTodayDate}
                  onChange={() => setUseTodayDate(true)}
                  className="text-blue-900"
                />
                <span className="font-medium">Perbarui ke Hari Ini & Nomor Unik Baru</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-gray-800">
                <input
                  type="radio"
                  name="cloneDateMode"
                  checked={!useTodayDate}
                  onChange={() => setUseTodayDate(false)}
                  className="text-blue-900"
                />
                <span>Gunakan Tanggal Dokumen Asli</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDuplicateToNota}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Muat ke Formulir Nota</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
