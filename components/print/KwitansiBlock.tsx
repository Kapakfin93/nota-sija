"use client";

import React from "react";
import { terbilang } from "../../lib/services/terbilang";

interface KwitansiBlockProps {
  noDokumen: string;
  tanggalStr: string;
  namaCustomer: string;
  nominal: number;
  keterangan?: string;
  kota?: string;
}

export function KwitansiBlock({
  noDokumen,
  tanggalStr,
  namaCustomer,
  nominal,
  keterangan,
  kota = "Semarang",
}: KwitansiBlockProps) {
  const formatRp = (n: number) => n.toLocaleString("id-ID");

  return (
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
            {noDokumen || "-"}
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
        Nama &nbsp;&nbsp;&nbsp;&nbsp;: <span className="font-bold">{namaCustomer || "-"}</span>
        <br />
        Jumlah &nbsp;&nbsp;:{" "}
        <span className="font-bold italic uppercase">
          {terbilang(nominal, { kapital: true })}
        </span>
        <br />
        Keterangan : <span className="italic" style={{ fontSize: "9pt" }}>{keterangan || "-"}</span>
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
        Rp {formatRp(nominal)}
      </div>

      <div style={{ textAlign: "right", marginTop: "30px", fontSize: "9.5pt" }}>
        {kota}, {tanggalStr}
      </div>
      <div style={{ textAlign: "right", marginTop: "45px", fontSize: "9.5pt" }}>
        ( ................................... )
      </div>
    </div>
  );
}
