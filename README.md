# nota-sija

Sistem penerbitan Nota Penjualan, Kwitansi Pembayaran, dan Surat Orderan digital resmi untuk **CV. Sinar Ilmu Jaya**.

---

## Arsitektur — 3 Layer

Aplikasi dirancang dengan pemisahan 3 lapis (**3-Layer Architecture**) agar antarmuka, logika bisnis, dan penyimpanan data terisolasi secara bersih:

```
nota-sija/
├── app/                        # LAYER 1: PRESENTATION (Pages & Routes)
│   ├── nota/page.tsx           #   Formulir input & live preview A4 Nota & Kwitansi
│   ├── nota/print/page.tsx     #   Halaman cetak murni A4 Nota
│   ├── orderan/page.tsx        #   Formulir input & live preview A4 Surat Orderan
│   └── orderan/print/page.tsx  #   Halaman cetak murni A4 Surat Orderan
│
├── components/print/           # LAYER 1: PRESENTATION (Single Source of Truth)
│   ├── DocumentHeader.tsx      #   Kop surat CV SIJA & info dokumen
│   ├── DocumentTable.tsx       #   Tabel dinamis item, total, & terbilang
│   ├── DocumentSignature.tsx   #   Tanda tangan & stempel perusahaan dinamis
│   ├── KwitansiBlock.tsx       #   Blok kwitansi pembayaran lunas
│   ├── PrintStyles.tsx         #   CSS cetak A4 fisik (@page, media print)
│   ├── PrintControlBar.tsx     #   Navigasi kontrol cetak
│   └── index.ts                #   Barrel export
│
├── lib/
│   ├── services/               # LAYER 2: BUSINESS LOGIC
│   │   ├── documentNumber.ts   #   Penomoran DD/MM/YY/NN, live date sync, nama PDF
│   │   ├── terbilang.ts        #   Konversi angka rupiah ke teks terbilang
│   │   ├── notaService.ts      #   Orkestrasi status transaksi Nota & Kwitansi
│   │   └── orderanService.ts   #   Orkestrasi lifecycle mode proyek (Orderan -> Nota)
│   │
│   ├── repositories/           # LAYER 3: PERSISTENCE / DATA ACCESS
│   │   ├── ISheetRepository.ts #   Kontrak interface data access
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

- **Framework:** Next.js (App Router, Turbopack)
- **Library:** React 19
- **Styling:** Tailwind CSS v4 + Print CSS terpusat
- **Storage:** LocalStorage (Offline-First)

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
