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
    {#each Array(6) as _, i}
      <div
        class="absolute h-0.5 w-0.5 rounded-full bg-blue-300/40 dark:bg-blue-200/30 drizzle-drop"
        style="left: {(i * 15 + 5) % 100}%; animation-delay: {i * 0.4}s; animation-duration: {1 + (i % 2) * 0.3}s;"
      ></div>
    {/each}
  </div>
{/if}

<style>
  .drizzle-drop {
    animation: drizzle-fall linear infinite;
    top: -2px;
  }

  @keyframes drizzle-fall {
    0% {
      transform: translateY(0);
      opacity: 0;
    }
    15% {
      opacity: 0.7;
    }
    85% {
      opacity: 0.7;
    }
    100% {
      transform: translateY(100%);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .drizzle-drop {
      animation: none;
      display: none;
    }
  }
</style>
