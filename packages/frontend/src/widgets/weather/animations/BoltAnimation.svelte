<script lang="ts">
  let reducedMotion = $state(false);
  let flash = $state(false);

  $effect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = mq.matches;
    const handler = (e: MediaQueryListEvent) => { reducedMotion = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });

  $effect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      flash = true;
      setTimeout(() => { flash = false; }, 150);
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  });
</script>

{#if !reducedMotion}
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    {#if flash}
      <div class="absolute inset-0 bg-yellow-200/20 dark:bg-yellow-300/10 lightning-flash"></div>
    {/if}
    <div class="absolute left-1/2 top-1/4 -translate-x-1/2">
      <svg class="h-8 w-8 text-yellow-400/80 dark:text-yellow-300/60 lightning-bolt" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
      </svg>
    </div>
  </div>
{/if}

<style>
  .lightning-flash {
    animation: flash-burst 0.15s ease-out;
  }

  .lightning-bolt {
    animation: bolt-flicker 4s ease-in-out infinite;
  }

  @keyframes flash-burst {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes bolt-flicker {
    0%, 100% { opacity: 0.3; }
    10% { opacity: 1; }
    12% { opacity: 0.2; }
    14% { opacity: 0.9; }
    20% { opacity: 0.3; }
  }

  @media (prefers-reduced-motion: reduce) {
    .lightning-flash, .lightning-bolt {
      animation: none;
      display: none;
    }
  }
</style>
