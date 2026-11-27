/* =========================================================
   RiwData — pembantu perhitungan riwayat kepangkatan, KGB, DUK
   ========================================================= */
const RiwData = {
  PENDIDIKAN: { 'S3': 7, 'S2': 6, 'S1': 5, 'D4': 5, 'D3': 4, 'D2': 3, 'D1': 2, 'SMA/SMK Sederajat': 1 },

  urutGol() {
    return (PegData.ref && PegData.ref.golongan_ruang) || ['I/a', 'I/b', 'I/c', 'I/d', 'II/a', 'II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'];
  },
  golIdx(g) { return g ? RiwData.urutGol().indexOf(g) : -1; },

  // Golongan berikutnya (null bila sudah tertinggi pada jalurnya)
  golBerikut(g) {
    const l = RiwData.urutGol(), i = l.indexOf(g);
    if (i < 0 || i >= l.length - 1) return null;
    if (g === 'IV/e') return null;                       // pangkat tertinggi PNS
    return l[i + 1];
  },

  rp(n) {
    n = String(n || '').replace(/\D/g, '');
    return n ? 'Rp ' + n.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';
  },

  // Selisih hari dari hari ini ke tanggal ISO (negatif = sudah lewat)
  hariKe(iso) {
    const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''), b = /^(\d{4})-(\d{2})-(\d{2})/.exec(UI.hariIniISO());
    if (!a || !b) return null;
    return Math.round((Date.UTC(+a[1], +a[2] - 1, +a[3]) - Date.UTC(+b[1], +b[2] - 1, +b[3])) / 86400000);
  },

  // Periode kenaikan pangkat reguler: 1 April atau 1 Oktober, pada/setelah tanggal acuan (minimal hari ini)
  periodeKP(iso) {
    const hari = UI.hariIniISO();
    const acu = iso && iso > hari ? iso : hari;
    const y = +acu.substring(0, 4);
    const kandidat = [y + '-04-01', y + '-10-01', (y + 1) + '-04-01'];
    return kandidat.filter(function (k) { return k >= acu; })[0];
  },

  // Tambahkan angka-angka turunan pada satu baris DUK
  hitung(r) {
    const hari = UI.hariIniISO();
    const k = PegData.karier(r);
    const o = Object.assign({}, r);
    o.mk = r.tmt_cpns ? UI.selisihTB(r.tmt_cpns, hari) : null;
    o.mkGol = r.tmt_pangkat ? UI.selisihTB(r.tmt_pangkat, hari) : null;
    o.usia = r.tanggal_lahir ? UI.selisihTB(r.tanggal_lahir, hari) : null;
    o.kgb = k.kgb;                                       // { tanggal, dasar }
    o.kgbHari = k.kgb ? RiwData.hariKe(k.kgb.tanggal) : null;
    o.kgbPasti = !!r.tmt_kgb_terakhir;                   // true = dari TMT KGB terakhir, false = perkiraan dari TMT CPNS
    o.kp = k.pangkat;                                    // { tanggal, dasar }
    o.kpHari = k.pangkat ? RiwData.hariKe(k.pangkat.tanggal) : null;
    return o;
  },

  // Urutan DUK: golongan ↓, TMT pangkat ↑, TMT CPNS (masa kerja) ↑, pendidikan ↓, tanggal lahir ↑ (lebih tua dulu), nama
  urutDUK(daftar) {
    const kosongAkhir = function (a, b) {
      if (!a && !b) return 0; if (!a) return 1; if (!b) return -1; return a < b ? -1 : a > b ? 1 : 0;
    };
    return daftar.slice().sort(function (a, b) {
      let r = RiwData.golIdx(b.golongan_ruang) - RiwData.golIdx(a.golongan_ruang);
      if (r) return r;
      r = kosongAkhir(a.tmt_pangkat, b.tmt_pangkat); if (r) return r;
      r = kosongAkhir(a.tmt_cpns, b.tmt_cpns); if (r) return r;
      r = (RiwData.PENDIDIKAN[b.pendidikan_terakhir] || 0) - (RiwData.PENDIDIKAN[a.pendidikan_terakhir] || 0); if (r) return r;
      r = kosongAkhir(a.tanggal_lahir, b.tanggal_lahir); if (r) return r;
      return String(a.nama).localeCompare(String(b.nama), 'id', { sensitivity: 'base' });
    });
  },

  // Teks "x thn y bln"
  mkTeks(s) { return s ? s.th + ' thn ' + s.bl + ' bln' : '—'; },

  // Lencana sisa waktu menurut jumlah hari
  badgeHari(h) {
    if (h === null || h === undefined) return '<span class="badge b-gray">—</span>';
    if (h < 0) return '<span class="badge b-red">Terlewat ' + RiwData.durasi(-h) + '</span>';
    if (h <= 30) return '<span class="badge b-red">' + (h === 0 ? 'Hari ini' : h + ' hari lagi') + '</span>';
    if (h <= 90) return '<span class="badge b-gold">' + RiwData.durasi(h) + ' lagi</span>';
    return '<span class="badge b-blue">' + RiwData.durasi(h) + ' lagi</span>';
  },
  durasi(h) {
    if (h < 60) return h + ' hari';
    const bl = Math.round(h / 30.44);
    if (bl < 24) return bl + ' bln';
    const th = Math.floor(bl / 12), s = bl % 12;
    return th + ' thn' + (s ? ' ' + s + ' bln' : '');
  }
};
