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
    <div class="absolute right-4 top-4 h-16 w-16 rounded-full bg-yellow-200/30 dark:bg-yellow-300/20 sun-glow"></div>
    {#each Array(8) as _, i}
      <div
        class="absolute right-7 top-7 h-0.5 w-6 origin-left bg-yellow-300/40 dark:bg-yellow-200/30 sun-ray"
        style="transform: rotate({i * 45}deg); animation-delay: {i * 0.5}s;"
      ></div>
    {/each}
  </div>
{/if}

<style>
  .sun-glow {
    animation: sun-pulse 4s ease-in-out infinite;
  }

  .sun-ray {
    animation: ray-rotate 12s linear infinite;
    transform-origin: 8px 8px;
  }

  @keyframes sun-pulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.1); }
  }

  @keyframes ray-rotate {
    0% { transform: rotate(var(--ray-angle, 0deg)); opacity: 0.2; }
    50% { opacity: 0.5; }
    100% { transform: rotate(calc(var(--ray-angle, 0deg) + 360deg)); opacity: 0.2; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sun-glow, .sun-ray {
      animation: none;
    }
  }
</style>
