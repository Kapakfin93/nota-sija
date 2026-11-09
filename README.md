# nota-sija

Sistem penerbitan Nota Penjualan, Kwitansi Pembayaran, dan Surat Orderan digital resmi untuk **CV. Sinar Ilmu Jaya**.

---

## Arsitektur — 3 Layer

Aplikasi dirancang dengan pemisahan 3 lapis (**3-Layer Architecture**) agar antarmuka, logika bisnis, dan penyimpanan data terisolasi secara bersih:

```
nota-sija/
├── app/                        # LAYER 1: PRESENTATION (Pages & Routes)
│   ├── api/transaksi/route.ts  #   Serverless API Boundary (GET, POST, PATCH Google Sheets)
│   ├── dashboard/page.tsx      #   Dashboard Arsip & Audit Bulanan (via NotaService)
│   ├── nota/page.tsx           #   Formulir input & live preview A4 Nota & Kwitansi
│   ├── nota/print/page.tsx     #   Halaman cetak murni A4 Nota (dengan fit-screen mobile)
│   ├── orderan/page.tsx        #   Formulir input & live preview A4 Surat Orderan
│   └── orderan/print/page.tsx  #   Halaman cetak murni A4 Surat Orderan (dengan fit-screen mobile)
│
├── components/
│   ├── dashboard/              # LAYER 1: PRESENTATION (Modular Audit Dashboard)
│   │   ├── DashboardHeader.tsx #   Header navigasi & sinkronisasi Google Sheets
│   │   ├── MonthSelector.tsx   #   Filter akordeon Tahun & Bulan (MM_YY)
│   │   ├── SummaryCards.tsx    #   Ringkasan Omzet, Lunas, & Tertagih (responsif 1/2/3 kolom)
│   │   ├── TransactionTable.tsx#   Mobile Audit Card View (<640px) & Tabel 8 Kolom (>=640px)
│   │   └── DetailModal.tsx     #   Modal inspeksi & fitur Clone/Re-date ke Nota
│   └── print/                  # LAYER 1: PRESENTATION (Single Source of Truth Cetak A4)
│       ├── DocumentHeader.tsx  #   Kop surat CV SIJA & info dokumen
│       ├── DocumentTable.tsx   #   Tabel dinamis item, total, & terbilang
│       ├── DocumentSignature.tsx # Tanda tangan & stempel perusahaan dinamis
│       ├── KwitansiBlock.tsx   #   Blok kwitansi pembayaran lunas
│       ├── PrintStyles.tsx     #   CSS cetak A4 fisik (@page, media print, fit-screen mobile)
│       ├── PrintControlBar.tsx #   Navigasi kontrol cetak
│       └── index.ts            #   Barrel export
│
├── lib/
│   ├── services/               # LAYER 2: BUSINESS LOGIC
│   │   ├── documentNumber.ts   #   Penomoran DD/MM/YY/NN, live date sync, nama PDF
│   │   ├── terbilang.ts        #   Konversi angka rupiah ke teks terbilang
│   │   ├── notaService.ts      #   Orkestrasi simpan, daftar bulan, arsip & status Nota
│   │   └── orderanService.ts   #   Orkestrasi lifecycle mode proyek (Orderan -> Nota)
│   │
│   ├── utils/
│   │   └── format.ts           #   Helper terpusat format Rupiah, angka, tanggal, & normalisasi item
│   │
│   ├── repositories/           # LAYER 3: PERSISTENCE / DATA ACCESS
│   │   ├── ISheetRepository.ts #   Kontrak interface data access (termasuk ambilDaftarBulan)
│   │   ├── hybridRepository.ts #   Sinkronisasi Offline-First LocalStorage + Cloud Google Sheets
│   │   ├── sheetsRepository.ts #   Google Sheets API v4 (Partisi bulanan Nota_MM_YY & Orderan_MM_YY)
│   │   ├── localStorageRepository.ts # Implementasi penyimpanan browser LocalStorage
│   │   └── inMemoryRepository.ts     # Implementasi in-memory (testing/mock)
│   │
│   └── types/
│       └── transaksi.ts        #   Definisi DTO dan kontrak entitas
│
├── public/
│   ├── logo.png                # Logo resmi CV SIJA
│   └── stempel.png             # Stempel resmi perusahaan (155px, -5°)
│
└── .agents/                    # DOKUMENTASI INTERNAL SISTEM
    ├── PRD.md                  # Spesifikasi produk & fitur
    ├── ARCHITECTURE.md         # Rincian 3-Layer arsitektur
    ├── DESIGN.md               # Standar cetak A4 & visual guide
    ├── SECURITY.md             # Sanitasi input & keamanan
    ├── TESTING.md              # Skenario & protokol pengujian
    ├── DEPLOYMENT.md           # Panduan build & deployment
    └── TASK_INSTRUCTION.md     # Prosedur kerja AI & developer
```

---

## Aturan Ketergantungan (Layered Rules)

- `app/` dan `components/print/` **hanya boleh** memanggil `lib/services/` — tidak pernah memanggil `lib/repositories/` secara langsung.
- `lib/services/` **hanya bergantung** pada kontrak interface (`ISheetRepository`), tidak terikat pada database tertentu.
- Seluruh elemen cetak A4 terpusat di `components/print/` sehingga tampilan formulir preview dan hasil cetak fisik selalu 100% konsisten (zero drift).

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Library:** React 19 + TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4 + Dedicated Print CSS (`PrintStyles.tsx`)
- **Storage:** Hybrid Architecture (`LocalStorageRepository` Offline-First + `GoogleSheetsRepository` Cloud Partitioning `Nota_MM_YY` & `Orderan_MM_YY`)

---

## Perintah Kerja

```bash
# Jalankan development server
npm run dev

# Validasi tipe & cek kode mati (unused code)
npx tsc --noEmit --noUnusedLocals --noUnusedParameters

# Build production
npm run build

# Jalankan production server
npm run start
```
