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
    <div class="absolute -left-8 top-4 h-10 w-20 rounded-full bg-neutral-200/30 dark:bg-neutral-600/25 cloud-drift-rain cloud-r-1"></div>
    <div class="absolute left-1/3 top-8 h-8 w-16 rounded-full bg-neutral-200/25 dark:bg-neutral-600/20 cloud-drift-rain cloud-r-2"></div>
    {#each Array(8) as _, i}
      <div
        class="absolute h-0.5 w-0.5 rounded-full bg-blue-400/50 dark:bg-blue-300/35 rain-drop-cr"
        style="left: {(i * 10 + 5) % 100}%; animation-delay: {i * 0.2}s; animation-duration: {0.7 + (i % 3) * 0.15}s;"
      ></div>
    {/each}
  </div>
{/if}

<style>
  .cloud-drift-rain {
    animation: cloud-move-rain 20s linear infinite;
  }

  .cloud-r-1 { animation-duration: 18s; }
  .cloud-r-2 { animation-duration: 24s; animation-delay: -7s; }

  .rain-drop-cr {
    animation: rain-fall-cr linear infinite;
    top: -4px;
  }

  @keyframes cloud-move-rain {
    0% { transform: translateX(-10%); }
    100% { transform: translateX(110%); }
  }

  @keyframes rain-fall-cr {
    0% { transform: translateY(0) rotate(12deg); opacity: 0; }
    10% { opacity: 0.8; }
    90% { opacity: 0.8; }
    100% { transform: translateY(100%) rotate(12deg); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .cloud-drift-rain, .rain-drop-cr {
      animation: none;
      display: none;
    }
  }
</style>
