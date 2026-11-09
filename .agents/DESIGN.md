# DESIGN — nota-sija (Print Layout & Visual Design System)

> **Paper Standard:** International Standard A4 (ISO 216: 210mm × 297mm)  
> **Print Accuracy:** Pixel-per-pixel identical between preview and print dialog  

---

## 1. Paper Dimensions & Print Specifications

Dokumen dirancang dengan presisi fisik cetak 1 lembar A4 portrait.

```css
@page {
  size: A4 portrait;
  margin: 0;
}
```

### 1.1 Wrapper Layout Metrics
| Selector | Metrik Fisik | Deskripsi |
| :--- | :--- | :--- |
| `.nota-wrapper` | `width: 210mm; min-height: 297mm;` | Kontainer kertas A4 fisik murni. |
| Padding Kertas | `padding: 10mm 12mm;` | Batas aman cetak printer fisik (margin printer). |
| `.doc-half` | `min-height: 128mm;` | Setengah halaman (Nota atas atau Nota salinan). |
| `.kwitansi-half` | `border-top: 2px dashed #999;` | Garis putus-putus pembatas robekan/guntingan kwitansi. |
| Spasi Kwitansi | `margin-top: 8mm; padding-top: 8mm;` | Jarak proporsional antara nota atas dan kwitansi bawah. |

---

## 2. Color Palette & Typography

Sistem identitas visual CV. Sinar Ilmu Jaya menggunakan kombinasi warna klasik formal:

### 2.1 Color Palette
- **Primary Navy:** `#1e3a8a` (Tailwind `blue-900`) — Digunakan pada judul kop surat "CV. SINAR ILMU JAYA", border tabel, dan header kolom tabel.
- **Accent Crimson:** `#b91c1c` (Tailwind `red-700`) — Digunakan pada subjudul bidang usaha dan baris alamat/telepon kop surat.
- **Text Black:** `#000000` / `#1f2937` — Digunakan pada isi tabel, rincian item, dan blok tanda tangan.
- **Divider Gray:** `#999999` — Garis pemisah kwitansi berpola titik/putus (*dashed line*).

### 2.2 Typography Hierarchy
- **Nama Perusahaan:** `'Times New Roman', serif; font-size: 15pt; font-weight: 900; letter-spacing: -0.2px;`
- **Bidang Usaha (Subheader):** `font-size: 10pt; font-weight: bold;`
- **Alamat & Kontak:** `font-size: 9pt;`
- **Header Tabel (`th`):** `font-size: 8.5pt; font-weight: bold; text-transform: uppercase;`
- **Isi Tabel (`td`):** `font-size: 9.5pt;`

---

## 3. Digital Stamp (Stempel Perusahaan) Specification

Stempel resmi perusahaan memiliki aturan penempatan dan styling yang telah distandarisasi untuk mencegah regresi visual:

- **Source Asset:** `/stempel.png` (disimpan di folder `public/stempel.png`).
- **Dimensi Lebar:** Tepat `155px` (menggunakan utility `w-[155px]`, `h-auto`).
- **Sudut Kemiringan (Rotation):** `-5deg` hingga `-6deg` (`rotate-[-5deg]` atau `rotate-[-6deg]`).
- **Posisi Dokumen Nota & Orderan:**
  - Terletak di atas blok tanda tangan pihak CV SIJA (Habibi).
  - Menggunakan koordinat absolut: `bottom: 4px; left: 50%; transform: translateX(-50%) rotate(-5deg);`.
- **Posisi Dokumen Kwitansi:**
  - Terletak menimpa tanda tangan penerima di sisi kanan kwitansi lunas.
- **Behavior:** `pointer-events-none` dan `select-none` agar tidak mengganggu seleksi teks atau interaksi mouse.

---

## 4. Mobile Responsive Scaling (Live Preview Fit-to-Screen)

Pada layar tablet atau ponsel pintar, lebar 210mm (sekitar 794px) akan melebihi viewport. Diimplementasikan viewport scaling dinamis berbasis CSS Transform:

```css
@media (max-width: 1023px) {
  .fit-screen-container {
    width: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    padding: 8px 0;
  }
  .fit-screen-wrapper {
    transform: scale(calc((100vw - 20px) / 794));
    transform-origin: top center;
    margin-bottom: calc(-1 * (1123px - (1123px * (100vw - 20px) / 794)));
  }
}
```

Fitur ini diterapkan secara terpusat di `components/print/PrintStyles.tsx` dan digunakan oleh seluruh halaman pratinjau maupun rute cetak (`/nota`, `/orderan`, `/nota/print`, dan `/orderan/print`) untuk memastikan pengguna mobile dapat melihat layout cetak A4 secara utuh 1:1 tanpa merusak dimensi fisik dokumen asli saat dicetak.

---

## 5. Responsive Dashboard Breakpoints (`/dashboard`)

Untuk menjaga keterbacaan di berbagai rasio layar (Desktop → Tablet → HP):
- **Desktop (`>=1024px`)**: `SummaryCards` tampil 3 kolom sejajar (`lg:grid-cols-3`), dan `TransactionTable` menampilkan tabel penuh 8 kolom.
- **Tablet (`640px–1023px`)**: `SummaryCards` merender kartu utama *Total Omzet Arsip* selebar 2 kolom (`sm:col-span-2`) di atas kartu *Sudah Lunas* dan *Tertagih* agar simetris.
- **Mobile (`<640px`)**: `TransactionTable` otomatis beralih dari tabel 8 kolom ke **Mobile Audit Card View (`sm:hidden`)** sehingga status bayar dan tombol **Lihat Rincian / Kloning Nota** dapat diakses langsung tanpa geser horizontal.
