<script>
  import { onDestroy } from 'svelte';
  import { authModalOpen, authModalTab } from '../stores/store.js';
  import AuthCard from './AuthCard.svelte';

  function handleComplete() {
    setTimeout(() => {
      authModalOpen.set(false);
    }, 1200);
  }

  // Lock body scroll when modal is open so wheel and touch scroll the modal cleanly
  $: if (typeof document !== 'undefined') {
    if ($authModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  });
</script>

{#if $authModalOpen}
  <div class="auth-modal-overlay" data-lenis-prevent>
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
    overflow: hidden;
    animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
