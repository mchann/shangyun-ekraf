import { neon } from '@neondatabase/serverless';
import { SEED, GL, ph, img, rp, esc, normWa, waLocal } from '../data/seed.js';

export const SELLER_STORAGE_KEY = 'shangyun.sellers.v1';
export const PRODUCT_STORAGE_KEY = 'shangyun.products.v1';
export const USER_STORAGE_KEY = 'shangyun.current_user.v1';

export const DEFAULT_SELLERS = [
  {
    id: 's1',
    nama: 'Master Chen Zhao',
    email: 'chen.zhao@shangyun.id',
    nama_toko: 'Zhao Atelier Suzhou',
    no_wa: '6285738211550',
    spesialisasi: 'Sulam Sutra & Kipas'
  },
  {
    id: 's2',
    nama: 'Artisan Lin Mei',
    email: 'lin.mei@shangyun.id',
    nama_toko: 'Mei Cinnabar Workshop',
    no_wa: '6281234567890',
    spesialisasi: 'Kerajinan Lakur & Kayu'
  },
  {
    id: 's3',
    nama: 'Wang Jin Long',
    email: 'wang.jinlong@shangyun.id',
    nama_toko: 'Jinlong Jade & Porcelain',
    no_wa: '6281987654321',
    spesialisasi: 'Keramik & Ukiran Giok'
  }
];

// Map initial products to sellers
export const INITIAL_PRODUCTS = SEED.map((p, idx) => {
  const sellerId = idx % 3 === 0 ? 's1' : idx % 3 === 1 ? 's2' : 's3';
  return {
    ...p,
    seller_id: p.seller_id || sellerId
  };
});

/**
 * Neon Database Client Wrapper
 * Jika env DATABASE_URL tersedia, dapat menggunakan koneksi live Neon.
 * Secara default (dummy mode), beroperasi via local in-memory & localStorage engine.
 */
class NeonDatabaseService {
  constructor() {
    this.databaseUrl =
      typeof process !== 'undefined' && process.env?.DATABASE_URL
        ? process.env.DATABASE_URL
        : '';
    this.sql = this.databaseUrl ? neon(this.databaseUrl) : null;
  }

  // --- SELLERS REPOSITORY ---
  getSellers() {
    if (typeof window === 'undefined') return [...DEFAULT_SELLERS];
    try {
      const raw = localStorage.getItem(SELLER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    this.saveSellers(DEFAULT_SELLERS);
    return [...DEFAULT_SELLERS];
  }

  saveSellers(sellersList) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(sellersList));
      } catch (e) {}
    }
  }

  addSeller(sellerData) {
    const list = this.getSellers();
    const newId = 's' + (list.length + 1) + '_' + Date.now().toString(36);
    const seller = {
      id: newId,
      nama: sellerData.nama.trim(),
      email: sellerData.email?.trim() || `${newId}@shangyun.id`,
      nama_toko: sellerData.nama_toko.trim(),
      no_wa: normWa(sellerData.no_wa) || '6285738211550',
      spesialisasi: sellerData.spesialisasi?.trim() || 'Kerajinan Tangan'
    };
    list.push(seller);
    this.saveSellers(list);
    return seller;
  }

  // --- PRODUCTS REPOSITORY ---
  getProducts() {
    if (typeof window === 'undefined') return [...INITIAL_PRODUCTS];
    try {
      const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    this.saveProducts(INITIAL_PRODUCTS);
    return [...INITIAL_PRODUCTS];
  }

  saveProducts(productsList) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(productsList));
      } catch (e) {}
    }
  }

  addProduct(productData) {
    const list = this.getProducts();
    const newId = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const product = {
      id: newId,
      seller_id: productData.seller_id || 's1',
      nama: productData.nama.trim(),
      kategori: productData.kategori.trim(),
      harga: Number(productData.harga) || 0,
      stok: Number(productData.stok) || 0,
      deskripsi: productData.deskripsi?.trim() || '',
      imageUrl: productData.imageUrl?.trim() || '',
      unggulan: Boolean(productData.unggulan)
    };
    list.push(product);
    this.saveProducts(list);
    return product;
  }

  updateProduct(id, productData) {
    const list = this.getProducts();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) return null;
    list[index] = {
      ...list[index],
      ...productData,
      id
    };
    this.saveProducts(list);
    return list[index];
  }

  deleteProduct(id) {
    let list = this.getProducts();
    list = list.filter((p) => p.id !== id);
    this.saveProducts(list);
    return true;
  }

  resetSeed() {
    this.saveSellers(DEFAULT_SELLERS);
    this.saveProducts(INITIAL_PRODUCTS);
  }
}

export const db = new NeonDatabaseService();

