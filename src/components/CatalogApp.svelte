<script>
  import { onMount, tick } from 'svelte';
  import gsap from 'gsap';
  import { DEFAULT_PRODUCTS, SVG_PRESETS, STORAGE_KEY, WA_PHONE_NUMBER, BRAND_NAME, formatRupiah } from '../data/products.js';

  // State Variables
  let products = [];
  let activeView = 'catalog'; // 'catalog' | 'dashboard'
  let searchQuery = '';
  let selectedCategory = 'Semua';
  let sortOption = 'featured';
  let featuredOnly = false;
  let dashSearchQuery = '';

  // Modals & Popups
  let isDetailModalOpen = false;
  let detailProduct = null;

  let isFormModalOpen = false;
  let formMode = 'add'; // 'add' | 'edit'
  let formId = '';
  let formNama = '';
  let formKategori = 'Keramik & Porselen';
  let formHarga = 5000000;
  let formStok = 3;
  let formDeskripsi = '';
  let formImageUrl = SVG_PRESETS['preset-vase'];
  let formUnggulan = false;
  let formPresetKey = 'preset-vase';

  // Toasts
  let toasts = [];

  function showToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 3500);
  }

  // Storage Functions
  function loadDatabase() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        products = JSON.parse(stored);
      } else {
        products = [...DEFAULT_PRODUCTS];
        saveDatabase();
      }
    } catch (e) {
      console.error('Error loading localStorage:', e);
      products = [...DEFAULT_PRODUCTS];
    }
  }

  function saveDatabase() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  function resetToDefault() {
    if (confirm('Kembalikan 8 mahakarya bawaan? Seluruh perubahan kustom akan digantikan.')) {
      products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
      saveDatabase();
      showToast('Data berhasil direset ke 8 karya bawaan', 'success');
      triggerGsapCards();
    }
  }

  // Derived Calculations
  $: categories = ['Semua', ...Array.from(new Set(products.map(p => p.kategori).filter(Boolean)))];

  $: filteredCatalogProducts = (() => {
    let list = products.filter(p => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || p.nama.toLowerCase().includes(q) || p.deskripsi.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q);
      const matchCategory = selectedCategory === 'Semua' || p.kategori === selectedCategory;
      const matchFeatured = !featuredOnly || p.unggulan;
      return matchSearch && matchCategory && matchFeatured;
    });

    list.sort((a, b) => {
      if (sortOption === 'featured') {
        if (a.unggulan === b.unggulan) return b.harga - a.harga;
        return a.unggulan ? -1 : 1;
      } else if (sortOption === 'price-asc') {
        return a.harga - b.harga;
      } else if (sortOption === 'price-desc') {
        return b.harga - a.harga;
      } else if (sortOption === 'name-asc') {
        return a.nama.localeCompare(b.nama);
      } else if (sortOption === 'stock-desc') {
        return b.stok - a.stok;
      }
      return 0;
    });

    return list;
  })();

  $: filteredDashProducts = products.filter(p => {
    const q = dashSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return p.id.toLowerCase().includes(q) || p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q);
  });

  // Metrics
  $: totalProducts = products.length;
  $: totalStock = products.reduce((acc, p) => acc + (Number(p.stok) || 0), 0);
  $: totalCategories = categories.length - 1;
  $: totalFeatured = products.filter(p => p.unggulan).length;
  $: totalInventoryValue = products.reduce((acc, p) => acc + ((Number(p.harga) || 0) * (Number(p.stok) || 0)), 0);

  // GSAP Animation Trigger
  async function triggerGsapCards() {
    await tick();
    if (typeof window !== 'undefined') {
      gsap.fromTo(
        '.product-card',
        { opacity: 0, y: 35, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out' }
      );
    }
  }

  function switchView(view) {
    activeView = view;
    if (view === 'catalog') {
      triggerGsapCards();
    }
  }

  // Modals
  function openDetailModal(product) {
    detailProduct = product;
    isDetailModalOpen = true;
  }

  function closeDetailModal() {
    isDetailModalOpen = false;
    detailProduct = null;
  }

  function openFormModal(mode, product = null) {
    formMode = mode;
    if (mode === 'add') {
      const nextId = `SY-${String(products.length + 1).padStart(3, '0')}`;
      formId = nextId;
      formNama = '';
      formKategori = 'Keramik & Porselen';
      formHarga = 5000000;
      formStok = 3;
      formDeskripsi = '';
      formPresetKey = 'preset-vase';
      formImageUrl = SVG_PRESETS['preset-vase'];
      formUnggulan = false;
    } else if (product) {
      formId = product.id;
      formNama = product.nama;
      formKategori = product.kategori;
      formHarga = product.harga;
      formStok = product.stok;
      formDeskripsi = product.deskripsi;
      formImageUrl = product.imageUrl;
      formUnggulan = product.unggulan;
      formPresetKey = 'custom';
    }
    isFormModalOpen = true;
  }

  function closeFormModal() {
    isFormModalOpen = false;
  }

  function handlePresetChange(e) {
    const key = e.target.value;
    formPresetKey = key;
    if (key !== 'custom' && SVG_PRESETS[key]) {
      formImageUrl = SVG_PRESETS[key];
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    if (!formId || !formNama || !formKategori || isNaN(formHarga) || isNaN(formStok) || !formDeskripsi || !formImageUrl) {
      showToast('Harap lengkapi seluruh kolom formulir bertanda *', 'danger');
      return;
    }

    if (formHarga < 0 || formStok < 0) {
      showToast('Harga dan stok tidak boleh bernilai negatif', 'danger');
      return;
    }

    if (formMode === 'add') {
      const exists = products.some(p => p.id.toLowerCase() === formId.toLowerCase());
      if (exists) {
        showToast(`ID "${formId}" sudah digunakan, mohon gunakan ID unik lain`, 'danger');
        return;
      }
      const newP = {
        id: formId,
        nama: formNama,
        kategori: formKategori,
        harga: Number(formHarga),
        stok: Number(formStok),
        deskripsi: formDeskripsi,
        imageUrl: formImageUrl,
        unggulan: formUnggulan
      };
      products = [newP, ...products];
      showToast(`Karya "${formNama}" berhasil ditambahkan ke etalase!`, 'success');
    } else {
      const idx = products.findIndex(p => p.id === formId);
      if (idx !== -1) {
        products[idx] = {
          id: formId,
          nama: formNama,
          kategori: formKategori,
          harga: Number(formHarga),
          stok: Number(formStok),
          deskripsi: formDeskripsi,
          imageUrl: formImageUrl,
          unggulan: formUnggulan
        };
        products = [...products];
        showToast(`Perubahan data "${formNama}" tersimpan`, 'success');
      }
    }

    saveDatabase();
    closeFormModal();
    if (activeView === 'catalog') {
      triggerGsapCards();
    }
  }

  function deleteProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    if (confirm(`Hapus karya pusaka "${p.nama}" (ID: ${p.id})?`)) {
      products = products.filter(x => x.id !== id);
      saveDatabase();
      showToast(`Karya "${p.nama}" telah dihapus`, 'success');
    }
  }

  function generateWaLink(item) {
    const msg = `Halo ${BRAND_NAME},\n\nSaya ingin memesan karya eksklusif Imlek:\n*${item.nama}* (ID: ${item.id})\nHarga: ${formatRupiah(item.harga)}\n\nMohon konfirmasi ketersediaan unit dan opsi pengiriman eksklusif. Terima kasih.`;
    return `https://wa.me/${WA_PHONE_NUMBER}?text=${encodeURIComponent(msg)}`;
  }

  onMount(() => {
    loadDatabase();
    triggerGsapCards();

    // GSAP Header Brand Shimmer
    if (typeof window !== 'undefined') {
      gsap.to('.brand-seal', {
        boxShadow: '0 0 24px rgba(212, 175, 55, 0.7)',
        repeat: -1,
        yoyo: true,
        duration: 1.8,
        ease: 'sine.inOut'
      });
    }
  });
</script>

<div class="app-wrapper">
  <!-- Sticky Site Navigation Header -->
  <header class="site-header">
    <div class="container header-inner">
      <div class="brand-group" on:click={() => switchView('catalog')}>
        <div class="brand-seal">韵</div>
        <div class="brand-text">
          <h1>Shang Yun</h1>
          <span>Imperial Lunar New Year Atelier</span>
        </div>
      </div>

      <!-- View Switcher -->
      <div class="view-switcher" role="tablist">
        <button 
          class="view-btn {activeView === 'catalog' ? 'active' : ''}" 
          on:click={() => switchView('catalog')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Katalog Pembeli
        </button>
        <button 
          class="view-btn {activeView === 'dashboard' ? 'active' : ''}" 
          on:click={() => switchView('dashboard')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M12 20v-6M6 20V10M18 20V4"></path>
          </svg>
          Dashboard Pengelola
        </button>
      </div>
    </div>
  </header>

  <!-- ==============================================
       1. VIEW: KATALOG PEMBELI
       ============================================== -->
  {#if activeView === 'catalog'}
    <main class="catalog-section">
      <!-- Hero Banner -->
      <section class="hero-section">
        <div class="container hero-content">
          <div class="hero-tag">
            <span class="dot"></span>
            Koleksi Pusaka Tahun Baru Imlek 2026
          </div>
          <h2 class="hero-title">
            Kemegahan Pusaka Imlek, <br>
            <span class="gold-accent">Keabadian Mahakarya Tradisi.</span>
          </h2>
          <p class="hero-desc">
            Kurasi cinderamata dan kerajinan tangan tingkat istana berbalut kemewahan emas, giok, dan sutra. Diciptakan dengan presisi artisanal untuk penghormatan tertinggi keluarga dan relasi bisnis VIP Anda.
          </p>

          <div class="hero-highlights">
            <div class="highlight-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              100% Kerajinan Otentik
            </div>
            <div class="highlight-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Kemasan Kotak Kayu Sutra
            </div>
            <div class="highlight-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Edisi Terbatas Setiap Musim
            </div>
          </div>
        </div>
      </section>

      <!-- Controls Panel -->
      <section class="container">
        <div class="controls-panel">
          <div class="controls-row-top">
            <div class="search-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                class="search-input" 
                placeholder="Cari nama karya, ornamen, atau filosofi..." 
                bind:value={searchQuery}
                on:input={triggerGsapCards}
              />
            </div>

            <div class="sort-wrap">
              <label for="sortSelect">Urutan:</label>
              <select id="sortSelect" class="custom-select" bind:value={sortOption} on:change={triggerGsapCards}>
                <option value="featured">Koleksi Unggulan Pertama</option>
                <option value="price-asc">Harga: Terendah ke Tertinggi</option>
                <option value="price-desc">Harga: Tertinggi ke Terendah</option>
                <option value="name-asc">Nama Karya: A — Z</option>
                <option value="stock-desc">Ketersediaan Stok Terbanyak</option>
              </select>
            </div>
          </div>

          <div class="controls-row-bottom">
            <div class="category-chips">
              {#each categories as cat}
                <button 
                  class="chip-btn {selectedCategory === cat ? 'active' : ''}" 
                  on:click={() => { selectedCategory = cat; triggerGsapCards(); }}
                >
                  <span>{cat}</span>
                  <span class="chip-count">
                    ({cat === 'Semua' ? products.length : products.filter(p => p.kategori === cat).length})
                  </span>
                </button>
              {/each}
            </div>

            <label class="featured-toggle-label">
              <input type="checkbox" bind:checked={featuredOnly} on:change={triggerGsapCards} />
              <span>Hanya Koleksi Unggulan ★</span>
            </label>
          </div>
        </div>

        <!-- Status Info Bar -->
        <div class="catalog-status-bar">
          <span>Menampilkan {filteredCatalogProducts.length} dari {products.length} karya pusaka</span>
          <span style="color: var(--gold-primary); font-size: 0.78rem;">Pengiriman Khusus VIP Courier & Asuransi Penuh</span>
        </div>

        <!-- Grid of Product Cards -->
        <div class="products-grid">
          {#if filteredCatalogProducts.length === 0}
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h3>Tidak Ada Karya yang Sesuai</h3>
              <p>Silakan sesuaikan kata kunci pencarian, pilih kategori lain, atau matikan filter unggulan.</p>
            </div>
          {:else}
            {#each filteredCatalogProducts as item (item.id)}
              <div class="product-card">
                <div class="card-media-wrap" on:click={() => openDetailModal(item)}>
                  {#if item.unggulan}
                    <span class="badge-featured">★ IMPERIAL PICK</span>
                  {/if}
                  
                  {#if item.stok <= 0}
                    <span class="badge-stock empty">Pemesanan Khusus (0 Pcs)</span>
                  {:else if item.stok <= 2}
                    <span class="badge-stock low">Sisa {item.stok} Unit Eksklusif</span>
                  {:else}
                    <span class="badge-stock">Tersedia {item.stok} Unit</span>
                  {/if}

                  <img src={item.imageUrl} alt={item.nama} loading="lazy" />
                </div>

                <div class="card-body">
                  <div class="card-category">{item.kategori}</div>
                  <h3 class="card-title">{item.nama}</h3>
                  <p class="card-desc">{item.deskripsi}</p>

                  <div class="card-price-row">
                    <span class="price-label">Nilai Mahakarya</span>
                    <span class="card-price">{formatRupiah(item.harga)}</span>
                  </div>

                  <div class="card-actions">
                    <button class="btn btn-detail" on:click={() => openDetailModal(item)}>
                      Detail Karya
                    </button>
                    <a 
                      href={generateWaLink(item)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="btn btn-wa {item.stok <= 0 ? 'disabled' : ''}"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.99.69.45-.05 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z"/>
                      </svg>
                      Pesan via WA
                    </a>
                  </div>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </section>
    </main>
  {/if}

  <!-- ==============================================
       2. VIEW: DASHBOARD PENGELOLA (ADMIN CRUD)
       ============================================== -->
  {#if activeView === 'dashboard'}
    <main class="dashboard-section container">
      <div class="dash-header">
        <div class="dash-title-group">
          <h2>Dashboard Kurasi & Inventaris</h2>
          <p>Pengelolaan data karya, penyesuaian stok, status unggulan, dan verifikasi pesanan.</p>
        </div>
        <div class="dash-actions-top">
          <button class="btn btn-outline-gold" on:click={resetToDefault}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            Reset Data Bawaan
          </button>
          <button class="btn btn-gold" on:click={() => openFormModal('add')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Karya Baru
          </button>
        </div>
      </div>

      <!-- KPI Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Ragam Karya</div>
          <div class="metric-value">{totalProducts}</div>
          <div class="metric-sub">Katalog produk aktif</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Unit Fisik</div>
          <div class="metric-value">{totalStock}</div>
          <div class="metric-sub">Unit siap dikirim</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Kategori Kerajinan</div>
          <div class="metric-value">{totalCategories}</div>
          <div class="metric-sub">Spesialisasi bahan</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Koleksi Unggulan</div>
          <div class="metric-value">{totalFeatured}</div>
          <div class="metric-sub">Highlight etalase depan</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Nilai Inventaris</div>
          <div class="metric-value" style="font-size: 1.4rem;">{formatRupiah(totalInventoryValue)}</div>
          <div class="metric-sub">Estimasi aset tersimpan</div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="table-container-card">
        <div class="table-toolbar">
          <div class="search-input-wrap" style="max-width: 320px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              class="search-input" 
              placeholder="Filter data tabel..." 
              bind:value={dashSearchQuery}
            />
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            Tersimpan lokal di peramban (<span style="color: var(--gold-light);">localStorage</span>)
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Karya & Kategori</th>
                <th>Harga (IDR)</th>
                <th>Stok</th>
                <th>Unggulan</th>
                <th style="text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {#if filteredDashProducts.length === 0}
                <tr>
                  <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    Tidak ada data karya yang sesuai pencarian.
                  </td>
                </tr>
              {:else}
                {#each filteredDashProducts as item (item.id)}
                  <tr>
                    <td style="font-family: monospace; color: var(--gold-light); font-weight: 600;">{item.id}</td>
                    <td>
                      <div class="table-product-cell">
                        <img class="table-thumb" src={item.imageUrl} alt={item.nama} />
                        <div>
                          <span class="table-prod-name">{item.nama}</span>
                          <span class="table-prod-cat">{item.kategori}</span>
                        </div>
                      </div>
                    </td>
                    <td style="font-weight: 600; color: #fff;">{formatRupiah(item.harga)}</td>
                    <td>
                      <span style="font-weight: 600; {item.stok <= 2 ? 'color: #ff8a80;' : 'color: var(--text-primary);'}">
                        {item.stok} pcs
                      </span>
                    </td>
                    <td>
                      {#if item.unggulan}
                        <span class="tag-featured-pill">★ Unggulan</span>
                      {:else}
                        <span class="tag-regular-pill">Biasa</span>
                      {/if}
                    </td>
                    <td style="text-align: right;">
                      <div class="table-action-btns" style="justify-content: flex-end;">
                        <button class="btn-action-icon" title="Edit Karya" on:click={() => openFormModal('edit', item)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button class="btn-action-icon danger" title="Hapus Karya" on:click={() => deleteProduct(item.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  {/if}

  <!-- ==============================================
       3. MODAL DETAIL PRODUK
       ============================================== -->
  {#if isDetailModalOpen && detailProduct}
    <div class="modal-backdrop open" on:click={closeDetailModal}>
      <div class="modal-dialog" style="max-width: 720px;" on:click|stopPropagation>
        <div class="modal-header">
          <h3 class="modal-title">Detail Mahakarya</h3>
          <button class="modal-close-btn" on:click={closeDetailModal}>&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-body-layout">
            <div class="detail-img-wrap">
              <img src={detailProduct.imageUrl} alt={detailProduct.nama} />
            </div>
            <div>
              <div class="card-category">{detailProduct.kategori}</div>
              <h2 style="font-family: var(--font-display); font-size: 1.4rem; color: var(--gold-light); margin-bottom: 12px; line-height: 1.3;">
                {detailProduct.nama}
              </h2>
              <div style="font-family: var(--font-display); font-size: 1.5rem; color: #fff; font-weight: 700; margin-bottom: 16px;">
                {formatRupiah(detailProduct.harga)}
              </div>
              <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">
                {detailProduct.deskripsi}
              </p>

              <div class="detail-meta-list">
                <div class="detail-meta-item">
                  <span class="lbl">Nomor Seri (ID):</span>
                  <span class="val">{detailProduct.id}</span>
                </div>
                <div class="detail-meta-item">
                  <span class="lbl">Ketersediaan Unit:</span>
                  <span class="val">{detailProduct.stok} unit tersedia</span>
                </div>
                <div class="detail-meta-item">
                  <span class="lbl">Sertifikasi:</span>
                  <span class="val">Artisan Authenticity Certificate</span>
                </div>
                <div class="detail-meta-item">
                  <span class="lbl">Kemasan Eksklusif:</span>
                  <span class="val">Silk Brocade Hardcase Box</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="justify-content: space-between;">
          <button class="btn btn-outline-gold" on:click={closeDetailModal}>Tutup</button>
          <a 
            href={generateWaLink(detailProduct)} 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn btn-wa {detailProduct.stok <= 0 ? 'disabled' : ''}"
          >
            Reservasi Koleksi via WhatsApp
          </a>
        </div>
      </div>
    </div>
  {/if}

  <!-- ==============================================
       4. MODAL CRUD: TAMBAH / EDIT PRODUK
       ============================================== -->
  {#if isFormModalOpen}
    <div class="modal-backdrop open" on:click={closeFormModal}>
      <div class="modal-dialog" on:click|stopPropagation>
        <div class="modal-header">
          <h3 class="modal-title">
            {formMode === 'add' ? 'Tambah Mahakarya Baru' : `Edit Karya: ${formNama}`}
          </h3>
          <button class="modal-close-btn" on:click={closeFormModal}>&times;</button>
        </div>
        <form on:submit={handleFormSubmit}>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="formIdInput">ID Produk <span class="required">*</span></label>
                <input 
                  id="formIdInput"
                  type="text" 
                  class="form-control" 
                  bind:value={formId} 
                  readonly={formMode === 'edit'} 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="formKategoriInput">Kategori <span class="required">*</span></label>
                <input 
                  id="formKategoriInput"
                  type="text" 
                  class="form-control" 
                  list="categoryListDatalist" 
                  bind:value={formKategori} 
                  required 
                />
                <datalist id="categoryListDatalist">
                  <option value="Keramik & Porselen"></option>
                  <option value="Tekstil & Sulaman"></option>
                  <option value="Ukiran Batu Mulia"></option>
                  <option value="Kerajinan Lak & Kayu"></option>
                  <option value="Logam & Emas"></option>
                  <option value="Dekorasi Ruang"></option>
                  <option value="Aksesori & Gift Box"></option>
                </datalist>
              </div>

              <div class="form-group col-span-2">
                <label class="form-label" for="formNamaInput">Nama Karya Kerajinan <span class="required">*</span></label>
                <input 
                  id="formNamaInput"
                  type="text" 
                  class="form-control" 
                  placeholder="Contoh: Vas Porselen Lukis Emas Dinasti" 
                  bind:value={formNama} 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="formHargaInput">Harga Satuan (Rp) <span class="required">*</span></label>
                <input 
                  id="formHargaInput"
                  type="number" 
                  class="form-control" 
                  min="0" 
                  step="1000" 
                  bind:value={formHarga} 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="formStokInput">Jumlah Stok (Pcs) <span class="required">*</span></label>
                <input 
                  id="formStokInput"
                  type="number" 
                  class="form-control" 
                  min="0" 
                  step="1" 
                  bind:value={formStok} 
                  required 
                />
              </div>

              <div class="form-group col-span-2">
                <label class="form-label" for="formDescInput">Deskripsi Filosofi & Bahan <span class="required">*</span></label>
                <textarea 
                  id="formDescInput"
                  class="form-control" 
                  rows="3" 
                  bind:value={formDeskripsi} 
                  placeholder="Ceritakan filosofi kemakmuran, bahan langka, dan teknik pengerjaannya..."
                  required
                ></textarea>
              </div>

              <div class="form-group col-span-2">
                <label class="form-label" for="formPresetSelect">Pilihan Gambar / Preset SVG</label>
                <select 
                  id="formPresetSelect"
                  class="custom-select" 
                  style="width: 100%; margin-bottom: 8px;" 
                  value={formPresetKey} 
                  on:change={handlePresetChange}
                >
                  <option value="custom">Input URL Gambar Sendiri</option>
                  <option value="preset-vase">Preset: Imperial Cloisonné Dragon Vase</option>
                  <option value="preset-fan">Preset: Golden Phoenix Silk Fan</option>
                  <option value="preset-ruyi">Preset: Master Hetian Jade Ruyi</option>
                  <option value="preset-tea">Preset: Cinnabar Lacquer Tea Set</option>
                  <option value="preset-tree">Preset: 24K Gold Leaf Prosperity Tree</option>
                  <option value="preset-lantern">Preset: Rosewood Palace Lantern</option>
                  <option value="preset-teapot">Preset: Master Yixing Zisha Teapot</option>
                  <option value="preset-box">Preset: Royal Crimson Velvet Box</option>
                </select>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="URL gambar atau data:image/svg+xml..." 
                  bind:value={formImageUrl} 
                  required 
                />
                <div class="image-preview-box">
                  {#if formImageUrl}
                    <img src={formImageUrl} alt="Pratinjau" style="max-height: 100%; object-fit: contain;" />
                  {:else}
                    <span style="color: var(--text-muted); font-size: 0.8rem;">Pratinjau visual karya</span>
                  {/if}
                </div>
              </div>

              <div class="form-group col-span-2">
                <label class="form-checkbox-row">
                  <input type="checkbox" bind:checked={formUnggulan} />
                  <span style="font-size: 0.85rem; color: var(--gold-light);">
                    Tandai sebagai Koleksi Unggulan (Tampil di banner & badge ★ IMPERIAL PICK)
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-gold" on:click={closeFormModal}>Batal</button>
            <button type="submit" class="btn btn-gold">Simpan Karya</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Floating Toast Notifications -->
  <div class="toast-container">
    {#each toasts as toast (toast.id)}
      <div class="toast {toast.type}">
        <span>{toast.type === 'success' ? '✓' : '✕'}</span>
        <span>{toast.message}</span>
      </div>
    {/each}
  </div>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-seal">尚韵</div>
      <p style="font-family: var(--font-display); letter-spacing: 2px; color: var(--gold-light);">SHANG YUN (尚韵) — EXCLUSIVE LUNAR NEW YEAR ATELIER</p>
      <p class="footer-notice">
        Dibangun dengan Astro + Svelte 5 + Three.js + GSAP untuk kurasi kerajinan tangan mewah perayaan Imlek. Beroperasi secara lokal melalui LocalStorage.
      </p>
    </div>
  </footer>
</div>

<style>
  .app-wrapper {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  header.site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(13, 7, 8, 0.94);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--border-gold);
    padding: 14px 0;
  }

  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .brand-group {
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    text-decoration: none;
  }

  .brand-seal {
    width: 44px;
    height: 44px;
    border: 2px solid var(--gold-primary);
    background: linear-gradient(135deg, var(--crimson-primary), var(--crimson-deep));
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Noto Serif SC', serif;
    font-weight: 700;
    color: var(--gold-light);
    font-size: 1.35rem;
    border-radius: var(--radius-sm);
    box-shadow: 0 0 14px rgba(212, 175, 55, 0.35);
    position: relative;
  }

  .brand-text h1 {
    font-family: var(--font-display);
    font-size: 1.35rem;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    background: var(--gold-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.15;
  }

  .brand-text span {
    font-size: 0.7rem;
    letter-spacing: 2px;
    color: var(--text-muted);
    text-transform: uppercase;
    display: block;
  }

  /* View Switcher */
  .view-switcher {
    display: flex;
    background: var(--bg-surface);
    border: 1px solid var(--border-gold);
    border-radius: 999px;
    padding: 4px;
    gap: 4px;
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.4);
  }

  .view-btn {
    padding: 8px 18px;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: var(--transition);
  }

  .view-btn:hover {
    color: var(--text-primary);
  }

  .view-btn.active {
    background: var(--gold-gradient);
    color: #120708;
    box-shadow: 0 2px 10px rgba(212, 175, 55, 0.4);
  }

  /* Hero */
  .hero-section {
    padding: 64px 0 36px;
    position: relative;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  }

  .hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(139, 21, 36, 0.4);
    border: 1px solid var(--border-gold);
    padding: 4px 14px;
    border-radius: 999px;
    font-size: 0.75rem;
    color: var(--gold-light);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .hero-tag .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold-primary);
    box-shadow: 0 0 8px var(--gold-primary);
  }

  .hero-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 3.2rem);
    font-weight: 900;
    line-height: 1.2;
    margin-bottom: 16px;
  }

  .gold-accent {
    background: var(--gold-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
  }

  .hero-desc {
    color: var(--text-secondary);
    max-width: 680px;
    font-size: 1rem;
    font-weight: 300;
    margin-bottom: 28px;
  }

  .hero-highlights {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .highlight-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--gold-gradient-soft);
    border: 1px solid var(--border-gold);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    color: var(--text-gold);
  }

  /* Controls */
  .controls-panel {
    background: var(--bg-surface);
    border: 1px solid var(--border-gold);
    border-radius: var(--radius-md);
    padding: 20px;
    margin: 32px 0 24px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .controls-row-top {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .search-input-wrap {
    position: relative;
    flex: 1;
    min-width: 260px;
  }

  .search-input-wrap svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gold-primary);
  }

  .search-input {
    width: 100%;
    background: var(--bg-surface-elevated);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: var(--radius-sm);
    padding: 10px 14px 10px 42px;
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.9rem;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--gold-primary);
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
  }

  .sort-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sort-wrap label {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .custom-select {
    background: var(--bg-surface-elevated);
    border: 1px solid rgba(212, 175, 55, 0.25);
    color: var(--text-gold);
    padding: 10px 16px;
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: 0.85rem;
    cursor: pointer;
  }

  .controls-row-bottom {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .category-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .chip-btn {
    background: var(--bg-surface-elevated);
    border: 1px solid rgba(212, 175, 55, 0.2);
    color: var(--text-secondary);
    font-size: 0.78rem;
    padding: 6px 14px;
    border-radius: 999px;
    cursor: pointer;
    transition: var(--transition);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .chip-btn.active {
    background: var(--crimson-deep);
    border-color: var(--gold-primary);
    color: var(--gold-light);
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
  }

  .chip-count {
    opacity: 0.6;
    font-size: 0.7rem;
  }

  .featured-toggle-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.82rem;
    color: var(--text-gold);
    user-select: none;
  }

  .featured-toggle-label input {
    accent-color: var(--gold-primary);
    width: 16px;
    height: 16px;
  }

  /* Catalog Status */
  .catalog-status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  /* Grid */
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
    gap: 28px;
    margin-bottom: 60px;
  }

  .product-card {
    background: var(--bg-card);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: var(--transition);
    position: relative;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }

  .product-card:hover {
    transform: translateY(-6px);
    border-color: var(--gold-primary);
    box-shadow: var(--shadow-luxury);
  }

  .card-media-wrap {
    position: relative;
    width: 100%;
    height: 250px;
    background: #110809;
    overflow: hidden;
    cursor: pointer;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  }

  .card-media-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .product-card:hover .card-media-wrap img {
    transform: scale(1.05);
  }

  .badge-featured {
    position: absolute;
    top: 12px;
    left: 12px;
    background: var(--gold-gradient);
    color: #1a080a;
    font-family: var(--font-display);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    z-index: 2;
  }

  .badge-stock {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(13, 7, 8, 0.85);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(212, 175, 55, 0.4);
    color: var(--text-gold);
    font-size: 0.7rem;
    padding: 3px 8px;
    border-radius: 999px;
    z-index: 2;
  }

  .badge-stock.low {
    border-color: #ff5252;
    color: #ff8a80;
  }

  .badge-stock.empty {
    background: rgba(184, 28, 46, 0.9);
    color: #fff;
    border-color: #ff5252;
  }

  .card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .card-category {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--gold-primary);
    margin-bottom: 6px;
    font-weight: 600;
  }

  .card-title {
    font-family: var(--font-display);
    font-size: 1.15rem;
    color: var(--text-primary);
    line-height: 1.35;
    margin-bottom: 10px;
    font-weight: 700;
  }

  .card-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: 18px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex-grow: 1;
  }

  .card-price-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 16px;
    padding-top: 12px;
    border-top: 1px dashed rgba(212, 175, 55, 0.2);
  }

  .price-label {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .card-price {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--gold-light);
  }

  .card-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: var(--transition);
    border: none;
  }

  .btn-detail {
    background: var(--bg-surface-elevated);
    border: 1px solid var(--border-gold);
    color: var(--text-gold);
  }

  .btn-detail:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: var(--gold-primary);
  }

  .btn-wa {
    background: linear-gradient(135deg, #1fa54e, #136932);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(31, 165, 78, 0.3);
  }

  .btn-wa:hover {
    background: linear-gradient(135deg, #25c05c, #17813e);
  }

  .btn-wa.disabled {
    opacity: 0.5;
    pointer-events: none;
    background: #444;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 20px;
    background: var(--bg-surface);
    border: 1px dashed var(--border-gold);
    border-radius: var(--radius-md);
  }

  .empty-state svg {
    color: var(--gold-primary);
    margin-bottom: 12px;
    opacity: 0.7;
  }

  /* Dashboard Styles */
  .dashboard-section {
    padding: 32px 0 60px;
  }

  .dash-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
  }

  .dash-title-group h2 {
    font-family: var(--font-display);
    font-size: 1.8rem;
    color: var(--gold-light);
  }

  .dash-title-group p {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .dash-actions-top {
    display: flex;
    gap: 12px;
  }

  .btn-gold {
    background: var(--gold-gradient);
    color: #160709;
    font-weight: 700;
  }

  .btn-outline-gold {
    background: transparent;
    border: 1px solid var(--border-gold);
    color: var(--gold-light);
  }

  /* Metrics */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 18px;
    margin-bottom: 32px;
  }

  .metric-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-gold);
    border-radius: var(--radius-md);
    padding: 20px;
    position: relative;
    overflow: hidden;
  }

  .metric-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--gold-primary);
  }

  .metric-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .metric-value {
    font-family: var(--font-display);
    font-size: 1.9rem;
    font-weight: 700;
    color: var(--gold-light);
  }

  .metric-sub {
    font-size: 0.72rem;
    color: var(--text-secondary);
    margin-top: 6px;
  }

  /* Table */
  .table-container-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-gold);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .table-toolbar {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
    background: var(--bg-surface-elevated);
  }

  .table-responsive {
    width: 100%;
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .data-table th {
    background: rgba(13, 7, 8, 0.6);
    padding: 14px 18px;
    color: var(--gold-primary);
    font-family: var(--font-display);
    letter-spacing: 1px;
    text-transform: uppercase;
    font-size: 0.72rem;
    border-bottom: 1px solid var(--border-gold);
  }

  .data-table td {
    padding: 14px 18px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.1);
    color: var(--text-secondary);
  }

  .table-product-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .table-thumb {
    width: 44px;
    height: 44px;
    border-radius: 6px;
    border: 1px solid var(--border-gold);
    object-fit: cover;
  }

  .table-prod-name {
    font-weight: 600;
    color: var(--text-primary);
    display: block;
  }

  .table-prod-cat {
    font-size: 0.72rem;
    color: var(--gold-primary);
  }

  .tag-featured-pill {
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid var(--border-gold);
    color: var(--gold-light);
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 0.7rem;
  }

  .tag-regular-pill {
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .table-action-btns {
    display: flex;
    gap: 8px;
  }

  .btn-action-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(212, 175, 55, 0.25);
    background: var(--bg-surface-elevated);
    color: var(--text-secondary);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn-action-icon:hover {
    border-color: var(--gold-primary);
    color: var(--gold-light);
  }

  .btn-action-icon.danger:hover {
    border-color: #ff5252;
    color: #ff5252;
  }

  /* Modals */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(8, 4, 5, 0.85);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal-dialog {
    background: var(--bg-surface);
    border: 1px solid var(--gold-primary);
    border-radius: var(--radius-md);
    width: 100%;
    max-width: 640px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-luxury);
  }

  .modal-header {
    padding: 18px 24px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-surface-elevated);
  }

  .modal-title {
    font-family: var(--font-display);
    font-size: 1.25rem;
    color: var(--gold-light);
  }

  .modal-close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 1.4rem;
  }

  .modal-body {
    padding: 24px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .form-group.col-span-2 {
    grid-column: span 2;
  }

  .form-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-gold);
    text-transform: uppercase;
  }

  .required {
    color: #ff5252;
  }

  .form-control {
    background: var(--bg-surface-elevated);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.9rem;
  }

  .form-control:focus {
    outline: none;
    border-color: var(--gold-primary);
  }

  .form-checkbox-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-surface-elevated);
    border: 1px solid rgba(212, 175, 55, 0.2);
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .image-preview-box {
    width: 100%;
    height: 120px;
    border: 1px dashed var(--border-gold);
    border-radius: var(--radius-sm);
    background: #100708;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-top: 6px;
  }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(212, 175, 55, 0.2);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background: var(--bg-surface-elevated);
  }

  /* Detail Layout */
  .detail-body-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .detail-img-wrap {
    width: 100%;
    height: 280px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid var(--border-gold);
    background: #100708;
  }

  .detail-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .detail-meta-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .detail-meta-item {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
    padding-bottom: 6px;
    font-size: 0.85rem;
  }

  .detail-meta-item .lbl {
    color: var(--text-muted);
  }

  .detail-meta-item .val {
    color: var(--text-gold);
    font-weight: 600;
  }

  /* Toasts */
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }

  .toast {
    background: var(--bg-surface-elevated);
    border: 1px solid var(--gold-primary);
    color: var(--text-primary);
    padding: 12px 18px;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-luxury);
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 10px;
    pointer-events: auto;
  }

  .toast.success {
    border-left: 4px solid #48a966;
  }

  .toast.danger {
    border-left: 4px solid #ff5252;
  }

  /* Footer */
  footer.site-footer {
    border-top: 1px solid rgba(212, 175, 55, 0.2);
    padding: 40px 0 24px;
    background: #090405;
    color: var(--text-muted);
    font-size: 0.8rem;
    text-align: center;
    margin-top: auto;
  }

  .footer-seal {
    font-family: 'Noto Serif SC', serif;
    color: var(--gold-primary);
    font-size: 1.5rem;
    margin-bottom: 10px;
  }

  .footer-notice {
    max-width: 600px;
    margin: 8px auto 0;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    .header-inner {
      flex-direction: column;
    }
    .detail-body-layout {
      grid-template-columns: 1fr;
    }
    .form-grid {
      grid-template-columns: 1fr;
    }
    .form-group.col-span-2 {
      grid-column: span 1;
    }
  }
</style>

