# SIM Kepegawaian SMKN 3 Tangerang

Progressive Web App (PWA) — frontend statis (HTML/CSS/JS) dengan backend Google Apps Script + Google Sheets.

**Status: Langkah 2 — Kerangka aplikasi (sidebar, header, notifikasi) & Dashboard Super Admin.**

Langkah 1 (Login) sudah termasuk.

## Struktur folder

```
sim-kepegawaian-smkn3/        ← folder ini = root repository (tempat git init)
├── index.html
├── manifest.json
├── sw.js
├── css/
│   ├── style.css             ← login & komponen dasar
│   └── app.css               ← sidebar, header, dashboard
├── js/
│   ├── config.js             ← satu-satunya berkas yang perlu Anda edit (GAS_URL)
│   ├── ui.js  api.js  login.js
│   ├── menu.js               ← daftar menu per peran + registri halaman
│   ├── charts.js  dashboard.js  shell.js
│   └── app.js
└── assets/                   ← logo & ikon PWA
```

## Pengaturan wajib

Buka `js/config.js`, ganti `GAS_URL` dengan URL Web App Apps Script Anda (berakhiran `/exec`).
Lihat `PANDUAN-INSTALASI.md` untuk langkah lengkap backend dan deploy.

## Catatan pengembangan

- Semua permintaan POST memakai `Content-Type: text/plain` (menghindari preflight CORS Apps Script).
- Setiap mengubah berkas, naikkan nomor `VERSI` di `sw.js`.
