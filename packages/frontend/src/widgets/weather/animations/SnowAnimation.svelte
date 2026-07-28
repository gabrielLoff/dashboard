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
    {#each Array(15) as _, i}
      <div
        class="absolute h-1.5 w-1.5 rounded-full bg-white/70 dark:bg-neutral-200/50 snow-flake"
        style="left: {(i * 7 + 2) % 100}%; animation-delay: {i * 0.2}s; animation-duration: {1.5 + (i % 4) * 0.3}s;"
      ></div>
    {/each}
  </div>
{/if}

<style>
  .snow-flake {
    animation: snow-fall linear infinite;
    top: -6px;
  }

  @keyframes snow-fall {
    0% {
      transform: translateY(0) translateX(0);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    50% {
      transform: translateY(50%) translateX(8px);
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(100%) translateX(-4px);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .snow-flake {
      animation: none;
      display: none;
    }
  }
</style>
