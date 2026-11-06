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

## 3. Static Export & Deployment Notes
- Seluruh rute saat ini (`/`, `/nota`, `/nota/print`, `/orderan`, `/orderan/print`) dikompilasi secara statis (`○ Static`).
- Tidak membutuhkan server database aktif di sisi backend untuk operasi normal.
- Kompatibel penuh untuk deploy 1-klik di platform Vercel atau VPS dengan PM2 / Docker container sederhana.
