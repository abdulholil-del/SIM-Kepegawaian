/* =========================================================
   Halaman: Riwayat Kepangkatan & DUK  (#/riwayat)
   Tab 1  Daftar Urut Kepangkatan (DUK) — peringkat otomatis, ekspor Excel, cetak
   Tab 2  Monitoring Jatuh Tempo KGB & Kenaikan Pangkat
   ========================================================= */
const RiwayatDUK = {
  KEY: 'duk_list',
  state: null,
  mentah: [],
  baris: [],          // sudah diurutkan DUK + angka turunan; properti .no = peringkat
  meta: { jumlah_pppk: 0, sekolah: {} },
  dimuat: false,

  reset() { RiwayatDUK.state = null; RiwayatDUK.mentah = []; RiwayatDUK.baris = []; RiwayatDUK.dimuat = false; },
  stateAwal() { return { tab: 'duk', q: '', gol: '', riw: '', hal: 1, per: 25, jenis: '', hor: '90' }; },

  async render(box, user) {
    if (!RiwayatDUK.state) RiwayatDUK.state = RiwayatDUK.stateAwal();
    PegData.siapkanRef();
    const c = Session.cacheGet(RiwayatDUK.KEY);
    if (c && c.daftar && !RiwayatDUK.dimuat) { RiwayatDUK.terima(c); }
    RiwayatDUK.kerangka(box);
    if (RiwayatDUK.dimuat) RiwayatDUK.gambar(); else RiwayatDUK.skeleton();
    await RiwayatDUK.muat(box);
  },

  terima(d) {
    RiwayatDUK.mentah = d.daftar;
    RiwayatDUK.meta = { jumlah_pppk: d.jumlah_pppk || 0, sekolah: d.sekolah || {} };
    if (d.ref) PegData.terapkanRef(d.ref);
    const urut = RiwData.urutDUK(d.daftar);
    RiwayatDUK.baris = urut.map(function (r, i) { const x = RiwData.hitung(r); x.no = i + 1; return x; });
    RiwayatDUK.dimuat = true;
  },

  async muat(box) {
    const r = await Api.post('dukList', {});
    if (Shell.rute !== 'riwayat') return;
    const upd = document.getElementById('dukUpd');
    if (r && r.success) {
      Session.cacheSet(RiwayatDUK.KEY, r.data);
      RiwayatDUK.terima(r.data);
      if (upd) upd.textContent = 'Diperbarui ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':') + ' WIB';
      RiwayatDUK.isiFilter();
      RiwayatDUK.gambar();
      return;
    }
    if (r && r.code === 'AUTH') return;
    if (RiwayatDUK.dimuat) { UI.toast((r && r.message) || 'Gagal memperbarui data.', 'error'); if (upd) upd.textContent = 'Menampilkan data tersimpan'; return; }
    document.getElementById('dukIsi').innerHTML = '<div class="panel-center card" style="margin:30px auto"><span class="ch-ic t-red">' + UI.ic('wifi-off') + '</span><h2>Data belum dapat dimuat</h2><p>' +
      UI.esc((r && r.message) || 'Terjadi kesalahan.') + '</p><button type="button" class="btn-secondary" id="btnCobaDuk">Coba Lagi</button></div>';
    document.getElementById('btnCobaDuk').addEventListener('click', function () { RiwayatDUK.render(box, Shell.user); });
  },

  // ---------- Kerangka ----------
  kerangka(box) {
    const s = RiwayatDUK.state;
    box.innerHTML =
      '<section class="banner peg-banner">' +
        '<div class="banner-chips"><span class="chip">' + UI.ic('award') + 'Data Master<i class="vbar"></i>Riwayat Kepangkatan &amp; DUK</span></div>' +
        '<h1>Riwayat Kepangkatan &amp; Daftar Urut Kepangkatan (DUK)</h1>' +
        '<p>Peringkat otomatis PNS berdasarkan golongan, TMT pangkat, masa kerja, pendidikan, dan usia, disertai pemantauan jatuh tempo KGB dan kenaikan pangkat.</p>' +
        '<div class="banner-actions"><button type="button" class="btn-glass" id="btnDukXls">' + UI.ic('download') + 'Ekspor Excel</button>' +
        '<button type="button" class="btn-gold" id="btnDukCetak">' + UI.ic('printer') + 'Cetak DUK</button><span class="upd" id="dukUpd"></span></div></section>' +
      '<div class="grid kpis" id="dukKpi"></div>' +
      '<nav class="ptabs duk-tabs" role="tablist" aria-label="Bagian halaman">' +
        '<button type="button" role="tab" class="ptab' + (s.tab === 'duk' ? ' on' : '') + '" data-tab="duk">' + UI.ic('award') + 'Daftar Urut Kepangkatan</button>' +
        '<button type="button" role="tab" class="ptab' + (s.tab === 'monitor' ? ' on' : '') + '" data-tab="monitor">' + UI.ic('alarm') + 'Monitoring Jatuh Tempo<em id="monBadge" hidden></em></button></nav>' +
      '<div id="dukIsi"></div>';
    box.querySelectorAll('.duk-tabs .ptab').forEach(function (b) {
      b.addEventListener('click', function () {
        s.tab = b.dataset.tab; s.hal = 1;
        box.querySelectorAll('.duk-tabs .ptab').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); });
        RiwayatDUK.gambar();
      });
    });
    UI.$('btnDukXls').addEventListener('click', RiwayatDUK.ekspor);
    UI.$('btnDukCetak').addEventListener('click', RiwayatDUK.cetak);
    UI.$('dukIsi').addEventListener('click', RiwayatDUK.klik);
    UI.$('dukIsi').addEventListener('change', function (e) { if (e.target.id === 'dPer') { s.per = Number(e.target.value); s.hal = 1; RiwayatDUK.gambar(); } });
    UI.$('dukIsi').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('tr[data-id]')) RiwayatDUK.buka(e.target.dataset.id); });
  },

  skeleton() {
    UI.$('dukKpi').innerHTML = [1, 2, 3, 4].map(function () { return '<div class="card"><div class="sk" style="height:14px;width:55%"></div><div class="sk" style="height:34px;width:40%;margin-top:18px"></div></div>'; }).join('');
    UI.$('dukIsi').innerHTML = '<section class="card table-card" style="margin-top:24px;padding:20px"><div class="sk" style="height:24px;width:40%;margin-bottom:18px"></div>' +
      [1, 2, 3, 4, 5].map(function () { return '<div class="sk" style="height:52px;margin-bottom:10px"></div>'; }).join('') + '</section>';
  },

  isiFilter() { /* filter dibangun ulang pada setiap gambar() agar mengikuti data */ },

  buka(id) { PegDetail.tabAwal = 'riwayat'; location.hash = '#/data-pegawai/' + id; },

  klik(e) {
    const s = RiwayatDUK.state;
    const pg = e.target.closest('[data-hal]');
    if (pg && !pg.disabled) { s.hal = Number(pg.dataset.hal); RiwayatDUK.gambar(); UI.$('dukIsi').scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
    const r = e.target.closest('.js-reset');
    if (r) { Object.assign(s, { q: '', gol: '', riw: '', jenis: '', hor: '90', hal: 1 }); return RiwayatDUK.gambar(); }
    const aksi = e.target.closest('[data-buka]');
    if (aksi) return RiwayatDUK.buka(aksi.dataset.buka);
    if (e.target.closest('a')) return;
    const baris = e.target.closest('[data-id]');
    if (baris) RiwayatDUK.buka(baris.dataset.id);
  },

  // ---------- Gambar ----------
  gambar() {
    RiwayatDUK.gambarKPI();
    const s = RiwayatDUK.state;
    const box = UI.$('dukIsi'); if (!box) return;
    if (!RiwayatDUK.baris.length) {
      box.innerHTML = '<section class="card table-card" style="margin-top:24px"><div class="empty-big">' + UI.ic('award') + '<h3>Belum ada PNS/CPNS dalam DUK</h3>' +
        '<p>DUK disusun dari data pegawai berstatus PNS atau CPNS. Tambahkan data pegawai pada menu Data Guru &amp; Tendik.</p>' +
        '<div class="empty-act"><a class="btn-secondary" href="#/data-pegawai" style="display:inline-flex;align-items:center">Buka Data Guru &amp; Tendik</a></div></div></section>';
      return;
    }
    if (s.tab === 'monitor') RiwayatDUK.gambarMonitor(box); else RiwayatDUK.gambarDUK(box);
    // pulihkan fokus pada kolom pencarian bila sedang mengetik
  },

  gambarKPI() {
    const b = RiwayatDUK.baris, el = UI.$('dukKpi'); if (!el) return;
    const kgb = b.filter(function (r) { return r.kgbHari !== null && r.kgbHari <= 90; });
    const terlewat = kgb.filter(function (r) { return r.kgbHari < 0; }).length;
    const d30 = kgb.filter(function (r) { return r.kgbHari >= 0 && r.kgbHari <= 30; }).length;
    const perk = kgb.filter(function (r) { return !r.kgbPasti; }).length;
    const kp = b.filter(function (r) { return r.kpHari !== null && r.kpHari <= 365; }).length;
    const ada = b.filter(function (r) { return r.n_pangkat > 0; }).length;
    const total = b.length;
    const periode = RiwData.periodeKP('');
    el.innerHTML =
      DashSA.kpi({ judul: 'Total PNS / CPNS dalam DUK', ikon: 'users', tint: 't-blue', nilai: total, sub: RiwayatDUK.meta.jumlah_pppk + ' PPPK tidak masuk DUK' }) +
      DashSA.kpi({ judul: 'KGB Jatuh Tempo ≤ 90 Hari', ikon: 'alarm', tint: 't-gold', nilai: kgb.length,
        badge: terlewat ? '<span class="badge b-red">' + terlewat + ' terlewat</span>' : (kgb.length ? '<span class="badge b-gold">Perlu disiapkan</span>' : '<span class="badge b-green">Aman</span>'),
        sub: d30 + ' dalam 30 hari' + (perk ? ' · ' + perk + ' memakai perkiraan dari TMT CPNS' : '') }) +
      DashSA.kpi({ judul: 'Calon Naik Pangkat ≤ 12 Bulan', ikon: 'trend', tint: 't-green', nilai: kp, sub: 'Periode pengajuan berikutnya: ' + UI.tglPanjang(periode) }) +
      DashSA.kpi({ judul: 'Kelengkapan Riwayat', ikon: 'shield', tint: 't-indigo', nilai: ada + '/' + total,
        badge: ada === total ? '<span class="badge b-green">Lengkap</span>' : '<span class="badge b-gold">' + (total - ada) + ' belum</span>', sub: 'PNS/CPNS yang sudah memiliki riwayat pangkat tercatat' });
    const mb = UI.$('monBadge');
    if (mb) { const n = kgb.length + b.filter(function (r) { return r.kpHari !== null && r.kpHari <= 90; }).length; mb.hidden = !n; mb.textContent = n; }
  },

  // ---------- Tab DUK ----------
  gambarDUK(box) {
    const s = RiwayatDUK.state, b = RiwayatDUK.baris;
    const golTersedia = [];
    b.forEach(function (r) { const g = r.golongan_ruang || ''; if (golTersedia.indexOf(g) < 0) golTersedia.push(g); });
    golTersedia.sort(function (x, y) { return RiwData.golIdx(y) - RiwData.golIdx(x); });
    const q = s.q.trim().toLowerCase(), angka = q.replace(/\D/g, '');
    const hasil = b.filter(function (r) {
      if (s.gol !== '' && (r.golongan_ruang || '—') !== s.gol) return false;
      if (s.riw === 'ada' && !r.n_pangkat) return false;
      if (s.riw === 'belum' && r.n_pangkat) return false;
      if (q) {
        const teks = (PegData.namaLengkap(r) + ' ' + (r.jabatan || '')).toLowerCase();
        if (teks.indexOf(q) < 0 && !(angka.length >= 3 && (r.nip || '').indexOf(angka) >= 0)) return false;
      }
      return true;
    });
    const hm = Math.max(1, Math.ceil(hasil.length / s.per));
    s.hal = Math.min(s.hal, hm);
    const awal = (s.hal - 1) * s.per, potong = hasil.slice(awal, awal + s.per);

    let h = '<section class="card filter-card"><div class="search-box">' + UI.ic('search') + '<input id="dQ" type="search" autocomplete="off" placeholder="Cari nama, NIP, atau jabatan…" value="' + UI.esc(s.q) + '" aria-label="Cari pegawai"></div>' +
      '<div class="filters f3"><label class="fsel"><span>Golongan / Ruang</span><select id="dGol"><option value="">Semua Golongan</option>' +
      golTersedia.map(function (g) { const v = g || '—'; return '<option value="' + UI.esc(v) + '"' + (s.gol === v ? ' selected' : '') + '>' + UI.esc(g ? PegData.golLabel(g) : 'Golongan belum diisi') + '</option>'; }).join('') + '</select></label>' +
      '<label class="fsel"><span>Riwayat Pangkat</span><select id="dRiw"><option value="">Semua</option><option value="ada"' + (s.riw === 'ada' ? ' selected' : '') + '>Sudah ada riwayat</option><option value="belum"' + (s.riw === 'belum' ? ' selected' : '') + '>Belum ada riwayat</option></select></label>' +
      '<div class="fsel fr"><span>&nbsp;</span><button type="button" class="link js-reset">Reset Filter</button></div></div></section>';

    h += '<section class="card table-card" style="margin-top:24px"><div class="table-head"><div><h3>Hierarki DUK Pegawai Negeri Sipil</h3>' +
      '<p>Urutan otomatis: golongan › TMT pangkat › masa kerja › pendidikan › usia. <b>' + hasil.length + '</b> dari ' + b.length + ' pegawai</p></div>' +
      '<label class="per">Tampilkan <select id="dPer">' + [10, 25, 50, 100].map(function (n) { return '<option value="' + n + '"' + (n === s.per ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label></div>';

    if (!hasil.length) h += '<div class="empty-big">' + UI.ic('search') + '<h3>Tidak ada pegawai yang cocok</h3><p>Ubah kata kunci atau filter.</p><div class="empty-act"><button type="button" class="chip-btn js-reset">Reset Filter</button></div></div>';
    else {
      h += '<div class="tbl-wrap"><table class="tbl duk-tbl"><thead><tr><th>No</th><th>Nama Lengkap &amp; NIP</th><th>Gol/Ruang &amp; TMT Pangkat</th><th>Jabatan &amp; Unit</th><th>Masa Kerja</th><th>Pendidikan</th><th>Usia / Tgl Lahir</th><th>KGB Berikutnya</th><th aria-hidden="true"></th></tr></thead><tbody>' +
        potong.map(RiwayatDUK.barisHTML).join('') + '</tbody></table></div>';
      h += '<div class="peg-cards duk-cards">' + potong.map(RiwayatDUK.kartuHTML).join('') + '</div>';
      h += '<div class="pager"><span>Menampilkan <b>' + (awal + 1) + '–' + (awal + potong.length) + '</b> dari <b>' + hasil.length + '</b> pegawai</span><div class="pg">' +
        '<button type="button" class="pgb" data-hal="' + (s.hal - 1) + '"' + (s.hal <= 1 ? ' disabled' : '') + ' aria-label="Halaman sebelumnya">' + UI.ic('prev') + '</button>' +
        PegList.nomorHalaman(s.hal, hm).map(function (n) { return n === '…' ? '<span class="pgd">…</span>' : '<button type="button" class="pgb' + (n === s.hal ? ' on' : '') + '" data-hal="' + n + '">' + n + '</button>'; }).join('') +
        '<button type="button" class="pgb" data-hal="' + (s.hal + 1) + '"' + (s.hal >= hm ? ' disabled' : '') + ' aria-label="Halaman berikutnya">' + UI.ic('next') + '</button></div></div>';
    }
    h += '</section>';
    box.innerHTML = h;
    const $ = function (id) { return document.getElementById(id); };
    const ubah = function (k, v) { s[k] = v; s.hal = 1; RiwayatDUK.gambar(); const q2 = $('dQ'); if (k === 'q' && q2) { q2.focus(); q2.setSelectionRange(v.length, v.length); } };
    $('dQ').addEventListener('input', UI.debounce(function () { ubah('q', $('dQ').value); }, 150));
    $('dGol').addEventListener('change', function () { ubah('gol', this.value); });
    $('dRiw').addEventListener('change', function () { ubah('riw', this.value); });
  },

  kgbSel(r) {
    if (!r.kgb) return '<small class="dim">TMT belum diisi</small>';
    return '<b class="jb">' + UI.esc(UI.tgl(r.kgb.tanggal)) + '</b>' + RiwData.badgeHari(r.kgbHari) + (r.kgbPasti ? '' : '<small class="dim">perkiraan</small>');
  },

  barisHTML(r) {
    return '<tr class="peg-row" data-id="' + UI.esc(r.id) + '" tabindex="0">' +
      '<td class="no"><b>' + r.no + '</b></td>' +
      '<td><div class="pc"><span class="av" style="' + PegData.avatar(r.nama) + '">' + UI.esc(UI.inisial(r.nama)) + '</span><div class="pc-t"><a class="pn" href="#/data-pegawai/' + UI.esc(r.id) + '">' + UI.esc(PegData.namaLengkap(r)) + '</a>' +
        (r.nip ? '<small class="mono">NIP ' + UI.esc(UI.nip(r.nip)) + '</small>' : '<small class="dim">NIP belum diisi</small>') + '</div></div></td>' +
      '<td>' + (r.golongan_ruang ? '<span class="badge b-blue">' + UI.esc(r.golongan_ruang) + '</span><b class="jb" style="margin-top:4px">' + UI.esc(PegData.PANGKAT[r.golongan_ruang] || '') + '</b>' : '<span class="badge b-gray">Belum diisi</span>') +
        '<small>' + (r.tmt_pangkat ? 'TMT ' + UI.esc(UI.tgl(r.tmt_pangkat)) : 'TMT pangkat belum diisi') + '</small></td>' +
      '<td><b class="jb">' + UI.esc(r.jabatan || '—') + '</b><small>' + UI.esc(r.unit_kerja || '') + '</small></td>' +
      '<td><b class="jb">' + UI.esc(RiwData.mkTeks(r.mk)) + '</b><small>MK golongan ' + UI.esc(RiwData.mkTeks(r.mkGol)) + '</small></td>' +
      '<td>' + UI.esc(r.pendidikan_terakhir || '—') + '</td>' +
      '<td><b class="jb">' + (r.usia ? r.usia.th + ' thn' : '—') + '</b><small>' + UI.esc(r.tanggal_lahir ? UI.tgl(r.tanggal_lahir) : '') + '</small></td>' +
      '<td>' + RiwayatDUK.kgbSel(r) + '</td>' +
      '<td class="go" aria-hidden="true">' + UI.ic('next') + '</td></tr>';
  },

  kartuHTML(r) {
    return '<a class="peg-card duk-card" href="#/data-pegawai/' + UI.esc(r.id) + '" data-buka="' + UI.esc(r.id) + '"><span class="no-badge">' + r.no + '</span>' +
      '<div class="pcd"><b>' + UI.esc(PegData.namaLengkap(r)) + '</b>' + (r.nip ? '<small class="mono">NIP ' + UI.esc(UI.nip(r.nip)) + '</small>' : '') +
      '<div class="pcd-b">' + (r.golongan_ruang ? '<span class="badge b-blue">' + UI.esc(r.golongan_ruang) + '</span>' : '<span class="badge b-gray">Gol. kosong</span>') +
      '<small>MK ' + UI.esc(RiwData.mkTeks(r.mk)) + '</small></div>' +
      '<div class="pcd-b"><small>KGB:</small>' + (r.kgb ? '<small><b>' + UI.esc(UI.tgl(r.kgb.tanggal)) + '</b></small>' + RiwData.badgeHari(r.kgbHari) : '<small>—</small>') + '</div></div></a>';
  },

  // ---------- Tab Monitoring ----------
  gambarMonitor(box) {
    const s = RiwayatDUK.state, b = RiwayatDUK.baris;
    const items = [];
    b.forEach(function (r) {
      if (r.kgb) items.push({ r: r, jenis: 'KGB', tgl: r.kgb.tanggal, hari: r.kgbHari, dasar: r.kgb.dasar, perkiraan: !r.kgbPasti });
      if (r.kp) items.push({ r: r, jenis: 'Pangkat', tgl: r.kp.tanggal, hari: r.kpHari, dasar: r.kp.dasar, perkiraan: false });
    });
    const q = s.q.trim().toLowerCase(), angka = q.replace(/\D/g, '');
    const sesuaiJenis = items.filter(function (x) { return !s.jenis || x.jenis === s.jenis; });
    const batas = { terlewat: -1, '30': 30, '90': 90, '180': 180, '365': 365, semua: 99999 }[s.hor];
    const hasil = sesuaiJenis.filter(function (x) {
      if (s.hor === 'terlewat' ? x.hari >= 0 : x.hari > batas) return false;
      if (q) {
        const teks = PegData.namaLengkap(x.r).toLowerCase();
        if (teks.indexOf(q) < 0 && !(angka.length >= 3 && (x.r.nip || '').indexOf(angka) >= 0)) return false;
      }
      return true;
    }).sort(function (x, y) { return x.hari - y.hari; });

    const bucket = function (lo, hi) { return sesuaiJenis.filter(function (x) { return x.hari >= lo && x.hari <= hi; }).length; };
    const tiles = [['Terlewat', sesuaiJenis.filter(function (x) { return x.hari < 0; }).length, 'merah'], ['0–3 bulan', bucket(0, 91), 'emas'], ['3–6 bulan', bucket(92, 182), 'biru'], ['6–9 bulan', bucket(183, 273), 'biru'], ['9–12 bulan', bucket(274, 365), 'biru']];
    const tanpaKgb = b.filter(function (r) { return !r.tmt_kgb_terakhir; }).length, tanpaPangkat = b.filter(function (r) { return !r.tmt_pangkat; }).length;

    let h = '<section class="card filter-card"><div class="search-box">' + UI.ic('search') + '<input id="dQ" type="search" autocomplete="off" placeholder="Cari nama atau NIP…" value="' + UI.esc(s.q) + '" aria-label="Cari pegawai"></div>' +
      '<div class="filters f3"><label class="fsel"><span>Jenis</span><select id="mJenis"><option value="">KGB &amp; Kenaikan Pangkat</option><option value="KGB"' + (s.jenis === 'KGB' ? ' selected' : '') + '>KGB saja</option><option value="Pangkat"' + (s.jenis === 'Pangkat' ? ' selected' : '') + '>Kenaikan Pangkat saja</option></select></label>' +
      '<label class="fsel"><span>Jatuh tempo dalam</span><select id="mHor">' + [['terlewat', 'Sudah terlewat'], ['30', '≤ 30 hari'], ['90', '≤ 90 hari'], ['180', '≤ 6 bulan'], ['365', '≤ 12 bulan'], ['semua', 'Semua']].map(function (o) { return '<option value="' + o[0] + '"' + (s.hor === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
      '<div class="fsel fr"><span>&nbsp;</span><button type="button" class="link js-reset">Reset Filter</button></div></div></section>';

    h += '<section class="card" style="margin-top:24px"><div class="card-head"><div><h3>Distribusi Jatuh Tempo 12 Bulan ke Depan</h3><p>Jumlah ' + (s.jenis === 'KGB' ? 'KGB' : s.jenis === 'Pangkat' ? 'kenaikan pangkat' : 'KGB dan kenaikan pangkat') + ' per rentang waktu</p></div><span class="ch-ic t-gold">' + UI.ic('calendar') + '</span></div>' +
      '<div class="dist">' + tiles.map(function (t) { return '<div class="dist-i n-' + t[2] + '"><small>' + t[0] + '</small><b>' + t[1] + '</b></div>'; }).join('') + '</div>' +
      ((tanpaKgb || tanpaPangkat) ? '<p class="fine" style="margin-top:12px">Catatan: ' + tanpaKgb + ' pegawai belum memiliki <b>TMT KGB terakhir</b> (jatuh tempo KGB diperkirakan dari TMT CPNS) dan ' + tanpaPangkat + ' belum memiliki <b>TMT pangkat</b> (tidak dapat dipantau). Lengkapi lewat tab Riwayat pada detail pegawai.</p>' : '') + '</section>';

    h += '<section class="card table-card" style="margin-top:24px"><div class="table-head"><div><h3>Daftar Jatuh Tempo</h3><p><b>' + hasil.length + '</b> item · diurutkan dari yang paling dekat</p></div></div>';
    if (!hasil.length) h += '<div class="empty-big">' + UI.ic('check') + '<h3>Tidak ada jatuh tempo pada rentang ini</h3><p>Coba perluas rentang waktu atau ubah jenis.</p></div>';
    else {
      h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Pegawai</th><th>Jenis</th><th>Golongan</th><th>Jatuh Tempo</th><th>Sisa Waktu</th><th>Dasar Perhitungan</th><th></th></tr></thead><tbody>' +
        hasil.slice(0, 300).map(function (x) {
          return '<tr class="peg-row" data-id="' + UI.esc(x.r.id) + '" tabindex="0"><td><div class="pc"><span class="av" style="' + PegData.avatar(x.r.nama) + '">' + UI.esc(UI.inisial(x.r.nama)) + '</span><div class="pc-t"><a class="pn" href="#/data-pegawai/' + UI.esc(x.r.id) + '">' + UI.esc(PegData.namaLengkap(x.r)) + '</a>' +
            (x.r.nip ? '<small class="mono">NIP ' + UI.esc(UI.nip(x.r.nip)) + '</small>' : '') + '</div></div></td>' +
            '<td><span class="badge ' + (x.jenis === 'KGB' ? 'b-gold' : 'b-green') + '">' + (x.jenis === 'KGB' ? 'KGB' : 'Naik Pangkat') + '</span></td>' +
            '<td>' + UI.esc(x.r.golongan_ruang || '—') + '</td><td><b class="jb">' + UI.esc(UI.tglPanjang(x.tgl)) + '</b></td><td>' + RiwData.badgeHari(x.hari) + '</td>' +
            '<td><small class="dim" style="margin:0">' + UI.esc(x.dasar) + (x.perkiraan ? ' (perkiraan)' : '') + '</small></td>' +
            '<td><button type="button" class="chip-btn btn-sm" data-buka="' + UI.esc(x.r.id) + '">Catat' + UI.ic('next') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' + (hasil.length > 300 ? '<p class="fine" style="padding:0 20px 16px">Menampilkan 300 item teratas. Persempit filter untuk melihat sisanya.</p>' : '');
    }
    h += '</section>';
    box.innerHTML = h;
    const $ = function (id) { return document.getElementById(id); };
    const ubah = function (k, v) { s[k] = v; RiwayatDUK.gambar(); const q2 = $('dQ'); if (k === 'q' && q2) { q2.focus(); q2.setSelectionRange(v.length, v.length); } };
    $('dQ').addEventListener('input', UI.debounce(function () { ubah('q', $('dQ').value); }, 150));
    $('mJenis').addEventListener('change', function () { ubah('jenis', this.value); });
    $('mHor').addEventListener('change', function () { ubah('hor', this.value); });
  },

  // ---------- Ekspor Excel ----------
  async ekspor() {
    if (!RiwayatDUK.baris.length) return UI.toast('Belum ada data DUK untuk diekspor.', 'error');
    let X;
    try { X = await PegIO.muatLib(); } catch (e) { return UI.toast(e.message, 'error'); }
    const aoa = [['No', 'Nama Lengkap', 'NIP', 'Pangkat', 'Golongan/Ruang', 'TMT Pangkat', 'Jabatan', 'Unit Kerja', 'TMT CPNS', 'Masa Kerja (Tahun)', 'Masa Kerja (Bulan)', 'Pendidikan', 'Tanggal Lahir', 'Usia', 'TMT KGB Terakhir', 'KGB Berikutnya', 'Jumlah Riwayat Pangkat', 'Jumlah Riwayat KGB']];
    RiwayatDUK.baris.forEach(function (r) {
      aoa.push([String(r.no), PegData.namaLengkap(r), r.nip || '', PegData.PANGKAT[r.golongan_ruang] || '', r.golongan_ruang || '', r.tmt_pangkat || '', r.jabatan || '', r.unit_kerja || '', r.tmt_cpns || '',
        r.mk ? String(r.mk.th) : '', r.mk ? String(r.mk.bl) : '', r.pendidikan_terakhir || '', r.tanggal_lahir || '', r.usia ? String(r.usia.th) : '', r.tmt_kgb_terakhir || '',
        r.kgb ? r.kgb.tanggal + (r.kgbPasti ? '' : ' (perkiraan)') : '', String(r.n_pangkat), String(r.n_kgb)]);
    });
    const ws = X.utils.aoa_to_sheet(aoa);
    ws['!cols'] = aoa[0].map(function (h, i) { let w = String(h).length; for (let j = 1; j < Math.min(aoa.length, 50); j++) w = Math.max(w, String(aoa[j][i]).length); return { wch: Math.min(Math.max(w + 2, 8), 40) }; });
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'DUK');
    UI.unduh(X.write(wb, { bookType: 'xlsx', type: 'array' }), 'DUK_' + UI.hariIniISO() + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    UI.toast('DUK diekspor ke Excel.', 'sukses');
  },

  // ---------- Cetak DUK (jendela cetak → simpan sebagai PDF) ----------
  cetak() {
    const b = RiwayatDUK.baris;
    if (!b.length) return UI.toast('Belum ada data DUK untuk dicetak.', 'error');
    const sk = RiwayatDUK.meta.sekolah || {};
    const w = window.open('', '_blank');
    if (!w) return UI.toast('Jendela cetak diblokir peramban. Izinkan pop-up untuk situs ini.', 'error');
    const tgl = UI.tglPanjang(UI.hariIniISO());
    const baris = b.map(function (r) {
      return '<tr><td class="c">' + r.no + '</td><td>' + UI.esc(PegData.namaLengkap(r)) + '<br><span class="m">' + UI.esc(r.nip ? UI.nip(r.nip) : '') + '</span></td>' +
        '<td>' + UI.esc(PegData.PANGKAT[r.golongan_ruang] || '') + '<br>' + UI.esc(r.golongan_ruang ? '(' + r.golongan_ruang + ')' : '') + '</td><td class="c">' + UI.esc(r.tmt_pangkat ? UI.tgl(r.tmt_pangkat) : '') + '</td>' +
        '<td>' + UI.esc(r.jabatan || '') + '</td><td class="c">' + UI.esc(RiwData.mkTeks(r.mk)) + '</td><td class="c">' + UI.esc(r.pendidikan_terakhir || '') + '</td>' +
        '<td class="c">' + UI.esc(r.tanggal_lahir ? UI.tgl(r.tanggal_lahir) : '') + '</td><td></td></tr>';
    }).join('');
    const html = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>DUK ' + UI.esc(sk.nama || '') + ' ' + UI.hariIniISO() + '</title><style>' +
      '@page{size:A4 landscape;margin:14mm 12mm}*{box-sizing:border-box}body{font:11px/1.4 "Times New Roman",serif;color:#000;margin:0}' +
      '.kop{text-align:center;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:10px}.kop b{display:block;font-size:15px;text-transform:uppercase}.kop span{font-size:11px}' +
      'h1{font-size:13px;text-align:center;margin:8px 0 2px;text-transform:uppercase}p.t{text-align:center;margin:0 0 10px;font-size:11px}' +
      'table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:3px 5px;vertical-align:top}th{background:#eee;text-align:center;font-size:10.5px}td.c{text-align:center}.m{font-size:10px}' +
      'tr{page-break-inside:avoid}thead{display:table-header-group}.ttd{margin-top:18px;margin-left:62%;text-align:center;page-break-inside:avoid}.ttd .sp{height:58px}' +
      '.ft{margin-top:14px;font-size:9px;color:#555}@media screen{body{padding:16px}}</style></head><body>' +
      '<div class="kop"><b>Pemerintah Provinsi Banten</b><b>' + UI.esc(sk.nama || 'Sekolah') + '</b><span>' + UI.esc(sk.alamat || '') + '</span></div>' +
      '<h1>Daftar Urut Kepangkatan (DUK) Pegawai Negeri Sipil</h1><p class="t">Keadaan per ' + UI.esc(tgl) + ' · Jumlah: ' + b.length + ' pegawai</p>' +
      '<table><thead><tr><th>No</th><th>Nama / NIP</th><th>Pangkat (Gol/Ruang)</th><th>TMT Pangkat</th><th>Jabatan</th><th>Masa Kerja</th><th>Pendidikan</th><th>Tgl Lahir</th><th>Ket.</th></tr></thead><tbody>' + baris + '</tbody></table>' +
      '<div class="ttd">Tangerang, ' + UI.esc(tgl) + '<br>' + UI.esc(sk.kepsek_jabatan || 'Kepala Sekolah') + '<div class="sp"></div><b><u>' + UI.esc(sk.kepsek_nama || '(.............................................)') + '</u></b><br>' + (sk.kepsek_nip ? 'NIP. ' + UI.esc(UI.nip(sk.kepsek_nip)) : '') + '</div>' +
      '<div class="ft">Dicetak dari SIM Kepegawaian ' + UI.esc(sk.nama || '') + ' · Urutan: golongan, TMT pangkat, masa kerja, pendidikan, usia.</div>' +
      '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},300)})<\/script></body></html>';
    w.document.open(); w.document.write(html); w.document.close();
  }
};

Pages['riwayat'] = function (box, user) { return RiwayatDUK.render(box, user); };
