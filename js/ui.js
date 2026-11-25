/* Pembantu antarmuka: escape HTML, toast, modal */
const UI = {
  $(id) { return document.getElementById(id); },

  // Escape HTML — wajib dipakai untuk setiap data dinamis yang disisipkan sebagai HTML
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  },


  // Ikon dari sprite di index.html
  ic(nama, kelas) { return '<svg class="ic' + (kelas ? ' ' + kelas : '') + '" aria-hidden="true"><use href="#i-' + nama + '"/></svg>'; },

  inisial(nama) {
    const k = String(nama || '?').replace(/[^A-Za-zÀ-ÿ\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!k.length) return '?';
    return (k[0][0] + (k.length > 1 ? k[k.length - 1][0] : '')).toUpperCase();
  },

  // Waktu server (WIB, "yyyy-MM-ddTHH:mm:ss") → Date
  keDate(iso) { return iso ? new Date(String(iso).length === 19 ? iso + '+07:00' : iso) : null; },

  // "14:05" bila hari ini, selain itu "24 Nov 14:05"
  waktu(iso) {
    const d = UI.keDate(iso);
    if (!d || isNaN(d)) return '—';
    const f = function (o) { return new Intl.DateTimeFormat('id-ID', Object.assign({ timeZone: 'Asia/Jakarta' }, o)).format(d); };
    const hariIni = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
    const hariD = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
    const jam = f({ hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    return hariIni === hariD ? jam : f({ day: 'numeric', month: 'short' }) + ' ' + jam;
  },

  relatif(iso) {
    const d = UI.keDate(iso);
    if (!d || isNaN(d)) return '';
    const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
    if (s < 60) return 'baru saja';
    if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    if (s < 7 * 86400) return Math.floor(s / 86400) + ' hari lalu';
    return UI.waktu(iso);
  },

  // { masehi: "Rabu, 25 November 2026", hijriah: "15 Jumadilakhir 1448 H" }
  tanggalLengkap() {
    const now = new Date();
    const masehi = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(now);
    let hijriah = '';
    try {
      const bulan = ['Muharam', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jumadilawal', 'Jumadilakhir', 'Rajab', 'Syakban', 'Ramadan', 'Syawal', 'Zulkaidah', 'Zulhijah'];
      const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Asia/Jakarta' }).formatToParts(now);
      const v = {};
      parts.forEach(function (x) { v[x.type] = x.value; });
      const m = parseInt(v.month, 10);
      if (m >= 1 && m <= 12) hijriah = parseInt(v.day, 10) + ' ' + bulan[m - 1] + ' ' + parseInt(v.year, 10) + ' H';
    } catch (e) { /* peramban lama: lewati tanggal Hijriah */ }
    return { masehi: masehi, hijriah: hijriah };
  },

  _toastTimer: null,
  toast(msg, type) {
    const el = UI.$('toast');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(UI._toastTimer);
    UI._toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3800);
  },

  /**
   * Modal sederhana.
   * UI.modal({ title, body: '<html>', actions: [{label, kind:'primary'|'ghost', onClick(close)}] })
   */
  modal(opt) {
    const root = UI.$('modalRoot');
    const prevFocus = document.activeElement;
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle">' +
      '<div class="modal-head"><h3 id="mTitle">' + UI.esc(opt.title) + '</h3>' +
      '<button type="button" class="modal-x" aria-label="Tutup"><svg class="ic"><use href="#i-x"/></svg></button></div>' +
      '<div class="modal-body">' + (opt.body || '') + '</div>' +
      '<div class="modal-foot"></div></div>';
    root.appendChild(bg);

    function close() {
      document.removeEventListener('keydown', onKey);
      bg.remove();
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      if (opt.onClose) opt.onClose();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) close(); });
    bg.querySelector('.modal-x').addEventListener('click', close);

    const foot = bg.querySelector('.modal-foot');
    (opt.actions || []).forEach(function (a) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = a.kind === 'ghost' ? 'chip-btn' : 'btn-secondary';
      b.textContent = a.label;
      b.addEventListener('click', function () { a.onClick ? a.onClick(close, b) : close(); });
      foot.appendChild(b);
    });
    if (!(opt.actions || []).length) foot.remove();

    const first = bg.querySelector('input, button.btn-secondary, .modal-x');
    if (first) setTimeout(function () { first.focus(); }, 30);
    return { close: close, el: bg };
  }
};
