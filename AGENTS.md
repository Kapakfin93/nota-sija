<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — nota-sija Constitution & Developer Rules

> **Core Philosophy:** DATA FIRST, NEVER ASSUME. IF AMBIGUOUS → STOP AND ASK.  
> **Documentation Center:** Refer to `.agents/` for PRD, ARCHITECTURE, DESIGN, SECURITY, TESTING, and DEPLOYMENT.

---

## 1. Project Overview & Tech Stack

- **Name:** nota-sija
- **Description:** Sistem penerbitan Nota, Kwitansi, dan Surat Orderan digital CV. Sinar Ilmu Jaya.
- **Language:** TypeScript (Strict Mode)
- **Framework:** Next.js (App Router, Turbopack)
- **UI & Styling:** React 19, Tailwind CSS v4, Dedicated Print CSS (`@page`)
- **Storage:** Hybrid Architecture (LocalStorage Offline-First + Google Sheets API Cloud Archive Vault via `HybridRepository`)
- **Archiving Engine:** Dynamic Monthly Tabs (`Nota_MM_YY` & `Orderan_MM_YY`) on Google Sheets
- **Workflow:** "Clone & Re-date" with auto-regenerating unique document numbers (`DD/MM/YY/NN`)
- **Audit Dashboard:** Modular audit viewer at `/dashboard` connected via Layer 2 (`NotaService`) with responsive Mobile Audit Card View (`<640px`) and 8-column Desktop Table (`>=640px`)

- **Package Manager:** `npm`

---

## 2. Essential Commands

```bash
# Development
npm run dev

# Audit Kode Mati & Validasi Tipe
npx tsc --noEmit --noUnusedLocals --noUnusedParameters

# Build Production
npm run build

# Menjalankan Production Build
npm run start
```

---

## 3. Strict 3-Layer Architecture Rules

1. **Layer 1: Presentation (`app/`, `components/print/`, `components/dashboard/`)**
   - Menangani UI formulir, tampilan cetak A4 (`fit-screen-wrapper` proporsional di mobile & 1:1 di desktop), serta Audit Dashboard.
   - **WAJIB** menggunakan komponen cetak dari `components/print/` (termasuk `PrintStyles.tsx`) sebagai Single Source of Truth.
   - **DILARANG** memanggil repository atau endpoint `/api/transaksi` langsung dari layer ini. Selalu panggil melalui `lib/services/` (`NotaService`, `OrderanService`) dan utilitas format bersama di `lib/utils/format.ts`.
2. **Layer 2: Business Logic (`lib/services/`)**
   - Mengelola perhitungan harga, aturan penomoran `DD/MM/YY/NN`, sinkronisasi tanggal, terbilang rupiah, dan sanitasi nama file PDF.
   - Bergantung hanya pada interface kontrak `ISheetRepository`.
3. **Layer 3: Data Access / Persistence (`lib/repositories/`, `lib/types/`)**
   - Mengatur penyimpanan state dan riwayat transaksi.
   - Bebas dari dependensi UI atau kalkulasi bisnis.

---

## 4. Coding Conventions & Quality Gates

1. **Komunikasi:** Seluruh percakapan, penjelasan, dan laporan wajib dalam **Bahasa Indonesia**. Kode, nama variabel, dan identifier teknis tetap **verbatim**.
2. **Zero Dead Code:** Tidak boleh meninggalkan unused import atau unused variable (`tsc --noUnusedLocals` wajib 0 error).
3. **Single Source of Truth Dokumen:** Tidak boleh menduplikasi markup dokumen Nota / Orderan di luar `components/print/`.
4. **Pencegahan Error Stempel:** Stempel digital CV SIJA wajib berukuran `155px` dengan rotasi `-5deg` / `-6deg`, diletakkan menimpa tanda tangan Habibi.
5. **Verifikasi Wajib Sebelum Done:** Setiap perubahan kode wajib dibuktikan dengan keberhasilan eksekusi `tsc` dan `npm run build`.
