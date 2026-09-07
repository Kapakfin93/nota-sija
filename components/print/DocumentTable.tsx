"use client";

import React from "react";
import { terbilang } from "../../lib/services/terbilang";
import { ItemBarang } from "../../lib/types/transaksi";

interface DocumentTableProps {
  mode: "nota" | "orderan";
  items: ItemBarang[];
  minRows?: number;
  showTerbilang?: boolean;
  terbilangKapital?: boolean;
  terbilangStyle?: "default" | "inline";
}

export function DocumentTable({
  mode,
  items,
  minRows = 5,
  showTerbilang = true,
  terbilangKapital = false,
  terbilangStyle = "default",
}: DocumentTableProps) {
  const grandTotal = items.reduce(
    (s, i) => s + (i.totalHarga || i.qty * i.hargaSatuan || 0),
    0
  );
  const formatRp = (n: number) => n.toLocaleString("id-ID");

  const emptyRowCount = Math.max(0, minRows - items.length);

  return (
    <>
      <table className="nota-table">
        <thead>
          {mode === "nota" ? (
            <tr>
              <th style={{ width: "28px" }}>NO</th>
              <th style={{ textAlign: "left" }}>NAMA BARANG</th>
              <th style={{ width: "55px" }}>VOLUME</th>
              <th style={{ width: "105px" }}>HARGA</th>
              <th style={{ width: "130px" }}>JUMLAH</th>
            </tr>
          ) : (
            <tr>
              <th style={{ width: "26px" }}>NO</th>
              <th style={{ textAlign: "left" }}>URAIAN BARANG/JASA</th>
              <th style={{ width: "50px" }}>QTY</th>
              <th style={{ width: "60px" }}>SATUAN</th>
              <th style={{ width: "100px" }}>HARGA SATUAN</th>
              <th style={{ width: "120px" }}>TOTAL HARGA</th>
            </tr>
          )}
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ textAlign: "center" }}>{idx + 1}</td>
              <td>{item.namaBarang}</td>
              <td style={{ textAlign: "center" }}>{item.qty}</td>
              {mode === "orderan" && (
                <td style={{ textAlign: "center" }}>{item.satuan || "-"}</td>
              )}
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                {formatRp(item.hargaSatuan)}
              </td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                {formatRp(item.totalHarga || item.qty * item.hargaSatuan)}
              </td>
            </tr>
          ))}

          {emptyRowCount > 0 &&
            Array.from({ length: emptyRowCount }).map((_, k) => (
              <tr key={`empty-${k}`}>
                <td style={{ textAlign: "center" }}>&nbsp;</td>
                <td />
                <td />
                {mode === "orderan" && <td />}
                <td />
                <td />
              </tr>
            ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={mode === "nota" ? 4 : 5} style={{ textAlign: "right" }}>
              TOTAL
            </td>
            <td style={{ textAlign: "right", fontSize: "11pt", whiteSpace: "nowrap" }}>
              Rp {formatRp(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>

      {showTerbilang && (
        <div style={{ fontSize: "8.5pt" }}>
          {terbilangStyle === "default" ? (
            <>
              <b>Keterangan :</b>
              <br />
              <b>Terbilang :</b>{" "}
              <span style={{ fontStyle: "italic" }}>
                {terbilang(grandTotal, { kapital: terbilangKapital })}
              </span>
            </>
          ) : (
            <>
              <b>Terbilang :</b>{" "}
              <span style={{ fontStyle: "italic" }}>
                {terbilang(grandTotal, { kapital: terbilangKapital })}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
