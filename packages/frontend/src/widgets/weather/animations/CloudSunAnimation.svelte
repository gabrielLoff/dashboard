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
    <div class="absolute right-4 top-4 h-12 w-12 rounded-full bg-yellow-200/20 dark:bg-yellow-300/15 sun-glow-partial"></div>
    <div class="absolute -left-6 top-4 h-10 w-20 rounded-full bg-neutral-200/40 dark:bg-neutral-600/30 cloud-drift-across cloud-a"></div>
    <div class="absolute left-1/4 top-8 h-7 w-14 rounded-full bg-neutral-200/30 dark:bg-neutral-600/20 cloud-drift-across cloud-b"></div>
  </div>
{/if}

<style>
  .sun-glow-partial {
    animation: sun-pulse-subtle 5s ease-in-out infinite;
  }

  .cloud-drift-across {
    animation: cloud-move-across 22s linear infinite;
  }

  .cloud-a { animation-duration: 20s; }
  .cloud-b { animation-duration: 28s; animation-delay: -10s; }

  @keyframes sun-pulse-subtle {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.4; }
  }

  @keyframes cloud-move-across {
    0% { transform: translateX(-15%); }
    100% { transform: translateX(115%); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sun-glow-partial, .cloud-drift-across {
      animation: none;
    }
  }
</style>
