# ARCHITECTURE — nota-sija (3-Layer Architecture Specification)

> **Standard:** Strict Layered Architecture & Separation of Concerns  
> **Framework:** Next.js (App Router, Turbopack) + React 19 + TypeScript (Strict Mode)  

---

## 1. Architectural Overview

Sistem `nota-sija` dirancang menggunakan arsitektur 3 lapis (**3-Layer Architecture**). Setiap lapisan memiliki batasan tanggung jawab yang terisolasi dan tidak boleh dilompati.

```
┌─────────────────────────────────────────────────────────────┐
│                 LAYER 1: PRESENTATION LAYER                 │
│  - Formulir Dokumen: app/nota/page.tsx, app/orderan/page.tsx │
│  - Halaman Cetak: app/nota/print/, app/orderan/print/       │
│  - Komponen Cetak: components/print/ (SSOT Print A4)        │
│  - Audit Dashboard: app/dashboard/page.tsx                  │
│  - Komponen Dashboard: components/dashboard/                │
│    (Header, MonthSelector, SummaryCards, Table, Modal)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ invokes
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 LAYER 2: BUSINESS LOGIC LAYER               │
│  - lib/services/notaService.ts (Aturan Penagihan & Lunas)   │
│  - lib/services/orderanService.ts (Surat Orderan)           │
│  - lib/services/documentNumber.ts (Penomoran DD/MM/YY/NN)   │
│  - lib/services/terbilang.ts (Konversi Kalimat Rupiah)      │
│  - lib/utils/format.ts (Helper Format Mata Uang & Periode)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ depends on Interface / DTO
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 LAYER 3: DATA / PERSISTENCE LAYER           │
│  - Kontrak Interface: lib/repositories/ISheetRepository.ts  │
│  - Cache Offline-First: lib/repositories/localStorage...ts   │
│  - Cloud Vault: lib/repositories/sheetsRepository.ts        │
│    (GoogleSheetsRepository — Monthly Partitioning Nota_MM_YY│
│     & Number Formatting #,##0)                              │
│  - Sinkronisasi Hybrid: lib/repositories/hybridRepository.ts│
│  - API Boundary: app/api/transaksi/route.ts (Serverless)    │
│  - Domain DTO: lib/types/transaksi.ts                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Layer Responsibilities & Rules

### 2.1 Layer 1: Presentation Layer
- **Lokasi:** `app/`, `components/print/`, dan `components/dashboard/`.
- **Tanggung Jawab:**

  - Menangkap event user (input form, pemilihan item, navigasi).
  - Merender tampilan interaktif dan formulir sidebar.
  - Merender dokumen cetak A4 dengan presisi tinggi.
- **Batasan Ketat:**
  - **DILARANG** mengakses atau memanggil `lib/repositories/` secara langsung.
  - **DILARANG** melakukan kalkulasi bisnis manual di dalam markup jika sudah ada fungsi service.
  - Wajib memanggil Layer 2 (`NotaService`, `OrderanService`, atau helper fungsi murni di `lib/services/`).

### 2.2 Layer 2: Business Logic / Application Layer
- **Lokasi:** `lib/services/`.
- **Tanggung Jawab:**
  - Mengelola aturan bisnis transaksi (`berjalan` -> `tertagih` -> `lunas`).
  - Menghitung logika nomor dokumen (`generateNoDokumen`, `updateNoDokumenTanggal`).
  - Mengonversi nominal ke kalimat terbilang (`terbilang`).
  - Menghasilkan nama file PDF terstandarisasi dan tersanitasi (`formatPdfFileName`).
- **Batasan Ketat:**
  - Tidak bergantung pada DOM, elemen visual, atau komponen React.
  - Hanya bergantung pada kontrak interface (`ISheetRepository`), tidak boleh mengikatkan diri ke implementasi database spesifik.

### 2.3 Layer 3: Data / Persistence Layer
- **Lokasi:** `lib/repositories/` dan `lib/types/`.
- **Tanggung Jawab:**
  - Menyimpan dan mengambil data mentah transaksi ke storage medium (`localStorage` atau `memory`).
  - Mengatur serialisasi dan deserialisasi data array transaksi.
- **Batasan Ketat:**
  - Tidak boleh mengetahui logika bisnis penomoran atau format tanggal.
  - Operasi penyimpanan harus idempotent dan aman terhadap kegagalan parsing.

---

## 3. Single Source of Truth for Print Components

Sebelumnya terdapat technical debt berupa duplikasi markup antara halaman form preview dan halaman cetak `/print`. Technical debt ini telah dieliminasi total dengan memusatkan seluruh elemen dokumen ke dalam folder `components/print/`:

| Komponen | Tanggung Jawab | File Sumber |
| :--- | :--- | :--- |
| `DocumentHeader` | Kop dokumen CV SIJA, judul dinamis (NOTA / SURAT ORDERAN), nomor dokumen, tanggal, nama customer. | `components/print/DocumentHeader.tsx` |
| `DocumentTable` | Tabel item dinamis (5 kolom Nota / 6 kolom Orderan), baris pelengkap otomatis, subtotal, grand total, dan terbilang. | `components/print/DocumentTable.tsx` |
| `DocumentSignature` | Blok tanda tangan pihak CV SIJA (Habibi) + customer, serta penempatan stempel rotasi dinamis. | `components/print/DocumentSignature.tsx` |
| `KwitansiBlock` | Blok kwitansi bawah dengan nomor nota, tanggal tersinkron, nominal, terbilang, dan tanda tangan lunas. | `components/print/KwitansiBlock.tsx` |
| `PrintStyles` | Definisi stylesheet global cetak A4 (`@page`, `@media print`, `.nota-wrapper`, `.nota-table`, typography). | `components/print/PrintStyles.tsx` |
| `PrintControlBar` | Bar navigasi di halaman `/print` (tombol Cetak, Kembali, dan status siap cetak). | `components/print/PrintControlBar.tsx` |

---

## 4. Entity Types & Data Contracts (`lib/types/transaksi.ts`)

```typescript
export interface ItemBarang {
  namaBarang: string;
  qty: number;
  satuan?: string;       // digunakan pada Surat Orderan & Nota
  hargaSatuan: number;
  totalHarga: number;
}

export interface Transaksi {
  noDokumen: string;              // Format: DD/MM/YY/NN
  mode: "normal" | "proyek";     // normal: Nota langsung; proyek: Surat Orderan
  status: "berjalan" | "tertagih" | "lunas";
  tanggalDokumen: string;         // DD/MM/YY
  namaCustomer: string;
  items: ItemBarang[];
  total: number;
  modeBagianBawah: "kosong" | "kwitansi" | "nota_kedua";
  keteranganKwitansi?: string;
  deskripsi?: string;            // Khusus Surat Orderan
  waktuPengerjaan?: string;      // Khusus Surat Orderan
  waktuPengiriman?: string;      // Khusus Surat Orderan
}
```

---

## 5. Storage Keys & State Persistence Flow

1. `eNotaSija`: Menyimpan state aktif formulir Nota (draft form, mode kwitansi, stempel, item list).
2. `eOrderanDraft`: Menyimpan state aktif formulir Surat Orderan.
3. `eSijaTransaksi`: Array dari `Transaksi[]` yang disimpan di `localStorage` saat finalisasi dokumen, digunakan sebagai cache lokal cepat (offline-first).

---

## 6. Cloud Archiving & Monthly Partitioning (Google Sheets Engine)

- **`GoogleSheetsRepository` (`lib/repositories/sheetsRepository.ts`):**
  Menggunakan Google Sheets API v4 dengan Service Account (`service-account.json`).
- **Dynamic Monthly Partitioning:**
  Menentukan sheet target berdasarkan segmen bulan dokumen `MM_YY`:
  - Modul Nota -> Tab `Nota_MM_YY` (misal `Nota_09_26`).
  - Modul Orderan -> Tab `Orderan_MM_YY` (misal `Orderan_09_26`).
  - Auto-scaffolding: Jika tab bulanan belum ada, backend otomatis membuatnya dan menyuntikkan header Navy freeze row 1.
- **Dual-Entry Record for `nota2` Mode:**
  Jika mode bawah adalah `nota2` (2 nota berbeda di 1 lembar fisik A4), backend memecah dan mengarsipkan kedua nota sebagai 2 entri legal independen agar nomor nota atas maupun nomor nota bawah sama-sama dapat dicari kembali di arsip.
- **`HybridRepository` (`lib/repositories/hybridRepository.ts`):**
  Menggabungkan kecepatan `LocalStorageRepository` di client dengan sinkronisasi background ke `/api/transaksi` menuju Google Sheets.

---

## 7. Technical Debt Registry & Deferred Roadmap

| Komponen / Fitur | Status | Keterangan & Rencana Implementasi |
| :--- | :--- | :--- |
| **Mode ORDERAN Cloud Partitioning** | **Active (`Orderan_MM_YY`)** | Pengarsipan Google Sheets (`GoogleSheetsRepository`) mendukung penuh tab bulanan `Nota_MM_YY` (11 kolom `A:K`) dan `Orderan_MM_YY` (13 kolom `A:M`) beserta sinkronisasi `HybridRepository`. |
| **Audit Dashboard UI & Mobile Card View** | **Active (`/dashboard`)** | Antarmuka audit modular di `/dashboard` terhubung ke Layer 2 (`NotaService`) dengan *Mobile Audit Card View* (`<640px`) dan tabel 8 kolom (`>=640px`). |


