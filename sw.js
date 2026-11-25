/* Service Worker — SIM Kepegawaian SMKN 3 Tangerang
   Naikkan nomor VERSI setiap kali Anda mengubah berkas aplikasi. */
const VERSI = 'simpeg-v1.1.0';
const SHELL = [
  './', './index.html', './manifest.json',
  './css/style.css', './css/app.css',
  './js/config.js', './js/ui.js', './js/api.js', './js/login.js',
  './js/menu.js', './js/charts.js', './js/dashboard.js', './js/shell.js', './js/app.js',
  './assets/logo-smkn3.png', './assets/icon-192.png', './assets/favicon-32.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSI).then(function (c) { return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSI; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Permintaan ke Google Apps Script: JANGAN pernah di-cache
  if (/(^|\.)script\.google(usercontent)?\.com$/.test(url.hostname)) return;

  // Font Google: tampilkan dari cache, perbarui di latar belakang
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSI).then(function (c) {
      return c.match(req).then(function (hit) {
        const net = fetch(req).then(function (res) { c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }

  if (url.origin !== location.origin) return;

  // Gambar/ikon: cache dulu
  if (url.pathname.indexOf('/assets/') !== -1) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        const copy = res.clone(); caches.open(VERSI).then(function (c) { c.put(req, copy); }); return res;
      });
    }));
    return;
  }

  // HTML/CSS/JS: jaringan dulu (agar pembaruan langsung terlihat), cache bila offline
  e.respondWith(
    fetch(req).then(function (res) {
      const copy = res.clone(); caches.open(VERSI).then(function (c) { c.put(req, copy); }); return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined);
      });
    })
  );
});
