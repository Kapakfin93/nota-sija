# SECURITY — nota-sija (Security Guidelines & Data Hygiene)

> **Core Tenet:** Zero Trust, Strict Input Sanitization, and Safe Local Persistence  

---

## 1. File System & File Download Sanitization

Saat mengunduh dokumen atau membuka dialog cetak ("Save as PDF"), penamaan file ditentukan secara dinamis melalui helper `formatPdfFileName` di `lib/services/documentNumber.ts`.

### 1.1 Aturan Sanitasi Nama File
- Semua karakter ilegal pada sistem file Windows, Linux, dan macOS dibersihkan:
  `\ / : * ? " < > |`
- Karakter pemisah tanggal pada nomor nota diubah dari `/` menjadi `-` (contoh: `07/09/26/65` menjadi `07-09-26-65`).
- Karakter spasi diganti dengan strip `-`.
- String dikonversi ke huruf kecil (*lowercase*) dan karakter non-alfanumerik dihilangkan melalui regex:
  ```typescript
  const cleanLabel = rawLabel
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/gi, "")
    .replace(/\s+/g, "-") || "nota";
  ```
- Output standar: `sija-[label]-[DD-MM-YY-NN].pdf`.

---

## 2. Client-Side State Security & LocalStorage Hygiene

Aplikasi menyimpan draf transaksi dan riwayat ke dalam browser `localStorage`.

### 2.1 Error Handling & Parsing
- Semua pembacaan dan penulisan `localStorage` wajib dibungkus dalam blok `try ... catch`.
- Jika data JSON rusak (*corrupted state*), aplikasi tidak boleh crash; sistem harus fallback ke state default dan mencatat error ke konsol secara terisolasi.
- Quota Management: Data riwayat transaksi disimpan dalam bentuk array DTO murni tanpa blob gambar berat (gambar logo dan stempel diload dari asset statis `/public`).

---

## 3. Secret & Environment Variable Hygiene

- **Status Saat Ini:** Aplikasi menggunakan `HybridRepository` (gabungan `LocalStorageRepository` di browser dan `GoogleSheetsRepository` di sisi server melalui Route Handler `/api/transaksi`). Kredensial Google Service Account hanya diakses di lingkungan server (Serverless Route Handler) dan **tidak pernah** terekspos ke client bundle.
- **Aturan Kredensial & Environment Variables:**
  - DILARANG PERNAH menyimpan kredensial atau file `service-account.json` di dalam git history (sudah dilindungi di `.gitignore`).
  - Di produksi (Vercel), kredensial wajib diset melalui Environment Variable `GOOGLE_SERVICE_ACCOUNT_JSON` (atau `GOOGLE_CLIENT_EMAIL` & `GOOGLE_PRIVATE_KEY`) serta `GOOGLE_SHEET_ID`.
  - Jangan gunakan prefix `NEXT_PUBLIC_` untuk kredensial server.
