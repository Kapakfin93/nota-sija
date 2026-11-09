# PRD — nota-sija (Product Requirements Document)

> **Version:** 1.0.0  
> **Last Updated:** 2026-11-07  
> **Status:** Active / Production Ready  
> **System Scope:** CV. Sinar Ilmu Jaya — Nota, Kwitansi, & Surat Orderan Digital  

---

## 1. Executive Summary

**nota-sija** adalah sistem digital penerbitan Nota Penjualan, Kwitansi Pembayaran, dan Surat Orderan yang dirancang khusus untuk operasional CV. Sinar Ilmu Jaya. Sistem ini menggantikan proses nota fisik manual dengan antarmuka web modern yang memiliki pratinjau real-time presisi cetak A4, penomoran live-sync, kalkulasi otomatis terbilang rupiah, serta stempel digital perusahaan yang valid secara visual.

### 1.1 Business Objectives
| Objective | Target & Success Metric |
| :--- | :--- |
| **Eliminasi Kesalahan Hitung** | 100% kalkulasi harga total dan kalimat terbilang rupiah dihitung otomatis. |
| **Konsistensi Format Dokumen** | Output cetak dan PDF identik standar kertas A4 (210mm x 297mm) tanpa drift visual. |
| **Sinkronisasi Nomor & Tanggal** | Bagian tanggal pada nomor dokumen (`DD/MM/YY/NN`) selalu sinkron live dengan field tanggal. |
| **Kemandirian Penyimpanan (Offline-First)** | Draft dan riwayat tersimpan deterministik di browser local storage tanpa dependensi luar. |

---

## 2. Target Users & Personas

### 2.1 Staff Administrasi / Kasir (Single Operator)
- **Role:** Operator tunggal operasional toko/kantor.
- **Tugas Utama:**
  - Menginput item barang/jasa dan rincian customer.
  - Memilih format dokumen (Nota Tunggal, Nota + Kwitansi Lunas, atau Nota Rangkap 2).
  - Mengatur Surat Orderan untuk pekerjaan bertenggat waktu / proyek sebelum penagihan.
  - Mencetak langsung ke printer fisik atau menyimpan sebagai file PDF berformat baku.

---

## 3. Feature Specifications

### 3.1 Modul Nota & Kwitansi (`/nota`)
- **Penomoran Dokumen (`noDokumen`):**
  - Format standar: `DD/MM/YY/NN` (tanggal dokumen 2 digit hari, bulan, tahun, diikuti 2 digit angka acak).
  - Karakteristik acak (non-sekuensial) sengaja diterapkan agar penanggalan mundur/maju fleksibel tanpa merusak urutan dokumen lain.
  - **Live Synchronization:** Jika user mengubah field input tanggal, segmen `DD/MM/YY` pada `noDokumen` otomatis terupdate seketika, dengan mempertahankan 2 digit angka acak di belakangnya.
- **Tabel Item Transaksi:**
  - Kolom: No, Banyaknya (Qty), Nama Barang, Harga Satuan, Jumlah (Total).
  - Kalkulasi subtotal dan grand total otomatis.
  - Baris kosong otomatis digenerate untuk menjaga tinggi visual dokumen tetap proporsional.
- **Terbilang Otomatis:**
  - Mengonversi grand total nominal rupiah ke format kalimat (e.g., *"Seratus Lima Puluh Ribu Rupiah"*).
- **Mode Dokumen Bagian Bawah (Khusus Nota):**
  - `none`: Hanya Nota atas (setengah halaman A4).
  - `kwitansi`: Bagian bawah memuat Kwitansi pembayaran lunas dengan tanda tangan penerima, kalimat terbilang kapital, dan garis potong putus-putus.
  - `nota2`: Bagian bawah memuat Nota Kedua (pekerjaan berbeda untuk menghemat kertas). Backend mengarsipkan kedua nota sebagai 2 record transaksi terpisah yang sah agar masing-masing nomor dapat dicari dan dilacak secara independen.
- **Workflow "Clone & Re-date" (Order Berulang Cepat):**
  - Operator dapat memuat riwayat orderan lama (customer, item, satuan, harga terisi otomatis).
  - Ketika tanggal diedit (maju atau mundur), segmen `DD/MM/YY` pada nomor dokumen otomatis terbarui dan menghasilkan 2 digit acak unik baru (`NN`) secara otomatis agar tidak menimpa nota lama di arsip, dengan opsi edit manual jika ingin nomor custom.
- **Stempel Digital:**
  - Toggle stempel perusahaan CV. Sinar Ilmu Jaya.
  - Spesifikasi visual: lebar 155px, rotasi -5° s/d -6°, menimpa area tanda tangan Habibi.

### 3.2 Modul Surat Orderan (`/orderan`)
- **Fungsi Khusus Proyek/Pemesanan:**
  - Kolom rincian pekerjaan: Deskripsi Pekerjaan, Waktu Pengerjaan, dan Waktu Pengiriman.
  - Tabel 6 kolom: No, Nama Barang/Jasa, Qty, Satuan, Harga Satuan, Jumlah.
- **Penomoran & Sinkronisasi:**
  - Format `DD/MM/YY/NN` sinkron dengan tanggal orderan.
- **Lifecycle Mode Proyek ke Nota:**
  - Surat Orderan diterbitkan berstatus `berjalan`.
  - Saat pekerjaan rampung, riwayat orderan dapat dipanggil kembali ke modul Nota untuk menerbitkan Nota final penagihan menggunakan **nomor dokumen yang sama**. Status bergeser dari `berjalan` -> `tertagih` -> `lunas`.

### 3.3 Halaman Khusus Cetak (`/nota/print` & `/orderan/print`)
- Halaman cetak murni tanpa elemen UI formulir sidebar.
- Menampilkan dokumen A4 bersih dengan CSS `@page { size: A4 portrait; margin: 0; }`.
- Auto-trigger dialog cetak browser (`window.print()`).
- Sanitasi nama dokumen PDF melalui utilitas `formatPdfFileName` (`sija-[label]-[nomor].pdf`).

---

## 4. Non-Functional Requirements

- **Arsitektur 3-Layer:** Pemisahan ketat antara Presentation Layer, Logic/Service Layer, dan Data/Repository Layer.
- **Zero Drift Visual:** Komponen cetak di halaman formulir dan halaman `/print` menggunakan Single Source of Truth dari `components/print/`.
- **Ketahanan State:** Seluruh input form otomatis tersimpan ke `localStorage` (anti data hilang saat reload browser).
- **Google Sheets Partitioning:** Pengarsipan otomatis per bulan menggunakan tab dinamis `Nota_MM_YY` dan `Orderan_MM_YY` via `GoogleSheetsRepository`.

---

---

## 5. Scope Boundaries & Technical Debt / Backlog

### 5.1 Status Cloud Partitioning & Audit Dashboard
- **Status:** ACTIVE / PRODUCTION READY.
- **Kondisi Saat Ini:**
  - Modul Nota (`Nota_MM_YY`, 11 kolom `A:K`) dan Modul Surat Orderan (`Orderan_MM_YY`, 13 kolom `A:M`) telah terintegrasi penuh dengan Google Sheets API v4 melalui `GoogleSheetsRepository` dan cache offline-first `HybridRepository`.
  - Modul Dashboard Audit (`/dashboard`) telah aktif melalui Layer 2 (`NotaService`) dengan tampilan berjenjang: **Mobile Audit Card View (`<640px`)** untuk layar ponsel dan **Tabel 8 Kolom (`>=640px`)** untuk tablet/desktop.
  - Seluruh pratinjau cetak (`/nota`, `/orderan`, `/nota/print`, `/orderan/print`) mendukung proporsi fisik ISO 216 A4 (`210mm x 297mm`) beserta penskalaan responsif `.fit-screen-wrapper` di layar mobile.

### 5.2 Scope Boundaries & Constraints
- **Google Sheets Integration:** Aktif penuh via Google Sheets API v4 (Service Account) terhubung ke Spreadsheet CV SIJA untuk modul Nota.
- **Autentikasi:** Tanpa sistem login / multi-user (single workstation app).

