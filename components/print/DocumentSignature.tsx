"use client";

import React from "react";

interface DocumentSignatureProps {
  variant: "nota" | "orderan";
  tanggalStr?: string;
  kota?: string;
  sertakanStempel?: boolean;
}

export function DocumentSignature({
  variant,
  tanggalStr = "-",
  kota = "Semarang",
  sertakanStempel = false,
}: DocumentSignatureProps) {
  if (variant === "orderan") {
    return (
      <div className="flex justify-end mt-10" style={{ fontSize: "9pt" }}>
        <div style={{ textAlign: "center", width: "220px", position: "relative" }}>
          <div style={{ marginBottom: "4px" }}>
            {kota}, {tanggalStr}
          </div>
          <div style={{ marginBottom: "4px" }}>Penyedia,</div>
          <div style={{ height: "60px", position: "relative" }}>
            {sertakanStempel && (
              <img
                src="/stempel.png"
                alt="Stempel CV Sinar Ilmu Jaya"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%) rotate(-5deg)",
                  width: "155px",
                  maxWidth: "none",
                  height: "auto",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
            )}
          </div>
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
        <div style={{ textAlign: "center", position: "relative", minWidth: "120px", marginRight: "14px" }}>
          <div style={{ marginBottom: "40px" }}>Hormat kami,</div>
          {sertakanStempel && (
            <img
              src="/stempel.png"
              alt="Stempel CV Sinar Ilmu Jaya"
              style={{
                position: "absolute",
                left: "calc(50% - 14px)",
                top: "16px",
                transform: "translateX(-50%) rotate(-6deg)",
                width: "155px",
                maxWidth: "none",
                height: "auto",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          )}
          <div style={{ borderTop: "1px solid #aaa", paddingTop: "2px", fontWeight: "bold" }}>
            ( Habibi )
          </div>
        </div>
      </div>
    </div>
  );
}
