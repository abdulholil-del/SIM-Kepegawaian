/* Grafik ringan tanpa pustaka: batang bertumpuk, batang horizontal */
const Charts = {
  PALET: ['#083A75', '#4C9AFF', '#F2B705', '#1E9E5A', '#9AA7B8', '#D64545'],

  pct(n, total) { return total > 0 ? Math.round(n / total * 100) : 0; },

  // Batang bertumpuk + legenda. items: [{label, jumlah}]
  stack(items) {
    const total = items.reduce(function (a, b) { return a + b.jumlah; }, 0);
    if (!total) return '';
    // gabungkan sisa bila > 5 kelompok
    let data = items.slice(0, 5);
    if (items.length > 5) {
      const sisa = items.slice(5).reduce(function (a, b) { return a + b.jumlah; }, 0);
      data.push({ label: 'Lainnya', jumlah: sisa });
    }
    let bar = '', leg = '';
    data.forEach(function (d, i) {
      const w = Math.max(d.jumlah / total * 100, 0.5);
      const c = Charts.PALET[i % Charts.PALET.length];
      bar += '<span style="flex:' + w.toFixed(2) + ' 1 0;background:' + c + '" title="' + UI.esc(d.label) + ': ' + d.jumlah + '"></span>';
      leg += '<div class="lg"><i style="background:' + c + '"></i><span>' + UI.esc(d.label) + '</span><b>' + Charts.pct(d.jumlah, total) + '%</b></div>';
    });
    return '<div class="sbar" role="img" aria-label="Distribusi kepegawaian">' + bar + '</div><div class="legend">' + leg + '</div>';
  },

  // Batang horizontal berlabel. items: [{label, jumlah}]
  bars(items) {
    const maks = Math.max.apply(null, items.map(function (x) { return x.jumlah; }).concat([1]));
    const warna = ['#083A75', '#4C9AFF', '#F2B705', '#9AA7B8', '#1E9E5A'];
    return items.map(function (d, i) {
      return '<div class="hbar"><div class="hbar-top"><span>' + UI.esc(d.label) + '</span><b>' + d.jumlah + ' Pegawai</b></div>' +
        '<div class="hbar-track"><span class="hbar-fill" style="width:' + (d.jumlah / maks * 100).toFixed(1) + '%;background:' + warna[i % warna.length] + '"></span></div></div>';
    }).join('');
  }
};
