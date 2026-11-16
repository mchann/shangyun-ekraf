<script>
  import { onMount } from 'svelte';
  import { 
    items, 
    sellers, 
    currentRole, 
    activeSellerId, 
    showToast, 
    dialogState, 
    sellerModalOpen, 
    delConfirmId,
    authUser,
    theme,
    activeTab
  } from '../stores/store.js';
  import { img, ph, rp, normWa, waLocal } from '../data/seed.js';

  // Active Menu in Sidebar: 'overview' | 'products' | 'wa' | 'admin'
  let currentMenu = 'overview';
  let sidebarOpen = false;
  let showNotifications = false;

  // Sync role to admin tab if role is admin
  $: if ($currentRole === 'admin' && currentMenu === 'admin') {
    // admin section
  }

  // Active seller object
  $: activeSeller = $sellers.find((s) => s.id === $activeSellerId) || $sellers[0] || {
    id: 's1',
    nama: 'Master Chen Zhao',
    nama_toko: 'Zhao Atelier Suzhou',
    no_wa: '6285738211550',
    spesialisasi: 'Sulam Sutra & Kipas'
  };

  // WhatsApp input for current seller
  let waInput = '';
  let waErr = '';

  $: if (activeSeller && activeSeller.no_wa) {
    waInput = waLocal(activeSeller.no_wa);
  }

  function handleSaveSellerWa() {
    const n = normWa(waInput);
    if (!n) {
      waErr = 'Masukkan nomor Indonesia yang valid, contoh 085738211550.';
      return;
    }
    waErr = '';
    const success = sellers.updateWa(activeSeller.id, n);
    if (success) {
      showToast(`Nomor WhatsApp untuk ${activeSeller.nama_toko} disimpan.`);
    }
  }

  // Seller filtered products
  $: sellerProducts = $items.filter((p) => p.seller_id === activeSeller.id);
  let sellerSelectedCategory = 'all';
  $: filteredSellerProducts = sellerSelectedCategory === 'all'
    ? sellerProducts
    : sellerProducts.filter((p) => p.kategori === sellerSelectedCategory);

  // Metrics for Seller
  $: sellerTotalStok = sellerProducts.reduce((acc, p) => acc + (Number(p.stok) || 0), 0);
  $: sellerCats = Array.from(new Set(sellerProducts.map((p) => p.kategori).filter(Boolean)));
  $: sellerUnggulan = sellerProducts.filter((p) => p.unggulan).length;

  // Metrics for Admin / Platform
  $: adminTotalStok = $items.reduce((acc, p) => acc + (Number(p.stok) || 0), 0);
  $: adminTotalValue = $items.reduce((acc, p) => acc + ((Number(p.harga) || 0) * (Number(p.stok) || 0)), 0);
  $: adminCats = Array.from(new Set($items.map((p) => p.kategori).filter(Boolean)));

  // Notifications Mock Data
  let notifications = [
    { id: 1, title: 'Pesanan WhatsApp Baru', time: '10m lalu', desc: 'Calon pembeli menanyakan stok Kipas Sutra Merah.', unread: true },
    { id: 2, title: 'Stok Menipis', time: '1j lalu', desc: 'Guci Porselen Biru Putih tersisa 2 unit.', unread: true },
    { id: 3, title: 'Katalog Imlek Diperbarui', time: 'Kemarin', desc: 'Koleksi kriya Imlek berhasil disinkronisasi ke etalase.', unread: false }
  ];
  $: unreadCount = notifications.filter(n => n.unread).length;

  function markAllNotificationsRead() {
    notifications = notifications.map(n => ({ ...n, unread: false }));
  }

  function openAddModal() {
    dialogState.set({ open: true, editId: null });
  }

  function openEditModal(id) {
    dialogState.set({ open: true, editId: id });
  }

  function openAddSellerModal() {
    sellerModalOpen.set(true);
  }

  function handleDeleteClick(id) {
    if ($delConfirmId === id) {
      items.remove(id);
      delConfirmId.set(null);
      showToast('Karya berhasil dihapus.');
    } else {
      delConfirmId.set(id);
    }
  }

  function handleImgError(e, p) {
    const t = e.currentTarget;
    if (t && !t.dataset.f) {
      t.dataset.f = '1';
      t.src = ph(p);
    }
  }

  function goToCollection() {
    activeTab.set('cat');
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      } else {
        if (window.__lenis) {
          window.__lenis.scrollTo(0, { immediate: true });
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
  }

  function handleLogout() {
    const name = $authUser?.name ? $authUser.name.split(' ')[0] : 'Pengguna';
    authUser.logout();
    showToast(`Sampai jumpa, ${name}. Berhasil keluar.`);
    activeTab.set('cat');
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      } else {
        if (window.__lenis) {
          window.__lenis.scrollTo(0, { immediate: true });
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
  }
</script>

<div class="dash-layout" data-lenis-prevent>
  <!-- Mobile Backdrop -->
  {#if sidebarOpen}
    <div 
      class="sidebar-backdrop" 
      on:click={() => (sidebarOpen = false)}
      role="button"
      tabindex="0"
      on:keydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
    ></div>
  {/if}

  <!-- ==================== SIDEBAR (Sesuai Referensi) ==================== -->
  <aside class="dash-sidebar" data-lenis-prevent class:open={sidebarOpen}>
    <!-- Brand / Logo Area -->
    <div class="sidebar-header">
      <div class="seal" aria-hidden="true">尚</div>
      <div class="brand-info">
        <span class="brand-title">Shang Yun</span>
        <span class="brand-desc">Atelier Dashboard</span>
      </div>
    </div>

    <!-- Navigation Menu Items -->
    <nav class="sidebar-menu">
      <button 
        type="button" 
        class="menu-item" 
        class:active={currentMenu === 'overview'}
        on:click={() => { currentMenu = 'overview'; sidebarOpen = false; }}
      >
        <svg class="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
        <span>Dashboard Ringkasan</span>
      </button>

      <button 
        type="button" 
        class="menu-item" 
        class:active={currentMenu === 'products'}
        on:click={() => { currentMenu = 'products'; sidebarOpen = false; }}
      >
        <svg class="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span>Kelola Karya & Stok</span>
      </button>

      <button 
        type="button" 
        class="menu-item" 
        class:active={currentMenu === 'wa'}
        on:click={() => { currentMenu = 'wa'; sidebarOpen = false; }}
      >
        <svg class="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <span>Pemesanan WhatsApp</span>
      </button>

      {#if $currentRole === 'admin'}
        <button 
          type="button" 
          class="menu-item" 
          class:active={currentMenu === 'admin'}
          on:click={() => { currentMenu = 'admin'; sidebarOpen = false; }}
        >
          <svg class="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Platform & Kemitraan</span>
        </button>
      {/if}

      <div class="menu-separator"></div>

      <button 
        type="button" 
        class="menu-item back-link"
        on:click={goToCollection}
      >
        <svg class="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>Kembali ke Koleksi</span>
      </button>
    </nav>

    <!-- Sidebar Bottom: Profile & Theme Switcher -->
    <div class="sidebar-bottom">
      <!-- Profile Card (Matching Elizabeth's user badge) -->
      <div class="user-card-widget">
        <div class="avatar-wrap">
          <div class="user-avatar-circle">
            {($authUser?.name || activeSeller.nama).charAt(0).toUpperCase()}
          </div>
          <span class="online-indicator" title="Status Online"></span>
        </div>
        <div class="user-info-text">
          <span class="user-real-name">{$authUser?.name || activeSeller.nama}</span>
          <span class="user-status-label">
            {$currentRole === 'admin' ? 'Administrator' : 'Pengrajin Aktif'}
          </span>
        </div>
        <button 
          class="logout-icon-btn" 
          on:click={handleLogout}
          title="Keluar dari akun"
          aria-label="Keluar dari akun"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>

      <!-- Theme Switcher Pill [ ☀ Light | ☾ Dark ] -->
      <div class="theme-switch-capsule" role="radiogroup" aria-label="Mode Tampilan">
        <button 
          type="button" 
          class="theme-pill-btn" 
          class:active={$theme === 'light'}
          on:click={() => theme.set('light')}
          aria-checked={$theme === 'light'}
          role="radio"
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
          <span>Light</span>
        </button>
        <button 
          type="button" 
          class="theme-pill-btn" 
          class:active={$theme === 'dark'}
          on:click={() => theme.set('dark')}
          aria-checked={$theme === 'dark'}
          role="radio"
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <span>Dark</span>
        </button>
      </div>
    </div>
  </aside>

  <!-- ==================== MAIN CONTENT AREA ==================== -->
  <div class="dash-content-area" data-lenis-prevent>
    <!-- Top Navbar in Dashboard -->
    <header class="dash-topbar">
      <div class="topbar-left">
        <!-- Mobile Drawer Hamburger Button -->
        <button 
          type="button" 
          class="mobile-menu-btn" 
          on:click={() => (sidebarOpen = !sidebarOpen)}
          aria-label="Buka Menu Sidebar"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div class="page-title-wrap">
          <h1 class="page-title">
            {currentMenu === 'overview' ? 'Dashboard' : 
             currentMenu === 'products' ? 'Kelola Karya & Stok' : 
             currentMenu === 'wa' ? 'Pengaturan WhatsApp' : 'Pengawasan Platform'}
          </h1>
          <span class="page-subtitle">Atelier {activeSeller.nama_toko}</span>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Toko Selector Dropdown -->
        <div class="seller-picker">
          <label for="dash-seller-select" class="picker-label">Gerai:</label>
          <select id="dash-seller-select" bind:value={$activeSellerId} class="seller-select-clean">
            {#each $sellers as s}
              <option value={s.id}>{s.nama_toko}</option>
            {/each}
          </select>
        </div>

        <!-- Notification Bell Widget -->
        <div class="notif-wrap">
          <button 
            type="button" 
            class="notif-btn" 
            on:click={() => (showNotifications = !showNotifications)}
            title="Pemberitahuan"
            aria-label="Pemberitahuan"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {#if unreadCount > 0}
              <span class="notif-badge">{unreadCount}</span>
            {/if}
          </button>

          <!-- Notification Popover Card -->
          {#if showNotifications}
            <div class="notif-popover">
              <div class="notif-popover-header">
                <b>Pemberitahuan</b>
                <button type="button" class="notif-clear-btn" on:click={markAllNotificationsRead}>
                  Tandai dibaca
                </button>
              </div>
              <div class="notif-list">
                {#each notifications as n}
                  <div class="notif-item" class:unread={n.unread}>
                    <div class="notif-top">
                      <span class="notif-title">{n.title}</span>
                      <span class="notif-time">{n.time}</span>
                    </div>
                    <p class="notif-desc">{n.desc}</p>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- User Profile Pill in Topbar -->
        <div class="topbar-profile-pill">
          <div class="profile-photo-circle">
            {($authUser?.name || activeSeller.nama).charAt(0).toUpperCase()}
          </div>
          <span class="profile-name-text">{$authUser?.name || activeSeller.nama}</span>
        </div>
      </div>
    </header>

    <!-- Main Canvas Content -->
    <main class="dash-main-scroll" data-lenis-prevent tabindex="0">
      {#if currentMenu === 'overview' || currentMenu === 'products'}
        <!-- ==================== BANNER SELAMAT DATANG (Sesuai Referensi) ==================== -->
        <div class="welcome-banner-card">
          <!-- Chinese Calligraphy & Auspicious Motif Watermark Background -->
          <div class="banner-chinese-watermark" aria-hidden="true">
            <span class="watermark-calligraphy" lang="zh">尚韵匠心 · 岁岁平安 · 福禄吉祥</span>
            <svg class="watermark-cloud-svg" viewBox="0 0 160 80" fill="currentColor">
              <path d="M120 40c0-11-9-20-20-20-2 0-4 0-6 1-4-12-15-21-29-21-16 0-30 13-30 29 0 2 0 4 1 6-3-1-6-2-10-2-14 0-26 11-26 25s12 25 26 25h94c11 0 20-9 20-20s-9-20-20-20c2-1 4-2 6-3z" />
            </svg>
          </div>

          <div class="banner-text-col">
            <span class="banner-greeting">
              Selamat datang kembali, {$authUser?.name || activeSeller.nama}!
            </span>
            <p class="banner-subtext">
              Gerai <b>{activeSeller.nama_toko}</b> siap melayani pesanan kriya Imlek. Unggah koleksi terbaru Anda dan optimalkan stok gerai.
            </p>
            <div class="banner-actions-row">
              <button class="banner-btn primary" on:click={openAddModal}>
                + Upload Karya Baru
              </button>
              <button class="banner-btn secondary" on:click={goToCollection}>
                Lihat di Katalog Publik
              </button>
            </div>
          </div>
          <div class="banner-avatar-col">
            <div class="banner-portrait-seal">
              <span class="seal-glyph" lang="zh">匠</span>
            </div>
          </div>
        </div>

        <!-- ==================== 4 STAT CARDS (Sesuai Referensi) ==================== -->
        <div class="stats-grid-row">
          <div class="stat-card">
            <span class="stat-watermark" lang="zh" aria-hidden="true">品</span>
            <div class="stat-header">
              <span class="stat-ico-badge" lang="zh">品</span>
              <span class="stat-name">Karya Diunggah</span>
            </div>
            <b class="stat-number">{sellerProducts.length}</b>
            <span class="stat-footer-text">Koleksi terdaftar</span>
          </div>

          <div class="stat-card">
            <span class="stat-watermark" lang="zh" aria-hidden="true">存</span>
            <div class="stat-header">
              <span class="stat-ico-badge" lang="zh">存</span>
              <span class="stat-name">Stok Fisik</span>
            </div>
            <b class="stat-number">{sellerTotalStok}</b>
            <span class="stat-footer-text">Total unit siap kirim</span>
          </div>

          <div class="stat-card">
            <span class="stat-watermark" lang="zh" aria-hidden="true">类</span>
            <div class="stat-header">
              <span class="stat-ico-badge" lang="zh">类</span>
              <span class="stat-name">Kategori Gerai</span>
            </div>
            <b class="stat-number">{sellerCats.length}</b>
            <span class="stat-footer-text">Ragam kriya Imlek</span>
          </div>

          <div class="stat-card">
            <span class="stat-watermark" lang="zh" aria-hidden="true">珍</span>
            <div class="stat-header">
              <span class="stat-ico-badge" lang="zh">珍</span>
              <span class="stat-name">Koleksi Unggulan</span>
            </div>
            <b class="stat-number">{sellerUnggulan}</b>
            <span class="stat-footer-text">Karya pilihan berstempel</span>
          </div>
        </div>

        <!-- ==================== TABEL KARYA TOKO ==================== -->
        <div class="content-card-box">
          <span class="card-corner-watermark" lang="zh" aria-hidden="true">尚韵</span>
          <div class="card-box-header">
            <div>
              <h2 class="card-box-title">Daftar Karya Toko ({sellerProducts.length})</h2>
              <span class="card-box-sub">Koleksi kriya yang sedang aktif ditampilkan di gerai {activeSeller.nama_toko}.</span>
            </div>
            <button class="btn sm" on:click={openAddModal}>
              + Upload Karya Baru
            </button>
          </div>

          {#if sellerCats.length > 0}
            <div class="dash-category-filter-bar" aria-label="Filter kategori karya gerai">
              <button 
                type="button" 
                class="dash-cat-pill" 
                class:active={sellerSelectedCategory === 'all'}
                on:click={() => (sellerSelectedCategory = 'all')}
              >
                Semua ({sellerProducts.length})
              </button>
              {#each sellerCats as cat}
                {@const catCount = sellerProducts.filter(p => p.kategori === cat).length}
                <button 
                  type="button" 
                  class="dash-cat-pill" 
                  class:active={sellerSelectedCategory === cat}
                  on:click={() => (sellerSelectedCategory = cat)}
                >
                  {cat} ({catCount})
                </button>
              {/each}
            </div>
          {/if}

          <div class="tw">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Nama Karya</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Unggulan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {#if filteredSellerProducts.length === 0}
                  <tr>
                    <td colspan="7" class="empty-cell">
                      {sellerProducts.length === 0 
                        ? 'Belum ada karya yang diunggah untuk gerai ini. Pilih "+ Upload Karya Baru" untuk mulai menambahkan.' 
                        : 'Tidak ada karya dalam kategori ini.'}
                    </td>
                  </tr>
                {:else}
                  {#each filteredSellerProducts as p (p.id)}
                    <tr>
                      <td>
                        <img 
                          class="th" 
                          data-id={p.id} 
                          src={img(p)} 
                          alt="" 
                          on:error={(e) => handleImgError(e, p)}
                        />
                      </td>
                      <td class="nm">{p.nama}</td>
                      <td><span class="cat-pill">{p.kategori}</span></td>
                      <td class="pr">{rp(p.harga)}</td>
                      <td>
                        {#if p.stok < 1}
                          <span class="st out" style="margin:0">Habis</span>
                        {:else}
                          <b>{p.stok} unit</b>
                        {/if}
                      </td>
                      <td>
                        {#if p.unggulan}
                          <span class="mini" title="Karya Unggulan">珍</span>
                        {/if}
                      </td>
                      <td class="act">
                        <button class="lk" on:click={() => openEditModal(p.id)}>Ubah</button>
                        <button class="lk del" on:click={() => handleDeleteClick(p.id)}>
                          {$delConfirmId === p.id ? 'Yakin hapus?' : 'Hapus'}
                        </button>
                      </td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      <!-- ==================== TAB KONTAK WHATSAPP ==================== -->
      {#if currentMenu === 'overview' || currentMenu === 'wa'}
        <div class="content-card-box" style="margin-top: 24px;">
          <span class="card-corner-watermark" lang="zh" aria-hidden="true">信</span>
          <div class="card-box-header">
            <div>
              <h2 class="card-box-title">Pemesanan WhatsApp Toko</h2>
              <span class="card-box-sub">Nomor resmi gerai yang dihubungi calon pembeli saat menekan tombol pesan pada katalog.</span>
            </div>
          </div>

          <div class="wap-grid">
            <div class="wap-field">
              <label for="wa-in-field">Nomor WhatsApp Gerai ({activeSeller.nama_toko})</label>
              <input 
                id="wa-in-field" 
                type="tel" 
                inputmode="numeric" 
                pattern="[0-9]*"
                placeholder="085738211550" 
                autocomplete="off" 
                bind:value={waInput}
                on:input={(e) => { waInput = e.target.value.replace(/\D/g, ''); }}
                on:keydown={(e) => {
                  if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey) return;
                  if (!/^\d$/.test(e.key)) e.preventDefault();
                }}
              />
              {#if waErr}
                <div class="err" role="alert">{waErr}</div>
              {/if}
            </div>
            <div class="wap-info">
              <span>Tautan Pemesanan Aktif:</span>
              <a href="https://wa.me/{activeSeller.no_wa}" target="_blank" rel="noopener" class="wa-link-preview">
                wa.me/{activeSeller.no_wa} ↗
              </a>
              <button class="btn" on:click={handleSaveSellerWa}>
                Simpan Perubahan Nomor
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- ==================== TAB ADMIN PLATFORM ==================== -->
      {#if currentMenu === 'admin' && $currentRole === 'admin'}
        <div class="content-card-box" style="margin-top: 24px;">
          <span class="card-corner-watermark" lang="zh" aria-hidden="true">盟</span>
          <div class="card-box-header">
            <div>
              <h2 class="card-box-title">Mitra Gerai & Pengrajin Platform ({$sellers.length})</h2>
              <span class="card-box-sub">Daftar atelier kriya resmi yang bermitra dengan Shang Yun.</span>
            </div>
            <button class="btn sm" on:click={openAddSellerModal}>
              + Daftarkan Gerai Baru
            </button>
          </div>

          <div class="tw">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Pengrajin</th>
                  <th>Nama Gerai / Atelier</th>
                  <th>Nomor WhatsApp</th>
                  <th>Spesialisasi</th>
                  <th>Koleksi Karya</th>
                </tr>
              </thead>
              <tbody>
                {#each $sellers as s (s.id)}
                  {@const count = $items.filter((p) => p.seller_id === s.id).length}
                  <tr>
                    <td style="font-family: monospace; color: var(--gold);">{s.id}</td>
                    <td class="nm">{s.nama}</td>
                    <td style="font-weight: 500;">{s.nama_toko}</td>
                    <td style="font-family: monospace;">+{s.no_wa}</td>
                    <td><span class="cat-pill">{s.spesialisasi}</span></td>
                    <td><b>{count} karya</b></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>

<style>
  /* ========================================================
     DASHBOARD LAYOUT (SIDEBAR + TOPBAR + MAIN)
     - Sesuai Referensi Gambar Elizabeth Addams Dashboard
     ======================================================== */
  .dash-layout {
    display: flex;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    background: var(--bg-primary);
    color: var(--white);
    position: relative;
    font-family: Jost, system-ui, sans-serif;
    overflow: hidden;
  }

  /* SIDEBAR */
  .dash-sidebar {
    width: 260px;
    height: 100%;
    max-height: 100vh;
    max-height: 100dvh;
    background: var(--bg-secondary);
    border-right: 1px solid var(--card-stat-border);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px 16px;
    flex-shrink: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.32s ease;
    z-index: 50;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 8px 24px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 20px;
  }

  .seal {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--red);
    color: #ffffff;
    display: grid;
    place-items: center;
    font: 400 20px "Ma Shan Zheng", serif;
    line-height: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
  }

  .brand-info {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }

  .brand-title {
    font: 600 20px "Cormorant Garamond", Georgia, serif;
    letter-spacing: 0.04em;
    color: var(--white);
  }

  .brand-desc {
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* SIDEBAR MENU */
  .sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 11px 14px;
    background: transparent;
    border: 0;
    border-radius: 12px;
    color: var(--muted);
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.22s ease;
  }

  .menu-item:hover {
    color: var(--white);
    background: var(--pill-bg);
  }

  /* Active Pill Item (Matches the warm camel active pill in Elizabeth's dashboard!) */
  .menu-item.active {
    background: var(--pill-active-bg);
    color: var(--pill-active-text);
    box-shadow: var(--pill-active-shadow);
    font-weight: 600;
  }

  .menu-icon {
    flex-shrink: 0;
    opacity: 0.85;
  }

  .menu-item.active .menu-icon {
    opacity: 1;
  }

  .menu-separator {
    height: 1px;
    background: var(--line);
    margin: 12px 6px;
  }

  .back-link {
    color: var(--muted);
    font-size: 13px;
  }

  .back-link:hover {
    color: var(--gold);
  }

  /* SIDEBAR BOTTOM WIDGETS */
  .sidebar-bottom {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 18px;
    border-top: 1px solid var(--line);
  }

  .user-card-widget {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    padding: 8px 10px;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .avatar-wrap {
    position: relative;
  }

  .user-avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--pill-active-bg);
    color: var(--pill-active-text);
    font-weight: 600;
    font-size: 13px;
    display: grid;
    place-items: center;
  }

  .online-indicator {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #10b981;
    border: 2px solid var(--bg-card);
  }

  .user-info-text {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
    flex: 1;
    overflow: hidden;
  }

  .user-real-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--white);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-status-label {
    font-size: 12px;
    color: var(--muted);
  }

  .logout-icon-btn {
    background: transparent;
    border: 0;
    color: var(--muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: color 0.2s, background 0.2s;
  }

  .logout-icon-btn:hover {
    color: #e0735f;
    background: rgba(224, 115, 95, 0.12);
  }

  /* Theme Switcher Pill in Sidebar */
  .theme-switch-capsule {
    display: flex;
    background: var(--pill-bg);
    border: 1px solid var(--pill-border);
    padding: 3px;
    border-radius: 20px;
    gap: 3px;
  }

  .theme-pill-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: transparent;
    border: 0;
    color: var(--muted);
    font-size: 12px;
    font-weight: 500;
    padding: 5px 8px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-pill-btn.active {
    background: var(--pill-active-bg);
    color: var(--pill-active-text);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    font-weight: 600;
  }

  /* ==================== CONTENT CANVAS & TOPBAR ==================== */
  .dash-content-area {
    flex: 1 1 0%;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
    max-height: 100vh;
    max-height: 100dvh;
    overflow: hidden;
    position: relative;
  }

  /* TOPBAR */
  .dash-topbar {
    height: 64px;
    padding: 0 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: var(--bg-glass);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--card-stat-border);
    flex-shrink: 0;
    z-index: 20;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .mobile-menu-btn {
    display: none;
    background: transparent;
    border: 0;
    color: var(--white);
    padding: 6px;
    border-radius: 8px;
    cursor: pointer;
  }

  .page-title-wrap {
    display: flex;
    flex-direction: column;
  }

  .page-title {
    font: 600 20px "Cormorant Garamond", Georgia, serif;
    margin: 0;
    color: var(--white);
    line-height: 1.1;
  }

  .page-subtitle {
    font-size: 12.5px;
    color: var(--muted);
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .seller-picker {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--muted);
  }

  .seller-select-clean {
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    color: var(--white);
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 12.5px;
    cursor: pointer;
  }

  /* Notification Bell */
  .notif-wrap {
    position: relative;
  }

  .notif-btn {
    position: relative;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    color: var(--white);
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .notif-btn:hover {
    border-color: var(--brass);
    color: var(--gold);
  }

  .notif-badge {
    position: absolute;
    top: -3px;
    right: -3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--red);
    color: #ffffff;
    font-size: 9.5px;
    font-weight: 600;
    display: grid;
    place-items: center;
  }

  .notif-popover {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 300px;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    border-radius: 14px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25);
    padding: 14px;
    z-index: 100;
  }

  .notif-popover-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
  }

  .notif-clear-btn {
    background: transparent;
    border: 0;
    font-size: 11px;
    color: var(--gold);
    cursor: pointer;
  }

  .notif-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
    max-height: 240px;
    overflow-y: auto;
  }

  .notif-item {
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--pill-bg);
    font-size: 12px;
  }

  .notif-item.unread {
    border-left: 3px solid var(--gold);
  }

  .notif-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 3px;
  }

  .notif-title {
    font-weight: 600;
    color: var(--white);
  }

  .notif-time {
    color: var(--muted);
    font-size: 10.5px;
  }

  .notif-desc {
    margin: 0;
    color: var(--muted);
    line-height: 1.35;
  }

  .topbar-profile-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    padding: 4px 10px 4px 5px;
    border-radius: 20px;
  }

  .profile-photo-circle {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--pill-active-bg);
    color: var(--pill-active-text);
    font-weight: 600;
    font-size: 12px;
    display: grid;
    place-items: center;
  }

  .profile-name-text {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--white);
  }

  /* MAIN SCROLL CONTAINER */
  .dash-main-scroll {
    flex: 1 1 0%;
    min-height: 0;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    padding: 24px 28px 64px;
    outline: none;
    scroll-behavior: smooth;
  }

  .dash-main-scroll::-webkit-scrollbar,
  .dash-sidebar::-webkit-scrollbar {
    width: 7px;
  }
  .dash-main-scroll::-webkit-scrollbar-track,
  .dash-sidebar::-webkit-scrollbar-track {
    background: transparent;
  }
  .dash-main-scroll::-webkit-scrollbar-thumb,
  .dash-sidebar::-webkit-scrollbar-thumb {
    background: rgba(224, 181, 98, 0.28);
    border-radius: 4px;
  }
  .dash-main-scroll::-webkit-scrollbar-thumb:hover,
  .dash-sidebar::-webkit-scrollbar-thumb:hover {
    background: var(--gold);
  }

  /* ==================== WELCOME BANNER CARD ==================== */
  .welcome-banner-card {
    position: relative;
    overflow: hidden;
    background: var(--dash-banner);
    color: #ffffff;
    border-radius: 20px;
    padding: 30px 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
    margin-bottom: 24px;
    border: 1px solid var(--card-stat-border);
  }

  /* Chinese Calligraphy & Cloud Watermark Background */
  .banner-chinese-watermark {
    position: absolute;
    right: 120px;
    bottom: -16px;
    pointer-events: none;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 24px;
    opacity: 0.065;
    z-index: 1;
  }

  :global([data-theme="light"]) .banner-chinese-watermark {
    opacity: 0.09;
  }

  .watermark-calligraphy {
    font: 400 68px/1 "Ma Shan Zheng", serif;
    letter-spacing: 0.14em;
    white-space: nowrap;
    color: #ffffff;
  }

  .watermark-cloud-svg {
    width: 140px;
    height: 70px;
    color: #ffffff;
    flex-shrink: 0;
  }

  .banner-text-col {
    position: relative;
    z-index: 2;
    max-width: 520px;
  }

  .banner-greeting {
    display: block;
    font: 600 clamp(22px, 3vw, 28px) "Cormorant Garamond", Georgia, serif;
    line-height: 1.15;
    margin-bottom: 8px;
  }

  .banner-subtext {
    margin: 0 0 18px;
    font-size: 14px;
    opacity: 0.92;
    line-height: 1.6;
    max-width: 480px; /* Resolves LINE LENGTH TOO LONG */
  }

  .banner-actions-row {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .banner-btn {
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    padding: 8px 18px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .banner-btn.primary {
    background: #ffffff;
    border: 1px solid #ffffff;
    color: #24140e;
    font-weight: 600;
  }

  .banner-btn.primary:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }

  .banner-btn.secondary {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: #ffffff;
  }

  .banner-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .banner-avatar-col {
    position: relative;
    z-index: 2;
    flex-shrink: 0;
  }

  .banner-portrait-seal {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    border: 2px solid rgba(255, 255, 255, 0.4);
    display: grid;
    place-items: center;
  }

  .seal-glyph {
    font: 400 36px "Ma Shan Zheng", serif;
    color: #ffffff;
    line-height: 1;
  }

  /* ==================== 4 STAT CARDS ==================== */
  .stats-grid-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    position: relative;
    overflow: hidden;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    border-radius: 16px;
    padding: 22px 24px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  }

  /* Stat Card Chinese Calligraphy Watermark */
  .stat-watermark {
    position: absolute;
    right: 8px;
    bottom: -10px;
    font: 400 80px/1 "Ma Shan Zheng", serif;
    color: var(--gold);
    opacity: 0.055;
    pointer-events: none;
    user-select: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  .stat-card:hover .stat-watermark {
    opacity: 0.11;
    transform: scale(1.06) rotate(-2deg);
  }

  .stat-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .stat-ico-badge {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: rgba(168, 32, 26, 0.1);
    color: var(--red);
    font: 400 15px "Ma Shan Zheng", serif;
    display: grid;
    place-items: center;
  }

  .stat-name {
    font-size: 13.5px;
    color: var(--muted);
    font-weight: 500;
  }

  .stat-number {
    position: relative;
    z-index: 2;
    display: block;
    font: 600 38px/1 "Cormorant Garamond", Georgia, serif;
    color: var(--gold);
    margin-bottom: 4px;
  }

  .stat-footer-text {
    position: relative;
    z-index: 2;
    font-size: 13px; /* Resolves TINY BODY TEXT */
    color: var(--muted);
  }

  /* ==================== CONTENT CARD BOX & TABLES ==================== */
  .content-card-box {
    position: relative;
    overflow: hidden;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    border-radius: 18px;
    padding: 24px 28px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
  }

  /* Traditional Corner Motif for Content Box */
  .card-corner-watermark {
    position: absolute;
    right: 20px;
    top: 10px;
    font: 400 64px/1 "Ma Shan Zheng", serif;
    color: var(--gold);
    opacity: 0.04;
    pointer-events: none;
    user-select: none;
  }

  /* Eliminates NESTED CARDS error by removing inner box styling from .tw */
  .content-card-box .tw {
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    margin-bottom: 0;
  }

  .card-box-header {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 20px;
  }

  .card-box-title {
    font: 600 24px "Cormorant Garamond", Georgia, serif;
    margin: 0 0 4px;
    color: var(--white);
  }

  .card-box-sub {
    font-size: 13.5px;
    color: var(--muted);
  }

  .dash-category-filter-bar {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--line);
  }

  .dash-cat-pill {
    background: var(--bg-secondary);
    border: 1px solid var(--line);
    color: var(--muted);
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .dash-cat-pill:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  .dash-cat-pill.active {
    background: rgba(224, 181, 98, 0.15);
    border-color: var(--gold);
    color: var(--gold);
    font-weight: 500;
  }

  .empty-cell {
    text-align: center;
    padding: 36px 12px;
    color: var(--muted);
    font-size: 13.5px;
  }

  .cat-pill {
    display: inline-block;
    font-size: 12px; /* Sized up from 11px */
    padding: 3px 9px;
    border-radius: 10px;
    background: var(--pill-bg);
    border: 1px solid rgba(185, 152, 92, 0.22);
    color: var(--muted);
  }

  /* WHATSAPP FORM */
  .wap-grid {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: flex-end;
  }

  .wap-field label {
    font-size: 13.5px;
    color: var(--muted);
    margin-bottom: 6px;
    display: block;
  }

  .wap-field input {
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--card-stat-border);
    background: var(--bg-secondary);
    color: var(--white);
    font: 600 20px "Cormorant Garamond", serif;
  }

  .wap-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .wa-link-preview {
    font-family: monospace;
    font-size: 13.5px;
    color: var(--gold);
    text-decoration: underline;
  }

  /* RESPONSIVE */
  @media (max-width: 900px) {
    .dash-sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
    }

    .dash-sidebar.open {
      transform: translateX(0);
    }

    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 45;
    }

    .mobile-menu-btn {
      display: inline-flex;
    }

    .dash-topbar {
      padding: 0 16px;
    }

    .dash-main-scroll {
      padding: 16px;
    }

    .wap-grid {
      grid-template-columns: 1fr;
    }

    .banner-avatar-col {
      display: none;
    }
  }

  @media (max-width: 600px) {
    .profile-name-text {
      display: none;
    }

    .picker-label {
      display: none;
    }
  }
</style>
