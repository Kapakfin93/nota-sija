"use client";

import React from "react";

interface DocumentSignatureProps {
  variant: "nota" | "orderan";
  tanggalStr?: string;
  kota?: string;
}

export function DocumentSignature({
  variant,
  tanggalStr = "-",
  kota = "Semarang",
}: DocumentSignatureProps) {
  if (variant === "orderan") {
    return (
      <div className="flex justify-end mt-10" style={{ fontSize: "9pt" }}>
        <div style={{ textAlign: "center", width: "220px" }}>
          <div style={{ marginBottom: "4px" }}>
            {kota}, {tanggalStr}
          </div>
          <div style={{ marginBottom: "4px" }}>Penyedia,</div>
          <div style={{ height: "60px" }} />
          <div style={{ borderTop: "1px solid #333", paddingTop: "4px", fontWeight: "bold" }}>
            CV. SINAR ILMU JAYA
          </div>
        </div>
      </div>
    );
  }

  return (
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
  );
}
