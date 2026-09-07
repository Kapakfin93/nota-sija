# nota-sija

Sistem penerbitan Nota, Kwitansi, dan Surat Orderan digital untuk CV. Sinar Ilmu Jaya.

## Arsitektur — 3 Layer

Struktur ini dipisah 3 lapis supaya setiap bagian bisa diubah tanpa merembet ke bagian lain (contoh: ganti Google Sheets ke database lain tidak perlu menyentuh tampilan atau logic bisnis).

```
nota-sija/
├── app/                        # LAYER 1: PRESENTATION
│   ├── nota/page.tsx           #   Halaman input & preview Nota
│   ├── orderan/page.tsx        #   Halaman input & preview Surat Orderan
│   └── api/                    #   Route handler (jembatan tipis ke services/)
│       ├── nota/route.ts
│       └── orderan/route.ts
│
├── components/                 # LAYER 1: PRESENTATION (reusable)
│   ├── DocumentTable.tsx       #   Tabel item (dipakai Nota & Orderan)
│   ├── PrintLayout.tsx         #   Wrapper kertas A4 + header berulang
│   └── ui/                     #   Komponen kecil (input, button, toggle)
│
├── lib/
│   ├── services/                # LAYER 2: BUSINESS LOGIC
│   │   ├── documentNumber.ts    #   Generate format DD/MM/YY/NN
│   │   ├── terbilang.ts         #   Konversi angka ke teks
│   │   ├── notaService.ts       #   Orkestrasi: buat Nota, toggle Kwitansi/Nota Kedua
│   │   └── orderanService.ts    #   Orkestrasi: buat Orderan, lanjut ke Nota (nomor sama)
│   │
│   ├── repositories/             # LAYER 3: DATA ACCESS
│   │   ├── ISheetRepository.ts   #   Interface — kontrak, bukan implementasi
│   │   ├── sheetsRepository.ts   #   Implementasi Google Sheets API
│   │   └── driveRepository.ts    #   Implementasi Google Drive API (foto)
│   │
│   └── types/
│       └── transaksi.ts          #   Tipe data bersama (Transaksi, Item)
│
└── public/
    └── logo.png                  # Logo asli CV SIJA
```

## Aturan Ketergantungan (penting untuk maintainability)

- `app/` dan `components/` **hanya boleh** memanggil `lib/services/` — tidak pernah langsung memanggil `lib/repositories/`.
- `lib/services/` **hanya boleh** memanggil `lib/repositories/` lewat interface (`ISheetRepository`), bukan implementasi konkret — supaya nanti gampang ganti dari Sheets ke DB lain tanpa mengubah service.
- `lib/repositories/` **tidak boleh** tahu apa-apa soal UI atau business rule (misal: repository tidak boleh tahu soal "format nomor dokumen").

## Stack

- Next.js (App Router) — deploy ke Vercel
- Google Sheets API + Google Drive API — data layer
- Tanpa autentikasi (single user)

## Status

🚧 Scaffold awal — struktur folder & kontrak interface. Implementasi detail menyusul di iterasi berikutnya.
