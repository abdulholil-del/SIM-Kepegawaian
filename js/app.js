/* =========================================================
   App — pengatur tampilan (login / ganti sandi / beranda),
   status server, PWA, dan alur sesi.
   ========================================================= */
const PERAN = {
  super_admin: 'Super Admin',
  admin: 'Administrator / TU',
  user: 'Pegawai (Guru / Tendik)'
};

const App = {
  VIEWS: ['login', 'ganti', 'app'],

  show(name) {
    App.VIEWS.forEach(function (v) { UI.$('view-' + v).hidden = (v !== name); });
    const sp = UI.$('splash');
    sp.classList.add('out');
    setTimeout(function () { sp.hidden = true; }, 320);
    window.scrollTo(0, 0);
    const fokus = { login: 'username', ganti: 'pwLama' }[name];
    if (fokus) setTimeout(function () { const el = UI.$(fokus); if (el) el.focus({ preventScroll: true }); }, 60);
  },

  async init() {
    Login.init();
    Ganti.init();
    App.pwa();
    document.addEventListener('sesi-habis', function () { App.sesiHabis(); });
    UI.$('serverStatus').addEventListener('click', function () { App.statusServer(); });

    // Sudah punya sesi? Tampilkan langsung dari cache lokal (instan), verifikasi di latar belakang.
    const user = Session.user();
    if (Session.token && Session.exp > Date.now() && user) {
      if (user.wajib_ganti) Ganti.tampil(); else App.masuk(user);
      App.verifikasi();
    } else {
      Session.clear();
      App.show('login');
    }
    App.statusServer();
  },

  // Pastikan sesi masih sah di server (tanpa menghalangi tampilan)
  async verifikasi() {
    const r = await Api.post('saya', {});
    if (r && r.success) {
      Session.setUser(r.data.user);
      if (r.data.user.wajib_ganti) Ganti.tampil(); else App.masuk(r.data.user);
    } else if (r && (r.code === 'NETWORK' || r.code === 'TIMEOUT')) {
      UI.toast('Mode offline — menampilkan data tersimpan.');
    }
    // code 'AUTH' ditangani oleh event "sesi-habis"
  },

  setelahLogin(data, ingat) {
    Session.save(data, ingat);
    if (data.wajib_ganti) { Ganti.tampil(); UI.toast('Silakan buat kata sandi baru.'); }
    else { App.masuk(data.user); UI.toast('Selamat datang, ' + (data.user.nama || data.user.username) + '!', 'sukses'); }
  },

  // Tampilkan kerangka aplikasi (atau cukup perbarui identitas bila sudah tampil)
  masuk(user) {
    if (Shell.aktif) Shell.perbaruiUser(user); else Shell.mulai(user);
  },

  keluar() {
    const tok = Session.token;
    Session.clear();                       // optimistik: langsung keluar di layar
    Shell.hentikan();
    Login.elUser.value = ''; Login.elPw.value = '';
    Login.hideAlert();
    App.show('login');
    UI.toast('Anda telah keluar.');
    if (tok) Api.post('logout', {}, { token: tok });   // dikirim di latar belakang
  },

  sesiHabis() {
    if (!UI.$('view-login').hidden) return;
    Session.clear();
    Shell.hentikan();
    App.show('login');
    Login.showAlert('Sesi Anda telah berakhir. Silakan masuk kembali.');
  },

  // ---------- Status server ----------
  async statusServer() {
    const btn = UI.$('serverStatus'), txt = UI.$('serverStatusText');
    const set = function (cls, t) { btn.className = 'status ' + cls; txt.textContent = t; };
    if (!Api.configured()) {
      UI.$('cfgWarn').hidden = false;
      set('status-off', 'Backend belum dikonfigurasi');
      return;
    }
    UI.$('cfgWarn').hidden = true;
    set('status-wait', 'Menghubungkan ke server…');
    const r = await Api.ping();
    if (r && r.success) set('status-ok', 'Server Aktif & Terhubung');
    else set('status-off', 'Server tidak terjangkau — klik untuk coba lagi');
  },

  // ---------- PWA ----------
  pwa() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').catch(function (e) { console.warn('SW gagal:', e); });
      });
    }
    let prompt = null;
    const btn = UI.$('btnInstall');
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); prompt = e; btn.hidden = false;
    });
    btn.addEventListener('click', async function () {
      if (!prompt) return;
      prompt.prompt();
      await prompt.userChoice;
      prompt = null; btn.hidden = true;
    });
    window.addEventListener('appinstalled', function () { btn.hidden = true; UI.toast('Aplikasi berhasil dipasang.', 'sukses'); });
  }
};

// ---------- Ganti kata sandi (wajib login pertama) ----------
const Ganti = {
  busy: false,
  init() {
    const $ = UI.$;
    $('gantiForm').addEventListener('submit', function (e) { e.preventDefault(); Ganti.submit(); });
    $('btnBatalGanti').addEventListener('click', function () { App.keluar(); });
    $('pwBaru').addEventListener('input', function () { Ganti.meter(this.value); });
    document.querySelectorAll('[data-eye]').forEach(function (b) {
      b.addEventListener('click', function () {
        const el = $(b.dataset.eye);
        const tampil = el.type === 'password';
        el.type = tampil ? 'text' : 'password';
        b.querySelector('use').setAttribute('href', tampil ? '#i-eye-off' : '#i-eye');
      });
    });
  },
  tampil() {
    ['pwLama', 'pwBaru', 'pwKonf'].forEach(function (id) { UI.$(id).value = ''; });
    UI.$('gantiAlert').hidden = true;
    Ganti.meter('');
    App.show('ganti');
  },
  meter(v) {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v) && /[A-Za-z]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
    const bar = UI.$('meterBar'), txt = UI.$('meterText');
    const peta = [['0%', '#E8EEF5', 'Gunakan kombinasi huruf dan angka.'], ['25%', '#D64545', 'Lemah'],
      ['50%', '#E8A317', 'Cukup'], ['75%', '#1E9E5A', 'Kuat'], ['100%', '#0B7A44', 'Sangat kuat']];
    const p = v ? peta[Math.max(1, s)] : peta[0];
    bar.style.width = p[0]; bar.style.background = p[1]; txt.textContent = p[2];
  },
  alert(msg) {
    UI.$('gantiAlertText').textContent = msg;
    UI.$('gantiAlert').hidden = false;
  },
  async submit() {
    if (Ganti.busy) return;
    const lama = UI.$('pwLama').value, baru = UI.$('pwBaru').value, konf = UI.$('pwKonf').value;
    UI.$('gantiAlert').hidden = true;
    if (!lama || !baru || !konf) return Ganti.alert('Semua kolom wajib diisi.');
    if (baru.length < 8 || !/[A-Za-z]/.test(baru) || !/\d/.test(baru)) return Ganti.alert('Kata sandi baru minimal 8 karakter dan mengandung huruf serta angka.');
    if (baru !== konf) return Ganti.alert('Konfirmasi kata sandi tidak sama.');
    if (baru === lama) return Ganti.alert('Kata sandi baru harus berbeda dari kata sandi sementara.');

    Ganti.busy = true;
    const btn = UI.$('btnGanti');
    btn.disabled = true; btn.classList.add('loading');
    const r = await Api.post('gantiPassword', { lama: lama, baru: baru, konfirmasi: konf });
    Ganti.busy = false;
    btn.disabled = false; btn.classList.remove('loading');

    if (r && r.success) {
      const u = Session.user() || {};
      u.wajib_ganti = false;
      Session.setUser(u);
      App.masuk(u);
      UI.toast('Kata sandi berhasil diganti.', 'sukses');
    } else {
      Ganti.alert((r && r.message) || 'Gagal mengganti kata sandi.');
    }
  }
};

document.addEventListener('DOMContentLoaded', function () { App.init(); });
