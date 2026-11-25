/* =========================================================
   Halaman: Dashboard (Super Admin) + halaman "segera"
   Prinsip UX instan: tampilkan cache lebih dulu → segarkan dari server.
   Data yang modulnya belum ada TIDAK dipalsukan: kartu diberi tanda "Segera".
   ========================================================= */
const DashSA = {
  KEY: 'dash_sa_',

  async render(box, user) {
    const cache = Session.cacheGet(DashSA.KEY + user.id);
    if (cache && cache.data) DashSA.paint(box, user, cache.data, cache.t, true);
    else box.innerHTML = DashSA.skeleton();
    await DashSA.muat(box, user, !!(cache && cache.data));
  },

  async muat(box, user, adaCache) {
    const btn = document.getElementById('btnRefreshDash');
    if (btn) { btn.disabled = true; btn.classList.add('busy'); }
    const r = await Api.post('dashboardSA', {});
    if (Shell.rute !== 'dashboard') return;            // pengguna sudah pindah halaman
    if (r && r.success) {
      const t = Date.now();
      Session.cacheSet(DashSA.KEY + user.id, { data: r.data, t: t });
      DashSA.paint(box, user, r.data, t, false);
      return;
    }
    if (r && r.code === 'AUTH') return;                 // ditangani event sesi-habis
    if (adaCache) {
      const btn2 = document.getElementById('btnRefreshDash');
      if (btn2) { btn2.disabled = false; btn2.classList.remove('busy'); }
      UI.toast((r && r.message) || 'Gagal memperbarui data.', 'error');
      const bar = document.getElementById('offbar');
      if (bar) bar.hidden = false;
      return;
    }
    box.innerHTML =
      '<div class="card panel-center"><span class="ch-ic t-red">' + UI.ic('wifi-off') + '</span>' +
      '<h2>Data belum dapat dimuat</h2><p>' + UI.esc((r && r.message) || 'Terjadi kesalahan.') + '</p>' +
      '<button type="button" class="btn-secondary" id="btnCoba">Coba Lagi</button></div>';
    document.getElementById('btnCoba').addEventListener('click', function () { Pages.dashboard(box, user); });
  },

  skeleton() {
    const k = '<div class="card"><div class="sk" style="height:14px;width:55%"></div><div class="sk" style="height:34px;width:40%;margin-top:18px"></div><div class="sk" style="height:12px;width:80%;margin-top:14px"></div></div>';
    return '<div class="sk" style="height:178px;border-radius:16px"></div>' +
      '<div class="grid kpis">' + k + k + k + k + '</div>' +
      '<div class="grid cols"><div class="stack"><div class="card"><div class="sk" style="height:150px"></div></div>' +
      '<div class="two"><div class="card"><div class="sk" style="height:190px"></div></div><div class="card"><div class="sk" style="height:190px"></div></div></div></div>' +
      '<div class="stack"><div class="card"><div class="sk" style="height:140px"></div></div><div class="card"><div class="sk" style="height:260px"></div></div></div></div>';
  },

  skorInfo(n) {
    if (n >= 90) return ['Sangat Baik', 'b-indigo'];
    if (n >= 75) return ['Baik', 'b-green'];
    if (n >= 50) return ['Cukup', 'b-gold'];
    return ['Perlu Perbaikan', 'b-red'];
  },

  kpi(o) {
    return '<article class="card' + (o.soon ? ' soon' : '') + '">' +
      '<div class="kpi-top"><span>' + o.judul + '</span><span class="ch-ic ' + o.tint + '">' + UI.ic(o.ikon) + '</span></div>' +
      '<div class="kpi-val"><strong>' + o.nilai + '</strong>' + (o.badge || '') + '</div>' +
      '<p class="kpi-sub">' + o.sub + '</p></article>';
  },

  paint(box, user, d, t, dariCache) {
    const tgl = UI.tanggalLengkap();
    const k = d.kpi || {};
    const total = k.total_pegawai || 0;
    const ds = d.distribusi_status || [];
    const cnt = function (lab) { const x = ds.filter(function (y) { return y.label === lab; })[0]; return x ? x.jumlah : 0; };
    const lain = total - cnt('PNS') - cnt('PPPK');
    const skor = DashSA.skorInfo(k.skor_data || 0);
    const antre = k.antrean_reset_password || 0;
    const sek = d.sekolah || {};
    const jam = new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');

    // ---- Banner ----
    let h = '<div id="offbar" class="offbar" hidden>' + UI.ic('wifi-off') + '<span>Tidak dapat memperbarui data. Menampilkan data tersimpan terakhir.</span></div>';
    h += '<section class="banner">' +
      '<div class="banner-chips"><span class="chip">' + UI.ic('calendar') + UI.esc(tgl.masehi) +
      (tgl.hijriah ? '<i class="vbar"></i>' + UI.esc(tgl.hijriah) : '') + '</span>' +
      '<span class="chip chip-green"><i class="dot"></i>Semester ' + UI.esc(sek.semester || '—') + ' TA ' + UI.esc(sek.tahun_ajaran || '—') + '</span></div>' +
      '<h1>Selamat datang, ' + UI.esc(user.nama || user.username) + '</h1>' +
      '<p>Ringkasan administrasi kepegawaian, kualitas data, dan keamanan akun ' + UI.esc(sek.nama || 'sekolah') + ' hari ini.</p>' +
      '<div class="banner-actions"><button type="button" class="btn-white" id="btnRefreshDash">' + UI.ic('refresh') + 'Muat Ulang Data</button>' +
      '<span class="upd">' + (dariCache ? 'Menyegarkan… data tersimpan ' : 'Diperbarui ') + jam + ' WIB</span></div></section>';

    // ---- KPI ----
    h += '<div class="grid kpis">';
    h += DashSA.kpi({
      judul: 'Total Pegawai', ikon: 'users', tint: 't-blue', nilai: total,
      badge: k.tambahan_bulan_ini > 0 ? '<span class="badge b-green">+' + k.tambahan_bulan_ini + ' bln ini</span>' : '',
      sub: total ? cnt('PNS') + ' PNS, ' + cnt('PPPK') + ' PPPK, ' + lain + ' lainnya' : 'Belum ada data pegawai aktif'
    });
    h += DashSA.kpi({
      judul: 'Presensi Hari Ini', ikon: 'pin', tint: 't-gray', nilai: '—', soon: true,
      badge: '<span class="soon-tag">SEGERA</span>', sub: 'Aktif setelah modul Presensi & Geofence dibangun'
    });
    h += DashSA.kpi({
      judul: 'Antrean Persetujuan', ikon: 'clipboard', tint: 't-gold', nilai: antre,
      badge: '<span class="badge ' + (antre ? 'b-gold' : 'b-green') + '">' + (antre ? 'Perlu Tindakan' : 'Tidak ada antrean') + '</span>',
      sub: antre ? antre + ' permintaan reset kata sandi menunggu · cuti & berkas menyusul' : 'Cuti & berkas data akan masuk antrean setelah modulnya aktif'
    });
    h += DashSA.kpi({
      judul: 'Skor Kualitas Data', ikon: 'shield', tint: 't-indigo', nilai: total ? (k.skor_data || 0) + '%' : '—',
      badge: total ? '<span class="badge ' + skor[1] + '">' + skor[0] + '</span>' : '',
      sub: total ? (k.tidak_lengkap || 0) + ' dari ' + total + ' pegawai datanya belum lengkap (< 80%)' : 'Dihitung dari kelengkapan data induk pegawai'
    });
    h += '</div>';

    // ---- Kolom kiri ----
    h += '<div class="grid cols"><div class="stack">';

    h += '<section class="card soon"><div class="card-head"><div><h3>Monitoring Presensi Realtime &amp; Geofence GPS</h3>' +
      '<p>Titik radius sekolah, ketepatan waktu, dan pelanggaran geofence.</p></div><span class="soon-tag">SEGERA</span></div>' +
      '<div class="tiles"><div class="tile"><span>Masuk tepat waktu</span><strong>—</strong></div>' +
      '<div class="tile"><span>Terlambat</span><strong>—</strong></div><div class="tile"><span>Di luar titik geofence</span><strong>—</strong></div></div>' +
      '<p class="soon-note">Panel ini akan menampilkan data langsung setelah modul Presensi &amp; Geofence dibangun. Tidak ada angka contoh yang ditampilkan agar data tidak menyesatkan.</p></section>';

    h += '<div class="two">';
    // Distribusi
    h += '<section class="card"><div class="card-head"><div><h3>Distribusi Kepegawaian</h3><p>Total ' + total + ' pegawai aktif</p></div><span class="badge b-blue">' + (total ? '100% Aktif' : 'Kosong') + '</span></div>';
    if (total) {
      h += Charts.stack(ds);
      const g = d.gender || {};
      h += '<div class="mini-foot"><span>Laki-laki <b>' + (g.L || 0) + '</b></span><span>Perempuan <b>' + (g.P || 0) + '</b></span>' +
        ((g.tidak_diisi || 0) ? '<span>Belum diisi <b>' + g.tidak_diisi + '</b></span>' : '') + '</div>';
    } else h += DashSA.kosong('Belum ada data pegawai. Data diisi melalui modul Data Guru &amp; Tendik.');
    h += '</section>';
    // Golongan
    h += '<section class="card"><div class="card-head"><div><h3>Struktur Golongan</h3><p>Sebaran golongan ruang pegawai</p></div><span class="ch-ic t-blue">' + UI.ic('activity') + '</span></div>';
    h += total ? Charts.bars(d.golongan || []) : DashSA.kosong('Belum ada data golongan.');
    h += '</section></div>';

    // Akun & keamanan
    const a = d.akun || {}, pr = a.per_role || {};
    h += '<section class="card"><div class="card-head"><div><h3>Akun &amp; Keamanan Sistem</h3><p>Status akun pengguna aplikasi</p></div><span class="ch-ic t-green">' + UI.ic('lockkey') + '</span></div>' +
      '<div class="stats4"><div class="stat"><span>Akun aktif</span><strong>' + (a.aktif || 0) + '</strong></div>' +
      '<div class="stat"><span>Nonaktif</span><strong>' + (a.nonaktif || 0) + '</strong></div>' +
      '<div class="stat' + (a.terkunci ? ' warn' : '') + '"><span>Terkunci</span><strong>' + (a.terkunci || 0) + '</strong></div>' +
      '<div class="stat"><span>Login 24 jam</span><strong>' + (a.login_24jam || 0) + '</strong></div></div>' +
      '<div class="roles"><span class="badge b-indigo">Super Admin ' + (pr.super_admin || 0) + '</span>' +
      '<span class="badge b-blue">Administrator ' + (pr.admin || 0) + '</span><span class="badge b-green">Pegawai ' + (pr.user || 0) + '</span></div>' +
      '<a class="link-soft" href="#/akun">Kelola akun &amp; peran ' + UI.ic('arrow') + '</a></section>';

    h += '</div>';

    // ---- Kolom kanan ----
    h += '<div class="stack">';
    h += '<section class="card soon"><div class="card-head"><div><h3>Agenda &amp; Jadwal Pekan Ini</h3><p>Kalender kegiatan sekolah</p></div><span class="soon-tag">SEGERA</span></div>' +
      '<p class="soon-note">Agenda akan tampil setelah modul Jadwal &amp; Kalender Kerja dibangun.</p></section>';

    h += '<section class="card"><div class="card-head"><div><h3>Audit Log &amp; Aktivitas</h3><p>Catatan aktivitas terbaru</p></div><span class="ch-ic t-green">' + UI.ic('history') + '</span></div>';
    if ((d.audit || []).length) {
      h += '<ul class="audit">' + d.audit.map(function (x) {
        return '<li><time>' + UI.esc(UI.waktu(x.waktu)) + '</time><div class="a-txt"><b>' + UI.esc(x.nama) + '</b> <span class="tg-' + UI.esc(x.tingkat) + '">' +
          UI.esc(x.label) + '</span><small>' + UI.esc(PERAN[x.role] || x.role || 'Sistem') + '</small></div></li>';
      }).join('') + '</ul>';
    } else h += DashSA.kosong('Belum ada aktivitas tercatat.');
    h += '<div class="card-foot"><a class="link-soft" style="margin:0" href="#/audit">Buka seluruh audit trail ' + UI.ic('arrow') + '</a></div></section>';
    h += '</div></div>';

    box.innerHTML = h;
    const btn = document.getElementById('btnRefreshDash');
    btn.addEventListener('click', function () { DashSA.muat(box, user, true); });
  },

  kosong(teks) { return '<div class="empty">' + UI.ic('info') + teks + '</div>'; }
};

// ---------- Dashboard peran lain (dibangun pada langkah berikutnya) ----------
const DashLain = {
  render(box, user) {
    const tgl = UI.tanggalLengkap();
    box.innerHTML =
      '<section class="banner"><div class="banner-chips"><span class="chip">' + UI.ic('calendar') + UI.esc(tgl.masehi) +
      (tgl.hijriah ? '<i class="vbar"></i>' + UI.esc(tgl.hijriah) : '') + '</span></div>' +
      '<h1>Selamat datang, ' + UI.esc(user.nama || user.username) + '</h1>' +
      '<p>' + UI.esc(PERAN[user.role] || user.role) + ' · SMKN 3 Tangerang</p></section>' +
      '<div class="card panel-center"><span class="ch-ic t-blue">' + UI.ic('info') + '</span>' +
      '<h2>Dashboard Anda sedang disiapkan</h2>' +
      '<p>Tampilan dashboard untuk peran <b>' + UI.esc(PERAN[user.role] || user.role) + '</b> akan dibangun pada langkah berikutnya. ' +
      'Saat ini dashboard lengkap tersedia untuk Super Admin.</p></div>';
  }
};

Pages.dashboard = function (box, user) {
  if (user.role === 'super_admin') return DashSA.render(box, user);
  return DashLain.render(box, user);
};

// ---------- Halaman untuk menu yang modulnya belum dibangun ----------
Pages.segera = function (box, user, item) {
  box.innerHTML =
    '<div class="card panel-center"><span class="ch-ic t-gold">' + UI.ic(item.icon) + '</span>' +
    '<h2>' + UI.esc(Menu.label(item, user.role)) + '</h2>' +
    '<p>Modul ini akan dibangun pada langkah berikutnya. Menu sudah disiapkan agar alur aplikasi terlihat utuh sejak awal.</p>' +
    '<a class="btn-secondary" href="#/dashboard">Kembali ke Dashboard</a></div>';
};
