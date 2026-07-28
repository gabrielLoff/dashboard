<script lang="ts">
  let reducedMotion = $state(false);

  $effect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = mq.matches;
    const handler = (e: MediaQueryListEvent) => { reducedMotion = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });
</script>

{#if !reducedMotion}
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute inset-x-0 top-1/4 h-3 bg-neutral-300/20 dark:bg-neutral-500/15 fog-layer fog-1"></div>
    <div class="absolute inset-x-0 top-1/2 h-4 bg-neutral-300/15 dark:bg-neutral-500/10 fog-layer fog-2"></div>
    <div class="absolute inset-x-0 top-3/4 h-3 bg-neutral-300/20 dark:bg-neutral-500/15 fog-layer fog-3"></div>
  </div>
{/if}

<style>
  .fog-layer {
    animation: fog-drift linear infinite;
  }

  .fog-1 { animation-duration: 15s; }
  .fog-2 { animation-duration: 20s; animation-delay: -5s; }
  .fog-3 { animation-duration: 18s; animation-delay: -10s; }

  @keyframes fog-drift {
    0% { transform: translateX(-20%); opacity: 0.3; }
    50% { opacity: 0.6; }
    100% { transform: translateX(20%); opacity: 0.3; }
  }

  @media (prefers-reduced-motion: reduce) {
    .fog-layer {
      animation: none;
    }
  }
</style>
