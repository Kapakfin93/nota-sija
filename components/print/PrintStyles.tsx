"use client";

import React from "react";

export function PrintStyles() {
  return (
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
  );
}
