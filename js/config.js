/* =========================================================
   KONFIGURASI — satu-satunya berkas yang perlu Anda ubah
   ========================================================= */
const APP_CONFIG = {
  // Tempel URL Web App Google Apps Script Anda (berakhiran /exec)
  GAS_URL: 'https://script.google.com/macros/s/AKfycbwSXKOnh1aHR9phkdctrW2GknBgynbVSSOP4C_l8v0ISENrS0slPZtzq777GMSUrX99Hw/exec',

  NAMA_APP: 'SIM Kepegawaian SMKN 3 Tangerang',
  VERSI: '1.0.0',
  TIMEOUT_MS: 30000,      // batas tunggu respons server
  PESAN_LAMBAT_MS: 3500   // tampilkan "menghubungkan…" bila server lambat (cold start)
};
