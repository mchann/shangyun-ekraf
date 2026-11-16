export const KEY = 'shangyun.products.v1';
export const WK = 'shangyun.wa.v1';
export const DEFAULT_WA = '6285738211550';

export const SEED = [
  {
    id: 'p1',
    nama: 'Lampion Sutra Emas',
    kategori: 'Dekorasi',
    harga: 450000,
    stok: 12,
    deskripsi: 'Sutra berbingkai kayu dengan sulam benang emas, tinggi 40 cm.',
    imageUrl: '',
    unggulan: true
  },
  {
    id: 'p2',
    nama: 'Angpao Sutra Bordir (isi 10)',
    kategori: 'Angpao',
    harga: 185000,
    stok: 40,
    deskripsi: 'Amplop kain bordir tangan dalam kotak berlapis beludru.',
    imageUrl: '',
    unggulan: false
  },
  {
    id: 'p3',
    nama: 'Hampers Imlek Prestige',
    kategori: 'Hampers',
    harga: 1250000,
    stok: 6,
    deskripsi: 'Kotak lakur merah berisi teh, kue kering, lilin, dan angpao.',
    imageUrl: '',
    unggulan: true
  },
  {
    id: 'p4',
    nama: 'Gantungan Simpul Keberuntungan',
    kategori: 'Aksesori',
    harga: 95000,
    stok: 30,
    deskripsi: 'Tali sutra merah dengan manik kayu, dirangkai satu per satu.',
    imageUrl: '',
    unggulan: false
  },
  {
    id: 'p5',
    nama: 'Kaligrafi Fu Berbingkai',
    kategori: 'Dekorasi',
    harga: 780000,
    stok: 5,
    deskripsi: 'Aksara Fu tulisan tangan di kertas beras, bingkai jati.',
    imageUrl: '',
    unggulan: true
  },
  {
    id: 'p6',
    nama: 'Kotak Teh Lakur Hitam',
    kategori: 'Hampers',
    harga: 560000,
    stok: 0,
    deskripsi: 'Lakur hitam bertepi emas, muat empat kaleng teh.',
    imageUrl: '',
    unggulan: false
  },
  {
    id: 'p7',
    nama: 'Ornamen Naga Keramik',
    kategori: 'Dekorasi',
    harga: 890000,
    stok: 8,
    deskripsi: 'Keramik glasir merah marun untuk meja altar atau ruang tamu.',
    imageUrl: '',
    unggulan: false
  },
  {
    id: 'p8',
    nama: 'Kipas Lipat Bordir',
    kategori: 'Aksesori',
    harga: 210000,
    stok: 18,
    deskripsi: 'Kipas bambu dengan kain bordir bunga plum.',
    imageUrl: '',
    unggulan: false
  }
];

export const GL = {
  Dekorasi: '福',
  Angpao: '紅',
  Hampers: '禧',
  Aksesori: '吉'
};

export function ph(p) {
  const g = GL[p.kategori] || '春';
  let h = 0;
  for (let k = 0; k < p.nama.length; k++) {
    h = (h * 31 + p.nama.charCodeAt(k)) % 60;
  }
  const dark = h % 2;
  const top = dark ? '#1a0d0a' : 'hsl(' + (h % 12 + 2) + ',72%,34%)';
  const bot = dark ? '#050202' : 'hsl(' + (h % 10) + ',70%,14%)';
  const ox = 60 + h * 4;
  const oy = 40 + (h % 5) * 30;
  const s =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' +
    top +
    '"/><stop offset="1" stop-color="' +
    bot +
    '"/></linearGradient><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter></defs><rect width="400" height="500" fill="url(#g)"/><ellipse cx="' +
    ox +
    '" cy="' +
    oy +
    '" rx="110" ry="150" fill="#050202" opacity=".75" filter="url(#b)"/><ellipse cx="' +
    (400 - ox) +
    '" cy="470" rx="170" ry="60" fill="#050202" opacity=".6" filter="url(#b)"/><text x="200" y="300" text-anchor="middle" font-size="190" font-family="serif" fill="#e8dbc0" opacity=".9">' +
    g +
    '</text></svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(s);
}

export function img(p) {
  return p.imageUrl || p.image_url || ph(p);
}

export function rp(n) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n);
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c];
  });
}

export function loadWa() {
  if (typeof window === 'undefined') return DEFAULT_WA;
  try {
    const v = localStorage.getItem(WK);
    if (v && /^62\d{8,13}$/.test(v)) return v;
  } catch (e) {}
  return DEFAULT_WA;
}

export function normWa(v) {
  let d = String(v).replace(/\D/g, '');
  if (d.indexOf('0') === 0) d = '62' + d.slice(1);
  else if (d.indexOf('8') === 0) d = '62' + d;
  return /^62\d{8,13}$/.test(d) ? d : '';
}

export function waLocal(wa) {
  return wa && wa.indexOf('62') === 0 ? '0' + wa.slice(2) : wa;
}

