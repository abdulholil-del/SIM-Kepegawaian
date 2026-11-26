/* =========================================================
   PegData — referensi, format, perhitungan karier, kelengkapan, foto
   Dipakai oleh: pegawai-list, pegawai-detail, pegawai-form, pegawai-io
   ========================================================= */
const PegData = {
  K_REF: 'peg_ref',
  ref: null,
  bup: { guru: 60, tendik: 58 },

  JENIS_PTK: { guru: 'Guru', tendik: 'Tenaga Kependidikan', pendukung: 'Tenaga Pendukung' },

  PANGKAT: {
    'I/a': 'Juru Muda', 'I/b': 'Juru Muda Tk. I', 'I/c': 'Juru', 'I/d': 'Juru Tk. I',
    'II/a': 'Pengatur Muda', 'II/b': 'Pengatur Muda Tk. I', 'II/c': 'Pengatur', 'II/d': 'Pengatur Tk. I',
    'III/a': 'Penata Muda', 'III/b': 'Penata Muda Tk. I', 'III/c': 'Penata', 'III/d': 'Penata Tk. I',
    'IV/a': 'Pembina', 'IV/b': 'Pembina Tk. I', 'IV/c': 'Pembina Utama Muda', 'IV/d': 'Pembina Utama Madya', 'IV/e': 'Pembina Utama'
  },

  LABEL: {
    nip: 'NIP', nuptk: 'NUPTK', nik: 'NIK', nama: 'Nama Lengkap (Tanpa Gelar)', gelar_depan: 'Gelar Depan', gelar_belakang: 'Gelar Belakang',
    tempat_lahir: 'Tempat Lahir', tanggal_lahir: 'Tanggal Lahir', jenis_kelamin: 'Jenis Kelamin', agama: 'Agama',
    status_perkawinan: 'Status Perkawinan', status_kepegawaian: 'Status Kepegawaian', jenis_ptk: 'Jenis PTK',
    jabatan: 'Jabatan', golongan_ruang: 'Golongan / Ruang', tmt_cpns: 'TMT CPNS', tmt_pns: 'TMT PNS',
    tmt_pangkat: 'TMT Pangkat Terakhir', tmt_kgb_terakhir: 'TMT KGB Terakhir', mapel_utama: 'Mata Pelajaran Utama',
    unit_kerja: 'Unit Kerja', alamat: 'Alamat', kelurahan: 'Kelurahan', kecamatan: 'Kecamatan', kota: 'Kota / Kabupaten',
    kode_pos: 'Kode Pos', no_hp: 'No. HP', email: 'Email', no_rekening: 'No. Rekening', bank: 'Bank', npwp: 'NPWP',
    no_bpjs_kes: 'No. BPJS Kesehatan', no_bpjs_tk: 'No. BPJS Ketenagakerjaan', no_karpeg: 'No. Karpeg', no_karis_karsu: 'No. Karis/Karsu',
    pendidikan_terakhir: 'Pendidikan Terakhir', jurusan: 'Jurusan / Program Studi', institusi: 'Institusi', tahun_lulus: 'Tahun Lulus',
    tugas_tambahan: 'Tugas Tambahan', beban_jam: 'Beban Jam / Minggu', foto: 'Foto', status_aktif: 'Status Data'
  },

  // ---------- Referensi ----------
  terapkanRef(ref, bup) {
    if (ref) PegData.ref = ref;
    if (bup) PegData.bup = bup;
    if (ref) Session.cacheSet(PegData.K_REF, { ref: ref, bup: PegData.bup });
  },
  siapkanRef() {
    if (PegData.ref) return true;
    const c = Session.cacheGet(PegData.K_REF);
    if (c && c.ref) { PegData.ref = c.ref; PegData.bup = c.bup || PegData.bup; return true; }
    return false;
  },

  // Pasangan [nilai, label] untuk <select>
  opsi(k) {
    const r = (PegData.ref && PegData.ref[k]) || [];
    if (k === 'jenis_ptk') return r.map(function (v) { return [v, PegData.JENIS_PTK[v] || v]; });
    if (k === 'golongan_ruang') return r.map(function (v) { return [v, PegData.PANGKAT[v] ? v + ' — ' + PegData.PANGKAT[v] : v]; });
    return r.map(function (v) { return [v, v]; });
  },

  // ---------- Format ----------
  namaLengkap(p) {
    let n = (p.gelar_depan ? p.gelar_depan + ' ' : '') + (p.nama || '');
    if (p.gelar_belakang) n += ', ' + p.gelar_belakang;
    return n.trim();
  },
  golLabel(g) { return g ? (PegData.PANGKAT[g] ? PegData.PANGKAT[g] + ' (' + g + ')' : g) : ''; },
  golBesar(g) {
    const m = String(g || '').toUpperCase().match(/\b(IV|III|II|I)\b/);
    return m ? 'Gol ' + m[1] : 'PPPK / Non-ASN';
  },
  ptkLabel(k) { return PegData.JENIS_PTK[k] || k || '—'; },
  isASN(status) { return /^(PNS|CPNS|PPPK)$/.test(status || ''); },
  badgeStatus(status) {
    if (status === 'PNS' || status === 'CPNS') return 'b-blue';
    if (status === 'PPPK') return 'b-green';
    if (status === 'GTY' || status === 'GTT') return 'b-gold';
    return 'b-gray';
  },
  statusAktifInfo(s) {
    return { aktif: ['Aktif', 'b-green'], nonaktif: ['Nonaktif', 'b-gray'], pensiun: ['Pensiun', 'b-gold'], 'mutasi keluar': ['Mutasi Keluar', 'b-red'] }[s || 'aktif'] || [s, 'b-gray'];
  },
  warnaKel(n) { return n >= 90 ? '#1E9E5A' : n >= 80 ? '#4C9AFF' : n >= 60 ? '#E8A317' : '#D64545'; },
  labelKel(n) { return n >= 90 ? 'Sangat Baik & Lengkap' : n >= 80 ? 'Baik' : n >= 60 ? 'Perlu Dilengkapi' : 'Belum Lengkap'; },

  // Warna avatar inisial yang stabil per nama
  avatar(nama) {
    const w = [['#EEF5FC', '#0B4F9E'], ['#E8F8F0', '#137A44'], ['#FEF8E7', '#B07A00'], ['#EEF0FF', '#4B4FD6'], ['#FDECEC', '#B83232'], ['#F1F5F9', '#475569']];
    let h = 0; String(nama || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; });
    const x = w[h % w.length];
    return 'background:' + x[0] + ';color:' + x[1];
  },

  // ---------- Kelengkapan (sama dengan aturan di server) ----------
  kolomWajib(p) {
    const w = ['nik', 'nama', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'agama', 'status_kepegawaian',
      'jenis_ptk', 'jabatan', 'alamat', 'no_hp', 'email', 'no_rekening', 'npwp', 'foto'];
    if (/^(PNS|CPNS|PPPK)/i.test(p.status_kepegawaian || '')) w.push('nip', 'golongan_ruang', 'tmt_cpns');
    return w;
  },
  kelengkapan(p, adaFoto) {
    const kurang = PegData.kolomWajib(p).filter(function (k) {
      if (k === 'foto') return !adaFoto;
      return !String(p[k] || '').trim();
    });
    const total = PegData.kolomWajib(p).length;
    return { skor: Math.round((1 - kurang.length / total) * 100), kurang: kurang };
  },

  // ---------- Karier & pensiun (perkiraan) ----------
  sisaWaktu(iso) {
    if (!iso) return null;
    const hari = UI.hariIniISO();
    const lewat = iso < hari;
    const s = lewat ? UI.selisihTB(iso, hari) : UI.selisihTB(hari, iso);
    if (!s) return null;
    let teks;
    if (s.totalBulan <= 0) teks = lewat ? 'Terlewat < 1 bulan' : 'Kurang dari 1 bulan lagi';
    else if (s.th >= 1) teks = (lewat ? 'Terlewat ' : '') + s.th + ' thn' + (s.bl ? ' ' + s.bl + ' bln' : '') + (lewat ? '' : ' lagi');
    else teks = (lewat ? 'Terlewat ' : '') + s.bl + ' bln' + (lewat ? '' : ' lagi');
    const nada = lewat ? 'merah' : (s.totalBulan <= 3 ? 'emas' : 'biru');
    return { teks: teks, nada: nada, lewat: lewat };
  },

  karier(p) {
    const status = p.status_kepegawaian;
    const pns = status === 'PNS' || status === 'CPNS';
    const k = { pns: pns, kgb: null, pangkat: null, pensiun: null };
    if (pns) {
      const dasarKgb = p.tmt_kgb_terakhir || p.tmt_cpns;
      if (dasarKgb) {
        let tgl = UI.tambahTahun(dasarKgb, 2);
        let dasar = 'TMT KGB terakhir';
        if (!p.tmt_kgb_terakhir) {            // tanpa TMT KGB terakhir: perkirakan siklus 2 tahunan dari TMT CPNS
          const hari = UI.hariIniISO();
          for (let i = 0; i < 40 && tgl < hari; i++) tgl = UI.tambahTahun(tgl, 2);
          dasar = 'siklus 2 tahunan dari TMT CPNS — isi TMT KGB terakhir agar akurat';
        }
        k.kgb = { tanggal: tgl, dasar: dasar };
      }
      if (p.tmt_pangkat) k.pangkat = { tanggal: UI.tambahTahun(p.tmt_pangkat, 4), dasar: 'TMT pangkat terakhir' };
    }
    if (p.tanggal_lahir) {
      const bup = p.jenis_ptk === 'guru' ? PegData.bup.guru : PegData.bup.tendik;
      const batas = UI.tambahTahun(p.tanggal_lahir, bup);
      const m = /^(\d{4})-(\d{2})/.exec(batas);
      let tmt = '';
      if (m) { let y = +m[1], mo = +m[2] + 1; if (mo > 12) { mo = 1; y++; } tmt = y + '-' + ('0' + mo).slice(-2) + '-01'; }
      k.pensiun = { batas: batas, tmt: tmt, bup: bup };
    }
    return k;
  },

  // ---------- Foto ----------
  _foto: {},
  async foto(id) {
    if (PegData._foto[id] !== undefined) return PegData._foto[id];
    const r = await Api.post('fotoGet', { id: id });
    const uri = (r && r.success && r.data.dataUri) || '';
    if (r && r.success) PegData._foto[id] = uri;
    return uri;
  },
  setFoto(id, uri) { PegData._foto[id] = uri; },

  // Kecilkan & potong foto ke rasio 3:4 → JPEG data URI (maks ~450×600)
  siapkanFoto(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Gunakan berkas gambar JPG atau PNG.'));
      if (file.size > 12 * 1024 * 1024) return reject(new Error('Ukuran berkas terlalu besar (maks 12 MB).'));
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        if (img.width < 200 || img.height < 260) return reject(new Error('Resolusi foto terlalu kecil (minimal 200×260 piksel).'));
        const rasio = 3 / 4;
        let sw = img.width, sh = img.height, sx = 0, sy = 0;
        if (sw / sh > rasio) { sw = Math.round(sh * rasio); sx = Math.round((img.width - sw) / 2); }
        else { sh = Math.round(sw / rasio); sy = Math.round((img.height - sh) / 6); }   // condong ke atas agar wajah tidak terpotong
        const W = Math.min(450, sw), H = Math.round(W / rasio);
        const cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        const cx = cv.getContext('2d');
        cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H);
        cx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
        let q = 0.82, uri = cv.toDataURL('image/jpeg', q);
        while (uri.length > 330000 && q > 0.4) { q -= 0.1; uri = cv.toDataURL('image/jpeg', q); }
        resolve(uri);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Berkas gambar tidak dapat dibaca.')); };
      img.src = url;
    });
  }
};
