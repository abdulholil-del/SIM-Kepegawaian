/* =========================================================
   API — komunikasi dengan Google Apps Script (REST/JSON)
   Aturan penting: POST memakai text/plain agar tidak memicu
   preflight CORS yang ditolak oleh Apps Script.
   ========================================================= */

// ---------- Penyimpanan sesi ----------
// "Ingat sesi" dicentang  → localStorage  (tetap setelah browser ditutup)
// Tidak dicentang         → sessionStorage (hilang saat tab ditutup)
const Session = {
  K_TOKEN: 'simpeg_token', K_USER: 'simpeg_user', K_EXP: 'simpeg_exp',

  _get(k) {
    try { return localStorage.getItem(k) || sessionStorage.getItem(k) || ''; } catch (e) { return ''; }
  },
  get token() { return this._get(this.K_TOKEN); },
  get exp() { return Number(this._get(this.K_EXP)) || 0; },
  user() {
    try { return JSON.parse(this._get(this.K_USER) || 'null'); } catch (e) { return null; }
  },

  save(data, ingat) {
    this.clear();
    try {
      const st = ingat ? localStorage : sessionStorage;
      st.setItem(this.K_TOKEN, data.token);
      st.setItem(this.K_EXP, String(data.kedaluwarsa || 0));
      st.setItem(this.K_USER, JSON.stringify(data.user));
    } catch (e) { /* penyimpanan diblokir: sesi hanya hidup di memori halaman */ }
  },
  setUser(u) {
    try {
      const st = localStorage.getItem(this.K_TOKEN) ? localStorage : sessionStorage;
      st.setItem(this.K_USER, JSON.stringify(u));
    } catch (e) {}
  },
  // Cache data tampilan (agar halaman langsung muncul, lalu disegarkan dari server).
  // Disimpan di penyimpanan yang sama dengan token, dan ikut terhapus saat keluar.
  _stCache() { try { return localStorage.getItem(this.K_TOKEN) ? localStorage : sessionStorage; } catch (e) { return null; } },
  cacheGet(k) {
    try { const st = this._stCache(); return st ? JSON.parse(st.getItem('simpeg_c_' + k) || 'null') : null; } catch (e) { return null; }
  },
  cacheSet(k, v) {
    try { const st = this._stCache(); if (st) st.setItem('simpeg_c_' + k, JSON.stringify(v)); } catch (e) {}
  },

  clear() {
    try {
      [localStorage, sessionStorage].forEach(function (st) {
        [Session.K_TOKEN, Session.K_USER, Session.K_EXP].forEach(function (k) { st.removeItem(k); });
        Object.keys(st).filter(function (k) { return k.indexOf('simpeg_c_') === 0; }).forEach(function (k) { st.removeItem(k); });
      });
    } catch (e) {}
  }
};

// ---------- Klien API ----------
const Api = {
  configured() {
    return /^https:\/\/script\.google(usercontent)?\.com\/.+/.test(String(APP_CONFIG.GAS_URL || ''));
  },

  // Cek server hidup. Sekaligus "membangunkan" Apps Script (mengurangi cold start saat login).
  async ping() {
    if (!Api.configured()) return { success: false, code: 'CONFIG', message: 'Backend belum dikonfigurasi' };
    const ctl = new AbortController();
    const timer = setTimeout(function () { ctl.abort(); }, 20000);
    try {
      const res = await fetch(APP_CONFIG.GAS_URL + '?action=ping', { signal: ctl.signal, cache: 'no-store' });
      const json = await res.json();
      return json;
    } catch (e) {
      return { success: false, code: 'NETWORK', message: 'Server tidak terjangkau' };
    } finally { clearTimeout(timer); }
  },

  /**
   * POST ke backend.  Api.post('login', {username, password}, {onSlow: fn})
   * Selalu mengembalikan objek {success, data, message, code} — tidak pernah melempar error.
   */
  async post(action, payload, opt) {
    opt = opt || {};
    if (!Api.configured()) {
      return { success: false, code: 'CONFIG', message: 'Backend belum dikonfigurasi. Isi GAS_URL di js/config.js.' };
    }
    const ctl = new AbortController();
    const timer = setTimeout(function () { ctl.abort(); }, APP_CONFIG.TIMEOUT_MS);
    const slow = opt.onSlow ? setTimeout(opt.onSlow, APP_CONFIG.PESAN_LAMBAT_MS) : null;
    try {
      const res = await fetch(APP_CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // JANGAN diganti application/json
        body: JSON.stringify({ action: action, payload: payload || {}, token: opt.token === undefined ? Session.token : opt.token }),
        signal: ctl.signal
      });
      const json = await res.json();
      if (json && json.code === 'AUTH' && opt.token === undefined) {
        document.dispatchEvent(new CustomEvent('sesi-habis'));
      }
      return json;
    } catch (e) {
      if (e && e.name === 'AbortError') {
        return { success: false, code: 'TIMEOUT', message: 'Server terlalu lama merespons. Periksa koneksi lalu coba lagi.' };
      }
      return { success: false, code: 'NETWORK', message: navigator.onLine === false
        ? 'Anda sedang offline. Periksa koneksi internet.'
        : 'Tidak dapat terhubung ke server. Coba lagi beberapa saat.' };
    } finally {
      clearTimeout(timer);
      if (slow) clearTimeout(slow);
    }
  }
};
