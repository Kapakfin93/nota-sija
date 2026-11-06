# TASK_INSTRUCTION — nota-sija (Agent Operating Procedures)

> **Document Purpose:** Standard Operating Procedures (SOP) untuk AI Coding Assistant & Developer dalam mengelola codebase `nota-sija`.  

---

## 1. Core Operating Principles

1. **DATA FIRST, NEVER ASSUME:**
   - Seluruh klaim atau perbaikan harus didukung bukti konkret (kutipan baris kode, output terminal, hasil pengujian).
   - Jangan pernah menyatakan "sudah diperbaiki" tanpa menyertakan verifikasi data.

2. **SEPARATION OF CONCERNS (3-LAYER INTEGRITY):**
   - **Layer 1 (Presentation):** `app/`, `components/print/` — tangani interaksi user dan render visual.
   - **Layer 2 (Logic):** `lib/services/` — kalkulasi harga, format penomoran dokumen, logika bisnis.
   - **Layer 3 (Persistence):** `lib/repositories/` — penyimpanan data melalui interface kontrak (`ISheetRepository`).
   - Dilarang membuat shortcut antar-layer (misal: Presentation memanggil repository langsung).

3. **SINGLE SOURCE OF TRUTH (ZERO VISUAL DRIFT):**
   - Seluruh elemen dokumen cetak A4 **WAJIB** menggunakan komponen bersama di `components/print/`.
   - Dilarang membuat markup/styling inline duplikat di halaman input form yang terpisah dari halaman print.

---

## 2. Step-by-Step Task Workflow

Setiap penugasan fitur atau perbaikan bug harus mengikuti 4 langkah baku:

```
[1. Index & Audit] ──► [2. Konfirmasi & Bukti] ──► [3. Eksekusi Minimal] ──► [4. Verifikasi Lolos]
```

1. **Index & Audit:**
   - Periksa status git (`git status`).
   - Identifikasi baris kode terdampak tanpa melakukan asumsi.
2. **Konfirmasi & Bukti:**
   - Sajikan temuan data dan rencana aksi dengan format konfirmasi pemahaman sebelum melakukan modifikasi signifikan.
3. **Eksekusi Minimal (Minimum Viable Diff):**
   - Ubah hanya baris yang relevan. Jangan melakukan refactor di luar scope yang disepakati.
   - Hapus unused import dan dead code yang timbul dari perubahan.
4. **Verifikasi Lolos:**
   - Jalankan `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`.
   - Jalankan `npm run build`.
   - Pastikan working tree bersih dan terstruktur untuk git commit.
