<script lang="ts">
  import { Sun, Moon } from 'lucide-svelte';
  import { themeStore } from '$lib/theme.svelte';
</script>

<button
  onclick={() => { themeStore.toggle(); }}
  class="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
  title="Toggle theme"
>
  {#if themeStore.current === 'dark'}
    <Sun class="h-5 w-5" />
  {:else}
    <Moon class="h-5 w-5" />
  {/if}
</button>
