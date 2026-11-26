/* =========================================================
   Halaman: Detail Profil Pegawai  (#/data-pegawai/<id>)
   ========================================================= */
const PegDetail = {
  id: '',
  cur: null,          // { p, kel, kurang, punya_akun }
  tab: 'identitas',
  tampilNik: false,
  box: null,

  async render(box, user, id) {
    PegDetail.box = box;
    PegDetail.id = id;
    PegDetail.tab = 'identitas';
    PegDetail.tampilNik = false;
    PegDetail.cur = null;
    box.innerHTML = PegDetail.skeleton();
    PegData.siapkanRef();
    await PegDetail.muat();
  },

  skeleton() {
    return '<div class="sk" style="height:20px;width:260px;margin-bottom:16px"></div><div class="sk" style="height:200px;border-radius:16px"></div>' +
      '<div class="sk" style="height:50px;margin-top:20px"></div><div class="grid cols"><div class="card"><div class="sk" style="height:300px"></div></div><div class="card"><div class="sk" style="height:300px"></div></div></div>';
  },

  async muat() {
    const id = PegDetail.id;
    const r = await Api.post('pegawaiGet', { id: id });
    if (Shell.rute !== 'data-pegawai' || Shell.param !== id) return;
    if (r && r.success) {
      PegData.terapkanRef(r.data.ref, r.data.bup);
      PegDetail.cur = r.data;
      PegDetail.gambar();
      PegDetail.muatFoto();
      return;
    }
    if (r && r.code === 'AUTH') return;
    const hilang = r && r.code === 'NOT_FOUND';
    PegDetail.box.innerHTML =
      '<div class="card panel-center"><span class="ch-ic ' + (hilang ? 't-gold' : 't-red') + '">' + UI.ic(hilang ? 'search' : 'wifi-off') + '</span>' +
      '<h2>' + (hilang ? 'Data pegawai tidak ditemukan' : 'Data belum dapat dimuat') + '</h2><p>' + UI.esc((r && r.message) || 'Terjadi kesalahan.') + '</p>' +
      '<a class="btn-secondary" href="#/data-pegawai">Kembali ke Daftar</a></div>';
  },

  async muatFoto() {
    const id = PegDetail.id;
    if (!PegDetail.cur || !PegDetail.cur.pegawai.foto) return;
    const uri = await PegData.foto(id);
    if (PegDetail.id !== id) return;
    PegDetail.pasangFoto(uri);
  },

  pasangFoto(uri) {
    const el = document.getElementById('pegFoto');
    if (!el) return;
    if (uri) el.innerHTML = '<img src="' + UI.esc(uri) + '" alt="Foto ' + UI.esc(PegDetail.cur.pegawai.nama) + '">' + el.querySelector('.foto-btn').outerHTML;
    PegDetail.ikatFoto();
  },

  ikatFoto() {
    const btn = document.querySelector('#pegFoto .foto-btn');
    if (!btn) return;
    btn.addEventListener('click', function () { document.getElementById('fotoInput').click(); });
  },

  // ---------- Kerangka ----------
  gambar() {
    const c = PegDetail.cur, p = c.pegawai, box = PegDetail.box;
    const nama = PegData.namaLengkap(p);
    const tak = p.status_aktif !== 'aktif';
    const st = PegData.statusAktifInfo(p.status_aktif);
    const SA = Shell.user.role === 'super_admin';
    const kel = c.kel;

    let h = '<div class="back-row"><a class="back" href="#/data-pegawai">' + UI.ic('back') + 'Kembali ke Data Guru &amp; Tendik</a>' +
      '<span class="crumb">Data Master › Data Guru &amp; Tendik › <b>' + UI.esc(p.nama) + '</b></span></div>';

    if (tak) {
      h += '<div class="note note-warn status-note" role="status">' + UI.ic('alert') + '<div><b>Pegawai berstatus ' + UI.esc(st[0]) + '</b>' +
        (p.tanggal_nonaktif ? ' sejak ' + UI.esc(UI.tglPanjang(p.tanggal_nonaktif)) : '') + (p.alasan_nonaktif ? '. Alasan: ' + UI.esc(p.alasan_nonaktif) : '') +
        '. Data ini tidak dihitung pada dashboard.</div><button type="button" class="chip-btn" id="btnAktifkan">Aktifkan Kembali</button></div>';
    }

    // Header
    h += '<section class="prof-head"><div class="ph-foto"><div class="foto-box" id="pegFoto"><span class="foto-ini" style="' + PegData.avatar(p.nama) + '">' + UI.esc(UI.inisial(p.nama)) + '</span>' +
      '<button type="button" class="foto-btn" aria-label="Ganti foto">' + UI.ic('camera') + '</button></div>' +
      '<input type="file" id="fotoInput" accept="image/jpeg,image/png" hidden><span class="foto-st ' + (tak ? 'off' : '') + '">' + UI.esc(st[0].toUpperCase()) + '</span></div>' +
      '<div class="ph-main"><div class="ph-chips"><span class="chip">' + UI.esc(p.status_kepegawaian || '—') + '</span><span class="chip">' + UI.esc(PegData.ptkLabel(p.jenis_ptk)) + '</span></div>' +
      '<h1>' + UI.esc(nama) + '</h1>' +
      '<div class="ph-ids">' +
        (p.nip ? '<span><i>NIP</i><b class="mono">' + UI.esc(UI.nip(p.nip)) + '</b></span>' : '') +
        (p.nuptk ? '<span><i>NUPTK</i><b class="mono">' + UI.esc(p.nuptk) + '</b></span>' : '') +
        '<span><i>NIK</i><b class="mono" id="nikTampil">' + UI.esc(PegDetail.nikTeks(p.nik)) + '</b><button type="button" class="mini-eye" id="btnNik" aria-label="Tampilkan NIK" aria-pressed="false">' + UI.ic('eye') + '</button></span></div>' +
      '<div class="ph-chips b2">' + (p.jabatan ? '<span class="chip chip-w">' + UI.ic('briefcase') + UI.esc(p.jabatan) + '</span>' : '') +
        (p.golongan_ruang ? '<span class="chip chip-gold">' + UI.ic('award') + UI.esc(PegData.golLabel(p.golongan_ruang)) + '</span>' : '') +
        (p.mapel_utama ? '<span class="chip chip-w">' + UI.ic('grad') + UI.esc(p.mapel_utama) + '</span>' : '') + '</div></div>' +
      '<div class="ph-side"><div class="ring-box">' + PegDetail.cincin(kel, 64) + '<div><small>KELENGKAPAN DATA</small><b>' + UI.esc(PegData.labelKel(kel)) + '</b></div></div>' +
      '<div class="ph-act"><button type="button" class="btn-white" id="btnEdit">' + UI.ic('edit') + 'Edit Data</button>' +
      '<button type="button" class="btn-glass" id="btnStatus">' + UI.ic('power') + 'Ubah Status</button>' +
      (SA ? '<button type="button" class="btn-glass danger" id="btnHapus">' + UI.ic('trash') + 'Hapus</button>' : '') + '</div></div></section>';

    // Tab
    const tabs = [['identitas', 'Identitas & Biodata', 'user'], ['kepegawaian', 'Kepegawaian & Jabatan', 'briefcase'], ['riwayat', 'Riwayat Pangkat & KGB', 'award'], ['dokumen', 'Dokumen & Arsip', 'folder']];
    h += '<nav class="ptabs" role="tablist" aria-label="Bagian profil">' + tabs.map(function (t) {
      const soon = t[0] === 'riwayat' || t[0] === 'dokumen';
      return '<button type="button" role="tab" class="ptab' + (PegDetail.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '" aria-selected="' + (PegDetail.tab === t[0]) + '">' + UI.ic(t[2]) + t[1] + (soon ? '<em>segera</em>' : '') + '</button>';
    }).join('') + '</nav>';

    h += '<div class="grid cols detail-cols"><div class="stack" id="tabIsi"></div><div class="stack" id="sisiDetail"></div></div>';
    box.innerHTML = h;
    PegDetail.gambarTab();
    PegDetail.gambarSisi();
    PegDetail.ikat();
    PegDetail.ikatFoto();
  },

  nikTeks(n) {
    if (!n) return '—';
    return PegDetail.tampilNik ? n : n.substring(0, 4) + '••••••••' + n.slice(-3);
  },

  // gelap=true → untuk latar putih; default → untuk latar biru tua
  cincin(n, ukuran, gelap) {
    const r = 26, k = 2 * Math.PI * r, off = k * (1 - n / 100);
    const warna = gelap ? (n >= 80 ? '#1E9E5A' : n >= 60 ? '#E8A317' : '#D64545') : (n >= 80 ? '#5BE49B' : n >= 60 ? '#F7CE4A' : '#FF9C9C');
    return '<svg class="cincin" width="' + ukuran + '" height="' + ukuran + '" viewBox="0 0 64 64" role="img" aria-label="Kelengkapan ' + n + ' persen">' +
      '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + (gelap ? '#E8EEF5' : 'rgba(255,255,255,.22)') + '" stroke-width="6"/>' +
      '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + warna + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + k.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 32 32)"/>' +
      '<text x="32" y="37" text-anchor="middle" font-size="15" font-weight="700" fill="' + (gelap ? '#1F2A37' : '#fff') + '" font-family="Poppins,sans-serif">' + n + '%</text></svg>';
  },

  // ---------- Konten tab ----------
  kv(label, nilai, opt) {
    opt = opt || {};
    const kosong = nilai === undefined || nilai === null || String(nilai).trim() === '';
    return '<div class="kvi' + (opt.lebar ? ' w2' : '') + '"><span>' + label + '</span>' +
      (kosong ? '<b class="kosong">Belum diisi</b>' : '<b' + (opt.mono ? ' class="mono"' : '') + '>' + (opt.html ? nilai : UI.esc(nilai)) + '</b>') +
      (opt.catatan ? '<small>' + opt.catatan + '</small>' : '') + '</div>';
  },

  kartu(judul, sub, ikon, tint, isi) {
    return '<section class="card"><div class="card-head"><div><h3>' + judul + '</h3>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><span class="ch-ic ' + tint + '">' + UI.ic(ikon) + '</span></div>' + isi + '</section>';
  },

  gambarTab() {
    const p = PegDetail.cur.pegawai, kv = PegDetail.kv, el = document.getElementById('tabIsi');
    let h = '';
    if (PegDetail.tab === 'identitas') {
      const usia = UI.selisihTB(p.tanggal_lahir, UI.hariIniISO());
      h += PegDetail.kartu('Biodata &amp; Informasi Pribadi', 'Data identitas pribadi pegawai', 'idcard', 't-blue',
        '<div class="kvg">' +
        kv('Tempat, Tanggal Lahir', [p.tempat_lahir, p.tanggal_lahir ? UI.tglPanjang(p.tanggal_lahir) : ''].filter(Boolean).join(', '), { catatan: usia ? 'Usia ' + usia.th + ' tahun' : '' }) +
        kv('Jenis Kelamin', p.jenis_kelamin) + kv('Agama', p.agama) + kv('Status Perkawinan', p.status_perkawinan) +
        kv('NIK', p.nik ? PegDetail.nikTeks(p.nik) : '', { mono: true }) + kv('NUPTK', p.nuptk, { mono: true }) + kv('NIP', p.nip ? UI.nip(p.nip) : '', { mono: true }) + '</div>');
      const alamat = [p.alamat, p.kelurahan && 'Kel. ' + p.kelurahan, p.kecamatan && 'Kec. ' + p.kecamatan, p.kota, p.kode_pos].filter(Boolean).join(', ');
      h += PegDetail.kartu('Alamat &amp; Kontak', 'Domisili dan saluran komunikasi', 'home', 't-green',
        '<div class="kvg">' + kv('Alamat Domisili', alamat, { lebar: true }) +
        kv('No. HP', p.no_hp ? '<a href="tel:' + UI.esc(p.no_hp) + '">' + UI.esc(p.no_hp) + '</a> · <a href="https://wa.me/62' + UI.esc(p.no_hp.replace(/^0/, '')) + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' : '', { html: true, mono: true }) +
        kv('Email', p.email ? '<a href="mailto:' + UI.esc(p.email) + '">' + UI.esc(p.email) + '</a>' : '', { html: true }) + '</div>');
      h += PegDetail.kartu('Rekening, Pajak &amp; Jaminan', 'Dipakai untuk administrasi gaji dan tunjangan', 'shield', 't-gold',
        '<div class="kvg">' + kv('Bank', p.bank) + kv('No. Rekening', p.no_rekening, { mono: true }) + kv('NPWP', PegDetail.npwp(p.npwp), { mono: true }) +
        kv('BPJS Kesehatan', p.no_bpjs_kes, { mono: true }) + kv('BPJS Ketenagakerjaan', p.no_bpjs_tk, { mono: true }) + '</div>');
    } else if (PegDetail.tab === 'kepegawaian') {
      const mk = p.tmt_cpns ? UI.selisihTB(p.tmt_cpns, UI.hariIniISO()) : null;
      h += '<section class="card"><div class="card-head"><div><h3>Status Kepegawaian &amp; Jabatan</h3><p>Riwayat penugasan dan beban kerja</p></div><span class="ch-ic t-blue">' + UI.ic('briefcase') + '</span></div>' +
        '<div class="tri"><div class="tri-i"><small>TMT CPNS / Mulai Bekerja</small><b>' + UI.esc(p.tmt_cpns ? UI.tglPanjang(p.tmt_cpns) : '—') + '</b><span>' + (mk ? 'Masa kerja ' + mk.th + ' thn ' + mk.bl + ' bln' : 'Belum diisi') + '</span></div>' +
        '<div class="tri-i"><small>Golongan / Pangkat</small><b>' + UI.esc(p.golongan_ruang ? PegData.golLabel(p.golongan_ruang) : '—') + '</b><span>' + (p.tmt_pangkat ? 'TMT ' + UI.esc(UI.tgl(p.tmt_pangkat)) : 'TMT pangkat belum diisi') + '</span></div>' +
        '<div class="tri-i"><small>Beban Mengajar</small><b>' + (p.beban_jam ? UI.esc(p.beban_jam) + ' Jam' : '—') + '</b><span>per minggu</span></div></div>' +
        '<div class="kvg">' + kv('Status Kepegawaian', p.status_kepegawaian) + kv('Jenis PTK', PegData.ptkLabel(p.jenis_ptk)) + kv('Jabatan', p.jabatan, { lebar: true }) +
        kv('Unit Kerja', p.unit_kerja) + kv('Mata Pelajaran Utama', p.mapel_utama) + kv('Tugas Tambahan', p.tugas_tambahan, { lebar: true }) +
        kv('TMT PNS', p.tmt_pns ? UI.tglPanjang(p.tmt_pns) : '') + kv('TMT KGB Terakhir', p.tmt_kgb_terakhir ? UI.tglPanjang(p.tmt_kgb_terakhir) : '') +
        kv('No. Karpeg', p.no_karpeg, { mono: true }) + kv('No. Karis/Karsu', p.no_karis_karsu, { mono: true }) + '</div></section>';
      h += PegDetail.kartu('Pendidikan Terakhir', 'Riwayat pendidikan lengkap tersedia pada modul berikutnya', 'grad', 't-green',
        '<div class="kvg">' + kv('Jenjang', p.pendidikan_terakhir) + kv('Tahun Lulus', p.tahun_lulus) + kv('Jurusan / Program Studi', p.jurusan) + kv('Institusi', p.institusi) + '</div>');
    } else {
      const j = PegDetail.tab === 'riwayat' ? ['Riwayat Pangkat & KGB', 'award', 'Riwayat kenaikan pangkat, kenaikan gaji berkala, dan SK terkait akan tersedia pada modul Riwayat Kepangkatan & DUK.'] :
        ['Dokumen & Arsip', 'folder', 'Unggah dan verifikasi SK CPNS/PNS, ijazah, KTP, dan berkas lain akan tersedia pada modul Dokumen & Arsip Digital.'];
      h += '<section class="card soon panel-center" style="margin:0;max-width:none"><span class="ch-ic t-gold">' + UI.ic(j[1]) + '</span><h2>' + j[0] + '</h2><p>' + j[2] + '</p><span class="soon-tag">SEGERA</span></section>';
    }
    el.innerHTML = h;
  },

  npwp(n) {
    n = String(n || '').replace(/\D/g, '');
    if (n.length === 15) return n.slice(0, 2) + '.' + n.slice(2, 5) + '.' + n.slice(5, 8) + '.' + n.slice(8, 9) + '-' + n.slice(9, 12) + '.' + n.slice(12);
    return n;
  },

  // ---------- Kolom kanan ----------
  gambarSisi() {
    const c = PegDetail.cur, p = c.pegawai, el = document.getElementById('sisiDetail');
    const kel = c.kel;
    let h = '<section class="card"><div class="card-head"><div><h3>Kelengkapan Data</h3><p>Berdasarkan kolom wajib administrasi</p></div>' +
      '<span class="kel-big" style="color:' + PegData.warnaKel(kel) + '">' + kel + '%</span></div>' +
      '<div class="kel-track lg"><span style="width:' + kel + '%;background:' + PegData.warnaKel(kel) + '"></span></div>';
    if (c.kurang.length) {
      h += '<p class="kurang-t">Belum diisi (' + c.kurang.length + '):</p><div class="kurang">' + c.kurang.map(function (k) { return '<span>' + UI.esc(PegData.LABEL[k] || k) + '</span>'; }).join('') + '</div>' +
        '<button type="button" class="btn-ghost" id="btnLengkapi" style="margin-top:14px;height:42px">' + UI.ic('edit') + 'Lengkapi Data</button>';
    } else h += '<p class="soon-note" style="margin-top:12px">Semua kolom wajib sudah terisi. Terima kasih.</p>';
    h += '</section>';

    const k = PegData.karier(p);
    h += '<section class="card"><div class="card-head"><div><h3>Pengingat Karier &amp; Pensiun</h3><p>Perkiraan otomatis dari data TMT</p></div><span class="ch-ic t-gold">' + UI.ic('alarm') + '</span></div>';
    const blok = function (judul, tgl, dasar, kosongTeks) {
      if (!tgl) return '<div class="rem"><small>' + judul + '</small><b class="kosong">' + kosongTeks + '</b></div>';
      const sw = PegData.sisaWaktu(tgl);
      return '<div class="rem n-' + (sw ? sw.nada : 'biru') + '"><small>' + judul + '</small><b>' + UI.esc(UI.tglPanjang(tgl)) + '</b>' +
        (sw ? '<span class="badge ' + (sw.nada === 'merah' ? 'b-red' : sw.nada === 'emas' ? 'b-gold' : 'b-blue') + '">' + UI.esc(sw.teks) + '</span>' : '') +
        '<em>Dasar: ' + UI.esc(dasar) + '</em></div>';
    };
    if (k.pns) {
      h += blok('Kenaikan Gaji Berkala (KGB)', k.kgb && k.kgb.tanggal, k.kgb ? k.kgb.dasar : '', 'TMT KGB / CPNS belum diisi');
      h += blok('Kenaikan Pangkat Reguler', k.pangkat && k.pangkat.tanggal, k.pangkat ? k.pangkat.dasar : '', 'TMT pangkat belum diisi');
    } else {
      h += '<p class="soon-note">KGB dan kenaikan pangkat reguler berlaku untuk PNS/CPNS. Status pegawai ini: <b>' + UI.esc(p.status_kepegawaian || '—') + '</b>.</p>';
    }
    h += k.pensiun ? blok('Batas Usia Pensiun (BUP ' + k.pensiun.bup + ' th)', k.pensiun.batas, 'tanggal lahir · perkiraan TMT pensiun ' + UI.tgl(k.pensiun.tmt), '') : blok('Batas Usia Pensiun', '', '', 'Tanggal lahir belum diisi');
    h += '<p class="fine">Perkiraan ini bukan keputusan resmi; BUP guru dan tendik dapat diatur di Pengaturan Sekolah.</p></section>';

    h += PegDetail.kartu('Informasi Data', '', 'info', 't-gray',
      '<div class="kvg one">' + PegDetail.kv('Status data', PegData.statusAktifInfo(p.status_aktif)[0]) +
      PegDetail.kv('Akun login', c.punya_akun ? 'Sudah memiliki akun' : 'Belum memiliki akun') +
      PegDetail.kv('Dibuat', p.dibuat ? UI.waktu(p.dibuat) : '') + PegDetail.kv('Terakhir diubah', p.diubah ? UI.waktu(p.diubah) : '') + '</div>');
    el.innerHTML = h;
    const bl = document.getElementById('btnLengkapi');
    if (bl) bl.addEventListener('click', PegDetail.edit);
  },

  // ---------- Aksi ----------
  ikat() {
    const $ = UI.$;
    document.querySelectorAll('.ptab').forEach(function (b) {
      b.addEventListener('click', function () {
        PegDetail.tab = b.dataset.tab;
        document.querySelectorAll('.ptab').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); });
        PegDetail.gambarTab();
      });
    });
    $('btnEdit').addEventListener('click', PegDetail.edit);
    $('btnStatus').addEventListener('click', function () { PegDetail.ubahStatus(); });
    const aktif = $('btnAktifkan'); if (aktif) aktif.addEventListener('click', function () { PegDetail.ubahStatus('aktif'); });
    const hapus = $('btnHapus'); if (hapus) hapus.addEventListener('click', PegDetail.hapus);
    $('btnNik').addEventListener('click', function () {
      PegDetail.tampilNik = !PegDetail.tampilNik;
      this.setAttribute('aria-pressed', String(PegDetail.tampilNik));
      this.querySelector('use').setAttribute('href', PegDetail.tampilNik ? '#i-eye-off' : '#i-eye');
      $('nikTampil').textContent = PegDetail.nikTeks(PegDetail.cur.pegawai.nik);
      if (PegDetail.tab === 'identitas') PegDetail.gambarTab();
    });
    $('fotoInput').addEventListener('change', function () { const f = this.files[0]; this.value = ''; if (f) PegDetail.gantiFoto(f); });
  },

  edit() {
    PegForm.buka(PegDetail.cur.pegawai, function (ringkas) {
      PegList.setelahSimpan(ringkas, false);
      PegDetail.muat();
    });
  },

  async gantiFoto(file) {
    let uri;
    try { uri = await PegData.siapkanFoto(file); } catch (e) { return UI.toast(e.message, 'error'); }
    const id = PegDetail.id, lama = PegData._foto[id];
    PegDetail.pasangFoto(uri);                                      // optimistik
    const r = await Api.post('fotoUnggah', { id: id, dataUri: uri });
    if (r && r.success) {
      PegData.setFoto(id, uri); PegDetail.cur.pegawai.foto = true;
      const li = PegList.data.find(function (x) { return x.id === id; }); if (li) li.foto = true;
      UI.toast('Foto pegawai disimpan.', 'sukses');
    } else {
      PegDetail.pasangFoto(lama || '');
      if (!lama) PegDetail.gambar();
      UI.toast((r && r.message) || 'Gagal menyimpan foto.', 'error');
    }
  },

  ubahStatus(awal) {
    const p = PegDetail.cur.pegawai, sekarang = p.status_aktif || 'aktif';
    const opsi = [['aktif', 'Aktif'], ['nonaktif', 'Nonaktif'], ['pensiun', 'Pensiun'], ['mutasi keluar', 'Mutasi Keluar']].filter(function (o) { return o[0] !== sekarang; });
    const m = UI.modal({
      title: 'Ubah Status Pegawai',
      body:
        '<p><b>' + UI.esc(PegData.namaLengkap(p)) + '</b><br><span class="muted">Status saat ini: ' + UI.esc(PegData.statusAktifInfo(sekarang)[0]) + '</span></p>' +
        '<div id="stAlert" class="note note-danger" role="alert" hidden>' + UI.ic('alert') + '<div id="stAlertText"></div></div>' +
        '<label class="lbl" for="stBaru">Status baru</label><div class="field"><select id="stBaru" class="plain-select">' + opsi.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></div>' +
        '<div id="stAlasanWrap"><label class="lbl" for="stAlasan">Alasan / keterangan <em>*</em></label><div class="field"><textarea id="stAlasan" rows="3" maxlength="200" placeholder="Contoh: Memasuki batas usia pensiun, pindah tugas ke SMKN 1…"></textarea></div></div>' +
        '<div class="note note-info" id="stInfo" style="margin-top:14px">' + UI.ic('info') + '<div>Pegawai yang dinonaktifkan tidak dihitung pada dashboard, dan <b>akun login miliknya otomatis dinonaktifkan</b>.</div></div>',
      actions: [
        { label: 'Batal', kind: 'ghost' },
        { label: 'Simpan Status', onClick: async function (close, btn) {
            const st = UI.$('stBaru').value, alasan = UI.$('stAlasan').value.trim();
            const err = function (t) { UI.$('stAlertText').textContent = t; UI.$('stAlert').hidden = false; };
            UI.$('stAlert').hidden = true;
            if (st !== 'aktif' && !alasan) return err('Alasan perubahan status wajib diisi.');
            btn.disabled = true; btn.textContent = 'Menyimpan…';
            const r = await Api.post('pegawaiStatus', { id: p.id, status: st, alasan: alasan });
            btn.disabled = false; btn.textContent = 'Simpan Status';
            if (r && r.success) {
              close();
              let pesan = 'Status pegawai diubah menjadi ' + PegData.statusAktifInfo(st)[0] + '.';
              if (r.data.akun_dinonaktifkan) pesan += ' ' + r.data.akun_dinonaktifkan + ' akun login dinonaktifkan.';
              if (r.data.akun_perlu_diaktifkan) pesan += ' Akun login perlu diaktifkan manual oleh Super Admin.';
              UI.toast(pesan, 'sukses');
              const li = PegList.data.find(function (x) { return x.id === p.id; }); if (li) li.status_aktif = st;
              Session.cacheSet(PegList.KEY, { daftar: PegList.data, ref: PegData.ref, bup: PegData.bup });
              PegDetail.muat();
            } else err((r && r.message) || 'Gagal mengubah status.');
        } }
      ]
    });
    const sel = m.el.querySelector('#stBaru');
    const sync = function () { const a = sel.value === 'aktif'; m.el.querySelector('#stAlasanWrap').hidden = a; m.el.querySelector('#stInfo').hidden = a; };
    sel.addEventListener('change', sync);
    if (awal) sel.value = awal;
    sync();
  },

  async hapus() {
    const p = PegDetail.cur.pegawai;
    const ya = await UI.konfirmasi({
      judul: 'Hapus Data Pegawai', ya: 'Ya, Hapus', bahaya: true,
      teks: 'Hapus data "' + PegData.namaLengkap(p) + '"? Data akan dikeluarkan dari daftar dan akun login terkait dinonaktifkan. Tindakan ini dicatat pada audit log.'
    });
    if (!ya) return;
    const btn = UI.$('btnHapus'); btn.disabled = true;
    const r = await Api.post('pegawaiHapus', { id: p.id, konfirmasi: true });
    btn.disabled = false;
    if (r && r.success) {
      PegList.data = PegList.data.filter(function (x) { return x.id !== p.id; });
      Session.cacheSet(PegList.KEY, { daftar: PegList.data, ref: PegData.ref, bup: PegData.bup });
      UI.toast('Data pegawai dihapus.', 'sukses');
      location.hash = '#/data-pegawai';
    } else UI.toast((r && r.message) || 'Gagal menghapus.', 'error');
  }
};
