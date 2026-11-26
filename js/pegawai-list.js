/* =========================================================
   Halaman: Data Guru & Tendik — daftar nominatif
   Semua penyaringan/pengurutan dilakukan di peramban (instan);
   data diambil sekali dari server lalu disegarkan di latar belakang.
   ========================================================= */
const PegList = {
  KEY: 'peg_list',
  data: [],
  dimuat: false,
  state: null,

  reset() {
    PegList.data = []; PegList.dimuat = false; PegList.state = null;
  },
  stateAwal() {
    return { q: '', status: '', ptk: '', gol: '', kel: '', aktif: 'aktif', urut: 'nama', arah: 1, hal: 1, per: 10 };
  },

  // ---------- Titik masuk ----------
  async render(box, user) {
    if (!PegList.state) PegList.state = PegList.stateAwal();
    PegData.siapkanRef();
    const c = Session.cacheGet(PegList.KEY);
    if (c && c.daftar && !PegList.dimuat) { PegList.data = c.daftar; PegList.dimuat = true; if (c.ref) PegData.terapkanRef(c.ref, c.bup); }
    PegList.kerangka(box);
    if (PegList.dimuat) PegList.gambar();
    else PegList.gambarSkeleton();
    await PegList.muat(box);
  },

  async muat(box) {
    const r = await Api.post('pegawaiList', {});
    if (Shell.rute !== 'data-pegawai' || Shell.param) return;
    const upd = document.getElementById('pegUpd');
    if (r && r.success) {
      PegList.data = r.data.daftar; PegList.dimuat = true;
      PegData.terapkanRef(r.data.ref, r.data.bup);
      Session.cacheSet(PegList.KEY, { daftar: r.data.daftar, ref: r.data.ref, bup: r.data.bup, t: Date.now() });
      if (upd) upd.textContent = 'Diperbarui ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':') + ' WIB';
      PegList.isiFilter();
      PegList.gambar();
      return;
    }
    if (r && r.code === 'AUTH') return;
    if (PegList.dimuat) { UI.toast((r && r.message) || 'Gagal memperbarui data.', 'error'); if (upd) upd.textContent = 'Menampilkan data tersimpan'; return; }
    document.getElementById('pegHasil').innerHTML =
      '<div class="panel-center" style="margin:30px auto"><span class="ch-ic t-red">' + UI.ic('wifi-off') + '</span><h2>Data belum dapat dimuat</h2><p>' +
      UI.esc((r && r.message) || 'Terjadi kesalahan.') + '</p><button type="button" class="btn-secondary" id="btnCobaPeg">Coba Lagi</button></div>';
    document.getElementById('btnCobaPeg').addEventListener('click', function () { PegList.render(box, Shell.user); });
  },

  // ---------- Kerangka (dibuat sekali per kunjungan) ----------
  kerangka(box) {
    const s = PegList.state;
    box.innerHTML =
      '<section class="banner peg-banner">' +
        '<div class="banner-chips"><span class="chip">' + UI.ic('users') + 'Data Master<i class="vbar"></i>Data Guru &amp; Tendik</span></div>' +
        '<h1>Data Induk Guru &amp; Tendik</h1>' +
        '<p>Pusat kendali nominatif pegawai ASN (PNS &amp; PPPK), tenaga kependidikan, serta tenaga non-ASN beserta kelengkapan datanya.</p>' +
        '<div class="banner-actions">' +
          '<button type="button" class="btn-glass" id="btnImpor">' + UI.ic('upload') + 'Impor Excel</button>' +
          '<button type="button" class="btn-glass" id="btnEkspor">' + UI.ic('download') + 'Ekspor Nominatif</button>' +
          '<button type="button" class="btn-gold" id="btnTambah">' + UI.ic('plus') + 'Tambah Pegawai Baru</button>' +
          '<span class="upd" id="pegUpd"></span>' +
        '</div></section>' +
      '<div class="grid kpis" id="pegKpi"></div>' +
      '<section class="card filter-card">' +
        '<div class="search-box">' + UI.ic('search') +
          '<input id="fQ" type="search" autocomplete="off" placeholder="Cari NIP, NUPTK, NIK, nama lengkap, atau jabatan…" value="' + UI.esc(s.q) + '" aria-label="Cari pegawai"></div>' +
        '<div class="filters">' +
          PegList.selectHTML('fStatus', 'Status Kepegawaian', 'Semua Status') +
          PegList.selectHTML('fPtk', 'Jenis PTK', 'Semua Jenis PTK') +
          PegList.selectHTML('fGol', 'Golongan / Ruang', 'Semua Golongan') +
          PegList.selectHTML('fKel', 'Kelengkapan Data', 'Semua Kelengkapan') +
          PegList.selectHTML('fAktif', 'Status Data', '') +
        '</div>' +
        '<div class="filter-foot"><div class="fchips" id="fChips"></div><button type="button" class="link" id="fReset">Reset Filter</button></div>' +
      '</section>' +
      '<section class="card table-card" id="pegHasil"></section>';

    PegList.isiFilter();
    PegList.ikat(box);
  },

  selectHTML(id, label, semua) {
    return '<label class="fsel"><span>' + label + '</span><select id="' + id + '">' + (semua ? '<option value="">' + semua + '</option>' : '') + '</select></label>';
  },

  isiFilter() {
    const s = PegList.state;
    const isi = function (id, pasangan, nilai) {
      const el = document.getElementById(id); if (!el) return;
      const awal = el.querySelector('option[value=""]') ? '<option value="">' + el.querySelector('option[value=""]').textContent + '</option>' : '';
      el.innerHTML = awal + pasangan.map(function (p) { return '<option value="' + UI.esc(p[0]) + '">' + UI.esc(p[1]) + '</option>'; }).join('');
      el.value = nilai;
    };
    isi('fStatus', PegData.opsi('status_kepegawaian'), s.status);
    isi('fPtk', PegData.opsi('jenis_ptk'), s.ptk);
    isi('fGol', ['Gol IV', 'Gol III', 'Gol II', 'Gol I', 'PPPK / Non-ASN'].map(function (g) { return [g, g]; }), s.gol);
    isi('fKel', [['hi', '≥ 90 % (Lengkap)'], ['mid', '80 – 89 %'], ['lo', '< 80 % (Perlu dilengkapi)']], s.kel);
    isi('fAktif', [['aktif', 'Aktif'], ['nonaktif', 'Nonaktif / Pensiun / Mutasi'], ['semua', 'Semua']], s.aktif);
  },

  ikat(box) {
    const s = PegList.state, $ = UI.$;
    const ubah = function (k, v) { s[k] = v; s.hal = 1; PegList.gambar(); };
    $('fQ').addEventListener('input', UI.debounce(function () { ubah('q', $('fQ').value); }, 150));
    [['fStatus', 'status'], ['fPtk', 'ptk'], ['fGol', 'gol'], ['fKel', 'kel'], ['fAktif', 'aktif']].forEach(function (x) {
      $(x[0]).addEventListener('change', function () { ubah(x[1], this.value); });
    });
    $('fReset').addEventListener('click', function () {
      const ur = { urut: s.urut, arah: s.arah, per: s.per };
      Object.assign(s, PegList.stateAwal(), ur);          // ubah di tempat: objek state harus tetap sama
      $('fQ').value = ''; PegList.isiFilter(); PegList.gambar();
    });
    $('btnTambah').addEventListener('click', function () { PegForm.buka(null, PegList.setelahSimpan); });
    $('btnImpor').addEventListener('click', function () { PegIO.impor(function () { PegList.muat(box); }); });
    $('btnEkspor').addEventListener('click', function () { PegIO.ekspor(PegList.hasilFilter().map(function (p) { return p.id; })); });

    // Delegasi event pada hasil
    $('pegHasil').addEventListener('click', function (e) {
      const th = e.target.closest('[data-urut]');
      if (th) { const k = th.dataset.urut; if (s.urut === k) s.arah = -s.arah; else { s.urut = k; s.arah = 1; } s.hal = 1; return PegList.gambar(); }
      const pg = e.target.closest('[data-hal]');
      if (pg && !pg.disabled) { s.hal = Number(pg.dataset.hal); PegList.gambar(); $('pegHasil').scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      if (e.target.closest('#btnTambahKosong')) return PegForm.buka(null, PegList.setelahSimpan);
      if (e.target.closest('#btnImporKosong')) return PegIO.impor(function () { PegList.muat(box); });
      if (e.target.closest('#btnResetKosong')) return $('fReset').click();
      if (e.target.closest('a')) return;
      const baris = e.target.closest('[data-id]');
      if (baris) location.hash = '#/data-pegawai/' + baris.dataset.id;
    });
    $('pegHasil').addEventListener('change', function (e) {
      if (e.target.id === 'fPer') { s.per = Number(e.target.value); s.hal = 1; PegList.gambar(); }
    });
    $('pegHasil').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('tr[data-id]')) location.hash = '#/data-pegawai/' + e.target.dataset.id;
    });
  },

  setelahSimpan(ringkas, baru) {
    const i = PegList.data.findIndex(function (p) { return p.id === ringkas.id; });
    if (i >= 0) PegList.data[i] = ringkas; else PegList.data.push(ringkas);
    Session.cacheSet(PegList.KEY, { daftar: PegList.data, ref: PegData.ref, bup: PegData.bup, t: Date.now() });
    if (Shell.rute === 'data-pegawai' && !Shell.param) { PegList.gambar(); PegList.gambarKPI(); }
  },

  // ---------- Penyaringan & pengurutan ----------
  hasilFilter() {
    const s = PegList.state;
    const q = s.q.trim().toLowerCase();
    const angka = q.replace(/\D/g, '');
    const urutStatus = (PegData.ref && PegData.ref.status_kepegawaian) || [];
    let h = PegList.data.filter(function (p) {
      const aktif = (p.status_aktif || 'aktif') === 'aktif';
      if (s.aktif === 'aktif' && !aktif) return false;
      if (s.aktif === 'nonaktif' && aktif) return false;
      if (s.status && p.status_kepegawaian !== s.status) return false;
      if (s.ptk && p.jenis_ptk !== s.ptk) return false;
      if (s.gol && PegData.golBesar(p.golongan_ruang) !== s.gol) return false;
      if (s.kel === 'hi' && p.kel < 90) return false;
      if (s.kel === 'mid' && (p.kel < 80 || p.kel >= 90)) return false;
      if (s.kel === 'lo' && p.kel >= 80) return false;
      if (q) {
        const teks = (PegData.namaLengkap(p) + ' ' + (p.jabatan || '') + ' ' + (p.mapel_utama || '') + ' ' + (p.unit_kerja || '')).toLowerCase();
        const cocokTeks = teks.indexOf(q) >= 0;
        const cocokAngka = angka.length >= 3 && ((p.nip || '').indexOf(angka) >= 0 || (p.nuptk || '').indexOf(angka) >= 0 || (p.nik || '').indexOf(angka) >= 0);
        if (!cocokTeks && !cocokAngka) return false;
      }
      return true;
    });
    const cmpNama = function (a, b) { return String(a.nama).localeCompare(String(b.nama), 'id', { sensitivity: 'base' }); };
    h.sort(function (a, b) {
      let r = 0;
      if (s.urut === 'kel') r = a.kel - b.kel;
      else if (s.urut === 'status') r = urutStatus.indexOf(a.status_kepegawaian) - urutStatus.indexOf(b.status_kepegawaian);
      else if (s.urut === 'tmt') r = String(a.tmt_cpns || '9999').localeCompare(String(b.tmt_cpns || '9999'));
      else r = cmpNama(a, b);
      if (r === 0) r = cmpNama(a, b);
      return r * s.arah;
    });
    return h;
  },

  // ---------- Gambar ----------
  gambar() {
    PegList.gambarKPI();
    PegList.gambarChip();
    const s = PegList.state;
    const semua = PegList.data;
    const hasil = PegList.hasilFilter();
    const box = document.getElementById('pegHasil');
    if (!box) return;

    if (!semua.length) {
      box.innerHTML = '<div class="empty-big">' + UI.ic('users') + '<h3>Belum ada data pegawai</h3>' +
        '<p>Mulai dengan menambah pegawai satu per satu, atau impor sekaligus dari berkas Excel.</p>' +
        '<div class="empty-act"><button type="button" class="btn-secondary" id="btnTambahKosong">' + UI.ic('plus') + ' Tambah Pegawai</button>' +
        '<button type="button" class="chip-btn" id="btnImporKosong">' + UI.ic('upload') + 'Impor Excel</button></div></div>';
      return;
    }
    if (!hasil.length) {
      box.innerHTML = '<div class="empty-big">' + UI.ic('search') + '<h3>Tidak ada pegawai yang cocok</h3><p>Ubah kata kunci atau longgarkan filter yang aktif.</p>' +
        '<div class="empty-act"><button type="button" class="chip-btn" id="btnResetKosong">Reset Filter</button></div></div>';
      return;
    }

    const total = hasil.length;
    const hal = Math.min(s.hal, Math.max(1, Math.ceil(total / s.per)));
    s.hal = hal;
    const awal = (hal - 1) * s.per;
    const potong = hasil.slice(awal, awal + s.per);

    const sortBtn = function (k, label) {
      const aktif = s.urut === k;
      return '<button type="button" class="th-sort' + (aktif ? ' on' : '') + '" data-urut="' + k + '" aria-label="Urutkan menurut ' + label + '">' + label +
        '<span class="arah">' + (aktif ? (s.arah > 0 ? '▲' : '▼') : '') + '</span></button>';
    };

    let h = '<div class="table-head"><div><h3>Daftar Nominatif Pegawai</h3><p><b>' + total + '</b> pegawai ditemukan' + (total !== semua.length ? ' dari ' + semua.length : '') + '</p></div>' +
      '<label class="per">Tampilkan <select id="fPer">' + [10, 25, 50, 100].map(function (n) { return '<option value="' + n + '"' + (n === s.per ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label></div>';

    // Tabel (desktop)
    h += '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th>' + sortBtn('nama', 'Nama Lengkap, Gelar &amp; NIP') + '</th><th>' + sortBtn('status', 'Status &amp; Gol/Ruang') + '</th>' +
      '<th>Jabatan &amp; Unit / Mapel</th><th>' + sortBtn('tmt', 'Pendidikan &amp; TMT') + '</th><th>' + sortBtn('kel', 'Kelengkapan') + '</th><th aria-hidden="true"></th></tr></thead><tbody>';
    potong.forEach(function (p) { h += PegList.barisHTML(p); });
    h += '</tbody></table></div>';

    // Kartu (ponsel)
    h += '<div class="peg-cards">' + potong.map(PegList.kartuHTML).join('') + '</div>';

    // Paginasi
    const hm = Math.ceil(total / s.per);
    h += '<div class="pager"><span>Menampilkan <b>' + (awal + 1) + '–' + (awal + potong.length) + '</b> dari <b>' + total + '</b> pegawai</span><div class="pg">' +
      '<button type="button" class="pgb" data-hal="' + (hal - 1) + '"' + (hal <= 1 ? ' disabled' : '') + ' aria-label="Halaman sebelumnya">' + UI.ic('prev') + '</button>' +
      PegList.nomorHalaman(hal, hm).map(function (n) {
        return n === '…' ? '<span class="pgd">…</span>' : '<button type="button" class="pgb' + (n === hal ? ' on' : '') + '" data-hal="' + n + '"' + (n === hal ? ' aria-current="page"' : '') + '>' + n + '</button>';
      }).join('') +
      '<button type="button" class="pgb" data-hal="' + (hal + 1) + '"' + (hal >= hm ? ' disabled' : '') + ' aria-label="Halaman berikutnya">' + UI.ic('next') + '</button></div></div>';

    box.innerHTML = h;
  },

  nomorHalaman(h, m) {
    if (m <= 7) { const a = []; for (let i = 1; i <= m; i++) a.push(i); return a; }
    const s = [1];
    if (h > 3) s.push('…');
    for (let i = Math.max(2, h - 1); i <= Math.min(m - 1, h + 1); i++) s.push(i);
    if (h < m - 2) s.push('…');
    s.push(m);
    return s;
  },

  maskNik(n) { return n && n.length >= 8 ? n.substring(0, 4) + '••••••••' + n.slice(-3) : (n || ''); },

  identitas(p) {
    if (p.nip) return '<small class="mono">NIP ' + UI.esc(UI.nip(p.nip)) + '</small>' + (p.nuptk ? '<small class="mono dim">NUPTK ' + UI.esc(p.nuptk) + '</small>' : '');
    return '<small class="mono">NIK ' + UI.esc(PegList.maskNik(p.nik)) + '</small>' + (p.nuptk ? '<small class="mono dim">NUPTK ' + UI.esc(p.nuptk) + '</small>' : '');
  },

  barKel(n) {
    return '<div class="kel"><div class="kel-track"><span style="width:' + n + '%;background:' + PegData.warnaKel(n) + '"></span></div><b>' + n + '%</b></div>';
  },

  barisHTML(p) {
    const tak = (p.status_aktif || 'aktif') !== 'aktif';
    const st = PegData.statusAktifInfo(p.status_aktif);
    return '<tr class="peg-row' + (tak ? ' tak' : '') + '" data-id="' + UI.esc(p.id) + '" tabindex="0">' +
      '<td><div class="pc"><span class="av" style="' + PegData.avatar(p.nama) + '">' + UI.esc(UI.inisial(p.nama)) + '</span><div class="pc-t">' +
        '<a class="pn" href="#/data-pegawai/' + UI.esc(p.id) + '">' + UI.esc(PegData.namaLengkap(p)) + '</a>' + PegList.identitas(p) + '</div></div></td>' +
      '<td><span class="badge ' + PegData.badgeStatus(p.status_kepegawaian) + '">' + UI.esc(p.status_kepegawaian || '—') + '</span>' +
        (tak ? ' <span class="badge ' + st[1] + '">' + st[0] + '</span>' : '') +
        '<small>' + UI.esc(p.golongan_ruang ? PegData.golLabel(p.golongan_ruang) : 'Non-golongan') + '</small></td>' +
      '<td><b class="jb">' + UI.esc(p.jabatan || '—') + '</b><small>' + UI.esc([p.mapel_utama, p.unit_kerja].filter(Boolean).join(' • ') || PegData.ptkLabel(p.jenis_ptk)) + '</small></td>' +
      '<td><b class="jb">' + UI.esc(p.pendidikan_terakhir || '—') + '</b><small>' + (p.tmt_cpns ? 'TMT CPNS ' + UI.esc(UI.tgl(p.tmt_cpns)) : 'TMT belum diisi') + '</small></td>' +
      '<td>' + PegList.barKel(p.kel) + '</td>' +
      '<td class="go" aria-hidden="true">' + UI.ic('next') + '</td></tr>';
  },

  kartuHTML(p) {
    const tak = (p.status_aktif || 'aktif') !== 'aktif';
    return '<a class="peg-card' + (tak ? ' tak' : '') + '" href="#/data-pegawai/' + UI.esc(p.id) + '">' +
      '<span class="av" style="' + PegData.avatar(p.nama) + '">' + UI.esc(UI.inisial(p.nama)) + '</span>' +
      '<div class="pcd"><b>' + UI.esc(PegData.namaLengkap(p)) + '</b>' + PegList.identitas(p) +
      '<div class="pcd-b"><span class="badge ' + PegData.badgeStatus(p.status_kepegawaian) + '">' + UI.esc(p.status_kepegawaian || '—') + '</span>' +
      (tak ? '<span class="badge b-gray">' + UI.esc(PegData.statusAktifInfo(p.status_aktif)[0]) + '</span>' : '') +
      '<small>' + UI.esc(p.jabatan || PegData.ptkLabel(p.jenis_ptk)) + '</small></div>' + PegList.barKel(p.kel) + '</div></a>';
  },

  gambarSkeleton() {
    const sk = '<div class="sk" style="height:56px;margin-bottom:12px"></div>';
    document.getElementById('pegHasil').innerHTML = '<div class="sk" style="height:24px;width:40%;margin-bottom:18px"></div>' + sk + sk + sk + sk + sk;
    document.getElementById('pegKpi').innerHTML = [1, 2, 3, 4].map(function () {
      return '<div class="card"><div class="sk" style="height:14px;width:55%"></div><div class="sk" style="height:34px;width:40%;margin-top:18px"></div></div>';
    }).join('');
  },

  gambarKPI() {
    const el = document.getElementById('pegKpi'); if (!el) return;
    const aktif = PegList.data.filter(function (p) { return (p.status_aktif || 'aktif') === 'aktif'; });
    const nonaktif = PegList.data.length - aktif.length;
    const hit = function (fn) { return aktif.filter(fn).length; };
    const guru = hit(function (p) { return p.jenis_ptk === 'guru'; });
    const tendik = hit(function (p) { return p.jenis_ptk === 'tendik'; });
    const pendukung = hit(function (p) { return p.jenis_ptk === 'pendukung'; });
    const st = function (x) { return hit(function (p) { return p.status_kepegawaian === x; }); };
    const guruSt = function (x) { return hit(function (p) { return p.jenis_ptk === 'guru' && (x === 'ASN' ? PegData.isASN(p.status_kepegawaian) : !PegData.isASN(p.status_kepegawaian)); }); };
    const nonASN = st('GTY') + st('GTT') + st('PTT') + st('Honorer');
    el.innerHTML =
      DashSA.kpi({ judul: 'Total Pegawai', ikon: 'users', tint: 't-blue', nilai: aktif.length, sub: aktif.length ? 'Personil aktif' + (nonaktif ? ' · ' + nonaktif + ' nonaktif/pensiun/mutasi' : '') : 'Belum ada data' }) +
      DashSA.kpi({ judul: 'Guru', ikon: 'grad', tint: 't-green', nilai: guru, sub: guruSt('ASN') + ' ASN (PNS/PPPK) · ' + guruSt('non') + ' non-ASN' }) +
      DashSA.kpi({ judul: 'Tenaga Kependidikan', ikon: 'briefcase', tint: 't-indigo', nilai: tendik + pendukung, sub: tendik + ' tendik/TU · ' + pendukung + ' tenaga pendukung' }) +
      DashSA.kpi({ judul: 'Honorer & Non-ASN', ikon: 'user', tint: 't-gold', nilai: nonASN, sub: 'GTY ' + st('GTY') + ' · GTT ' + st('GTT') + ' · PTT ' + st('PTT') + ' · Honorer ' + st('Honorer') });
  },

  gambarChip() {
    const s = PegList.state, el = document.getElementById('fChips'); if (!el) return;
    const c = [];
    const peta = { status: 'Status', ptk: 'PTK', gol: 'Golongan' };
    ['status', 'ptk', 'gol'].forEach(function (k) { if (s[k]) c.push(peta[k] + ': ' + (k === 'ptk' ? PegData.ptkLabel(s[k]) : s[k])); });
    if (s.kel) c.push('Kelengkapan: ' + { hi: '≥ 90%', mid: '80–89%', lo: '< 80%' }[s.kel]);
    if (s.aktif !== 'aktif') c.push('Data: ' + (s.aktif === 'semua' ? 'Semua' : 'Nonaktif'));
    el.innerHTML = '<span class="flabel">Filter aktif:</span>' + (c.length ? c.map(function (t) { return '<span class="fchip">' + UI.esc(t) + '</span>'; }).join('') : '<span class="fchip fchip-n">Tanpa filter tambahan</span>');
  }
};

// Titik masuk rute: #/data-pegawai  &  #/data-pegawai/<id>
Pages['data-pegawai'] = function (box, user, param) {
  if (param) return PegDetail.render(box, user, param);
  return PegList.render(box, user);
};
