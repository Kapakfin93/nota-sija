"use client";

import React from "react";

interface DocumentHeaderProps {
  documentTitle: "NOTA" | "SURAT ORDERAN";
  noDokumen: string;
  tanggalStr: string;
  namaCustomer: string;
  recipientLabel?: "KEPADA" | "KEPADA YTH.";
  layoutType?: "split_header" | "inline_date";
}

export function DocumentHeader({
  documentTitle,
  noDokumen,
  tanggalStr,
  namaCustomer,
  recipientLabel = "KEPADA YTH.",
  layoutType = "split_header",
}: DocumentHeaderProps) {
  return (
    <>
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
          {layoutType === "split_header" ? (
            <>
              <div style={{ fontSize: "8pt", color: "#555" }}>TANGGAL</div>
              <div className="font-bold mb-2" style={{ fontSize: "9.5pt" }}>
                {tanggalStr}
              </div>
              <div style={{ fontSize: "8pt", color: "#555" }}>{recipientLabel}</div>
              <div className="font-bold text-black" style={{ fontSize: "9.5pt", minHeight: "18px" }}>
                {namaCustomer || "-"}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "8pt", color: "#555" }}>{recipientLabel}</div>
              <div className="font-bold text-black" style={{ fontSize: "9.5pt", minHeight: "18px" }}>
                {namaCustomer || "-"}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="w-full" style={{ height: "2px", background: "#1e3a8a", margin: "6px 0 8px" }} />

      <div className={`flex items-end mb-2 ${layoutType === "inline_date" ? "justify-between" : ""}`}>
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
            {documentTitle}
          </span>
          <span style={{ fontWeight: "bold", fontSize: "10.5pt", marginLeft: "8px", fontFamily: "monospace" }}>
            {noDokumen || "-"}
          </span>
        </div>
        {layoutType === "inline_date" && (
          <div style={{ textAlign: "right", fontSize: "9pt" }}>
            <span style={{ color: "#555" }}>Tanggal:</span>{" "}
            <span className="font-bold">{tanggalStr}</span>
          </div>
        )}
      </div>
    </>
  );
}
