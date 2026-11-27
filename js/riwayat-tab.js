/* =========================================================
   PegRiwayat — tab "Riwayat Pangkat & KGB" pada detail pegawai
   Menampilkan status kepangkatan & gaji terkini, linimasa kenaikan pangkat,
   tabel KGB, dan proyeksi kenaikan pangkat. Admin dapat menambah/mengubah/menghapus.
   ========================================================= */
const PegRiwayat = {
  data: null,
  id: '',
  el: null,

  bisaUbah() { return Shell.user && (Shell.user.role === 'admin' || Shell.user.role === 'super_admin'); },

  async render(el) {
    const id = PegDetail.id;
    PegRiwayat.el = el; PegRiwayat.id = id; PegRiwayat.data = null;
    el.innerHTML = '<section class="card"><div class="sk" style="height:22px;width:40%;margin-bottom:16px"></div><div class="sk" style="height:110px"></div></section>' +
      '<section class="card"><div class="sk" style="height:200px"></div></section>';
    const r = await Api.post('riwayatGet', { id: id });
    if (PegDetail.id !== id || PegDetail.tab !== 'riwayat') return;
    if (!(r && r.success)) {
      if (r && r.code === 'AUTH') return;
      el.innerHTML = '<section class="card panel-center" style="margin:0;max-width:none"><span class="ch-ic t-red">' + UI.ic('wifi-off') + '</span><h2>Riwayat belum dapat dimuat</h2><p>' +
        UI.esc((r && r.message) || 'Terjadi kesalahan.') + '</p><button type="button" class="btn-secondary" id="btnCobaRw">Coba Lagi</button></section>';
      document.getElementById('btnCobaRw').addEventListener('click', function () { PegRiwayat.render(el); });
      return;
    }
    PegRiwayat.data = r.data;
    PegData.terapkanRef(r.data.ref);
    PegRiwayat.gambar();
    PegDetail.gambarSisi();                      // kolom kanan menambahkan kartu proyeksi
  },

  // ---------- Tampilan utama ----------
  gambar() {
    const d = PegRiwayat.data, el = PegRiwayat.el, admin = PegRiwayat.bisaUbah();
    if (!d.asn) {
      el.innerHTML = '<section class="card soon panel-center" style="margin:0;max-width:none"><span class="ch-ic t-gray">' + UI.ic('info') + '</span><h2>Tidak berlaku untuk status ini</h2>' +
        '<p>Riwayat pangkat dan KGB hanya dicatat untuk PNS, CPNS, dan PPPK. Status pegawai ini: <b>' + UI.esc(d.pegawai.status_kepegawaian || 'belum diisi') + '</b>.</p></section>';
      return;
    }
    let h = '';
    if (d.bisa_awal && admin) {
      h += '<div class="note note-info awal-note">' + UI.ic('info') + '<div><b>Belum ada riwayat tercatat.</b> Data pegawai saat ini memuat ' +
        (d.pegawai.golongan_ruang && d.pegawai.tmt_pangkat ? 'golongan <b>' + UI.esc(d.pegawai.golongan_ruang) + '</b> (TMT ' + UI.esc(UI.tgl(d.pegawai.tmt_pangkat)) + ')' : '') +
        (d.pegawai.tmt_kgb_terakhir ? (d.pegawai.golongan_ruang && d.pegawai.tmt_pangkat ? ' dan ' : '') + 'TMT KGB terakhir <b>' + UI.esc(UI.tgl(d.pegawai.tmt_kgb_terakhir)) + '</b>' : '') +
        '. Jadikan sebagai riwayat pertama?</div><button type="button" class="btn-secondary" id="btnRwAwal">Buat Riwayat Awal</button></div>';
    }
    h += PegRiwayat.kartuStatus();
    h += PegRiwayat.kartuPangkat(admin);
    h += PegRiwayat.kartuKgb(admin);
    el.innerHTML = h;
    PegRiwayat.ikat();
  },

  kartuStatus() {
    const d = PegRiwayat.data, pg = d.pegawai, hari = UI.hariIniISO();
    const pa = d.pangkat.filter(function (x) { return x.id === d.pangkat_aktif_id; })[0];
    const ka = d.kgb.filter(function (x) { return x.id === d.kgb_aktif_id; })[0];
    const gol = pa ? pa.golongan_ruang : pg.golongan_ruang, tmt = pa ? pa.tmt : pg.tmt_pangkat;
    const mkg = tmt ? UI.selisihTB(tmt, hari) : null;
    const mk = pg.tmt_cpns ? UI.selisihTB(pg.tmt_cpns, hari) : null;
    return '<section class="card"><div class="card-head"><div><h3>Status Kepangkatan &amp; Gaji Terkini</h3><p>Dihitung dari riwayat yang sudah berlaku</p></div><span class="ch-ic t-blue">' + UI.ic('award') + '</span></div>' +
      '<div class="tri">' +
      '<div class="tri-i"><small>Golongan Terakhir</small><b>' + UI.esc(gol ? PegData.golLabel(gol) : '—') + '</b><span>' + (tmt ? 'TMT ' + UI.esc(UI.tglPanjang(tmt)) : 'TMT belum diisi') + (pa && pa.nomor_sk ? '<br>SK ' + UI.esc(pa.nomor_sk) : '') + '</span></div>' +
      '<div class="tri-i"><small>Masa Kerja Golongan</small><b>' + UI.esc(RiwData.mkTeks(mkg)) + '</b><span>Masa kerja total ' + UI.esc(RiwData.mkTeks(mk)) + '</span></div>' +
      '<div class="tri-i tri-gold"><small>Gaji Pokok (KGB Terakhir)</small><b>' + UI.esc(ka && ka.gaji_baru ? RiwData.rp(ka.gaji_baru) : '—') + '</b><span>' +
        (ka ? 'TMT ' + UI.esc(UI.tglPanjang(ka.tmt)) + (ka.nomor_sk ? '<br>SK ' + UI.esc(ka.nomor_sk) : '') : (pg.tmt_kgb_terakhir ? 'TMT ' + UI.esc(UI.tglPanjang(pg.tmt_kgb_terakhir)) + ' (gaji belum dicatat)' : 'Belum ada riwayat KGB')) + '</span></div>' +
      '</div></section>';
  },

  kartuPangkat(admin) {
    const d = PegRiwayat.data, hari = UI.hariIniISO();
    let h = '<section class="card"><div class="card-head"><div><h3>Riwayat Kenaikan Pangkat</h3><p>' + d.pangkat.length + ' riwayat tercatat · terbaru di atas</p></div>' +
      (admin ? '<button type="button" class="btn-secondary btn-sm" id="btnTambahPangkat">' + UI.ic('plus') + 'Tambah Riwayat Pangkat</button>' : '') + '</div>';
    if (!d.pangkat.length) return h + '<div class="empty">' + UI.ic('award') + 'Belum ada riwayat kenaikan pangkat.</div></section>';
    h += '<ol class="tl">' + d.pangkat.map(function (r) {
      const aktif = r.id === d.pangkat_aktif_id, depan = r.tmt > hari;
      return '<li class="tl-i' + (aktif ? ' on' : '') + (depan ? ' next' : '') + '"><span class="tl-dot"></span><div class="tl-card">' +
        '<div class="tl-top"><div><b class="tl-t">' + UI.esc(PegData.golLabel(r.golongan_ruang)) + '</b>' +
          (aktif ? '<span class="badge b-blue">PANGKAT AKTIF SAAT INI</span>' : depan ? '<span class="badge b-gold">BERLAKU MULAI ' + UI.esc(UI.tgl(r.tmt)) + '</span>' : '') + '</div>' +
          '<div class="tl-tmt"><small>TMT</small><b>' + UI.esc(UI.tglPanjang(r.tmt)) + '</b></div></div>' +
        '<div class="tl-grid">' +
          '<div><span>Jenis</span><b>' + UI.esc(r.jenis || '—') + '</b></div>' +
          '<div><span>No. &amp; Tanggal SK</span><b>' + (r.nomor_sk ? UI.esc(r.nomor_sk) : '<i class="kosong">Belum diisi</i>') + (r.tanggal_sk ? '<small>' + UI.esc(UI.tglPanjang(r.tanggal_sk)) + '</small>' : '') + '</b></div>' +
          '<div><span>Pejabat Penetap</span><b>' + (r.pejabat_penetap ? UI.esc(r.pejabat_penetap) : '<i class="kosong">Belum diisi</i>') + '</b></div>' +
          (r.angka_kredit ? '<div><span>Angka Kredit</span><b>' + UI.esc(r.angka_kredit) + ' AK</b></div>' : '') +
        '</div>' + (r.keterangan ? '<p class="tl-ket">' + UI.esc(r.keterangan) + '</p>' : '') +
        (admin ? '<div class="tl-act"><button type="button" class="ic-btn" data-edit-pangkat="' + UI.esc(r.id) + '" aria-label="Ubah riwayat">' + UI.ic('edit') + 'Ubah</button>' +
          '<button type="button" class="ic-btn dgr" data-hapus-pangkat="' + UI.esc(r.id) + '" aria-label="Hapus riwayat">' + UI.ic('trash') + 'Hapus</button></div>' : '') +
        '</div></li>';
    }).join('') + '</ol></section>';
    return h;
  },

  kartuKgb(admin) {
    const d = PegRiwayat.data;
    let h = '<section class="card"><div class="card-head"><div><h3>Riwayat Kenaikan Gaji Berkala (KGB)</h3><p>Setiap 2 tahun sesuai ketentuan gaji pegawai negeri sipil</p></div>' +
      (admin ? '<button type="button" class="btn-secondary btn-sm" id="btnTambahKgb">' + UI.ic('plus') + 'Input SK KGB</button>' : '') + '</div>';
    if (!d.kgb.length) return h + '<div class="empty">' + UI.ic('sheet') + 'Belum ada riwayat KGB.</div></section>';
    h += '<div class="kgb-wrap"><table class="kgb-tbl"><thead><tr><th>No. SK &amp; TMT</th><th>Gaji Pokok Lama</th><th>Gaji Pokok Baru</th><th>Masa Kerja</th><th>Pejabat Penetap</th>' + (admin ? '<th></th>' : '') + '</tr></thead><tbody>' +
      d.kgb.map(function (r) {
        const aktif = r.id === d.kgb_aktif_id;
        const mk = (r.mk_tahun || r.mk_bulan) ? (r.mk_tahun || 0) + ' thn ' + (r.mk_bulan || 0) + ' bln' : '—';
        return '<tr class="' + (aktif ? 'on' : '') + '"><td data-l="No. SK & TMT"><b>' + (r.nomor_sk ? UI.esc(r.nomor_sk) : '<i class="kosong">SK belum diisi</i>') + '</b><small>TMT ' + UI.esc(UI.tglPanjang(r.tmt)) + (aktif ? ' · <span class="badge b-green">Berlaku</span>' : '') + '</small></td>' +
          '<td data-l="Gaji Lama" class="rp old">' + UI.esc(RiwData.rp(r.gaji_lama)) + '</td><td data-l="Gaji Baru" class="rp"><b>' + UI.esc(RiwData.rp(r.gaji_baru)) + '</b></td>' +
          '<td data-l="Masa Kerja">' + UI.esc(mk) + '</td><td data-l="Pejabat">' + (r.pejabat_penetap ? UI.esc(r.pejabat_penetap) : '—') + (r.tanggal_sk ? '<small>SK ' + UI.esc(UI.tgl(r.tanggal_sk)) + '</small>' : '') + '</td>' +
          (admin ? '<td class="act"><button type="button" class="ic-btn" data-edit-kgb="' + UI.esc(r.id) + '" aria-label="Ubah KGB">' + UI.ic('edit') + '</button><button type="button" class="ic-btn dgr" data-hapus-kgb="' + UI.esc(r.id) + '" aria-label="Hapus KGB">' + UI.ic('trash') + '</button></td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div></section>';
    return h;
  },

  ikat() {
    const el = PegRiwayat.el, d = PegRiwayat.data;
    const $ = function (s) { return el.querySelector(s); };
    const b1 = $('#btnTambahPangkat'); if (b1) b1.addEventListener('click', function () { PegRiwayat.formPangkat(null); });
    const b2 = $('#btnTambahKgb'); if (b2) b2.addEventListener('click', function () { PegRiwayat.formKgb(null); });
    const b3 = $('#btnRwAwal'); if (b3) b3.addEventListener('click', PegRiwayat.buatAwal);
    el.querySelectorAll('[data-edit-pangkat]').forEach(function (b) { b.addEventListener('click', function () { PegRiwayat.formPangkat(d.pangkat.filter(function (x) { return x.id === b.dataset.editPangkat; })[0]); }); });
    el.querySelectorAll('[data-edit-kgb]').forEach(function (b) { b.addEventListener('click', function () { PegRiwayat.formKgb(d.kgb.filter(function (x) { return x.id === b.dataset.editKgb; })[0]); }); });
    el.querySelectorAll('[data-hapus-pangkat]').forEach(function (b) { b.addEventListener('click', function () { PegRiwayat.hapus('pangkatHapus', b.dataset.hapusPangkat, 'riwayat kenaikan pangkat ini'); }); });
    el.querySelectorAll('[data-hapus-kgb]').forEach(function (b) { b.addEventListener('click', function () { PegRiwayat.hapus('kgbHapus', b.dataset.hapusKgb, 'riwayat KGB ini'); }); });
  },

  async buatAwal() {
    const btn = document.getElementById('btnRwAwal'); btn.disabled = true;
    const r = await Api.post('riwayatBuatAwal', { id: PegDetail.id });
    btn.disabled = false;
    if (r && r.success) { UI.toast('Riwayat awal dibuat.', 'sukses'); PegDetail.muat(); }
    else UI.toast((r && r.message) || 'Gagal membuat riwayat awal.', 'error');
  },

  async hapus(aksi, id, label) {
    const ya = await UI.konfirmasi({ judul: 'Hapus Riwayat', ya: 'Ya, Hapus', bahaya: true, teks: 'Hapus ' + label + '? Golongan/TMT pada data pegawai akan disesuaikan dengan riwayat yang tersisa. Tindakan ini dicatat pada audit log.' });
    if (!ya) return;
    const r = await Api.post(aksi, { id: id });
    if (r && r.success) { UI.toast(r.message || 'Riwayat dihapus.', 'sukses'); PegDetail.muat(); }
    else UI.toast((r && r.message) || 'Gagal menghapus.', 'error');
  },

  // ---------- Formulir ----------
  FP: [
    { k: 'golongan_ruang', label: 'Golongan / Ruang', tipe: 'select', ref: 'golongan_ruang', wajib: 1, w: 6 },
    { k: 'tmt', label: 'TMT (Terhitung Mulai Tanggal)', tipe: 'date', wajib: 1, w: 6 },
    { k: 'jenis', label: 'Jenis Kenaikan Pangkat', tipe: 'select', ref: 'jenis_kp', wajib: 1, w: 6 },
    { k: 'angka_kredit', label: 'Angka Kredit (opsional)', tipe: 'text', w: 6, ph: 'Contoh: 150 atau 150,5' },
    { k: 'nomor_sk', label: 'Nomor SK', tipe: 'text', w: 6, ph: 'Contoh: 823.4/041/BKD/2022' },
    { k: 'tanggal_sk', label: 'Tanggal SK', tipe: 'date', w: 6 },
    { k: 'pejabat_penetap', label: 'Pejabat Penetap', tipe: 'text', w: 12, ph: 'Contoh: Gubernur Banten' },
    { k: 'keterangan', label: 'Keterangan', tipe: 'textarea', w: 12 }
  ],
  FK: [
    { k: 'tmt', label: 'TMT KGB', tipe: 'date', wajib: 1, w: 6 },
    { k: 'golongan_ruang', label: 'Golongan / Ruang', tipe: 'select', ref: 'golongan_ruang', w: 6 },
    { k: 'gaji_lama', label: 'Gaji Pokok Lama (Rp)', tipe: 'rp', w: 6, ph: 'Contoh: 4935200' },
    { k: 'gaji_baru', label: 'Gaji Pokok Baru (Rp)', tipe: 'rp', wajib: 1, w: 6, ph: 'Contoh: 5120400' },
    { k: 'mk_tahun', label: 'Masa Kerja (tahun)', tipe: 'text', w: 3, ph: '0–50', hint: 'Terisi otomatis dari TMT CPNS bila kosong; sesuaikan dengan SK.' },
    { k: 'mk_bulan', label: 'Masa Kerja (bulan)', tipe: 'text', w: 3, ph: '0–11' },
    { k: 'nomor_sk', label: 'Nomor SK KGB', tipe: 'text', w: 6, ph: 'Contoh: 822.2/089/SMKN3-TU/2026' },
    { k: 'tanggal_sk', label: 'Tanggal SK', tipe: 'date', w: 6 },
    { k: 'pejabat_penetap', label: 'Pejabat Penetap', tipe: 'text', w: 6, ph: 'Contoh: Kepala SMKN 3 Tangerang' },
    { k: 'keterangan', label: 'Keterangan', tipe: 'textarea', w: 6 }
  ],

  campField(f, v) {
    const id = 'rf_' + f.k, attr = ' id="' + id + '" data-k="' + f.k + '"' + (f.ph ? ' placeholder="' + UI.esc(f.ph) + '"' : '');
    let ctl;
    if (f.tipe === 'select') {
      ctl = '<select' + attr + '><option value="">Pilih…</option>' + PegData.opsi(f.ref).map(function (o) { return '<option value="' + UI.esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + UI.esc(o[1]) + '</option>'; }).join('') + '</select>';
    } else if (f.tipe === 'textarea') ctl = '<textarea' + attr + ' rows="2" maxlength="200">' + UI.esc(v) + '</textarea>';
    else if (f.tipe === 'rp') ctl = '<input type="text" inputmode="numeric" autocomplete="off"' + attr + ' value="' + UI.esc(v) + '">';
    else ctl = '<input type="' + (f.tipe === 'date' ? 'date' : 'text') + '"' + attr + (f.tipe === 'date' ? ' min="1940-01-01" max="2100-12-31"' : ' maxlength="120" autocomplete="off"') + ' value="' + UI.esc(v) + '">';
    return '<div class="fcol c' + f.w + '"><label class="lbl" for="' + id + '">' + UI.esc(f.label) + (f.wajib ? ' <em>*</em>' : '') + '</label><div class="field ctl">' + ctl + '</div>' +
      (f.tipe === 'rp' ? '<p class="f-hint" id="rh_' + f.k + '">' + (v ? UI.esc(RiwData.rp(v)) : '') + '</p>' : '') + (f.hint ? '<p class="f-hint">' + UI.esc(f.hint) + '</p>' : '') +
      '<p class="f-err" id="err_' + f.k + '" role="alert"></p></div>';
  },

  // Dialog formulir generik
  dialog(judul, fields, nilai, aksi, payloadExtra, onTersimpan) {
    const m = UI.modal({
      title: judul, kelas: 'm-lg',
      body: '<div class="fgrid rw-form">' + fields.map(function (f) { return PegRiwayat.campField(f, nilai[f.k] || ''); }).join('') + '</div>',
      actions: [
        { label: 'Batal', kind: 'ghost' },
        { label: 'Simpan', onClick: async function (close, btn) {
            const data = {}, galat = {};
            fields.forEach(function (f) { data[f.k] = m.el.querySelector('#rf_' + f.k).value.trim(); });
            m.el.querySelectorAll('.f-err').forEach(function (p) { p.textContent = ''; });
            m.el.querySelectorAll('.ctl input, .ctl select, .ctl textarea').forEach(function (i) { i.classList.remove('err'); });
            fields.forEach(function (f) { if (f.wajib && !data[f.k]) galat[f.k] = f.tipe === 'select' ? 'Pilih ' + f.label.toLowerCase() : f.label + ' wajib diisi'; });
            const tampil = function (e) {
              Object.keys(e).forEach(function (k) { const p = m.el.querySelector('#err_' + k); if (p) p.textContent = e[k]; const i = m.el.querySelector('#rf_' + k); if (i) i.classList.add('err'); });
              const pertama = Object.keys(e)[0], el = pertama && m.el.querySelector('#rf_' + pertama); if (el) el.focus();
            };
            if (Object.keys(galat).length) return tampil(galat);
            btn.disabled = true; btn.textContent = 'Menyimpan…';
            const r = await Api.post(aksi, Object.assign({ data: data }, payloadExtra));
            btn.disabled = false; btn.textContent = 'Simpan';
            if (r && r.success) {
              close();
              UI.toast(r.message || 'Tersimpan.', 'sukses');
              if (r.data && r.data.peringatan && r.data.peringatan.length) setTimeout(function () { UI.toast(r.data.peringatan[0]); }, 3200);
              onTersimpan();
            } else if (r && r.errors) { tampil(r.errors); UI.toast(r.message || 'Periksa isian.', 'error'); }
            else UI.toast((r && r.message) || 'Gagal menyimpan.', 'error');
        } }
      ]
    });
    // pratinjau format rupiah
    m.el.querySelectorAll('input[inputmode="numeric"]').forEach(function (i) {
      i.addEventListener('input', function () { const h = m.el.querySelector('#rh_' + i.dataset.k); if (h) h.textContent = i.value ? RiwData.rp(i.value) : ''; });
    });
    return m;
  },

  formPangkat(e) {
    const d = PegRiwayat.data, pg = d.pegawai;
    const baru = !e;
    const nilai = e ? Object.assign({}, e) : { golongan_ruang: RiwData.golBerikut(pg.golongan_ruang) || '', jenis: 'Kenaikan Pangkat Reguler' };
    PegRiwayat.dialog(baru ? 'Tambah Riwayat Pangkat' : 'Ubah Riwayat Pangkat', PegRiwayat.FP, nilai, 'pangkatSimpan',
      { id_pegawai: PegDetail.id, id: e ? e.id : '' }, function () { PegDetail.muat(); });
  },

  formKgb(e) {
    const d = PegRiwayat.data, pg = d.pegawai;
    const nilai = e ? Object.assign({}, e) : { golongan_ruang: pg.golongan_ruang || '', gaji_lama: d.gaji_terakhir || '' };
    const m = PegRiwayat.dialog(e ? 'Ubah Riwayat KGB' : 'Input SK KGB', PegRiwayat.FK, nilai, 'kgbSimpan',
      { id_pegawai: PegDetail.id, id: e ? e.id : '' }, function () { PegDetail.muat(); });
    // Saran masa kerja dari TMT CPNS bila kolom masih kosong
    const tmt = m.el.querySelector('#rf_tmt');
    tmt.addEventListener('change', function () {
      const th = m.el.querySelector('#rf_mk_tahun'), bl = m.el.querySelector('#rf_mk_bulan');
      if (!pg.tmt_cpns || !tmt.value || th.value || bl.value) return;
      const s = UI.selisihTB(pg.tmt_cpns, tmt.value);
      if (s && s.totalBulan >= 0) { th.value = s.th; bl.value = s.bl; }
    });
  },

  // ---------- Kolom kanan: proyeksi kenaikan pangkat ----------
  sisiHTML() {
    if (!PegRiwayat.data || PegRiwayat.id !== PegDetail.id) return '';
    const d = PegRiwayat.data, pg = d.pegawai, hari = UI.hariIniISO();
    const pns = pg.status_kepegawaian === 'PNS' || pg.status_kepegawaian === 'CPNS';
    let isi;
    if (!d.asn || !pns) {
      isi = '<p class="soon-note">Kenaikan pangkat reguler berlaku untuk PNS/CPNS. Status pegawai ini: <b>' + UI.esc(pg.status_kepegawaian || '—') + '</b>.</p>';
    } else {
      const pa = d.pangkat.filter(function (x) { return x.id === d.pangkat_aktif_id; })[0];
      const gol = pa ? pa.golongan_ruang : pg.golongan_ruang, tmt = pa ? pa.tmt : pg.tmt_pangkat;
      const next = gol ? RiwData.golBerikut(gol) : null;
      if (!gol) isi = '<p class="soon-note">Golongan belum diisi. Lengkapi data atau tambahkan riwayat pangkat.</p>';
      else if (!next) isi = '<p class="soon-note">Golongan <b>' + UI.esc(gol) + '</b> adalah pangkat tertinggi pada jalur PNS.</p>';
      else {
        const due = tmt ? UI.tambahTahun(tmt, 4) : '';
        const bulan = tmt ? UI.selisihTB(tmt, hari) : null;
        const pct = bulan ? Math.max(0, Math.min(100, Math.round(bulan.totalBulan / 48 * 100))) : 0;
        const ak = d.pangkat.filter(function (x) { return x.angka_kredit; })[0];
        isi = '<div class="proy"><small>TARGET GOLONGAN BERIKUTNYA</small><b>' + UI.esc(PegData.golLabel(next)) + '</b>' +
          '<span>' + (due ? 'Periode pengajuan: <b>' + UI.esc(UI.tglPanjang(RiwData.periodeKP(due))) + '</b> (siklus 4 tahunan)' : 'TMT pangkat belum diisi') + '</span></div>' +
          (tmt ? '<div class="proy-bar"><div class="proy-top"><span>Masa di pangkat saat ini</span><b>' + UI.esc(RiwData.mkTeks(bulan)) + ' / 4 thn</b></div><div class="kel-track lg"><span style="width:' + pct + '%;background:' + (pct >= 100 ? '#1E9E5A' : '#0B4F9E') + '"></span></div></div>' : '') +
          (ak ? '<div class="proy-ak"><span>Angka kredit terakhir tercatat</span><b>' + UI.esc(ak.angka_kredit) + ' AK</b></div>' : '') +
          '<p class="fine">Syarat lain (SKP 2 tahun terakhir, angka kredit/PAK, ijazah, dan kelengkapan berkas) akan diperiksa pada modul Usulan KGB &amp; Pangkat.</p>';
      }
    }
    return '<section class="card"><div class="card-head"><div><h3>Proyeksi Kenaikan Pangkat</h3><p>Perkiraan berdasarkan TMT pangkat terkini</p></div><span class="ch-ic t-green">' + UI.ic('trend') + '</span></div>' + isi + '</section>';
  }
};
