/* =========================================================
   Registri menu & halaman.
   Menambah modul baru = (1) ubah ready:true pada item menu,
   (2) daftarkan Pages.<id> = function (box, user) {...}
   ========================================================= */
const Pages = {};   // diisi oleh berkas halaman (dashboard.js, dst.)

const Menu = {
  ADMINS: ['super_admin', 'admin'],

  ITEMS: [
    { id: 'dashboard', label: 'Dashboard Utama', labelUser: 'Beranda', icon: 'dashboard', grup: 'DASHBOARD', roles: ['super_admin', 'admin', 'user'], ready: true },

    { id: 'data-pegawai', label: 'Data Guru & Tendik', icon: 'users', grup: 'DATA MASTER & PEGAWAI', roles: ['super_admin', 'admin'], ready: true },
    { id: 'riwayat', label: 'Riwayat Kepangkatan & DUK', icon: 'award', grup: 'DATA MASTER & PEGAWAI', roles: ['super_admin', 'admin'], ready: true },
    { id: 'dokumen', label: 'Dokumen & Arsip Digital', icon: 'folder', grup: 'DATA MASTER & PEGAWAI', roles: ['super_admin', 'admin'] },

    { id: 'presensi', label: 'Rekap Presensi & Geofence', icon: 'pin', grup: 'PRESENSI & JADWAL', roles: ['super_admin', 'admin'] },
    { id: 'jadwal', label: 'Jadwal & Kalender Kerja', icon: 'calendar', grup: 'PRESENSI & JADWAL', roles: ['super_admin', 'admin'] },

    { id: 'cuti', label: 'Pengajuan Cuti & Izin', icon: 'clipboard', grup: 'LAYANAN ASN', roles: ['super_admin', 'admin'] },
    { id: 'usulan', label: 'Usulan KGB & Pangkat', icon: 'trend', grup: 'LAYANAN ASN', roles: ['super_admin', 'admin'] },

    { id: 'kinerja', label: 'Penilaian Kinerja (SKP & PKG)', icon: 'shield', grup: 'KINERJA & SK', roles: ['super_admin', 'admin'] },
    { id: 'arsip-sk', label: 'Arsip SK & Surat Ber-QR', icon: 'qr', grup: 'KINERJA & SK', roles: ['super_admin', 'admin'] },

    { id: 'akun', label: 'Akun & Peran', icon: 'usercog', grup: 'PENGATURAN SISTEM', roles: ['super_admin'] },
    { id: 'audit', label: 'Audit Log', icon: 'history', grup: 'PENGATURAN SISTEM', roles: ['super_admin'] },
    { id: 'sekolah', label: 'Pengaturan Sekolah', icon: 'school', grup: 'PENGATURAN SISTEM', roles: ['super_admin'] },

    { id: 'profil', label: 'Profil Saya', icon: 'user', grup: 'MENU PEGAWAI', roles: ['user'] },
    { id: 'presensi-saya', label: 'Presensi', icon: 'pin', grup: 'MENU PEGAWAI', roles: ['user'] },
    { id: 'cuti-saya', label: 'Cuti & Izin', icon: 'clipboard', grup: 'MENU PEGAWAI', roles: ['user'] },
    { id: 'dokumen-saya', label: 'Dokumen Saya', icon: 'folder', grup: 'MENU PEGAWAI', roles: ['user'] },
    { id: 'kinerja-saya', label: 'Kinerja Saya', icon: 'shield', grup: 'MENU PEGAWAI', roles: ['user'] },
    { id: 'surat-saya', label: 'Surat Saya', icon: 'qr', grup: 'MENU PEGAWAI', roles: ['user'] }
  ],

  SUBJUDUL: {
    super_admin: 'Panel Kontrol Utama · Super Admin',
    admin: 'Panel Kontrol Admin · Kepegawaian SMKN 3 Tangerang',
    user: 'Portal Pegawai · SMKN 3 Tangerang'
  },

  label(item, role) { return (role === 'user' && item.labelUser) || item.label; },

  // Item yang boleh dilihat peran ini, dikelompokkan sesuai urutan
  untuk(role) {
    const hasil = [];
    Menu.ITEMS.forEach(function (it) {
      if (it.roles.indexOf(role) < 0) return;
      let g = hasil.filter(function (x) { return x.nama === it.grup; })[0];
      if (!g) { g = { nama: it.grup, items: [] }; hasil.push(g); }
      g.items.push(it);
    });
    return hasil;
  },

  cari(id, role) {
    return Menu.ITEMS.filter(function (it) { return it.id === id && it.roles.indexOf(role) >= 0; })[0] || null;
  }
};
