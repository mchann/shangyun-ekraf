<script>
  import { onMount, onDestroy } from 'svelte';
  import { authUser, authModalOpen, activeTab, currentRole, activeSellerId, sellers, showToast } from '../stores/store.js';

  export let isModal = false;
  export let onComplete = null;
  export let initialMode = 'in';

  let activeMode = initialMode; // 'in' (Masuk / Sign In) | 'up' (Daftar / Sign Up)

  // Jika sudah login sebagai admin atau seller, langsung lempar ke dashboard
  onMount(() => {
    if ($authUser && ($authUser.role === 'admin' || $authUser.role === 'seller')) {
      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/login') {
          window.location.href = '/dashboard';
        } else if (isModal) {
          activeTab.set('dash');
          authModalOpen.set(false);
          window.location.href = '/dashboard';
        }
      }
    }
  });

  // Demo accounts data (Khusus Admin & Akun Uji Coba)
  const DEMO_ACCOUNTS = {
    admin: {
      email: 'admin@shangyun.id',
      pass: 'admin123',
      name: 'Administrator Platform',
      role: 'admin'
    },
    seller: {
      email: 'seller@shangyun.id',
      pass: 'seller123',
      name: 'Master Chen Zhao',
      role: 'seller',
      sellerId: 's1'
    },
    pembeli: {
      email: 'pembeli@shangyun.id',
      pass: 'pembeli123',
      name: 'Pembeli Terhormat',
      role: 'pembeli'
    }
  };

  // Input fields for Login
  let loginUser = '';
  let loginPass = '';
  let showLoginPass = false;

  // Registration Mode: 'pembeli' | 'seller'
  let regType = 'pembeli';
  let regStep = 1; // 1: Isi Data | 2: Verifikasi OTP

  // Input fields for Register Pembeli & Seller
  let regName = '';
  let regEmail = '';
  let regWa = '';
  let regPass = '';
  let regPassConfirm = '';
  let regTerms = false;
  let showRegPass = false;

  // Seller specific fields
  let regToko = '';
  let regSpesialisasi = 'Sulam Sutra & Kipas';

  // OTP Verification state
  let generatedOtp = '886622';
  let otpDigits = ['', '', '', '', '', ''];
  let otpError = '';
  let resendTimer = 60;
  let countdownInterval = null;
  let isSendingOtp = false;

  // Validation & feedback state
  let errors = {};
  let passStrength = 0;
  let isSuccess = false;
  let successTitle = '';
  let successDesc = '';
  let targetRole = 'pembeli';

  const HEADINGS = {
    in: {
      z: '欢迎回来',
      y: 'Huānyíng huílái',
      p: 'Selamat datang kembali. Masuk ke akun Anda untuk menikmati koleksi kriya Imlek atau mengelola toko.'
    },
    up: {
      z: '初次见面',
      y: 'Chūcì jiànmiàn',
      p: 'Pendaftaran akun baru dengan verifikasi kode OTP aman. Pilih registrasi sebagai Pembeli atau Perajin (Seller).'
    }
  };

  function setMode(m) {
    activeMode = m;
    regStep = 1;
    errors = {};
    otpError = '';
    isSuccess = false;
  }

  function setRegType(t) {
    regType = t;
    regStep = 1;
    errors = {};
    otpError = '';
  }

  function fillDemo(roleKey) {
    const acc = DEMO_ACCOUNTS[roleKey];
    if (!acc) return;
    loginUser = acc.email;
    loginPass = acc.pass;
    errors = {};
    showToast(`Akun bawaan ${roleKey.toUpperCase()} diisi.`);
  }

  function handlePassInput(val) {
    let s = (val.length >= 8) + (/[a-z]/.test(val) && /[A-Z]/.test(val)) + /\d/.test(val) + /[^A-Za-z0-9]/.test(val);
    if (!val) s = 0;
    passStrength = s;
  }

  function handlePhoneInput(e) {
    const clean = e.target.value.replace(/\D/g, '');
    regWa = clean;
    e.target.value = clean;
    if (errors.regWa) errors.regWa = '';
  }

  function handlePhoneKeydown(e) {
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  function handlePhonePaste(e) {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '');
    const input = e.target;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const val = input.value;
    const nextVal = (val.slice(0, start) + digits + val.slice(end)).replace(/\D/g, '');
    regWa = nextVal;
    input.value = nextVal;
    input.setSelectionRange(start + digits.length, start + digits.length);
    if (errors.regWa) errors.regWa = '';
  }

  function validateLogin() {
    errors = {};
    if (!loginUser.trim()) {
      errors.loginUser = 'Isi email atau ID akun.';
    }
    if (!loginPass) {
      errors.loginPass = 'Isi kata sandi.';
    }
    return Object.keys(errors).length === 0;
  }

  function validateRegisterStep1() {
    errors = {};
    if (regName.trim().length < 2) {
      errors.regName = regType === 'seller' ? 'Nama pengrajin minimal 2 karakter.' : 'Nama lengkap minimal 2 karakter.';
    }
    if (regType === 'seller' && regToko.trim().length < 3) {
      errors.regToko = 'Nama gerai / toko atelier minimal 3 karakter.';
    }
    const emRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emRegex.test(regEmail.trim())) {
      errors.regEmail = 'Masukkan alamat email yang valid.';
    }
    if (regType === 'seller') {
      const cleanWa = regWa.replace(/\D/g, '');
      if (!cleanWa) {
        errors.regWa = 'Nomor WhatsApp toko wajib diisi khusus angka.';
      } else if (cleanWa.length < 9) {
        errors.regWa = 'Nomor WhatsApp minimal 9 digit angka (contoh: 081234567890).';
      }
    }
    if (regPass.length < 8) {
      errors.regPass = 'Kata sandi minimal 8 karakter.';
    }
    if (!regPassConfirm || regPassConfirm !== regPass) {
      errors.regPassConfirm = 'Konfirmasi kata sandi tidak cocok.';
    }
    if (!regTerms) {
      errors.regTerms = 'Centang persetujuan syarat untuk melanjutkan.';
    }
    return Object.keys(errors).length === 0;
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    if (!validateLogin()) return;

    const trimmed = loginUser.trim().toLowerCase();
    let detectedRole = 'pembeli';
    let detectedName = loginUser.split('@')[0];
    let detectedSellerId = null;

    if (trimmed === 'admin' || trimmed.startsWith('admin@') || trimmed.includes('admin')) {
      detectedRole = 'admin';
      detectedName = 'Administrator Platform';
    } else if (trimmed === 'seller' || trimmed.startsWith('seller@') || trimmed.includes('seller') || trimmed.includes('chen.zhao')) {
      detectedRole = 'seller';
      detectedName = 'Master Chen Zhao';
      detectedSellerId = 's1';
    } else {
      detectedRole = 'pembeli';
      detectedName = loginUser.split('@')[0];
    }

    targetRole = detectedRole;

    const user = {
      username: loginUser.split('@')[0],
      email: loginUser.includes('@') ? loginUser : `${loginUser}@shangyun.id`,
      name: detectedName,
      role: detectedRole,
      seller_id: detectedSellerId
    };

    authUser.login(user);
    currentRole.set(detectedRole);
    if (detectedRole === 'seller') {
      activeSellerId.set('s1');
    }

    showToast(`Masuk berhasil sebagai ${detectedRole.toUpperCase()}. Selamat datang!`);

    if (onComplete) onComplete();

    // Untuk admin dan seller langsung lempar ke dashboard
    if (detectedRole === 'admin' || detectedRole === 'seller') {
      if (typeof window !== 'undefined') {
        activeTab.set('dash');
        if (isModal) authModalOpen.set(false);
        window.location.href = '/dashboard';
      }
      return;
    }

    // Untuk pembeli: tutup modal atau arahkan ke katalog utama
    if (typeof window !== 'undefined') {
      activeTab.set('cat');
      if (isModal) {
        authModalOpen.set(false);
      } else {
        window.location.href = '/';
      }
    }
  }

  // --- OTP WORKFLOW ---
  async function startOtpFlow(e) {
    e.preventDefault();
    if (!validateRegisterStep1()) return;

    isSendingOtp = true;
    // Generate 6-digit lucky OTP
    generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    otpDigits = ['', '', '', '', '', ''];
    otpError = '';
    resendTimer = 60;

    startCountdown();
    regStep = 2;

    showToast(`Mengirim kode OTP ke ${regEmail}...`);

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim().toLowerCase(),
          otp: generatedOtp,
          name: regName.trim(),
          role: regType
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim email OTP');
      }
      showToast(`Kode OTP verifikasi berhasil dikirim ke ${regEmail}! Periksa inbox/spam email Anda.`);
    } catch (err) {
      console.error('Send OTP error:', err);
      showToast(`Perhatian: Gagal mengirim email OTP (${err.message}).`);
    } finally {
      isSendingOtp = false;
      setTimeout(() => {
        const firstInput = document.getElementById('otp-0');
        if (firstInput) firstInput.focus();
      }, 150);
    }
  }

  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      if (resendTimer > 0) {
        resendTimer -= 1;
      } else {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  function handleOtpInput(e, idx) {
    const val = e.target.value.replace(/\D/g, '');
    otpDigits[idx] = val.slice(-1);
    otpDigits = [...otpDigits];
    otpError = '';

    if (val && idx < 5) {
      const next = document.getElementById(`otp-${idx + 1}`);
      if (next) next.focus();
    }
  }

  function handleOtpKeydown(e, idx) {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      const prev = document.getElementById(`otp-${idx - 1}`);
      if (prev) {
        prev.focus();
        otpDigits[idx - 1] = '';
        otpDigits = [...otpDigits];
      }
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    for (let i = 0; i < 6; i++) {
      otpDigits[i] = pasted[i] || '';
    }
    otpDigits = [...otpDigits];
    const lastFilled = Math.min(pasted.length, 5);
    const target = document.getElementById(`otp-${lastFilled}`);
    if (target) target.focus();
  }

  function autoFillOtp() {
    for (let i = 0; i < 6; i++) {
      otpDigits[i] = generatedOtp[i] || '';
    }
    otpDigits = [...otpDigits];
    otpError = '';
    const lastBox = document.getElementById('otp-5');
    if (lastBox) lastBox.focus();
  }

  async function resendOtp() {
    if (resendTimer > 0 || isSendingOtp) return;
    isSendingOtp = true;
    generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    resendTimer = 60;
    startCountdown();
    showToast(`Mengirim ulang kode OTP ke ${regEmail}...`);

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim().toLowerCase(),
          otp: generatedOtp,
          name: regName.trim(),
          role: regType
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim email');
      }
      showToast(`Kode OTP baru telah dikirimkan ke ${regEmail}.`);
    } catch (err) {
      console.error('Resend OTP error:', err);
      showToast(`Gagal mengirim ulang OTP: ${err.message}`);
    } finally {
      isSendingOtp = false;
    }
  }

  function verifyOtp() {
    const entered = otpDigits.join('');
    if (entered.length < 6) {
      otpError = 'Masukkan 6-digit kode OTP lengkap.';
      return;
    }

    if (entered !== generatedOtp) {
      otpError = 'Kode OTP tidak cocok atau sudah kedaluwarsa.';
      return;
    }

    // OTP Verified! Register user based on regType
    targetRole = regType;

    if (regType === 'seller') {
      // Register New Seller
      const newSeller = sellers.add({
        nama: regName.trim(),
        email: regEmail.trim(),
        nama_toko: regToko.trim(),
        no_wa: regWa.trim(),
        spesialisasi: regSpesialisasi
      });

      const user = {
        username: regEmail.split('@')[0],
        email: regEmail.trim(),
        name: regName.trim(),
        role: 'seller',
        seller_id: newSeller.id,
        toko: regToko.trim()
      };

      authUser.login(user);
      currentRole.set('seller');
      activeSellerId.set(newSeller.id);

      showToast(`Pendaftaran Berhasil! Selamat datang, ${regToko}.`);

      if (onComplete) onComplete();

      if (typeof window !== 'undefined') {
        activeTab.set('dash');
        if (isModal) authModalOpen.set(false);
        window.location.href = '/dashboard';
      }
      return;
    } else {
      // Register New Pembeli
      const user = {
        username: regEmail.split('@')[0],
        email: regEmail.trim(),
        name: regName.trim(),
        role: 'pembeli',
        seller_id: null
      };

      authUser.login(user);
      currentRole.set('pembeli');

      showToast(`Verifikasi OTP Berhasil! Selamat datang, ${user.name}.`);

      if (onComplete) onComplete();

      if (typeof window !== 'undefined') {
        activeTab.set('cat');
        if (isModal) {
          authModalOpen.set(false);
        } else {
          window.location.href = '/';
        }
      }
      return;
    }

    if (onComplete) onComplete();
  }

  function handleForgot() {
    showToast('Tautan pemulihan kata sandi telah dikirimkan ke email.');
  }

  function resetForm() {
    isSuccess = false;
    regStep = 1;
    loginPass = '';
    regPass = '';
    regPassConfirm = '';
    errors = {};
    otpError = '';
  }

  function closeView() {
    authModalOpen.set(false);
  }

  onDestroy(() => {
    if (countdownInterval) clearInterval(countdownInterval);
  });
</script>

<div class="auth-root {isModal ? 'modal-mode' : ''}" data-lenis-prevent>
  <!-- AUTHENTIC TRADITIONAL CHINESE SHANSHUI LANDSCAPE BACKGROUND -->
  <div class="scene shanshui-bg" aria-hidden="true">
    <div class="bg-overlay"></div>
  </div>

  <!-- TOP BAR -->
  <div class="top">
    <div class="mark">
      <span class="seal">尚</span>Shang Yun
    </div>
    <div class="rt">
      {#if isModal}
        <button class="shop close-btn" on:click={closeView}>Tutup &times;</button>
      {:else}
        <a class="shop" href="/">Kembali ke Koleksi</a>
      {/if}
      <span class="yr" lang="zh">丁未新春</span>
    </div>
  </div>

  <!-- MAIN STAGE -->
  <div class="stage">
    <!-- LEFT CALLIGRAPHY HEADLINE -->
    <section class="hd">
      <div class="hr" aria-live="polite">
        <h1 lang="zh">{HEADINGS[activeMode].z}</h1>
        <div class="tx">
          <span class="py">{HEADINGS[activeMode].y}</span>
          <p>{HEADINGS[activeMode].p}</p>
        </div>
      </div>
    </section>

    <!-- RIGHT: LUXURY AUTH CARD -->
    <main class="card smooth-card">
      {#if isModal}
        <button class="modal-corner-close" on:click={closeView} title="Tutup">&times;</button>
      {/if}

      <!-- Top Mode Tabs: Masuk vs Daftar -->
      <div class="ct">
        <span class="seal" aria-hidden="true">尚</span>
        <div class="tabs" role="tablist">
          <button 
            type="button"
            role="tab" 
            aria-selected={activeMode === 'in'} 
            on:click={() => setMode('in')}
          >
            <b lang="zh">登录</b>
            <small>Masuk</small>
          </button>
          <button 
            type="button"
            role="tab" 
            aria-selected={activeMode === 'up'} 
            on:click={() => setMode('up')}
          >
            <b lang="zh">注册</b>
            <small>Daftar Akun</small>
          </button>
          <span class="auth-tab-slider {activeMode === 'up' ? 'is-up' : ''}" aria-hidden="true"></span>
        </div>
      </div>

      {#if activeMode === 'in'}
        <!-- ==================== TAB MASUK (LOGIN) ==================== -->
        
        <ul class="perks">
          <li><b lang="zh" aria-hidden="true">礼</b>Koleksi kriya Imlek</li>
          <li><b lang="zh" aria-hidden="true">速</b>Pesan via WhatsApp</li>
          <li><b lang="zh" aria-hidden="true">安</b>Keamanan terverifikasi</li>
        </ul>

        {#if !isSuccess}
          <form class="pn" on:submit={handleLoginSubmit} novalidate>
            <div class="f" class:bad={Boolean(errors.loginUser)}>
              <label for="li-u">Email atau ID Akun</label>
              <div class="w">
                <span lang="zh">用</span>
                <input 
                  id="li-u" 
                  autocomplete="username" 
                  placeholder="nama@email.com atau ID Akun" 
                  bind:value={loginUser}
                />
              </div>
              {#if errors.loginUser}
                <em role="alert">{errors.loginUser}</em>
              {/if}
            </div>

            <div class="f" class:bad={Boolean(errors.loginPass)}>
              <label for="li-p">Kata sandi</label>
              <div class="w">
                <span lang="zh">密</span>
                <input 
                  id="li-p" 
                  type={showLoginPass ? 'text' : 'password'} 
                  autocomplete="current-password" 
                  placeholder="Kata sandi akun Anda" 
                  bind:value={loginPass}
                />
                <button 
                  type="button" 
                  class="eye-btn" 
                  on:click={() => (showLoginPass = !showLoginPass)}
                  aria-label={showLoginPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  title={showLoginPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {#if showLoginPass}
                    <svg class="eye-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  {:else}
                    <svg class="eye-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  {/if}
                </button>
              </div>
              {#if errors.loginPass}
                <em role="alert">{errors.loginPass}</em>
              {/if}
            </div>

            <div class="row">
              <button type="button" class="lk" on:click={handleForgot}>Lupa kata sandi?</button>
            </div>

            <button class="go" type="submit">
              Masuk ke Akun
            </button>

            <p class="alt">
              Belum punya akun? <button type="button" class="lk" on:click={() => setMode('up')}>Daftar Akun Baru</button>
            </p>
          </form>
        {/if}

      {:else}
        <!-- ==================== TAB DAFTAR (REGISTRASI PEMBELI & SELLER VIA OTP) ==================== -->

        {#if regStep === 1}
          <!-- PILIHAN 2 PERAN REGISTRASI: PEMBELI VS SELLER (SVG ICON PACK, NO EMOJI) -->
          <div class="reg-role-tabs">
            <button 
              type="button" 
              class="reg-role-btn" 
              class:active={regType === 'pembeli'}
              on:click={() => setRegType('pembeli')}
            >
              <svg class="role-svg-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <b>Daftar Pembeli</b>
            </button>
            <button 
              type="button" 
              class="reg-role-btn" 
              class:active={regType === 'seller'}
              on:click={() => setRegType('seller')}
            >
              <svg class="role-svg-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <b>Daftar Seller (Perajin)</b>
            </button>
          </div>

          <div class="reg-step-indicator">
            <span class="step-badge">Langkah 1/2</span>
            <span>{regType === 'seller' ? 'Formulir Mitra Gerai Perajin' : 'Formulir Akun Calon Pembeli'}</span>
          </div>

          <!-- FORM REGISTRASI STEP 1 -->
          <form class="pn" on:submit={startOtpFlow} novalidate>
            {#if regType === 'seller'}
              <!-- FORM KHUSUS SELLER -->
              <div class="f" class:bad={Boolean(errors.regToko)}>
                <label for="se-toko">Nama Gerai / Atelier Kriya</label>
                <div class="w">
                  <span lang="zh">店</span>
                  <input 
                    id="se-toko" 
                    placeholder="Contoh: Suzhou Silk Studio" 
                    bind:value={regToko}
                  />
                </div>
                {#if errors.regToko}
                  <em role="alert">{errors.regToko}</em>
                {/if}
              </div>

              <div class="f" class:bad={Boolean(errors.regName)}>
                <label for="se-name">Nama Pemilik / Pengrajin</label>
                <div class="w">
                  <span lang="zh">名</span>
                  <input 
                    id="se-name" 
                    placeholder="Nama lengkap Anda" 
                    bind:value={regName}
                  />
                </div>
                {#if errors.regName}
                  <em role="alert">{errors.regName}</em>
                {/if}
              </div>

              <div class="f">
                <label for="se-spec">Spesialisasi Kriya Seni</label>
                <div class="w">
                  <span lang="zh">艺</span>
                  <select id="se-spec" bind:value={regSpesialisasi} class="reg-select">
                    <option value="Sulam Sutra & Kipas">Sulam Sutra & Kipas</option>
                    <option value="Kerajinan Lakur & Kayu">Kerajinan Lakur & Kayu</option>
                    <option value="Keramik & Ukiran Giok">Keramik & Ukiran Giok</option>
                    <option value="Kaligrafi & Kertas Beras">Kaligrafi & Kertas Beras</option>
                    <option value="Hampers Imlek Mewah">Hampers Imlek Mewah</option>
                    <option value="Ornamen & Simpul Keberuntungan">Ornamen & Simpul Keberuntungan</option>
                  </select>
                </div>
              </div>

              <div class="f" class:bad={Boolean(errors.regWa)}>
                <label for="se-wa">Nomor WhatsApp Gerai (Pemesanan Katalog)</label>
                <div class="w">
                  <span lang="zh">联</span>
                  <input 
                    id="se-wa" 
                    type="tel"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="081234567890" 
                    bind:value={regWa}
                    on:input={handlePhoneInput}
                    on:keydown={handlePhoneKeydown}
                    on:paste={handlePhonePaste}
                  />
                </div>
                {#if errors.regWa}
                  <em role="alert">{errors.regWa}</em>
                {/if}
              </div>
            {:else}
              <!-- FORM KHUSUS PEMBELI -->
              <div class="f" class:bad={Boolean(errors.regName)}>
                <label for="su-n">Nama Lengkap</label>
                <div class="w">
                  <span lang="zh">名</span>
                  <input 
                    id="su-n" 
                    autocomplete="name" 
                    placeholder="Nama lengkap Anda" 
                    bind:value={regName}
                  />
                </div>
                {#if errors.regName}
                  <em role="alert">{errors.regName}</em>
                {/if}
              </div>
            {/if}

            <div class="f" class:bad={Boolean(errors.regEmail)}>
              <label for="su-e">Alamat Email (Untuk Pengiriman OTP)</label>
              <div class="w">
                <span lang="zh">邮</span>
                <input 
                  id="su-e" 
                  type="email" 
                  autocomplete="email" 
                  placeholder="nama@email.com" 
                  bind:value={regEmail}
                />
              </div>
              {#if errors.regEmail}
                <em role="alert">{errors.regEmail}</em>
              {/if}
            </div>

            <div class="f" class:bad={Boolean(errors.regPass)}>
              <label for="su-p">Kata Sandi</label>
              <div class="w">
                <span lang="zh">密</span>
                <input 
                  id="su-p" 
                  type={showRegPass ? 'text' : 'password'} 
                  autocomplete="new-password" 
                  placeholder="Minimal 8 karakter" 
                  bind:value={regPass}
                  on:input={(e) => handlePassInput(e.target.value)}
                />
                <button 
                  type="button" 
                  class="eye-btn" 
                  on:click={() => (showRegPass = !showRegPass)}
                  aria-label={showRegPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  title={showRegPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {#if showRegPass}
                    <svg class="eye-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  {:else}
                    <svg class="eye-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  {/if}
                </button>
              </div>
              <div class="meter l{passStrength}">
                <i></i><i></i><i></i><i></i>
                <span>{['', 'Lemah', 'Cukup', 'Baik', 'Kuat'][passStrength] || ''}</span>
              </div>
              {#if errors.regPass}
                <em role="alert">{errors.regPass}</em>
              {/if}
            </div>

            <div class="f" class:bad={Boolean(errors.regPassConfirm)}>
              <label for="su-c">Konfirmasi Kata Sandi</label>
              <div class="w">
                <span lang="zh">确</span>
                <input 
                  id="su-c" 
                  type="password" 
                  autocomplete="new-password" 
                  placeholder="Ulangi kata sandi" 
                  bind:value={regPassConfirm}
                />
              </div>
              {#if errors.regPassConfirm}
                <em role="alert">{errors.regPassConfirm}</em>
              {/if}
            </div>

            <div class="f" class:bad={Boolean(errors.regTerms)}>
              <label class="chk">
                <input type="checkbox" bind:checked={regTerms} />
                Saya menyetujui syarat & ketentuan kemitraan Shang Yun.
              </label>
              {#if errors.regTerms}
                <em role="alert">{errors.regTerms}</em>
              {/if}
            </div>

            <button class="go" type="submit" disabled={isSendingOtp}>
              {isSendingOtp ? 'Mengirim Kode OTP...' : 'Lanjut: Kirim Kode OTP Verifikasi →'}
            </button>

            <p class="alt">
              Sudah memiliki akun? <button type="button" class="lk" on:click={() => setMode('in')}>Masuk</button>
            </p>
          </form>

        {:else if regStep === 2 && !isSuccess}
          <!-- ==================== STEP 2: VERIFIKASI KODE OTP ==================== -->
          <div class="otp-view">
            <div class="reg-step-indicator">
              <span class="step-badge">Langkah 2/2</span>
              <span>Verifikasi Keamanan Akun ({regType.toUpperCase()})</span>
            </div>

            <div class="otp-instruction">
              <p>
                Kode OTP 6-digit keamanan telah dikirimkan ke <b>{regEmail}</b>.
              </p>
            </div>

            <!-- Notifikasi Pengiriman Email OTP Real -->
            <div class="otp-mail-card">
              <div class="otp-mail-header">
                <span class="otp-mail-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7L12 13 2 7" />
                  </svg>
                </span>
                <span>Email OTP Dikirim ke:</span>
                <span lang="zh">驗證信</span>
              </div>
              <div class="otp-mail-body">
                <span class="otp-mail-addr">{regEmail}</span>
                <span class="otp-mail-hint">Silakan periksa kotak masuk atau folder spam email Anda untuk menyalin 6-digit kode OTP keamanan.</span>
              </div>
            </div>

            <!-- 6 Kotak Digit Input OTP -->
            <div class="otp-inputs-grid">
              {#each [0, 1, 2, 3, 4, 5] as idx}
                <input 
                  id={`otp-${idx}`}
                  type="text" 
                  inputmode="numeric" 
                  maxlength="1" 
                  class="otp-box"
                  bind:value={otpDigits[idx]}
                  on:input={(e) => handleOtpInput(e, idx)}
                  on:keydown={(e) => handleOtpKeydown(e, idx)}
                  on:paste={handleOtpPaste}
                />
              {/each}
            </div>

            {#if otpError}
              <div class="otp-error-banner" role="alert">{otpError}</div>
            {/if}

            <button class="go" type="button" on:click={verifyOtp}>
              Verifikasi OTP & Aktifkan Akun {regType === 'seller' ? 'Seller' : 'Pembeli'}
            </button>

            <div class="otp-bottom-links">
              {#if resendTimer > 0}
                <span class="countdown-text">Kirim ulang kode dalam {resendTimer} detik</span>
              {:else}
                <button type="button" class="lk" on:click={resendOtp}>Kirim Ulang Kode OTP</button>
              {/if}
              <button type="button" class="lk-edit" on:click={() => (regStep = 1)}>&larr; Ubah Data</button>
            </div>
          </div>
        {/if}
      {/if}

      <!-- SUCCESS CELEBRATION STAMP -->
      {#if isSuccess}
        <div class="ok">
          <div class="stamp" lang="zh" aria-hidden="true">成</div>
          <h2>{successTitle}</h2>
          <p>{successDesc}</p>
          
          {#if isModal}
            <button class="go sh" on:click={closeView}>Mulai Sekarang</button>
          {:else}
            <a class="go sh" href={targetRole === 'pembeli' ? '/' : '/dashboard'}>
              {targetRole === 'pembeli' ? 'Jelajahi Koleksi' : 'Buka Dashboard'}
            </a>
          {/if}

          <p class="alt">
            <button type="button" class="lk" on:click={resetForm}>Ganti Akun</button>
          </p>
        </div>
      {/if}

      <p class="note">
        Koneksi akun aman & terenkripsi. Admin menggunakan akun dummy bawaan pengelola.
      </p>
    </main>
  </div>
</div>

<style>
  .auth-root {
    position: relative;
    min-height: 100vh;
    overflow-x: hidden;
    color: var(--paper, #f3e8d0);
    font: 300 15px/1.65 'Jost', system-ui, sans-serif;
  }

  .auth-root.modal-mode {
    position: fixed;
    inset: 0;
    z-index: 1000;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 36px 16px 80px;
    box-sizing: border-box;
  }

  .auth-root.modal-mode::-webkit-scrollbar {
    width: 8px;
  }
  .auth-root.modal-mode::-webkit-scrollbar-track {
    background: rgba(12, 6, 5, 0.75);
  }
  .auth-root.modal-mode::-webkit-scrollbar-thumb {
    background: rgba(224, 181, 98, 0.35);
    border-radius: 4px;
  }
  .auth-root.modal-mode::-webkit-scrollbar-thumb:hover {
    background: var(--gold, #e0b562);
  }

  .auth-root.modal-mode .stage {
    min-height: auto;
    width: 100%;
    max-width: 480px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 0;
    margin: auto;
  }

  .auth-root.modal-mode .hd {
    display: none;
  }

  .auth-root.modal-mode .card.smooth-card {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    position: relative;
  }

  .scene.shanshui-bg {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background-color: #0c0605;
    background-image: url('/bg-login.jpg');
    background-position: center center;
    background-size: cover;
    background-repeat: no-repeat;
    pointer-events: none;
    z-index: 1;
  }

  .bg-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 70% 50%, rgba(12, 6, 5, 0.2) 0%, rgba(12, 6, 5, 0.55) 100%),
                linear-gradient(to bottom, rgba(12, 6, 5, 0.45) 0%, rgba(12, 6, 5, 0.2) 40%, rgba(12, 6, 5, 0.65) 100%);
    pointer-events: none;
  }

  /* Top Bar */
  .top {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(16px + env(safe-area-inset-top, 0px)) 28px 16px;
  }

  .mark {
    display: flex;
    align-items: center;
    gap: 12px;
    font: 500 22px 'Cormorant Garamond', serif;
    letter-spacing: 0.06em;
  }

  .seal {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    background: var(--red, #b3261e);
    color: var(--paper, #f3e8d0);
    font: 400 18px 'Ma Shan Zheng', serif;
    border-radius: 2px;
    border: 1px solid rgba(224, 181, 98, 0.5);
  }

  .yr {
    font: 400 18px 'Ma Shan Zheng', serif;
    color: var(--gold, #e0b562);
    letter-spacing: 0.3em;
  }

  .rt {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .shop {
    color: var(--paper, #f3e8d0);
    text-decoration: none;
    border-bottom: 1px solid var(--gold, #e0b562);
    font-size: 14px;
    cursor: pointer;
    background: none;
    border-top: 0;
    border-left: 0;
    border-right: 0;
    font-family: inherit;
    padding: 0 0 2px 0;
  }

  /* Stage Layout */
  .stage {
    position: relative;
    z-index: 2;
    min-height: 100svh;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
    align-items: center;
    gap: 24px;
    padding: 96px clamp(20px, 5vw, 72px) calc(40px + env(safe-area-inset-bottom, 0px)) calc(6vw + min(36vw, 400px));
  }

  .hd {
    display: flex;
    flex-direction: column;
    gap: 34px;
    align-items: center;
  }

  .hr {
    display: flex;
    flex-direction: row-reverse;
    gap: 26px;
    align-items: flex-start;
    justify-content: center;
  }

  .hd h1 {
    writing-mode: vertical-rl;
    font: 400 clamp(70px, 9vw, 120px)/1.12 'Ma Shan Zheng', serif;
    color: var(--paper, #f3e8d0);
    letter-spacing: 0.06em;
    margin: 0;
  }

  .tx {
    max-width: 210px;
    margin-top: 44px;
    color: #ead9bd;
  }

  .py {
    display: block;
    font: italic 500 19px 'Cormorant Garamond', serif;
    color: var(--gold, #e0b562);
    letter-spacing: 0.14em;
    margin-bottom: 10px;
  }

  /* OPTIMIZED LUXURY GLASS CARD (NO BORDER OVERFLOW & NO GLOW) */
  .card.smooth-card {
    position: relative;
    background: rgba(22, 9, 7, 0.94);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(224, 181, 98, 0.35);
    padding: 28px 32px 26px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
    border-radius: 6px;
    box-sizing: border-box;
    will-change: transform;
    transform: translateZ(0);
  }

  .modal-corner-close {
    position: absolute;
    top: 14px;
    right: 14px;
    background: none;
    border: none;
    color: #cdb59c;
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s;
    z-index: 10;
  }
  .modal-corner-close:hover {
    color: var(--gold, #e0b562);
  }

  .ct {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 20px;
  }

  .tabs {
    position: relative;
    display: flex;
    flex: 1;
    border-bottom: 1px solid rgba(224, 181, 98, 0.25);
  }

  .tabs button {
    flex: 1;
    background: none;
    border: 0;
    padding: 4px 0 12px;
    cursor: pointer;
    color: #cdb59c;
    transition: color 0.2s ease;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    text-align: center;
  }

  .tabs button:hover {
    color: var(--gold, #e0b562);
  }

  .tabs button[aria-selected="true"] {
    color: var(--paper, #f3e8d0);
  }

  .tabs b {
    display: block;
    font: 400 28px/1.1 'Ma Shan Zheng', serif;
    letter-spacing: 0.06em;
  }

  .tabs small {
    display: block;
    font-size: 12px;
    letter-spacing: 0.04em;
    margin-top: 2px;
  }

  .auth-tab-slider {
    position: absolute;
    left: 0;
    bottom: -1px;
    width: 50%;
    height: 2px;
    margin: 0 !important;
    padding: 0;
    background: var(--gold, #e0b562);
    box-shadow: none;
    border-radius: 2px 2px 0 0;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    z-index: 2;
  }

  .auth-tab-slider.is-up {
    transform: translateX(100%);
  }

  /* Dual Role Tabs in Registration */
  .reg-role-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
  }

  .reg-role-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 10px;
    background: rgba(18, 7, 5, 0.6);
    border: 1px solid rgba(224, 181, 98, 0.2);
    border-radius: 3px;
    color: #a8968a;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .reg-role-btn.active {
    background: rgba(224, 181, 98, 0.15);
    border-color: var(--gold, #e0b562);
    color: var(--paper, #f3e8d0);
  }

  .reg-role-btn b {
    font-size: 12.5px;
    font-weight: 500;
  }

  .role-svg-icon {
    display: block;
    flex-shrink: 0;
  }

  .reg-step-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    font-size: 12px;
    color: #cdb59c;
  }

  .step-badge {
    background: rgba(224, 181, 98, 0.2);
    border: 1px solid var(--gold, #e0b562);
    color: var(--gold, #e0b562);
    font-size: 10px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 10px;
    letter-spacing: 0.05em;
  }

  .reg-select {
    flex: 1;
    background: transparent;
    border: 0;
    color: var(--paper, #f3e8d0);
    padding: 10px 10px 10px 0;
    font: inherit;
    font-size: 13.5px;
    outline: none;
    cursor: pointer;
  }

  .reg-select option {
    background: #180907;
    color: #f3e8d0;
  }

  /* OTP Step 2 Styles */
  .otp-view {
    padding-top: 4px;
  }

  .otp-instruction p {
    font-size: 13.5px;
    color: #cdb59c;
    margin-bottom: 14px;
    line-height: 1.5;
  }

  .otp-mail-card {
    background: rgba(22, 9, 7, 0.75);
    border: 1px solid rgba(224, 181, 98, 0.28);
    border-radius: 4px;
    padding: 12px 14px;
    margin-bottom: 20px;
  }

  .otp-mail-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11.5px;
    color: #a8968a;
  }

  .otp-mail-icon {
    display: flex;
    align-items: center;
    color: var(--gold, #e0b562);
  }

  .otp-mail-header span[lang="zh"] {
    margin-left: auto;
    font-family: 'Ma Shan Zheng', serif;
    font-size: 13px;
    color: var(--gold, #e0b562);
  }

  .otp-mail-body {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .otp-mail-addr {
    font-size: 14px;
    font-weight: 600;
    color: var(--paper, #f3e8d0);
    letter-spacing: 0.02em;
    word-break: break-all;
  }

  .otp-mail-hint {
    font-size: 11.5px;
    color: #9f8c7e;
    line-height: 1.4;
  }

  /* 6-box OTP Grid */
  .otp-inputs-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
    max-width: 100%;
    margin-bottom: 16px;
    box-sizing: border-box;
  }

  .otp-box {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    height: 52px;
    text-align: center;
    font-family: monospace;
    font-size: 22px;
    font-weight: 600;
    color: var(--gold, #e0b562);
    background: rgba(12, 5, 4, 0.7);
    border: 1px solid rgba(224, 181, 98, 0.35);
    border-radius: 6px;
    outline: none;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    transition: border-color 0.2s ease;
  }

  .otp-box:focus {
    border-color: var(--gold, #e0b562);
    background: rgba(24, 10, 8, 0.85);
  }

  .otp-error-banner {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid #ef4444;
    color: #fca5a5;
    font-size: 12px;
    padding: 8px 12px;
    border-radius: 3px;
    margin-bottom: 14px;
    text-align: center;
  }

  .otp-bottom-links {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    font-size: 12.5px;
  }

  .countdown-text {
    color: #8f7d71;
    font-size: 12px;
  }

  .lk-edit {
    background: none;
    border: none;
    color: #cdb59c;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
    text-decoration: underline;
  }

  .perks {
    list-style: none;
    padding: 0;
    margin: 0 0 18px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    font-size: 11px;
    color: #cdb59c;
  }

  .perks li {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.02);
    padding: 4px 6px;
    border: 1px solid rgba(224, 181, 98, 0.1);
    border-radius: 2px;
  }

  .perks b {
    font-family: 'Ma Shan Zheng', serif;
    font-size: 13px;
    color: var(--gold, #e0b562);
  }

  /* Forms */
  .f {
    margin-bottom: 14px;
  }

  .f label {
    display: block;
    font-size: 12px;
    color: #cdb59c;
    margin-bottom: 5px;
  }

  .f .w {
    position: relative;
    display: flex;
    align-items: center;
    border: 1px solid rgba(224, 181, 98, 0.28);
    background: rgba(12, 5, 4, 0.7);
    border-radius: 3px;
    transition: border-color 0.2s;
  }

  .f .w:focus-within {
    border-color: var(--gold, #e0b562);
  }

  .f .w span {
    font-family: 'Ma Shan Zheng', serif;
    font-size: 15px;
    color: var(--gold, #e0b562);
    padding: 0 12px;
  }

  .f input {
    flex: 1;
    background: transparent;
    border: 0;
    color: var(--paper, #f3e8d0);
    padding: 10px 10px 10px 0;
    font: inherit;
    font-size: 14px;
    outline: none;
  }

  .f .eye-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #a8968a;
    padding: 0 12px;
    cursor: pointer;
    transition: color 0.2s ease;
  }
  .f .eye-btn:hover { color: var(--gold, #e0b562); }
  .eye-svg { display: block; }

  .f em {
    display: block;
    font-size: 11.5px;
    color: #f87171;
    font-style: normal;
    margin-top: 4px;
  }

  .meter {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
  }
  .meter i {
    flex: 1;
    height: 3px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    transition: background 0.3s;
  }
  .meter span {
    font-size: 10.5px;
    margin-left: 6px;
    color: #cdb59c;
  }
  .meter.l1 i:nth-child(1) { background: #ef4444; }
  .meter.l2 i:nth-child(-n+2) { background: #f59e0b; }
  .meter.l3 i:nth-child(-n+3) { background: #10b981; }
  .meter.l4 i:nth-child(-n+4) { background: #e0b562; }

  .row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 14px;
  }

  .chk {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    cursor: pointer;
    color: #cdb59c;
  }

  .go {
    width: 100%;
    padding: 12px 18px;
    background: linear-gradient(135deg, #a8241b, #821510);
    border: 1px solid rgba(224, 181, 98, 0.45);
    color: var(--paper, #f3e8d0);
    font-family: inherit;
    font-size: 13.5px;
    letter-spacing: 0.1em;
    font-weight: 500;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.25s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  }

  .go:hover {
    background: linear-gradient(135deg, #b82c22, #961914);
    border-color: var(--gold, #e0b562);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    transform: translateY(-1px);
  }

  .go.sh {
    display: inline-block;
    text-align: center;
    text-decoration: none;
    margin-top: 14px;
  }

  .alt {
    text-align: center;
    font-size: 13px;
    color: #cdb59c;
    margin-top: 16px;
    margin-bottom: 0;
  }

  .lk {
    background: none;
    border: none;
    color: var(--gold, #e0b562);
    font: inherit;
    font-size: 12.5px;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  /* Success celebration */
  .ok {
    text-align: center;
    padding: 20px 0;
  }

  .stamp {
    display: inline-grid;
    place-items: center;
    width: 68px;
    height: 68px;
    margin: 0 auto 16px;
    background: var(--red, #b3261e);
    color: var(--paper, #f3e8d0);
    font: 400 36px 'Ma Shan Zheng', serif;
    border: 2px solid var(--gold, #e0b562);
    border-radius: 4px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    animation: stampIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes stampIn {
    0% { transform: scale(1.6) rotate(-15deg); opacity: 0; }
    100% { transform: scale(1) rotate(0); opacity: 1; }
  }

  .ok h2 {
    font-size: 26px;
    color: var(--paper, #f3e8d0);
    margin-bottom: 8px;
  }

  .ok p {
    color: #cdb59c;
    font-size: 14px;
  }

  .note {
    font-size: 11px;
    color: #8f7d71;
    text-align: center;
    margin-top: 18px;
    margin-bottom: 0;
  }

  @media (max-width: 900px) {
    .stage {
      grid-template-columns: 1fr;
      padding: 80px 20px 40px;
    }
    .hd {
      display: none;
    }
    #pg {
      opacity: 0.25;
      left: -20vw;
    }
    .demo-chips {
      flex-direction: column;
    }
  }
</style>
