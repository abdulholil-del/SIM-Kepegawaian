/* =========================================================
   KONFIGURASI — satu-satunya berkas yang perlu Anda ubah
   ========================================================= */
const APP_CONFIG = {
  // Tempel URL Web App Google Apps Script Anda (berakhiran /exec)
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzXcKv7zUN98fbPMkeQvqoT5NhVu9qw0scuxo9KIchLNbSP8DkbBgYBuMdZe7S_BXcKxQ/exec',

  NAMA_APP: 'SIM Kepegawaian SMKN 3 Tangerang',
  VERSI: '1.0.0',
  TIMEOUT_MS: 30000,      // batas tunggu respons server
  PESAN_LAMBAT_MS: 3500   // tampilkan "menghubungkan…" bila server lambat (cold start)
};
