/* =========================================================
   PegForm — formulir tambah / ubah pegawai (4 langkah)
   1 Data Diri & NIK · 2 Kepegawaian · 3 Pendidikan, Tugas & Kontak · 4 Tinjau & Simpan
   Validasi di sini hanya untuk kenyamanan; server memvalidasi ulang.
   ========================================================= */
const PegForm = {
  K_DRAF: 'draf_peg',
  d: {},
  id: '',
  langkah: 0,
  galat: {},
  fotoBaru: '',
  fotoLama: '',
  adaFoto: false,
  dirty: false,
  onSaved: null,
  el: null,
  prevFokus: null,
  _tmrDraf: null,
  _escHandler: null,
  menyimpan: false,

  // ---------- Definisi bidang ----------
  // w = lebar kolom (12 kolom). bila = fungsi: bidang hanya tampil bila true.
  STEPS: [
    { judul: 'Data Diri & NIK', bagian: [
      { judul: 'Identitas Pribadi & Dokumen Kependudukan', ikon: 'idcard', fields: [
        { k: 'gelar_depan', w: 3, ph: 'Contoh: Dra., Dr., Drs.' },
        { k: 'nama', w: 6, wajib: 1, ph: 'Nama sesuai KTP, tanpa gelar' },
        { k: 'gelar_belakang', w: 3, ph: 'Contoh: M.Pd, S.Kom' },
        { k: 'nip', w: 4, angka: 18, ph: '18 digit (PNS / PPPK)', hint: 'Wajib untuk PNS, CPNS, dan PPPK.' },
        { k: 'nuptk', w: 4, angka: 16, ph: '16 digit (jika ada)' },
        { k: 'nik', w: 4, angka: 16, wajib: 1, ph: '16 digit sesuai KTP' },
        { k: 'tempat_lahir', w: 4, ph: 'Kota/kabupaten kelahiran' },
        { k: 'tanggal_lahir', w: 4, tipe: 'date', wajib: 1 },
        { k: 'jenis_kelamin', w: 4, tipe: 'radio', wajib: 1, opsi: [['Laki-laki', 'Laki-laki'], ['Perempuan', 'Perempuan']] },
        { k: 'agama', w: 4, tipe: 'select', ref: 'agama' },
        { k: 'status_perkawinan', w: 4, tipe: 'select', ref: 'status_perkawinan' }
      ] }
    ] },
    { judul: 'Kepegawaian', bagian: [
      { judul: 'Status Kepegawaian & Penugasan', ikon: 'briefcase', fields: [
        { k: 'status_kepegawaian', w: 4, tipe: 'select', ref: 'status_kepegawaian', wajib: 1 },
        { k: 'jenis_ptk', w: 4, tipe: 'select', ref: 'jenis_ptk', wajib: 1 },
        { k: 'golongan_ruang', w: 4, tipe: 'select', ref: 'golongan_ruang', bila: function (d) { return PegData.isASN(d.status_kepegawaian); }, hint: 'PNS: I/a – IV/e · PPPK: golongan V – XVII.' },
        { k: 'jabatan', w: 6, ph: 'Contoh: Guru Mata Pelajaran, Kepala Tata Usaha' },
        { k: 'unit_kerja', w: 6, ph: 'Unit kerja / penugasan' },
        { k: 'tmt_cpns', w: 4, tipe: 'date', label: 'TMT CPNS / Mulai Bekerja' },
        { k: 'tmt_pns', w: 4, tipe: 'date', bila: function (d) { return d.status_kepegawaian === 'PNS' || d.status_kepegawaian === 'CPNS'; } },
        { k: 'tmt_pangkat', w: 4, tipe: 'date', bila: function (d) { return d.status_kepegawaian === 'PNS' || d.status_kepegawaian === 'CPNS'; } },
        { k: 'tmt_kgb_terakhir', w: 4, tipe: 'date', bila: function (d) { return d.status_kepegawaian === 'PNS' || d.status_kepegawaian === 'CPNS'; }, hint: 'Dipakai untuk pengingat KGB berikutnya (+2 tahun).' },
        { k: 'no_karpeg', w: 4, bila: function (d) { return d.status_kepegawaian === 'PNS' || d.status_kepegawaian === 'CPNS'; } },
        { k: 'no_karis_karsu', w: 4, bila: function (d) { return d.status_kepegawaian === 'PNS' || d.status_kepegawaian === 'CPNS'; } }
      ] }
    ] },
    { judul: 'Pendidikan, Tugas & Kontak', bagian: [
      { judul: 'Pendidikan Terakhir', ikon: 'grad', fields: [
        { k: 'pendidikan_terakhir', w: 3, tipe: 'select', ref: 'pendidikan_terakhir', label: 'Jenjang' },
        { k: 'jurusan', w: 4, ph: 'Program studi / jurusan' },
        { k: 'institusi', w: 3, ph: 'Nama kampus / sekolah' },
        { k: 'tahun_lulus', w: 2, angka: 4, ph: 'TTTT' }
      ] },
      { judul: 'Tugas Mengajar', ikon: 'clipboard', fields: [
        { k: 'mapel_utama', w: 5, ph: 'Mata pelajaran / bidang keahlian' },
        { k: 'tugas_tambahan', w: 5, ph: 'Contoh: Wakil Kepala Sekolah Bidang Kurikulum' },
        { k: 'beban_jam', w: 2, angka: 2, ph: 'Jam/mgg' }
      ] },
      { judul: 'Alamat & Kontak', ikon: 'home', fields: [
        { k: 'alamat', w: 12, tipe: 'textarea', ph: 'Jalan, nomor, RT/RW' },
        { k: 'kelurahan', w: 3 }, { k: 'kecamatan', w: 3 }, { k: 'kota', w: 3 }, { k: 'kode_pos', w: 3, angka: 5 },
        { k: 'no_hp', w: 6, tipe: 'tel', ph: '08xxxxxxxxxx' },
        { k: 'email', w: 6, tipe: 'email', ph: 'nama@email.com' }
      ] },
      { judul: 'Rekening, Pajak & Jaminan Sosial', ikon: 'shield', fields: [
        { k: 'bank', w: 3, ph: 'Contoh: BJB, BRI' }, { k: 'no_rekening', w: 3, angka: 24 }, { k: 'npwp', w: 3, angka: 16, ph: '15–16 digit' },
        { k: 'no_bpjs_kes', w: 3, angka: 16 }, { k: 'no_bpjs_tk', w: 3, angka: 16 }
      ] }
    ] },
    { judul: 'Tinjau & Simpan', bagian: [] }
  ],

  semuaField() {
    const a = [];
    PegForm.STEPS.forEach(function (s, i) { s.bagian.forEach(function (b) { b.fields.forEach(function (f) { a.push({ f: f, langkah: i }); }); }); });
    return a;
  },
  cariField(k) { return PegForm.semuaField().filter(function (x) { return x.f.k === k; })[0]; },
  labelField(f) { return f.label || PegData.LABEL[f.k] || f.k; },

  // ---------- Buka / tutup ----------
  buka(pegawai, onSaved) {
    if (!PegData.siapkanRef()) { UI.toast('Data referensi belum dimuat. Tunggu sebentar lalu coba lagi.', 'error'); return; }
    PegForm.onSaved = onSaved;
    PegForm.id = pegawai ? pegawai.id : '';
    PegForm.langkah = 0; PegForm.galat = {}; PegForm.fotoBaru = ''; PegForm.fotoLama = ''; PegForm.dirty = false; PegForm.menyimpan = false;
    PegForm.adaFoto = !!(pegawai && pegawai.foto);
    PegForm.d = {};
    PegForm.semuaField().forEach(function (x) { PegForm.d[x.f.k] = pegawai ? String(pegawai[x.f.k] || '') : ''; });
    if (!pegawai) PegForm.d.unit_kerja = 'SMKN 3 Tangerang';
    PegForm.draf = !pegawai ? Session.cacheGet(PegForm.K_DRAF) : null;

    PegForm.prevFokus = document.activeElement;
    const bg = document.createElement('div');
    bg.className = 'modal-bg form-bg';
    bg.innerHTML = '<div class="modal m-xl form-modal" role="dialog" aria-modal="true" aria-labelledby="pfJudul"></div>';
    UI.$('modalRoot').appendChild(bg);
    PegForm.el = bg;
    document.body.classList.add('no-scroll');

    PegForm._escHandler = function (e) { if (e.key === 'Escape' && !document.querySelector('.modal-bg:not(.form-bg)')) PegForm.mintaTutup(); };
    document.addEventListener('keydown', PegForm._escHandler);
    PegForm.gambar();
    if (pegawai && PegForm.adaFoto) PegData.foto(pegawai.id).then(function (u) { if (PegForm.el && u) { PegForm.fotoLama = u; PegForm.pasangFotoPreview(); } });
  },

  async mintaTutup() {
    if (PegForm.menyimpan) return;
    if (PegForm.dirty) {
      const ya = await UI.konfirmasi({
        judul: 'Tutup Formulir?', ya: 'Ya, Tutup', tidak: 'Lanjut Mengisi',
        teks: PegForm.id ? 'Perubahan yang belum disimpan akan hilang.' : 'Isian akan tersimpan otomatis sebagai draf pada perangkat ini, sehingga dapat dilanjutkan nanti.'
      });
      if (!ya) return;
    }
    PegForm.tutup();
  },

  tutup() {
    clearTimeout(PegForm._tmrDraf);
    document.removeEventListener('keydown', PegForm._escHandler);
    document.body.classList.remove('no-scroll');
    if (PegForm.el) PegForm.el.remove();
    PegForm.el = null;
    if (PegForm.prevFokus && PegForm.prevFokus.focus) PegForm.prevFokus.focus();
  },

  // ---------- Kerangka modal ----------
  gambar() {
    const box = PegForm.el.querySelector('.modal');
    const baru = !PegForm.id;
    const n = PegForm.STEPS.length;
    const st = PegForm.langkah;

    let h = '<div class="pf-head"><span class="pf-ic">' + UI.ic(baru ? 'plus' : 'edit') + '</span><div class="pf-ht"><h3 id="pfJudul">' + (baru ? 'Tambah Data Pegawai Baru' : 'Edit Data Pegawai') +
      '</h3><p>' + (baru ? 'Lengkapi data induk pegawai sesuai standar BKN / Dapodik.' : UI.esc(PegData.namaLengkap(PegForm.d))) + '</p></div>' +
      '<button type="button" class="modal-x" id="pfX" aria-label="Tutup formulir">' + UI.ic('x') + '</button></div>';

    h += '<ol class="stepper" aria-label="Langkah pengisian">' + PegForm.STEPS.map(function (s, i) {
      const cls = i < st ? 'done' : i === st ? 'on' : '';
      return '<li class="' + cls + '"' + (i === st ? ' aria-current="step"' : '') + '><span class="sn">' + (i < st ? UI.ic('tick') : (i + 1)) + '</span><span class="sl"><small>LANGKAH ' + (i + 1) + '</small>' + s.judul + '</span></li>';
    }).join('') + '</ol>';

    h += '<div class="pf-body" id="pfBody"></div>';

    h += '<div class="pf-foot"><div class="pf-fl"><button type="button" class="link-plain" id="pfBatal">Batal / Keluar</button>' +
      (baru ? '<span class="draft-info" id="draftInfo" role="status"></span>' : '') + '</div><div class="pf-fr">' +
      '<button type="button" class="chip-btn" id="pfKembali"' + (st === 0 ? ' disabled' : '') + '>' + UI.ic('back') + 'Kembali</button>' +
      (baru ? '<button type="button" class="chip-btn" id="pfDraf">Simpan Draf</button>' : '') +
      (st < n - 1
        ? '<button type="button" class="btn-secondary" id="pfLanjut">Lanjutkan ke ' + UI.esc(PegForm.STEPS[st + 1].judul) + UI.ic('arrow') + '</button>'
        : '<button type="button" class="btn-secondary btn-save" id="pfSimpan"><span class="bl">' + (baru ? 'Simpan Pegawai' : 'Simpan Perubahan') + '</span>' + UI.ic('check') + '<span class="btn-spin" aria-hidden="true"></span></button>') +
      '</div></div>';
    box.innerHTML = h;

    PegForm.gambarBody();
    PegForm.ikatTetap();
    PegForm.infoDraf();
  },

  gambarBody() {
    const body = document.getElementById('pfBody');
    const st = PegForm.langkah;
    let h = '';
    if (st === 0) h += PegForm.fotoHTML() + PegForm.drafBanner();
    if (st < 3) {
      PegForm.STEPS[st].bagian.forEach(function (b) {
        h += '<section class="pf-sec"><h4>' + UI.ic(b.ikon) + b.judul + '</h4><div class="fgrid">' +
          b.fields.filter(function (f) { return !f.bila || f.bila(PegForm.d); }).map(PegForm.fieldHTML).join('') + '</div></section>';
      });
    } else h += PegForm.ringkasanHTML();
    body.innerHTML = h;
    body.scrollTop = 0;
    PegForm.tampilkanGalat();
    if (st === 0) PegForm.pasangFotoPreview();
  },

  fotoHTML() {
    return '<section class="pf-foto"><div class="pf-fbox" id="pfFbox"><span>' + UI.ic('camera') + '<small>Pasfoto 3×4</small></span></div><div class="pf-ftxt">' +
      '<div class="pf-ftop"><h4>Foto Resmi Pegawai</h4><small>JPG / PNG</small></div>' +
      '<p>Gunakan pasfoto formal berlatar polos agar dapat dipakai untuk kartu pegawai digital. Foto dipotong otomatis ke rasio 3:4 dan dikecilkan.</p>' +
      '<div class="pf-fact"><button type="button" class="chip-btn" id="pfPilihFoto">' + UI.ic('upload') + 'Pilih Foto</button>' +
      '<button type="button" class="link-plain" id="pfHapusFoto" hidden>Batalkan foto baru</button>' +
      '<span class="pf-tag">Min. 200×260 px</span><span class="pf-tag">Rasio 3:4</span></div>' +
      '<input type="file" id="pfFile" accept="image/jpeg,image/png" hidden></div></section>';
  },

  pasangFotoPreview() {
    const box = document.getElementById('pfFbox'); if (!box) return;
    const uri = PegForm.fotoBaru || PegForm.fotoLama;
    if (uri) box.innerHTML = '<img src="' + UI.esc(uri) + '" alt="Pratinjau foto">';
    const h = document.getElementById('pfHapusFoto'); if (h) h.hidden = !PegForm.fotoBaru;
  },

  drafBanner() {
    const dr = PegForm.draf;
    if (PegForm.id || !dr || !dr.d) return '';
    return '<div class="note note-info pf-draf" id="pfDrafBanner">' + UI.ic('info') + '<div>Ada <b>draf tersimpan</b> (' + UI.esc(UI.relatif(dr.waktu)) + ')' + (dr.d.nama ? ' atas nama <b>' + UI.esc(dr.d.nama) + '</b>' : '') + '. ' +
      '<button type="button" class="link" id="pfPakaiDraf">Lanjutkan draf</button> · <button type="button" class="link" id="pfBuangDraf">Mulai dari kosong</button></div></div>';
  },

  // ---------- Bidang ----------
  fieldHTML(f) {
    const k = f.k, id = 'pf_' + k, v = PegForm.d[k] || '', lab = PegForm.labelField(f);
    let ctl;
    const attr = ' id="' + id + '" data-k="' + k + '"' + (f.ph ? ' placeholder="' + UI.esc(f.ph) + '"' : '');
    if (f.tipe === 'select') {
      const opsi = PegData.opsi(f.ref);
      ctl = '<select' + attr + '><option value="">Pilih…</option>' + opsi.map(function (o) { return '<option value="' + UI.esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + UI.esc(o[1]) + '</option>'; }).join('') + '</select>';
    } else if (f.tipe === 'radio') {
      ctl = '<div class="radios" role="radiogroup" aria-label="' + UI.esc(lab) + '">' + f.opsi.map(function (o, i) {
        return '<label class="rd' + (v === o[0] ? ' on' : '') + '"><input type="radio" name="pf_' + k + '" data-k="' + k + '" value="' + UI.esc(o[0]) + '"' + (v === o[0] ? ' checked' : '') + '><span>' + UI.esc(o[1]) + '</span></label>';
      }).join('') + '</div>';
    } else if (f.tipe === 'textarea') {
      ctl = '<textarea' + attr + ' rows="2" maxlength="200">' + UI.esc(v) + '</textarea>';
    } else {
      const tipe = f.tipe || 'text';
      const extra = (f.angka ? ' inputmode="numeric" maxlength="' + (f.angka + 6) + '" autocomplete="off"' : '') + (tipe === 'date' ? ' min="1940-01-01" max="' + (k === 'tanggal_lahir' ? UI.hariIniISO() : '2100-12-31') + '"' : '') +
        (tipe === 'tel' ? ' inputmode="tel" autocomplete="off"' : '') + (tipe === 'email' ? ' autocomplete="off" inputmode="email"' : '') + (!f.angka && tipe === 'text' ? ' maxlength="' + (k === 'nama' ? 100 : 100) + '" autocomplete="off"' : '');
      ctl = '<input type="' + tipe + '"' + attr + extra + ' value="' + UI.esc(v) + '">';
    }
    return '<div class="fcol c' + f.w + '" data-f="' + k + '"><label class="lbl" for="' + id + '">' + UI.esc(lab) + (f.wajib ? ' <em>*</em>' : '') + '</label>' +
      '<div class="field ctl' + (f.tipe === 'radio' ? ' norm' : '') + '">' + ctl + '</div>' +
      (f.hint ? '<p class="f-hint">' + UI.esc(f.hint) + '</p>' : '') + '<p class="f-err" id="err_' + k + '" role="alert"></p></div>';
  },

  // ---------- Langkah 4: ringkasan ----------
  ringkasanHTML() {
    const d = PegForm.d;
    const adaFoto = !!(PegForm.fotoBaru || PegForm.adaFoto);
    const kel = PegData.kelengkapan(d, adaFoto);
    const baris = function (judul, pairs) {
      return '<section class="pf-sec"><h4>' + judul + '</h4><div class="kvg">' + pairs.map(function (p) {
        const kosong = !String(p[1] || '').trim();
        return '<div class="kvi"><span>' + p[0] + '</span>' + (kosong ? '<b class="kosong">Belum diisi</b>' : '<b>' + UI.esc(p[1]) + '</b>') + '</div>';
      }).join('') + '</div></section>';
    };
    let h = '<div class="sum-top"><div class="sum-ring">' + PegDetail.cincin(kel.skor, 72, true) + '</div><div><h4>Tinjau data sebelum disimpan</h4>' +
      '<p>Kelengkapan saat ini <b>' + kel.skor + '%</b> (' + UI.esc(PegData.labelKel(kel.skor)) + '). Kolom yang masih kosong dapat dilengkapi kapan saja melalui menu <i>Edit Data</i>.</p></div></div>';
    if (kel.kurang.length) h += '<div class="kurang pf-kurang">' + kel.kurang.map(function (k) { return '<span>' + UI.esc(PegData.LABEL[k] || k) + '</span>'; }).join('') + '</div>';
    h += baris('Data Diri', [['Nama', PegData.namaLengkap(d)], ['NIP', d.nip ? UI.nip(d.nip) : ''], ['NUPTK', d.nuptk], ['NIK', d.nik], ['Tempat, Tgl Lahir', [d.tempat_lahir, d.tanggal_lahir ? UI.tglPanjang(d.tanggal_lahir) : ''].filter(Boolean).join(', ')], ['Jenis Kelamin', d.jenis_kelamin], ['Agama', d.agama], ['Foto', adaFoto ? (PegForm.fotoBaru ? 'Foto baru dipilih' : 'Sudah ada') : '']]);
    h += baris('Kepegawaian', [['Status', d.status_kepegawaian], ['Jenis PTK', PegData.ptkLabel(d.jenis_ptk)], ['Golongan', d.golongan_ruang ? PegData.golLabel(d.golongan_ruang) : ''], ['Jabatan', d.jabatan], ['Unit Kerja', d.unit_kerja], ['TMT CPNS', d.tmt_cpns ? UI.tgl(d.tmt_cpns) : '']]);
    h += baris('Pendidikan, Tugas & Kontak', [['Pendidikan', [d.pendidikan_terakhir, d.jurusan].filter(Boolean).join(' · ')], ['Mapel Utama', d.mapel_utama], ['Alamat', d.alamat], ['No. HP', d.no_hp], ['Email', d.email], ['Rekening', [d.bank, d.no_rekening].filter(Boolean).join(' · ')]]);
    h += '<div class="note note-info">' + UI.ic('info') + '<div>Dokumen pendukung (SK, ijazah, KTP) akan diunggah melalui modul <b>Dokumen &amp; Arsip Digital</b> pada langkah berikutnya.</div></div>';
    return h;
  },

  // ---------- Validasi klien ----------
  validasiLangkah(st) {
    const d = PegForm.d, e = {};
    const f2 = PegForm.semuaField().filter(function (x) { return x.langkah === st; });
    const kosong = function (k) { return !String(d[k] || '').trim(); };
    f2.forEach(function (x) {
      const f = x.f; if (f.bila && !f.bila(d)) return;
      if (f.wajib && kosong(f.k)) e[f.k] = f.tipe === 'select' || f.tipe === 'radio' ? 'Pilih ' + PegForm.labelField(f).toLowerCase() : PegForm.labelField(f).replace(/\(.*\)/, '').trim() + ' wajib diisi';
    });
    const ada = function (k) { return f2.some(function (x) { return x.f.k === k && (!x.f.bila || x.f.bila(d)); }); };
    const angka = function (k, n, pesan) { if (ada(k) && d[k] && !e[k] && !new RegExp('^\\d{' + n + '}$').test(d[k])) e[k] = pesan; };
    const asn = /^(PNS|CPNS|PPPK)$/.test(d.status_kepegawaian);
    if (ada('nik') && !e.nik) angka('nik', 16, 'NIK harus 16 digit angka');
    if (ada('nip')) { angka('nip', 18, 'NIP harus 18 digit angka'); }
    if (ada('nuptk')) angka('nuptk', 16, 'NUPTK harus 16 digit angka');
    if (ada('kode_pos')) angka('kode_pos', 5, 'Kode pos harus 5 digit');
    if (ada('tahun_lulus') && d.tahun_lulus && (+d.tahun_lulus < 1960 || +d.tahun_lulus > new Date().getFullYear() + 1)) e.tahun_lulus = 'Tahun lulus tidak valid';
    if (ada('npwp') && d.npwp && !/^\d{15,16}$/.test(d.npwp)) e.npwp = 'NPWP harus 15 atau 16 digit';
    if (ada('tanggal_lahir') && d.tanggal_lahir && !e.tanggal_lahir) {
      const u = UI.selisihTB(d.tanggal_lahir, UI.hariIniISO());
      if (!u || u.th < 17 || u.th > 80) e.tanggal_lahir = 'Tanggal lahir tidak masuk akal (usia 17–80 tahun)';
    }
    if (ada('email') && d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'Format email tidak valid';
    if (ada('no_hp') && d.no_hp) { const h = d.no_hp.replace(/[^\d+]/g, ''); if (!/^(\+62|62|0)?8\d{8,12}$/.test(h) && !/^0\d{8,13}$/.test(h)) e.no_hp = 'No. HP tidak valid (contoh 081234567890)'; }
    if (ada('beban_jam') && d.beban_jam && +d.beban_jam > 60) e.beban_jam = 'Maksimal 60 jam per minggu';
    ['tmt_cpns', 'tmt_pns', 'tmt_pangkat', 'tmt_kgb_terakhir'].forEach(function (k) {
      if (ada(k) && d[k] && d.tanggal_lahir && d[k] < d.tanggal_lahir && !e[k]) e[k] = 'Tidak boleh sebelum tanggal lahir';
    });
    if (ada('nip') && asn && !d.nip && !e.nip) e.nip = 'NIP wajib untuk PNS/CPNS/PPPK';
    return e;
  },

  // NIP wajib bergantung pada status (langkah 2) → periksa lintas langkah di langkah 1 saat simpan
  validasiSemua() {
    const e = {};
    for (let i = 0; i < 3; i++) Object.assign(e, PegForm.validasiLangkah(i));
    if (/^(PNS|CPNS|PPPK)$/.test(PegForm.d.status_kepegawaian) && !PegForm.d.nip && !e.nip) e.nip = 'NIP wajib untuk PNS/CPNS/PPPK';
    return e;
  },

  tampilkanGalat() {
    document.querySelectorAll('#pfBody .f-err').forEach(function (p) { p.textContent = ''; });
    document.querySelectorAll('#pfBody .ctl input, #pfBody .ctl select, #pfBody .ctl textarea').forEach(function (i) { i.classList.remove('err'); });
    Object.keys(PegForm.galat).forEach(function (k) {
      const p = document.getElementById('err_' + k); if (!p) return;
      p.textContent = PegForm.galat[k];
      const i = document.getElementById('pf_' + k); if (i) i.classList.add('err');
    });
  },

  fokusGalatPertama() {
    const k = Object.keys(PegForm.galat).filter(function (x) { return document.getElementById('err_' + x); })[0];
    if (!k) return;
    const el = document.getElementById('pf_' + k) || document.querySelector('[data-f="' + k + '"] input');
    if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(function () { el.focus({ preventScroll: true }); }, 250); }
  },

  // ---------- Navigasi langkah ----------
  lanjut() {
    const e = PegForm.validasiLangkah(PegForm.langkah);
    PegForm.galat = e;
    if (Object.keys(e).length) { PegForm.tampilkanGalat(); PegForm.fokusGalatPertama(); UI.toast('Periksa isian yang ditandai merah.', 'error'); return; }
    PegForm.langkah++;
    PegForm.gambar();
  },
  kembali() { if (PegForm.langkah > 0) { PegForm.langkah--; PegForm.galat = {}; PegForm.gambar(); } },

  // ---------- Pengikatan event ----------
  ikatTetap() {
    const $ = function (id) { return document.getElementById(id); };
    $('pfX').addEventListener('click', PegForm.mintaTutup);
    $('pfBatal').addEventListener('click', PegForm.mintaTutup);
    $('pfKembali').addEventListener('click', PegForm.kembali);
    if ($('pfLanjut')) $('pfLanjut').addEventListener('click', PegForm.lanjut);
    if ($('pfSimpan')) $('pfSimpan').addEventListener('click', PegForm.simpan);
    if ($('pfDraf')) $('pfDraf').addEventListener('click', function () { PegForm.simpanDraf(true); });

    const body = $('pfBody');
    body.addEventListener('input', function (e) {
      const k = e.target.dataset && e.target.dataset.k;
      if (!k) return;
      PegForm.d[k] = e.target.value;
      PegForm.dirty = true;
      if (PegForm.galat[k]) { delete PegForm.galat[k]; const p = document.getElementById('err_' + k); if (p) p.textContent = ''; e.target.classList.remove('err'); }
      PegForm.jadwalDraf();
    });
    body.addEventListener('change', function (e) {
      const k = e.target.dataset && e.target.dataset.k;
      if (!k) return;
      const f = PegForm.cariField(k);
      // Bersihkan isian angka (hapus spasi/titik/tanda hubung)
      if (f && f.f.angka && e.target.type === 'text') { PegForm.d[k] = e.target.value.replace(/\D/g, ''); e.target.value = PegForm.d[k]; }
      if (f && f.f.tipe === 'radio') {
        PegForm.d[k] = e.target.value;
        e.target.closest('.radios').querySelectorAll('.rd').forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); });
        PegForm.dirty = true; if (PegForm.galat[k]) { delete PegForm.galat[k]; PegForm.tampilkanGalat(); }
        PegForm.jadwalDraf();
      }
      if (k === 'status_kepegawaian') { PegForm.gambarBody(); const el = document.getElementById('pf_status_kepegawaian'); if (el) el.focus({ preventScroll: true }); }
    });
    body.addEventListener('click', function (e) {
      if (e.target.closest('#pfPilihFoto') || e.target.closest('#pfFbox')) return $('pfFile').click();
      if (e.target.closest('#pfHapusFoto')) { PegForm.fotoBaru = ''; PegForm.pasangFotoPreview(); const b = $('pfFbox'); if (b && !PegForm.fotoLama) b.innerHTML = '<span>' + UI.ic('camera') + '<small>Pasfoto 3×4</small></span>'; return; }
      if (e.target.closest('#pfPakaiDraf')) { Object.assign(PegForm.d, PegForm.draf.d); PegForm.draf = null; PegForm.dirty = true; PegForm.gambarBody(); return UI.toast('Draf dimuat.', 'sukses'); }
      if (e.target.closest('#pfBuangDraf')) { Session.cacheSet(PegForm.K_DRAF, null); PegForm.draf = null; const bn = $('pfDrafBanner'); if (bn) bn.remove(); PegForm.infoDraf(); }
    });
    body.addEventListener('change', async function (e) {
      if (e.target.id !== 'pfFile') return;
      const file = e.target.files[0]; e.target.value = '';
      if (!file) return;
      try { PegForm.fotoBaru = await PegData.siapkanFoto(file); PegForm.dirty = true; PegForm.pasangFotoPreview(); }
      catch (err) { UI.toast(err.message, 'error'); }
    });
    body.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'radio' && e.target.type !== 'file') {
        e.preventDefault();
        if (PegForm.langkah < 3) PegForm.lanjut();
      }
    });
  },

  // ---------- Draf otomatis (hanya untuk pegawai baru) ----------
  jadwalDraf() {
    if (PegForm.id) return;
    clearTimeout(PegForm._tmrDraf);
    PegForm._tmrDraf = setTimeout(function () { PegForm.simpanDraf(false); }, 800);
  },
  simpanDraf(manual) {
    if (PegForm.id || !PegForm.el) return;
    const isi = Object.keys(PegForm.d).some(function (k) { return k !== 'unit_kerja' && String(PegForm.d[k] || '').trim(); });
    if (!isi) { if (manual) UI.toast('Belum ada isian untuk disimpan.'); return; }
    Session.cacheSet(PegForm.K_DRAF, { d: PegForm.d, waktu: nowLokal() });
    PegForm.infoDraf();
    if (manual) UI.toast('Draf disimpan di perangkat ini.', 'sukses');
  },
  infoDraf() {
    const el = document.getElementById('draftInfo'); if (!el) return;
    const dr = Session.cacheGet(PegForm.K_DRAF);
    el.innerHTML = dr && dr.waktu ? '<i></i>Draf tersimpan ' + UI.esc(UI.relatif(dr.waktu)) : '';
  },

  // ---------- Simpan ----------
  async simpan() {
    if (PegForm.menyimpan) return;
    const e = PegForm.validasiSemua();
    if (Object.keys(e).length) {
      PegForm.galat = e;
      const awal = Math.min.apply(null, Object.keys(e).map(function (k) { const x = PegForm.cariField(k); return x ? x.langkah : 0; }));
      PegForm.langkah = awal; PegForm.gambar(); PegForm.fokusGalatPertama();
      return UI.toast('Masih ada isian yang perlu diperbaiki.', 'error');
    }
    PegForm.menyimpan = true;
    const btn = document.getElementById('pfSimpan');
    btn.disabled = true; btn.classList.add('loading');

    const r = await Api.post('pegawaiSimpan', { id: PegForm.id, data: PegForm.d });
    if (!(r && r.success)) {
      PegForm.menyimpan = false; btn.disabled = false; btn.classList.remove('loading');
      if (r && r.errors) {
        PegForm.galat = r.errors;
        const awal = Math.min.apply(null, Object.keys(r.errors).map(function (k) { const x = PegForm.cariField(k); return x ? x.langkah : 0; }));
        PegForm.langkah = awal; PegForm.gambar(); PegForm.fokusGalatPertama();
        return UI.toast(r.message || 'Periksa kembali isian yang ditandai.', 'error');
      }
      return UI.toast((r && r.message) || 'Gagal menyimpan data pegawai.', 'error');
    }

    const hasil = r.data;
    let catatan = '';
    if (PegForm.fotoBaru) {
      const rf = await Api.post('fotoUnggah', { id: hasil.id, dataUri: PegForm.fotoBaru });
      if (rf && rf.success) { PegData.setFoto(hasil.id, PegForm.fotoBaru); hasil.pegawai.foto = true; }
      else catatan = ' Namun foto gagal diunggah: ' + ((rf && rf.message) || 'coba lagi dari halaman detail') + '.';
    }
    if (!PegForm.id) Session.cacheSet(PegForm.K_DRAF, null);
    PegForm.dirty = false; PegForm.menyimpan = false;
    const cb = PegForm.onSaved, nama = hasil.pegawai.nama, baru = hasil.baru;
    PegForm.tutup();
    UI.toast((baru ? 'Pegawai "' + nama + '" ditambahkan.' : 'Data "' + nama + '" diperbarui.') + catatan, catatan ? 'error' : 'sukses');
    if (hasil.peringatan && hasil.peringatan.length) setTimeout(function () { UI.toast(hasil.peringatan[0]); }, 3200);
    if (cb) cb(hasil.pegawai, baru);
  }
};

// Waktu lokal WIB format "yyyy-MM-ddTHH:mm:ss" (sama dengan format server)
function nowLokal() {
  const p = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
  return p.replace(' ', 'T');
}
