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
    <div class="absolute -left-8 top-6 h-10 w-20 rounded-full bg-neutral-200/40 dark:bg-neutral-600/30 cloud-drift cloud-1"></div>
    <div class="absolute left-1/3 top-10 h-8 w-16 rounded-full bg-neutral-200/30 dark:bg-neutral-600/20 cloud-drift cloud-2"></div>
  </div>
{/if}

<style>
  .cloud-drift {
    animation: cloud-move 20s linear infinite;
  }

  .cloud-1 {
    animation-duration: 18s;
  }

  .cloud-2 {
    animation-duration: 25s;
    animation-delay: -8s;
  }

  @keyframes cloud-move {
    0% { transform: translateX(-10%); }
    100% { transform: translateX(110%); }
  }

  @media (prefers-reduced-motion: reduce) {
    .cloud-drift {
      animation: none;
    }
  }
</style>
