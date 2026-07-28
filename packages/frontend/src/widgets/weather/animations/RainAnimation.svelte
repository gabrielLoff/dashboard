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
    {#each Array(12) as _, i}
      <div
        class="absolute h-0.5 w-0.5 rounded-full bg-blue-400/60 dark:bg-blue-300/40 rain-drop"
        style="left: {(i * 8 + 3) % 100}%; animation-delay: {i * 0.15}s; animation-duration: {0.6 + (i % 3) * 0.2}s;"
      ></div>
    {/each}
  </div>
{/if}

<style>
  .rain-drop {
    animation: rain-fall linear infinite;
    top: -4px;
  }

  @keyframes rain-fall {
    0% {
      transform: translateY(0) rotate(15deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(100%) rotate(15deg);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rain-drop {
      animation: none;
      display: none;
    }
  }
</style>
