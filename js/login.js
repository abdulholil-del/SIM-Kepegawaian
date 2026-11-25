/* =========================================================
   Halaman Login: tab peran, validasi, kirim ke API, lupa sandi
   ========================================================= */
const Login = {
  portal: 'pegawai',
  busy: false,

  TEKS: {
    pegawai: {
      judul: 'Portal Masuk Pegawai', label: 'NIP / NUPTK / Username',
      placeholder: 'Masukkan NIP, NUPTK, atau NIK', info: true
    },
    admin: {
      judul: 'Portal Masuk Administrator', label: 'Username Administrator',
      placeholder: 'Masukkan username administrator', info: false
    }
  },

  init() {
    const $ = UI.$;
    this.form = $('loginForm');
    this.elUser = $('username');
    this.elPw = $('password');
    this.btn = $('btnMasuk');

    // Tab peran (ingat pilihan terakhir)
    document.querySelectorAll('.tab').forEach(function (t) {
      t.addEventListener('click', function () { Login.setPortal(t.dataset.portal, true); });
    });
    let terakhir = 'pegawai';
    try { terakhir = localStorage.getItem('simpeg_portal') || 'pegawai'; } catch (e) {}
    this.setPortal(terakhir === 'admin' ? 'admin' : 'pegawai', false);

    // Navigasi tab dengan panah kiri/kanan (aksesibilitas)
    document.querySelector('.tabs').addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        Login.setPortal(Login.portal === 'admin' ? 'pegawai' : 'admin', true);
        $('tab-' + Login.portal).focus();
      }
    });

    // Tampilkan / sembunyikan kata sandi
    $('togglePw').addEventListener('click', function () {
      const tampil = Login.elPw.type === 'password';
      Login.elPw.type = tampil ? 'text' : 'password';
      this.setAttribute('aria-pressed', String(tampil));
      this.setAttribute('aria-label', tampil ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
      this.querySelector('use').setAttribute('href', tampil ? '#i-eye-off' : '#i-eye');
    });

    // Peringatan Caps Lock
    const caps = function (e) {
      if (e.getModifierState) $('capsWarn').hidden = !e.getModifierState('CapsLock');
    };
    this.elPw.addEventListener('keyup', caps);
    this.elPw.addEventListener('keydown', caps);
    this.elPw.addEventListener('blur', function () { $('capsWarn').hidden = true; });

    // Hapus tanda galat saat mengetik
    [this.elUser, this.elPw].forEach(function (el) {
      el.addEventListener('input', function () { el.classList.remove('err'); Login.hideAlert(); });
    });

    this.form.addEventListener('submit', function (e) { e.preventDefault(); Login.submit(); });
    $('btnLupa').addEventListener('click', function () { Login.lupa(); });
    $('btnBantuan').addEventListener('click', function () { Login.bantuan(); });
    $('btnKontak').addEventListener('click', function () { Login.kontak(); });
  },

  setPortal(p, simpan) {
    this.portal = p;
    const t = this.TEKS[p];
    document.querySelectorAll('.tab').forEach(function (el) {
      const aktif = el.dataset.portal === p;
      el.classList.toggle('active', aktif);
      el.setAttribute('aria-selected', String(aktif));
      el.tabIndex = aktif ? 0 : -1;
    });
    UI.$('loginTitle').textContent = t.judul;
    UI.$('lblUser').textContent = t.label;
    this.elUser.placeholder = t.placeholder;
    UI.$('infoBaru').hidden = !t.info;
    this.hideAlert();
    if (simpan) { try { localStorage.setItem('simpeg_portal', p); } catch (e) {} }
  },

  showAlert(msg) {
    UI.$('loginAlertText').textContent = msg;
    const box = UI.$('loginAlert');
    box.hidden = false;
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  },
  hideAlert() { UI.$('loginAlert').hidden = true; },

  setBusy(b) {
    this.busy = b;
    this.btn.disabled = b;
    this.btn.classList.toggle('loading', b);
    this.btn.querySelector('.btn-label').textContent = b ? 'Memproses…' : 'Masuk ke Sistem';
    if (!b) UI.$('slowNote').hidden = true;
  },

  async submit() {
    if (this.busy) return;
    const username = this.elUser.value.trim();
    const password = this.elPw.value;

    // Validasi sisi klien (validasi sebenarnya tetap di server)
    this.hideAlert();
    this.elUser.classList.toggle('err', !username);
    this.elPw.classList.toggle('err', !password);
    if (!username || !password) {
      this.showAlert(!username ? 'Masukkan NIP, NUPTK, atau username Anda.' : 'Masukkan kata sandi Anda.');
      (!username ? this.elUser : this.elPw).focus();
      return;
    }

    this.setBusy(true);
    const ingat = UI.$('ingat').checked;
    const r = await Api.post('login', {
      username: username, password: password, portal: this.portal, ingat: ingat,
      perangkat: (navigator.userAgent || '').substring(0, 100)
    }, {
      token: '',
      onSlow: function () { UI.$('slowNote').hidden = false; }
    });
    this.setBusy(false);

    if (r && r.success) {
      this.elPw.value = '';
      App.setelahLogin(r.data, ingat);
      return;
    }

    // Gagal
    this.elPw.value = '';
    this.elPw.classList.add('err');
    this.showAlert((r && r.message) || 'Terjadi kesalahan. Coba lagi.');
    if (r && r.code === 'PORTAL') {
      // Arahkan ke tab yang benar bila salah pilih
      this.setPortal(this.portal === 'admin' ? 'pegawai' : 'admin', true);
      this.showAlert(r.message);
    }
    this.elPw.focus();
  },

  // ---------- Lupa kata sandi ----------
  lupa() {
    const m = UI.modal({
      title: 'Lupa Kata Sandi',
      body:
        '<p>Masukkan NIP / NUPTK / username Anda. Permintaan reset akan diteruskan ke administrator, ' +
        'yang kemudian memberi Anda kata sandi sementara.</p>' +
        '<label class="lbl" for="lupaUser">NIP / NUPTK / Username</label>' +
        '<div class="field"><svg class="ic fic"><use href="#i-user"/></svg>' +
        '<input id="lupaUser" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="64" placeholder="Masukkan NIP atau username"></div>' +
        '<p id="lupaMsg" class="muted" style="margin:12px 0 0" role="status"></p>',
      actions: [
        { label: 'Batal', kind: 'ghost' },
        { label: 'Kirim Permintaan', onClick: async function (close, btn) {
            const el = document.getElementById('lupaUser');
            const msg = document.getElementById('lupaMsg');
            const val = el.value.trim();
            if (!val) { msg.textContent = 'Isi NIP / username terlebih dahulu.'; el.focus(); return; }
            btn.disabled = true; btn.textContent = 'Mengirim…';
            const r = await Api.post('lupaPassword', { username: val }, { token: '' });
            btn.disabled = false; btn.textContent = 'Kirim Permintaan';
            if (r && r.success) { close(); UI.toast(r.message, 'sukses'); }
            else msg.textContent = (r && r.message) || 'Gagal mengirim permintaan.';
        } }
      ]
    });
    const u = this.elUser.value.trim();
    if (u) m.el.querySelector('#lupaUser').value = u;
    m.el.querySelector('#lupaUser').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') m.el.querySelector('.btn-secondary').click();
    });
  },

  bantuan() {
    UI.modal({
      title: 'Panduan & Bantuan',
      body:
        '<ol class="steps">' +
        '<li><b>Pegawai (guru/tendik):</b> pilih tab <i>Pegawai</i>, masuk dengan NIP, NUPTK, atau NIK sebagai username.</li>' +
        '<li><b>Operator/TU:</b> pilih tab <i>Administrator / TU</i> dan masuk dengan username yang diberikan.</li>' +
        '<li>Login pertama memakai kata sandi sementara dari administrator; Anda akan diminta membuat kata sandi baru.</li>' +
        '<li>Centang <i>Ingat sesi saya</i> hanya di perangkat pribadi. Di komputer bersama, selalu klik <b>Keluar</b>.</li>' +
        '<li>Salah kata sandi 5 kali akan mengunci akun sementara selama 15 menit.</li>' +
        '<li>Lupa kata sandi? Klik <b>Lupa Kata Sandi?</b> atau hubungi operator kepegawaian.</li>' +
        '<li>Aplikasi dapat dipasang di layar utama ponsel lewat menu browser (<i>Tambahkan ke layar utama</i>).</li>' +
        '</ol>',
      actions: [{ label: 'Mengerti' }]
    });
  },

  kontak() {
    UI.modal({
      title: 'Hubungi Operator Kepegawaian',
      body:
        '<p>Untuk bantuan akun (akun belum terdaftar, akun terkunci, atau reset kata sandi), ' +
        'silakan datang atau hubungi <b>Subbag Tata Usaha / Operator Kepegawaian SMKN 3 Tangerang</b>.</p>' +
        '<p class="muted">Sertakan NIP/NUPTK dan nama lengkap Anda agar akun dapat dicari dengan cepat.</p>',
      actions: [{ label: 'Tutup' }]
    });
  }
};
