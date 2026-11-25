/* =========================================================
   Shell — sidebar, header, router (hash), notifikasi, menu akun
   ========================================================= */
const Shell = {
  user: null,
  aktif: false,
  rute: '',
  _terikat: false,
  _timerBell: null,
  _timerPing: null,

  // ---------- Siklus hidup ----------
  mulai(user) {
    Shell.user = user;
    Shell.aktif = true;
    Shell.isiIdentitas();
    Shell.bangunNav();
    App.show('app');
    Shell.bindSekali();

    if (!/^#\/[a-z0-9-]+$/.test(location.hash)) history.replaceState(null, '', '#/dashboard');
    Shell.route();

    Shell.bootstrap();
    Shell.cekServer();
    clearInterval(Shell._timerBell); clearInterval(Shell._timerPing);
    Shell._timerBell = setInterval(function () { if (!document.hidden) Shell.bootstrap(true); }, 60000);
    Shell._timerPing = setInterval(function () { if (!document.hidden) Shell.cekServer(true); }, 120000);
  },

  perbaruiUser(user) {
    Shell.user = user;
    Shell.isiIdentitas();
  },

  hentikan() {
    Shell.aktif = false;
    Shell.user = null;
    Shell.rute = '';
    clearInterval(Shell._timerBell); clearInterval(Shell._timerPing);
    Shell.tutupPop();
    Shell.tutupMenu();
    UI.$('page').innerHTML = '';
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  },

  isiIdentitas() {
    const u = Shell.user;
    const ini = UI.inisial(u.nama || u.username);
    UI.$('sbAvatar').textContent = ini;
    UI.$('tbAvatar').textContent = ini;
    UI.$('sbNama').textContent = u.nama || u.username;
    UI.$('sbPeran').textContent = PERAN[u.role] || u.role;
    UI.$('tbNama').textContent = u.nama || u.username;
    UI.$('tbNip').textContent = u.username;
    UI.$('tbSub').textContent = Menu.SUBJUDUL[u.role] || '';
  },

  // ---------- Navigasi samping ----------
  bangunNav() {
    const role = Shell.user.role;
    let h = '';
    Menu.untuk(role).forEach(function (g) {
      h += '<div class="sb-group">' + UI.esc(g.nama) + '</div>';
      g.items.forEach(function (it) {
        h += '<a class="sb-item' + (it.ready ? '' : ' nanti') + '" href="#/' + it.id + '" data-id="' + it.id + '"' + (it.ready ? '' : ' title="Modul belum tersedia"') + '>' + UI.ic(it.icon) +
          '<span>' + UI.esc(Menu.label(it, role)) + '</span>' + (it.ready ? '<i class="dot-gold" hidden></i>' : '<em class="soon">Segera</em>') + '</a>';
      });
    });
    UI.$('sbNav').innerHTML = h;
  },

  route() {
    if (!Shell.aktif) return;
    const m = location.hash.match(/^#\/([a-z0-9-]+)$/);
    const id = m ? m[1] : 'dashboard';
    const item = Menu.cari(id, Shell.user.role);
    if (!item) {                                   // tidak dikenal / bukan hak peran ini
      if (id !== 'dashboard') UI.toast('Halaman tidak tersedia untuk akun Anda.');
      history.replaceState(null, '', '#/dashboard');
      return Shell.route();
    }
    Shell.rute = item.id;
    document.querySelectorAll('.sb-item').forEach(function (a) {
      const on = a.dataset.id === item.id;
      a.classList.toggle('active', on);
      const dot = a.querySelector('.dot-gold');
      if (dot) dot.hidden = !on;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('#bottomNav [data-bn]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.bn === 'dashboard' && item.id === 'dashboard');
    });
    UI.$('tbTitle').textContent = item.id === 'dashboard' ? 'Dashboard' : Menu.label(item, Shell.user.role);
    document.title = Menu.label(item, Shell.user.role) + ' · SIM Kepegawaian SMKN 3';

    const box = UI.$('page');
    Shell.tutupMenu(); Shell.tutupPop();
    window.scrollTo(0, 0);
    if (item.ready && Pages[item.id]) Pages[item.id](box, Shell.user);
    else Pages.segera(box, Shell.user, item);
  },

  // ---------- Drawer (ponsel) ----------
  bukaMenu() { UI.$('sidebar').classList.add('open'); UI.$('sbScrim').classList.add('show'); },
  tutupMenu() { UI.$('sidebar').classList.remove('open'); UI.$('sbScrim').classList.remove('show'); },

  // ---------- Popover (notifikasi & akun) ----------
  tutupPop() {
    ['notifPop', 'profilPop'].forEach(function (id) { UI.$(id).hidden = true; });
    UI.$('btnBell').setAttribute('aria-expanded', 'false');
    UI.$('btnProfil').setAttribute('aria-expanded', 'false');
  },

  togglePop(nama) {
    const id = nama === 'notif' ? 'notifPop' : 'profilPop';
    const sedangBuka = !UI.$(id).hidden;
    Shell.tutupPop();
    if (sedangBuka) return;
    UI.$(id).hidden = false;
    UI.$(nama === 'notif' ? 'btnBell' : 'btnProfil').setAttribute('aria-expanded', 'true');
    if (nama === 'notif') Shell.muatNotif(); else Shell.isiMenuAkun();
  },

  isiMenuAkun() {
    const u = Shell.user;
    UI.$('profilPop').innerHTML =
      '<div class="menu-head"><span class="avatar">' + UI.esc(UI.inisial(u.nama || u.username)) + '</span><div><b>' + UI.esc(u.nama || u.username) +
      '</b><small>' + UI.esc(PERAN[u.role] || u.role) + ' · ' + UI.esc(u.username) + '</small></div></div>' +
      '<button type="button" class="menu-item" data-aksi="sandi">' + UI.ic('lock') + 'Ganti Kata Sandi</button>' +
      '<button type="button" class="menu-item danger" data-aksi="keluar">' + UI.ic('logout') + 'Keluar</button>';
  },

  // ---------- Notifikasi ----------
  setBell(n) {
    const teks = n > 9 ? '9+' : String(n);
    ['bellDot', 'bnDot'].forEach(function (id) { const el = UI.$(id); el.hidden = !n; el.textContent = teks; });
  },

  async bootstrap(senyap) {
    const r = await Api.post('bootstrap', {});
    if (r && r.success) {
      Shell.setBell(r.data.notif_belum_dibaca || 0);
      if (r.data.user) { Session.setUser(r.data.user); Shell.perbaruiUser(r.data.user); }
    } else if (!senyap && r && r.code !== 'AUTH') { /* offline: lonceng tetap tanpa angka */ }
  },

  async muatNotif() {
    const pop = UI.$('notifPop');
    pop.innerHTML = '<div class="pop-head"><b>Notifikasi</b></div><div class="pop-empty">Memuat…</div>';
    const r = await Api.post('notifList', {});
    if (UI.$('notifPop').hidden) return;
    if (!(r && r.success)) {
      pop.innerHTML = '<div class="pop-head"><b>Notifikasi</b></div><div class="pop-empty">' + UI.esc((r && r.message) || 'Gagal memuat.') + '</div>';
      return;
    }
    Shell.setBell(r.data.belum_dibaca);
    Shell.gambarNotif(r.data.daftar, r.data.belum_dibaca);
  },

  gambarNotif(daftar, belum) {
    const pop = UI.$('notifPop');
    let h = '<div class="pop-head"><b>Notifikasi' + (belum ? ' (' + belum + ')' : '') + '</b>' +
      (belum ? '<button type="button" data-aksi="semua">Tandai semua dibaca</button>' : '') + '</div><div class="pop-list">';
    if (!daftar.length) h += '<div class="pop-empty">Belum ada notifikasi.</div>';
    daftar.forEach(function (n) {
      const ikon = n.jenis === 'peringatan' ? 'alert' : n.jenis === 'sukses' ? 'check' : 'info';
      h += '<button type="button" class="ntf' + (n.dibaca ? '' : ' unread') + '" data-id="' + UI.esc(n.id) + '" data-tautan="' + UI.esc(n.tautan) + '">' +
        '<span class="ntf-ic ' + UI.esc(n.jenis) + '">' + UI.ic(ikon) + '</span>' +
        '<span class="ntf-body"><b>' + UI.esc(n.judul) + '</b>' + (n.isi ? '<p>' + UI.esc(n.isi) + '</p>' : '') + '<small>' + UI.esc(UI.relatif(n.waktu)) + '</small></span>' +
        (n.dibaca ? '' : '<i class="udot"></i>') + '</button>';
    });
    pop.innerHTML = h + '</div>';
  },

  async klikNotif(id, tautan, el) {
    // optimistik: tampil terbaca dulu, kirim ke server di latar belakang
    if (el.classList.contains('unread')) {
      el.classList.remove('unread');
      const dot = el.querySelector('.udot'); if (dot) dot.remove();
      const bell = UI.$('bellDot');
      const sisa = Math.max(0, (parseInt(bell.textContent, 10) || 1) - 1);
      Shell.setBell(sisa);
      Api.post('notifBaca', { ids: [id] });
    }
    if (/^#\/[a-z0-9-]+$/.test(tautan)) { Shell.tutupPop(); location.hash = tautan; }
  },

  async tandaiSemua() {
    document.querySelectorAll('#notifPop .ntf.unread').forEach(function (e) { e.classList.remove('unread'); const d = e.querySelector('.udot'); if (d) d.remove(); });
    Shell.setBell(0);
    const h = document.querySelector('#notifPop .pop-head button'); if (h) h.remove();
    Api.post('notifBaca', { semua: true });
  },

  // ---------- Ganti kata sandi (dari menu akun) ----------
  gantiSandi() {
    Shell.tutupPop();
    const m = UI.modal({
      title: 'Ganti Kata Sandi',
      body:
        '<div id="gsAlert" class="note note-danger" role="alert" hidden>' + UI.ic('alert') + '<div id="gsAlertText"></div></div>' +
        '<label class="lbl" for="gsLama">Kata sandi saat ini</label><div class="field">' + UI.ic('lock', 'fic') + '<input id="gsLama" type="password" autocomplete="current-password" maxlength="128"></div>' +
        '<label class="lbl" for="gsBaru">Kata sandi baru</label><div class="field">' + UI.ic('lock', 'fic') + '<input id="gsBaru" type="password" autocomplete="new-password" maxlength="64" placeholder="Minimal 8 karakter, huruf &amp; angka"></div>' +
        '<label class="lbl" for="gsKonf">Ulangi kata sandi baru</label><div class="field">' + UI.ic('lock', 'fic') + '<input id="gsKonf" type="password" autocomplete="new-password" maxlength="64"></div>',
      actions: [
        { label: 'Batal', kind: 'ghost' },
        { label: 'Simpan', onClick: async function (close, btn) {
            const lama = UI.$('gsLama').value, baru = UI.$('gsBaru').value, konf = UI.$('gsKonf').value;
            const err = function (t) { UI.$('gsAlertText').textContent = t; UI.$('gsAlert').hidden = false; };
            UI.$('gsAlert').hidden = true;
            if (!lama || !baru || !konf) return err('Semua kolom wajib diisi.');
            if (baru.length < 8 || !/[A-Za-z]/.test(baru) || !/\d/.test(baru)) return err('Kata sandi baru minimal 8 karakter dan mengandung huruf serta angka.');
            if (baru !== konf) return err('Konfirmasi kata sandi tidak sama.');
            if (baru === lama) return err('Kata sandi baru harus berbeda dari yang lama.');
            btn.disabled = true; btn.textContent = 'Menyimpan…';
            const r = await Api.post('gantiPassword', { lama: lama, baru: baru, konfirmasi: konf });
            btn.disabled = false; btn.textContent = 'Simpan';
            if (r && r.success) { close(); UI.toast('Kata sandi berhasil diganti.', 'sukses'); }
            else err((r && r.message) || 'Gagal mengganti kata sandi.');
        } }
      ]
    });
    return m;
  },

  // ---------- Status server ----------
  async cekServer() {
    const pill = UI.$('apiPill'), txt = UI.$('apiPillText');
    const set = function (c, t) { pill.className = 'pill ' + c; txt.textContent = t; };
    set('pill-wait', 'Menghubungkan…');
    const r = await Api.ping();
    if (r && r.success) set('pill-ok', 'GAS API Terhubung');
    else set('pill-off', 'Server terputus');
  },

  // ---------- Pengikatan event (sekali saja) ----------
  bindSekali() {
    if (Shell._terikat) return;
    Shell._terikat = true;

    window.addEventListener('hashchange', function () { Shell.route(); });
    UI.$('btnMenu').addEventListener('click', Shell.bukaMenu);
    UI.$('btnTutupMenu').addEventListener('click', Shell.tutupMenu);
    UI.$('sbScrim').addEventListener('click', Shell.tutupMenu);
    UI.$('sbNav').addEventListener('click', function (e) { if (e.target.closest('.sb-item')) Shell.tutupMenu(); });
    UI.$('btnBell').addEventListener('click', function (e) { e.stopPropagation(); Shell.togglePop('notif'); });
    UI.$('btnProfil').addEventListener('click', function (e) { e.stopPropagation(); Shell.togglePop('profil'); });
    UI.$('apiPill').addEventListener('click', function () { if (this.classList.contains('pill-off')) Shell.cekServer(); });

    UI.$('notifPop').addEventListener('click', function (e) {
      e.stopPropagation();
      const sem = e.target.closest('[data-aksi="semua"]');
      if (sem) return Shell.tandaiSemua();
      const n = e.target.closest('.ntf');
      if (n) Shell.klikNotif(n.dataset.id, n.dataset.tautan, n);
    });
    UI.$('profilPop').addEventListener('click', function (e) {
      e.stopPropagation();
      const b = e.target.closest('[data-aksi]');
      if (!b) return;
      if (b.dataset.aksi === 'sandi') Shell.gantiSandi();
      if (b.dataset.aksi === 'keluar') { Shell.tutupPop(); App.keluar(); }
    });
    document.addEventListener('click', function () { Shell.tutupPop(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { Shell.tutupPop(); Shell.tutupMenu(); } });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && Shell.aktif) Shell.bootstrap(true); });

    // Navigasi bawah (ponsel)
    UI.$('bottomNav').addEventListener('click', function (e) {
      const b = e.target.closest('[data-bn]');
      if (!b) return;
      e.stopPropagation();
      const a = b.dataset.bn;
      if (a === 'dashboard') { if (location.hash !== '#/dashboard') location.hash = '#/dashboard'; else window.scrollTo({ top: 0, behavior: 'smooth' }); }
      if (a === 'notif') Shell.togglePop('notif');
      if (a === 'menu') Shell.bukaMenu();
      if (a === 'akun') Shell.togglePop('profil');
    });
  }
};
