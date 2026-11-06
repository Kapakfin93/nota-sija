# DEPLOYMENT — nota-sija (Build & Deployment Protocol)

> **Platform:** Next.js (App Router, Turbopack) + React 19  
> **Deployment Target:** Vercel / Static Node Web Server  

---

## 1. Environment & Prerequisites

- **Node.js:** v20.x atau v22.x LTS (Diuji pada Node.js v22.15.0).
- **Package Manager:** `npm` (Lockfile: `package-lock.json`).

---

## 2. Standard Commands

### 2.1 Development
```bash
npm run dev
```
- Menjalankan Next.js development server pada `http://localhost:3000`.

### 2.2 Production Build
```bash
npm run build
```
- Mengkompilasi seluruh halaman aplikasi menjadi halaman statis teroptimasi (`prerendered as static content`).

### 2.3 Production Runtime
```bash
npm run start
```
- Menjalankan production server dari hasil kompilasi folder `.next`.

---

## 3. Deployment Topology & Cloud Configuration (Vercel)

### 3.1 Route Compilation Profile
- **`○ Static` (Prerendered):** `/`, `/nota`, `/nota/print`, `/orderan`, `/orderan/print`, `/dashboard`.
- **`ƒ Dynamic` (Serverless Function):** `/api/transaksi` (GET, POST, PATCH terhubung ke Google Sheets API).

### 3.2 Required Cloud Environment Variables
Karena file `service-account.json` wajib di-exclude dari Git repository demi alasan keamanan (`.gitignore`), deployment di Vercel memerlukan konfigurasi Environment Variables berikut:

| Environment Variable | Wajib / Opsional | Keterangan & Format Nilai |
| :--- | :--- | :--- |
| **`GOOGLE_SERVICE_ACCOUNT_JSON`** | **Wajib di Vercel** | Seluruh string JSON dari file `service-account.json` (termasuk `client_email` dan `private_key`). Backend otomatis mem-parse dan memperbaiki format line-break (`\n`). |
| **`GOOGLE_SHEET_ID`** | Opsional (Ada Fallback) | ID Spreadsheet Google Sheets target (`1HcHWHnSm7S8zc01ur7btOg_icLx6aHUZwYwJZkC9OOU`). |
| **`GOOGLE_CLIENT_EMAIL`** | Alternatif | Jika tidak menggunakan `GOOGLE_SERVICE_ACCOUNT_JSON`, email service account dapat dipisah. |
| **`GOOGLE_PRIVATE_KEY`** | Alternatif | Jika tidak menggunakan `GOOGLE_SERVICE_ACCOUNT_JSON`, private key dapat dipisah. |

### 3.3 Fallback Mechanism
1. **Cloud / Vercel:** Membaca dari `process.env.GOOGLE_SERVICE_ACCOUNT_JSON`.
2. **Local Machine:** Membaca dari file `service-account.json` di root direktori laptop.
