<script>
  import { sellers, sellerModalOpen, showToast } from '../stores/store.js';
  import { normWa } from '../data/seed.js';

  let dialogEl;
  let nama = '';
  let namaToko = '';
  let noWa = '';
  let email = '';
  let spesialisasi = 'Sulam Sutra & Kipas';
  let errMsg = '';

  $: if ($sellerModalOpen) {
    nama = '';
    namaToko = '';
    noWa = '';
    email = '';
    spesialisasi = 'Kerajinan Tangan';
    errMsg = '';
    if (dialogEl && !dialogEl.open) {
      dialogEl.showModal();
    }
  } else {
    if (dialogEl && dialogEl.open) {
      dialogEl.close();
    }
  }

  function closeModal() {
    sellerModalOpen.set(false);
  }

  function handleSubmit() {
    const trimmedNama = (nama || '').trim();
    const trimmedToko = (namaToko || '').trim();
    const normalizedWa = normWa(noWa);

    if (!trimmedNama) {
      errMsg = 'Nama pengrajin wajib diisi.';
      return;
    }
    if (!trimmedToko) {
      errMsg = 'Nama toko/atelier wajib diisi.';
      return;
    }
    if (!normalizedWa) {
      errMsg = 'Nomor WhatsApp tidak valid. Masukkan nomor Indonesia, contoh: 081234567890.';
      return;
    }

    sellers.add({
      nama: trimmedNama,
      nama_toko: trimmedToko,
      no_wa: normalizedWa,
      email: (email || '').trim(),
      spesialisasi: (spesialisasi || '').trim()
    });

    showToast(`Seller "${trimmedToko}" berhasil didaftarkan!`);
    closeModal();
  }
</script>

<dialog id="seller-dlg" bind:this={dialogEl} on:close={closeModal}>
  <h2>Tambah Seller / Pengrajin Baru</h2>
  <p style="color: var(--muted); font-size: 13px; margin: 0 0 16px;">
    Daftarkan mitra pengrajin baru untuk menjual kerajinan tangan di Shang Yun.
  </p>

  <form method="dialog" novalidate on:submit|preventDefault={handleSubmit}>
    <label>
      Nama Pengrajin <span style="color: var(--red)">*</span>
      <input type="text" maxlength="80" placeholder="Contoh: Master Tan Wei" bind:value={nama} required />
    </label>

    <label>
      Nama Toko / Atelier <span style="color: var(--red)">*</span>
      <input type="text" maxlength="80" placeholder="Contoh: Tan Imperial Porcelain Studio" bind:value={namaToko} required />
    </label>

    <div class="row">
      <label>
        Nomor WhatsApp <span style="color: var(--red)">*</span>
        <input type="tel" placeholder="081234567890" bind:value={noWa} required />
      </label>
      <label>
        Spesialisasi
        <input type="text" placeholder="Contoh: Keramik & Ukiran" bind:value={spesialisasi} />
      </label>
    </div>

    <label>
      Email Kontak
      <input type="email" placeholder="tan.wei@shangyun.id" bind:value={email} />
    </label>

    {#if errMsg}
      <div class="err" role="alert">{errMsg}</div>
    {/if}

    <div class="acts">
      <button type="button" class="btn ghost" on:click={closeModal}>Batal</button>
      <button type="submit" class="btn">Daftarkan Seller</button>
    </div>
  </form>
</dialog>

<style>
  dialog#seller-dlg {
    background: var(--ink2);
    color: var(--white);
    border: 1px solid var(--brass);
    padding: 28px;
    width: min(500px, 92vw);
    border-radius: 0;
  }
</style>

