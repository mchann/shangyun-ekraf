import { writable, derived } from 'svelte/store';
import { db, DEFAULT_SELLERS, INITIAL_PRODUCTS, USER_STORAGE_KEY } from '../lib/db.js';
import { normWa } from '../data/seed.js';

export const AUTH_USER_STORAGE_KEY = 'shangyun.auth.user.v1';
export const THEME_STORAGE_KEY = 'shangyun.theme.v1';

// --- THEME STORE (Mode Gelap: Merah, Hitam, Emas | Mode Terang: Coklat, Merah, Cream) ---
function createThemeStore() {
  let initial = 'dark';
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        initial = saved;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        initial = 'light';
      }
    } catch (e) {}
  }

  const { subscribe, set } = writable(initial);

  function applyToDom(val) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', val);
      document.documentElement.style.colorScheme = val;
    }
  }

  if (typeof window !== 'undefined') {
    applyToDom(initial);
  }

  return {
    subscribe,
    set: (val) => {
      set(val);
      applyToDom(val);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, val);
        } catch (e) {}
      }
    },
    toggle: () => {
      let current;
      subscribe((v) => (current = v))();
      const next = current === 'light' ? 'dark' : 'light';
      set(next);
      applyToDom(next);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (e) {}
      }
    }
  };
}

export const theme = createThemeStore();

// --- CURRENT USER / AUTH STORE ---
function createAuthStore() {
  let initial = null;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (saved) {
        initial = JSON.parse(saved);
      }
    } catch (e) {}
  }

  const { subscribe, set } = writable(initial);

  return {
    subscribe,
    login: (user) => {
      set(user);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
        } catch (e) {}
      }
    },
    logout: () => {
      set(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        } catch (e) {}
      }
    }
  };
}

export const authUser = createAuthStore();
export const authModalOpen = writable(false);
export const authModalTab = writable('in'); // 'in' (Sign In) | 'up' (Sign Up)

// --- CURRENT ACTIVE ROLE STORE ---
// 'pembeli' | 'seller' | 'admin'
function createRoleStore() {
  let initial = 'pembeli';
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved && ['pembeli', 'seller', 'admin'].includes(saved)) {
        initial = saved;
      }
    } catch (e) {}
  }

  const { subscribe, set } = writable(initial);

  return {
    subscribe,
    set: (role) => {
      set(role);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(USER_STORAGE_KEY, role);
        } catch (e) {}
      }
    }
  };
}

export const currentRole = createRoleStore();
export const activeSellerId = writable('s1'); // ID seller yang sedang aktif jika role = 'seller'

// Sync role when authUser changes
authUser.subscribe((user) => {
  if (user && user.role) {
    currentRole.set(user.role);
    if (user.role === 'seller' && user.seller_id) {
      activeSellerId.set(user.seller_id);
    }
  }
});

// --- SELLERS STORE ---
function createSellersStore() {
  const initial = typeof window !== 'undefined' ? db.getSellers() : DEFAULT_SELLERS;
  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set,
    update,
    add: (sellerData) => {
      const newSeller = db.addSeller(sellerData);
      update((list) => [...list, newSeller]);

      // Sync to Neon via backend API
      if (typeof window !== 'undefined') {
        fetch('/api/sellers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sellerData)
        }).catch((err) => console.warn('Could not sync seller to Neon:', err));
      }
      return newSeller;
    },
    updateWa: (sellerId, newWa) => {
      const normalized = normWa(newWa);
      if (!normalized) return false;
      update((list) => {
        const next = list.map((s) => (s.id === sellerId ? { ...s, no_wa: normalized } : s));
        db.saveSellers(next);
        return next;
      });

      // Sync to Neon via backend API
      if (typeof window !== 'undefined') {
        fetch('/api/sellers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sellerId, no_wa: normalized })
        }).catch((err) => console.warn('Could not sync WA update to Neon:', err));
      }
      return true;
    },
    reset: () => {
      db.saveSellers(DEFAULT_SELLERS);
      set([...DEFAULT_SELLERS]);
    }
  };
}

export const sellers = createSellersStore();

// --- PRODUCTS STORE ---
function createProductsStore() {
  const initial = typeof window !== 'undefined' ? db.getProducts() : INITIAL_PRODUCTS;
  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set,
    update,
    add: (productData) => {
      const newProduct = db.addProduct(productData);
      update((list) => [...list, newProduct]);

      // Sync to Neon via backend API
      if (typeof window !== 'undefined') {
        fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct)
        }).catch((err) => console.warn('Could not sync product add to Neon:', err));
      }
      return newProduct;
    },
    edit: (id, productData) => {
      const updated = db.updateProduct(id, productData);
      if (updated) {
        update((list) => list.map((p) => (p.id === id ? { ...p, ...productData } : p)));

        // Sync to Neon via backend API
        if (typeof window !== 'undefined') {
          fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...productData })
          }).catch((err) => console.warn('Could not sync product edit to Neon:', err));
        }
      }
      return updated;
    },
    remove: (id) => {
      db.deleteProduct(id);
      update((list) => list.filter((p) => p.id !== id));

      // Sync to Neon via backend API
      if (typeof window !== 'undefined') {
        fetch('/api/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        }).catch((err) => console.warn('Could not sync product remove to Neon:', err));
      }
    },
    reset: () => {
      db.resetSeed();
      sellers.set([...DEFAULT_SELLERS]);
      set([...INITIAL_PRODUCTS]);
    }
  };
}

export const items = createProductsStore();

/**
 * Sync data with live Neon PostgreSQL via /api/sellers & /api/products
 */
export async function syncWithServer() {
  if (typeof window === 'undefined') return;
  try {
    const [resSellers, resProducts] = await Promise.all([
      fetch('/api/sellers').catch(() => null),
      fetch('/api/products').catch(() => null)
    ]);

    if (resSellers && resSellers.ok) {
      const sData = await resSellers.json();
      if (Array.isArray(sData) && sData.length > 0) {
        sellers.set(sData);
        db.saveSellers(sData);
      }
    }

    if (resProducts && resProducts.ok) {
      const pData = await resProducts.json();
      if (Array.isArray(pData) && pData.length > 0) {
        items.set(pData);
        db.saveProducts(pData);
      }
    }
  } catch (e) {
    console.info('Live sync notice: Using cached offline storage.', e);
  }
}

// Auto sync when loaded in browser
if (typeof window !== 'undefined') {
  syncWithServer();
}

// Filter & Navigation Stores
export const activeTab = writable('cat'); // 'cat' | 'dash'
export const q = writable('');
export const selectedCat = writable('all');
export const selectedSeller = writable('all'); // Filter by seller in catalog
export const sortOrder = writable('feat');

// Toast Notification (With cross-page redirect persistence)
function createToastStore() {
  let initial = '';
  if (typeof window !== 'undefined') {
    try {
      const saved = sessionStorage.getItem('shangyun_toast');
      if (saved) {
        initial = saved;
        sessionStorage.removeItem('shangyun_toast');
        setTimeout(() => toastMsg.set(''), 2500);
      }
    } catch (e) {}
  }
  return writable(initial);
}
export const toastMsg = createToastStore();
let toastTimer;
export function showToast(m) {
  toastMsg.set(m);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('shangyun_toast', m);
    } catch (e) {}
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMsg.set('');
      try {
        sessionStorage.removeItem('shangyun_toast');
      } catch (e) {}
    }, 2400);
  }
}

// Modal Dialog States
export const dialogState = writable({
  open: false,
  editId: null
});

export const sellerModalOpen = writable(false);
export const delConfirmId = writable(null);

// ========================================================
// SHOPPING CART STORE
// - Persistent cart across page refresh
// - Add to cart, update qty, remove item, clear cart
// - Floating cart trigger when cartCount > 0
// ========================================================
const CART_STORAGE_KEY = 'shangyun.cart.v1';

function createCartStore() {
  let initial = [];
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        initial = JSON.parse(saved);
      }
    } catch (e) {}
  }

  const { subscribe, set, update } = writable(initial);

  function save(items) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {}
    }
  }

  return {
    subscribe,
    addItem: (product, qty = 1) => {
      let addedName = product.nama || 'Karya';
      update((items) => {
        const existingIdx = items.findIndex((i) => i.id === product.id);
        const maxStock = Number(product.stok) || 999;
        let next;
        if (existingIdx > -1) {
          next = items.map((item, idx) => {
            if (idx === existingIdx) {
              const newQty = Math.min(item.qty + qty, maxStock);
              return { 
                ...item, 
                qty: newQty, 
                maxStock, 
                harga: product.harga, 
                nama: product.nama, 
                imageUrl: product.imageUrl || product.image_url 
              };
            }
            return item;
          });
        } else {
          const item = {
            id: product.id,
            nama: product.nama,
            kategori: product.kategori,
            harga: Number(product.harga) || 0,
            imageUrl: product.imageUrl || product.image_url,
            seller_id: product.seller_id,
            seller_toko: product.seller_toko || 'Zhao Atelier Suzhou',
            seller_wa: product.seller_wa || '6285738211550',
            maxStock: maxStock,
            qty: Math.min(qty, maxStock)
          };
          next = [...items, item];
        }
        save(next);
        return next;
      });
      showToast(`"${addedName}" berhasil ditambahkan ke keranjang pesanan.`);
    },
    updateQty: (productId, qty) => {
      update((items) => {
        const next = items
          .map((item) => {
            if (item.id === productId) {
              const safeQty = Math.max(1, Math.min(qty, item.maxStock || 999));
              return { ...item, qty: safeQty };
            }
            return item;
          })
          .filter((item) => item.qty > 0);
        save(next);
        return next;
      });
    },
    removeItem: (productId) => {
      update((items) => {
        const next = items.filter((i) => i.id !== productId);
        save(next);
        return next;
      });
      showToast('Karya dihapus dari keranjang.');
    },
    clearCart: () => {
      set([]);
      save([]);
      showToast('Keranjang pesanan dikosongkan.');
    }
  };
}

export const cart = createCartStore();
export const cartOpen = writable(false);

// Derived stores
export const cartCount = derived(cart, ($cart) =>
  $cart.reduce((total, item) => total + (Number(item.qty) || 0), 0)
);

export const cartTotal = derived(cart, ($cart) =>
  $cart.reduce((total, item) => total + (Number(item.harga) || 0) * (Number(item.qty) || 0), 0)
);
