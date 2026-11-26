/* =========================================================
   PegIO — Ekspor nominatif & Impor Excel data pegawai
   Pustaka SheetJS dimuat saat dibutuhkan (js/vendor/xlsx.full.min.js).
   Alur impor: unduh template → isi → pilih berkas → PERIKSA DULU (tanpa menyimpan)
               → tinjau masalah → impor bertahap (100 baris per permintaan).
   ========================================================= */
const PegIO = {
  _lib: null,

  // Kolom template (urutan = urutan kolom Excel)
  KOLOM: ['nip', 'nuptk', 'nik', 'nama', 'gelar_depan', 'gelar_belakang', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'agama',
    'status_perkawinan', 'status_kepegawaian', 'jenis_ptk', 'jabatan', 'golongan_ruang', 'tmt_cpns', 'tmt_pns', 'tmt_pangkat',
    'tmt_kgb_terakhir', 'mapel_utama', 'unit_kerja', 'alamat', 'kelurahan', 'kecamatan', 'kota', 'kode_pos', 'no_hp', 'email',
    'no_rekening', 'bank', 'npwp', 'no_bpjs_kes', 'no_bpjs_tk', 'no_karpeg', 'no_karis_karsu', 'pendidikan_terakhir', 'jurusan',
    'institusi', 'tahun_lulus', 'tugas_tambahan', 'beban_jam'],

  CONTOH: {
    nip: '198501012010012001', nuptk: '', nik: '3671014101850002', nama: 'CONTOH - HAPUS BARIS INI', gelar_depan: '', gelar_belakang: 'S.Pd',
    tempat_lahir: 'Tangerang', tanggal_lahir: '1985-01-01', jenis_kelamin: 'Perempuan', agama: 'Islam', status_perkawinan: 'Kawin',
    status_kepegawaian: 'PNS', jenis_ptk: 'Guru', jabatan: 'Guru Mata Pelajaran', golongan_ruang: 'III/c', tmt_cpns: '2010-01-01',
    tmt_pns: '2011-03-01', tmt_pangkat: '2022-04-01', tmt_kgb_terakhir: '2024-04-01', mapel_utama: 'Bahasa Indonesia', unit_kerja: 'SMKN 3 Tangerang',
    alamat: 'Jl. Contoh No. 1', kelurahan: 'Sukasari', kecamatan: 'Tangerang', kota: 'Kota Tangerang', kode_pos: '15118', no_hp: '081234567890',
    email: 'contoh@email.com', no_rekening: '1234567890', bank: 'BJB', npwp: '123456789012345', no_bpjs_kes: '', no_bpjs_tk: '',
    no_karpeg: '', no_karis_karsu: '', pendidikan_terakhir: 'S1', jurusan: 'Pendidikan Bahasa Indonesia', institusi: 'Universitas Contoh',
    tahun_lulus: '2008', tugas_tambahan: '', beban_jam: '24'
  },

  // Nama kolom alternatif yang dikenali saat impor (huruf kecil, tanpa tanda baca)
  ALIAS: {
    namalengkap: 'nama', namatanpagelar: 'nama', namalengkaptanpagelar: 'nama', tmtkgb: 'tmt_kgb_terakhir', tmtkgbterakhir: 'tmt_kgb_terakhir',
    golongan: 'golongan_ruang', golonganruang: 'golongan_ruang', pangkatgolongan: 'golongan_ruang', mapel: 'mapel_utama', matapelajaranutama: 'mapel_utama',
    unit: 'unit_kerja', unitkerja: 'unit_kerja', hp: 'no_hp', nohp: 'no_hp', telepon: 'no_hp', notelepon: 'no_hp', rekening: 'no_rekening', norekening: 'no_rekening',
    nobpjskesehatan: 'no_bpjs_kes', bpjskesehatan: 'no_bpjs_kes', nobpjskes: 'no_bpjs_kes', nobpjsketenagakerjaan: 'no_bpjs_tk', bpjsketenagakerjaan: 'no_bpjs_tk', nobpjstk: 'no_bpjs_tk',
    nokarpeg: 'no_karpeg', nokarisakarsu: 'no_karis_karsu', nokarsukaris: 'no_karis_karsu', nokaris: 'no_karis_karsu', nokariskarsu: 'no_karis_karsu',
    kotakabupaten: 'kota', jenjang: 'pendidikan_terakhir', jurusanprogramstudi: 'jurusan', kampus: 'institusi', bebanjam: 'beban_jam', bebanjamminggu: 'beban_jam',
    tanggallahir: 'tanggal_lahir', jeniskelamin: 'jenis_kelamin', statusperkawinan: 'status_perkawinan', statuskepegawaian: 'status_kepegawaian', jenisptk: 'jenis_ptk',
    tmtcpns: 'tmt_cpns', tmtcpnsmulaibekerja: 'tmt_cpns', tmtpns: 'tmt_pns', tmtpangkat: 'tmt_pangkat', tmtpangkatterakhir: 'tmt_pangkat', pendidikanterakhir: 'pendidikan_terakhir',
    gelardepan: 'gelar_depan', gelarbelakang: 'gelar_belakang', tempatlahir: 'tempat_lahir', kodepos: 'kode_pos', tahunlulus: 'tahun_lulus', tugastambahan: 'tugas_tambahan'
  },

  norm(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]/g, ''); },

  // ---------- Pustaka Excel ----------
  muatLib() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (PegIO._lib) return PegIO._lib;
    PegIO._lib = new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = './js/vendor/xlsx.full.min.js';
      s.onload = function () { resolve(window.XLSX); };
      s.onerror = function () { PegIO._lib = null; reject(new Error('Pustaka Excel gagal dimuat. Periksa koneksi internet lalu coba lagi.')); };
      document.head.appendChild(s);
    });
    return PegIO._lib;
  },

  // ---------- EKSPOR ----------
  async ekspor(ids) {
    if (!ids || !ids.length) return UI.toast('Tidak ada data untuk diekspor. Periksa filter Anda.', 'error');
    UI.toast('Menyiapkan berkas Excel…');
    let X;
    try { X = await PegIO.muatLib(); } catch (e) { return UI.toast(e.message, 'error'); }
    const r = await Api.post('pegawaiEkspor', { ids: ids });
    if (!(r && r.success)) return UI.toast((r && r.message) || 'Gagal mengambil data.', 'error');

    const kolom = r.data.kolom;
    const label = function (k) { return k === 'status_aktif' ? 'Status Data' : (PegData.LABEL[k] || k); };
    const aoa = [kolom.map(label)];
    r.data.baris.forEach(function (b) {
      aoa.push(kolom.map(function (k) { return k === 'jenis_ptk' ? PegData.ptkLabel(b[k]) : String(b[k] || ''); }));
    });
    const ws = X.utils.aoa_to_sheet(aoa);
    ws['!cols'] = kolom.map(function (k, i) {
      let w = String(aoa[0][i]).length;
      for (let j = 1; j < Math.min(aoa.length, 60); j++) w = Math.max(w, String(aoa[j][i]).length);
      return { wch: Math.min(Math.max(w + 2, 10), 42) };
    });
    ws['!autofilter'] = { ref: X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: kolom.length - 1 } }) };
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, 'Nominatif');
    const info = X.utils.aoa_to_sheet([['Nominatif Pegawai SMKN 3 Tangerang'], ['Dibuat', UI.hariIniISO()], ['Jumlah pegawai', String(r.data.baris.length)], ['Dokumen ini berisi data pribadi. Jaga kerahasiaannya.']]);
    X.utils.book_append_sheet(wb, info, 'Info');
    const out = X.write(wb, { bookType: 'xlsx', type: 'array' });
    UI.unduh(out, 'Nominatif_Pegawai_' + UI.hariIniISO() + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    UI.toast(r.data.baris.length + ' pegawai diekspor ke Excel.', 'sukses');
  },

  // ---------- TEMPLATE ----------
  async template() {
    let X;
    try { X = await PegIO.muatLib(); } catch (e) { return UI.toast(e.message, 'error'); }
    const ws = {};
    const sel = function (r, c) { return X.utils.encode_cell({ r: r, c: c }); };
    PegIO.KOLOM.forEach(function (k, c) {
      ws[sel(0, c)] = { t: 's', v: PegData.LABEL[k] || k };
      ws[sel(1, c)] = { t: 's', v: PegIO.CONTOH[k] || '', z: '@' };
      for (let r = 2; r <= 400; r++) ws[sel(r, c)] = { t: 's', v: '', z: '@' };    // seluruh kolom berformat Teks agar NIP/NIK tidak rusak
    });
    ws['!ref'] = X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 400, c: PegIO.KOLOM.length - 1 } });
    ws['!cols'] = PegIO.KOLOM.map(function (k) { return { wch: Math.max(14, (PegData.LABEL[k] || k).length + 3) }; });

    const ref = PegData.ref || {};
    const petunjuk = [
      ['PETUNJUK PENGISIAN'], [''],
      ['1. Isi data mulai baris 2 pada sheet "Data". HAPUS baris contoh (nama diawali "CONTOH").'],
      ['2. Semua kolom sudah berformat TEKS. Jangan mengubahnya menjadi Angka, karena NIP/NIK 16–18 digit akan rusak (menjadi 1,97E+17).'],
      ['3. Kolom wajib: Nama, NIK (16 digit), Tanggal Lahir, Jenis Kelamin, Status Kepegawaian, Jenis PTK. NIP (18 digit) wajib untuk PNS/CPNS/PPPK.'],
      ['4. Tanggal ditulis TTTT-BB-HH (contoh 1985-01-31) atau HH/BB/TTTT (31/01/1985).'],
      ['5. Maksimal 5.000 baris per berkas. Baris yang salah akan dilaporkan; baris yang benar tetap dapat diimpor.'],
      ['6. NIK/NIP yang sudah terdaftar akan ditolak (tidak menimpa data lama). Gunakan menu Edit Data untuk mengubah.'], [''],
      ['PILIHAN YANG DIKENAL'],
      ['Status Kepegawaian', (ref.status_kepegawaian || []).join(', ')],
      ['Jenis PTK', 'Guru, Tenaga Kependidikan, Tenaga Pendukung'],
      ['Jenis Kelamin', 'Laki-laki / Perempuan (atau L / P)'],
      ['Agama', (ref.agama || []).join(', ')],
      ['Status Perkawinan', (ref.status_perkawinan || []).join(', ')],
      ['Golongan / Ruang', (ref.golongan_ruang || []).join(', ')],
      ['Pendidikan Terakhir', (ref.pendidikan_terakhir || []).join(', ')]
    ];
    const wp = X.utils.aoa_to_sheet(petunjuk);
    wp['!cols'] = [{ wch: 28 }, { wch: 110 }];
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, 'Data');
    X.utils.book_append_sheet(wb, wp, 'Petunjuk');
    UI.unduh(X.write(wb, { bookType: 'xlsx', type: 'array' }), 'Template_Impor_Pegawai.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  },

  // ---------- BACA BERKAS ----------
  async baca(file) {
    const X = await PegIO.muatLib();
    if (file.size > 8 * 1024 * 1024) throw new Error('Ukuran berkas terlalu besar (maks 8 MB).');
    const buf = await file.arrayBuffer();
    let wb;
    try { wb = X.read(new Uint8Array(buf), { type: 'array', cellNF: true, raw: true }); }
    catch (e) { throw new Error('Berkas tidak dapat dibaca. Gunakan .xlsx, .xls, atau .csv.'); }
    const nama = wb.SheetNames.filter(function (n) { return PegIO.norm(n) === 'data'; })[0] || wb.SheetNames.filter(function (n) { return PegIO.norm(n) !== 'petunjuk'; })[0];
    const ws = nama && wb.Sheets[nama];
    if (!ws || !ws['!ref']) throw new Error('Sheet data tidak ditemukan atau kosong.');
    const rg = X.utils.decode_range(ws['!ref']);
    if (rg.e.r > 5000) throw new Error('Terlalu banyak baris (maks 5.000 per berkas).');

    // Petakan header → kolom
    const peta = {}, taktahu = [];
    for (let c = rg.s.c; c <= rg.e.c; c++) {
      const sel = ws[X.utils.encode_cell({ r: rg.s.r, c: c })];
      if (!sel || sel.v === undefined || String(sel.v).trim() === '') continue;
      const h = PegIO.norm(sel.v);
      let key = PegIO.ALIAS[h] || null;
      if (!key) { key = PegIO.KOLOM.filter(function (k) { return PegIO.norm(k) === h || PegIO.norm(PegData.LABEL[k]) === h; })[0]; }
      if (key && !(key in peta)) peta[key] = c; else if (!key) taktahu.push(String(sel.v).trim());
    }
    ['nama', 'nik'].forEach(function (k) { if (!(k in peta)) throw new Error('Kolom "' + PegData.LABEL[k] + '" tidak ditemukan pada baris pertama. Gunakan template resmi.'); });

    const nilai = function (sel, k) {
      if (!sel || sel.v === undefined || sel.v === null) return { v: '' };
      if (sel.t === 'n') {
        if (sel.z && X.SSF.is_date(sel.z)) {
          const d = X.SSF.parse_date_code(sel.v);
          return { v: d.y + '-' + ('0' + d.m).slice(-2) + '-' + ('0' + d.d).slice(-2) };
        }
        if (Math.abs(sel.v) >= 1e15) return { v: '', galat: PegData.LABEL[k] + ' tersimpan sebagai angka (rusak). Ubah format kolom menjadi Teks' };
        return { v: String(sel.v) };
      }
      if (sel.t === 'b') return { v: '' };
      return { v: String(sel.v).trim() };
    };

    const baris = [];
    for (let r = rg.s.r + 1; r <= rg.e.r; r++) {
      const o = { _baris: r + 1 }; let ada = false; const galat = [];
      Object.keys(peta).forEach(function (k) {
        const x = nilai(ws[X.utils.encode_cell({ r: r, c: peta[k] })], k);
        o[k] = x.v; if (x.v !== '') ada = true;
        if (x.galat) galat.push(x.galat);
      });
      if (!ada) continue;
      if (/^contoh\s*-\s*hapus/i.test(o.nama || '')) continue;
      if (galat.length) o._galatKlien = galat.join('; ');
      baris.push(o);
    }
    return { baris: baris, taktahu: taktahu, sheet: nama };
  },

  // ---------- Kirim bertahap ----------
  async kirim(baris, cobaSaja, onProgres) {
    const hasil = {};
    let berhasil = 0;
    for (let i = 0; i < baris.length; i += 100) {
      const potong = baris.slice(i, i + 100);
      const r = await Api.post('pegawaiImpor', { rows: potong, cobaSaja: cobaSaja });
      if (!(r && r.success)) throw new Error((r && r.message) || 'Server menolak permintaan.');
      r.data.hasil.forEach(function (h) { hasil[h.baris] = h; });
      berhasil += r.data.berhasil;
      if (onProgres) onProgres(Math.min(i + 100, baris.length), baris.length);
    }
    return { hasil: hasil, berhasil: berhasil };
  },

  // ---------- Antarmuka impor ----------
  impor(onSelesai) {
    if (!PegData.siapkanRef()) PegData.siapkanRef();
    const m = UI.modal({ title: 'Impor Data Pegawai dari Excel', kelas: 'm-lg import-modal', body: '<div id="imporIsi"></div>' });
    const isi = function (h) { m.el.querySelector('#imporIsi').innerHTML = h; };
    let berkas = null;

    const layarPilih = function (pesan) {
      isi('<ol class="steps imp-steps"><li><b>Unduh template</b> lalu isi data pegawai (semua kolom sudah berformat teks).</li>' +
        '<li><b>Pilih berkas</b> yang sudah diisi. Sistem akan <b>memeriksa dulu</b> tanpa menyimpan apa pun.</li>' +
        '<li>Tinjau masalah, lalu <b>impor baris yang benar</b>.</li></ol>' +
        '<button type="button" class="chip-btn" id="impTemplate">' + UI.ic('download') + 'Unduh Template (.xlsx)</button>' +
        '<label class="dropzone" id="impDrop"><input type="file" id="impFile" accept=".xlsx,.xls,.csv" hidden>' + UI.ic('sheet') +
        '<b>Pilih berkas Excel / CSV</b><small>atau seret dan lepas di sini · maks 8 MB / 5.000 baris</small></label>' +
        (pesan ? '<div class="note note-danger" role="alert" style="margin-top:14px">' + UI.ic('alert') + '<div>' + UI.esc(pesan) + '</div></div>' : ''));
      m.el.querySelector('#impTemplate').addEventListener('click', PegIO.template);
      const f = m.el.querySelector('#impFile');
      f.addEventListener('change', function () { if (f.files[0]) proses(f.files[0]); });
      const dz = m.el.querySelector('#impDrop');
      ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('on'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('on'); }); });
      dz.addEventListener('drop', function (e) { const x = e.dataTransfer.files[0]; if (x) proses(x); });
    };

    const progres = function (judul, a, b) {
      isi('<div class="imp-prog"><b>' + UI.esc(judul) + '</b><div class="kel-track lg"><span style="width:' + (b ? Math.round(a / b * 100) : 5) + '%;background:#0B4F9E"></span></div><small>' + (b ? a + ' dari ' + b + ' baris' : 'Mohon tunggu…') + '</small></div>');
    };

    const proses = async function (file) {
      berkas = file;
      progres('Membaca berkas…', 0, 0);
      let data;
      try { data = await PegIO.baca(file); } catch (e) { return layarPilih(e.message); }
      if (!data.baris.length) return layarPilih('Tidak ada baris data yang terbaca. Pastikan data diisi mulai baris 2.');
      const kirimList = data.baris.filter(function (b) { return !b._galatKlien; });
      let periksa = { hasil: {}, berhasil: 0 };
      try { periksa = await PegIO.kirim(kirimList, true, function (a, b) { progres('Memeriksa data…', a, b); }); }
      catch (e) { return layarPilih(e.message); }
      layarTinjau(data, kirimList, periksa.hasil);
    };

    const layarTinjau = function (data, kirimList, hasil) {
      const masalah = [];
      data.baris.forEach(function (b) {
        if (b._galatKlien) return masalah.push({ baris: b._baris, nama: b.nama, pesan: b._galatKlien });
        const h = hasil[b._baris];
        if (h && !h.ok) masalah.push({ baris: b._baris, nama: b.nama, pesan: h.pesan });
      });
      const siap = kirimList.filter(function (b) { return hasil[b._baris] && hasil[b._baris].ok; });
      const peringatan = siap.filter(function (b) { return hasil[b._baris].peringatan; }).length;

      let h = '<div class="imp-sum"><div class="isum ok"><strong>' + siap.length + '</strong><span>baris siap diimpor</span></div>' +
        '<div class="isum ' + (masalah.length ? 'bad' : '') + '"><strong>' + masalah.length + '</strong><span>baris bermasalah</span></div>' +
        '<div class="isum"><strong>' + data.baris.length + '</strong><span>baris terbaca</span></div></div>';
      if (data.taktahu.length) h += '<div class="note note-warn" style="margin-top:12px">' + UI.ic('info') + '<div>Kolom berikut tidak dikenali dan diabaikan: <b>' + UI.esc(data.taktahu.slice(0, 8).join(', ')) + '</b></div></div>';
      if (peringatan) h += '<div class="note note-info" style="margin-top:12px">' + UI.ic('info') + '<div>' + peringatan + ' baris memiliki peringatan ringan (mis. 8 digit pertama NIP tidak sama dengan tanggal lahir). Tetap dapat diimpor.</div></div>';
      if (masalah.length) {
        h += '<div class="imp-tbl-wrap"><table class="imp-tbl"><thead><tr><th>Baris</th><th>Nama</th><th>Masalah</th></tr></thead><tbody>' +
          masalah.slice(0, 200).map(function (x) { return '<tr><td>' + x.baris + '</td><td>' + UI.esc(x.nama || '—') + '</td><td>' + UI.esc(x.pesan) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
          (masalah.length > 200 ? '<p class="fine">Menampilkan 200 dari ' + masalah.length + ' masalah. Unduh laporan untuk daftar lengkap.</p>' : '');
      } else h += '<div class="note note-info" style="margin-top:12px">' + UI.ic('check') + '<div>Semua baris lolos pemeriksaan. 🎉</div></div>';
      h += '<div class="imp-act"><button type="button" class="chip-btn" id="impUlang">Pilih Berkas Lain</button>' +
        (masalah.length ? '<button type="button" class="chip-btn" id="impLaporan">' + UI.ic('download') + 'Unduh Laporan Masalah</button>' : '') +
        '<button type="button" class="btn-secondary" id="impMulai"' + (siap.length ? '' : ' disabled') + '>Impor ' + siap.length + ' Baris</button></div>';
      isi(h);
      m.el.querySelector('#impUlang').addEventListener('click', function () { layarPilih(); });
      const lap = m.el.querySelector('#impLaporan');
      if (lap) lap.addEventListener('click', function () { PegIO.laporan(masalah); });
      m.el.querySelector('#impMulai').addEventListener('click', async function () {
        progres('Mengimpor data…', 0, siap.length);
        let akhir;
        try { akhir = await PegIO.kirim(siap, false, function (a, b) { progres('Mengimpor data…', a, b); }); }
        catch (e) { return layarPilih(e.message); }
        const gagal = siap.filter(function (b) { return !(akhir.hasil[b._baris] && akhir.hasil[b._baris].ok); }).map(function (b) { return { baris: b._baris, nama: b.nama, pesan: akhir.hasil[b._baris] ? akhir.hasil[b._baris].pesan : 'Tidak diproses' }; });
        layarSelesai(akhir.berhasil, gagal.concat(masalah));
        if (onSelesai) onSelesai();
      });
    };

    const layarSelesai = function (berhasil, gagal) {
      isi('<div class="imp-done">' + UI.ic('check') + '<h3>Impor selesai</h3><p><b>' + berhasil + '</b> pegawai berhasil ditambahkan' + (gagal.length ? ', <b>' + gagal.length + '</b> baris tidak diimpor' : '') + '.</p>' +
        '<div class="imp-act" style="justify-content:center">' + (gagal.length ? '<button type="button" class="chip-btn" id="impLaporan2">' + UI.ic('download') + 'Unduh Laporan Masalah</button>' : '') +
        '<button type="button" class="btn-secondary" id="impTutup">Selesai</button></div></div>');
      m.el.querySelector('#impTutup').addEventListener('click', m.close);
      const l2 = m.el.querySelector('#impLaporan2'); if (l2) l2.addEventListener('click', function () { PegIO.laporan(gagal); });
    };

    layarPilih();
  },

  async laporan(masalah) {
    let X;
    try { X = await PegIO.muatLib(); } catch (e) { return UI.toast(e.message, 'error'); }
    const aoa = [['Baris Excel', 'Nama', 'Masalah']].concat(masalah.map(function (x) { return [String(x.baris), x.nama || '', x.pesan]; }));
    const ws = X.utils.aoa_to_sheet(aoa); ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 100 }];
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Masalah');
    UI.unduh(X.write(wb, { bookType: 'xlsx', type: 'array' }), 'Laporan_Masalah_Impor_' + UI.hariIniISO() + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }
};
