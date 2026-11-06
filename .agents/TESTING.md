# TESTING — nota-sija (Quality Assurance & Verification Protocol)

> **Core Tenet:** Evidence-Based Execution. Zero Fantasy Approvals.  

---

## 1. Static Quality & Lint Verification

Sebelum melakukan commit atau rilis kode baru, dua pemeriksaan wajib dijalankan:

### 1.1 Type Check & Dead Code Audit
```bash
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
```
- **Kriteria Lolos:** Exit code 0 tanpa ada error deklarasi tidak terbaca (`TS6133`) atau inkonsistensi tipe.

### 1.2 Production Build Verification
```bash
npm run build
```
- **Kriteria Lolos:** Build Next.js Turbopack selesai dengan semua route berstatus static `○` dan zero compilation error.

---

## 2. Automated & End-to-End Verification (Playwright)

Sistem dilengkapi dengan skenario uji Playwright untuk memvalidasi interaksi kritis.

### 2.1 Critical Test Cases
1. **Live Date & Document Number Sync:**
   - Ubah nilai pada `<input type="date">`.
   - Verifikasi bahwa 8 karakter pertama pada `noDokumen` berubah menjadi `DD/MM/YY` yang sesuai dengan input tanggal.
   - Verifikasi bahwa 2 digit unik acak (`NN`) di akhir nomor nota **TETAP SAMA** (tidak ter-generate ulang).
2. **Kwitansi Date Binding:**
   - Aktifkan toggle `Mode Bagian Bawah: Kwitansi`.
   - Verifikasi tanggal di blok kwitansi membaca nilai yang sama persis dengan field tanggal Nota.
3. **Pixel-per-Pixel Preview vs Print Consistence:**
   - Verifikasi bahwa struktur `DocumentHeader`, `DocumentTable`, dan `DocumentSignature` di halaman form preview (`/nota`) dan halaman cetak (`/nota/print`) menghasilkan computed CSS yang identik.
4. **Digital Stamp Presence & Geometry:**
   - Aktifkan `Sertakan Stempel`.
   - Verifikasi elemen `img[src*="stempel.png"]` memiliki computed width `155px` dan rotasi `-5deg` / `-6deg`.

---

## 3. Manual Inspection Checklist
- [ ] Buka `/nota`, tambahkan 3 item barang, pastikan grand total dan kalimat terbilang rupiah tepat.
- [ ] Buka `/orderan`, isi deskripsi pengerjaan dan waktu pengiriman, periksa tabel 6 kolom.
- [ ] Uji cetak (`Ctrl + P` atau tombol Cetak), periksa dialog print browser apakah memuat 1 halaman penuh A4 tanpa halaman kedua kosong (*no blank overflow page*).
