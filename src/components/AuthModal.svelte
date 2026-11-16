<script>
  import { authModalOpen, authModalTab } from '../stores/store.js';
  import AuthCard from './AuthCard.svelte';

  function handleComplete() {
    setTimeout(() => {
      authModalOpen.set(false);
    }, 1200);
  }
</script>

{#if $authModalOpen}
  <div class="auth-modal-overlay">
    <AuthCard isModal={true} initialMode={$authModalTab} onComplete={handleComplete} />
  </div>
{/if}

<style>
  .auth-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(12, 6, 5, 0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    overflow-y: auto;
    animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>

