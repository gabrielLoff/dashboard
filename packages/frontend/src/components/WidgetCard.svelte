<script lang="ts">
  import type { Snippet } from 'svelte';
  import { RefreshCw, AlertCircle } from 'lucide-svelte';
  import { cn, formatTimeAgo } from '$lib/utils';

  let {
    title,
    icon,
    isLoading,
    isFetching,
    error,
    onRefresh,
    children,
    background,
    updatedAt,
    isDragging = false,
    onDragStart,
    class: className = '',
  }: {
    title: string;
    icon?: Snippet;
    isLoading: boolean;
    isFetching: boolean;
    error: string;
    onRefresh: (opts?: { clear?: boolean }) => void;
    children: Snippet;
    background?: Snippet;
    updatedAt?: string;
    isDragging?: boolean;
    onDragStart?: () => void;
    class?: string;
  } = $props();

  let now = $state(Date.now());

  $effect(() => {
    if (!updatedAt) return;
    const interval = setInterval(() => { now = Date.now(); }, 60_000);
    return () => clearInterval(interval);
  });

  const timeAgo = $derived(updatedAt ? formatTimeAgo(updatedAt) : '');
</script>

<div class={cn('rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900', isDragging && 'opacity-30', className)}>
  <div
    class="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-800"
    class:cursor-grab={onDragStart && !isDragging}
    class:cursor-grabbing={isDragging}
    onpointerdown={onDragStart}
  >
    <div class="flex items-center gap-2">
      {#if icon}
        <span class="text-neutral-500 dark:text-neutral-400">{@render icon()}</span>
      {/if}
      <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{title}</h3>
    </div>
    <button
      onclick={(e) => { onRefresh(e.altKey ? { clear: true } : undefined); }}
      disabled={isFetching}
      class="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
      title="Refresh · Alt+click to clear cache"
    >
      <RefreshCw class={cn('h-4 w-4', isFetching && 'animate-spin')} />
    </button>
  </div>

  <div class="relative p-5">
    {#if background}
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        {@render background()}
      </div>
    {/if}
    {#if isLoading}
      <div class="flex items-center justify-center py-8">
        <RefreshCw class="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    {:else if error}
      <div class="flex flex-col items-center justify-center gap-2 py-6 text-center">
        <AlertCircle class="h-8 w-8 text-red-400" />
        <p class="text-sm text-red-500">{error}</p>
        <button
          onclick={() => { onRefresh(); }}
          class="rounded-md bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Retry
        </button>
      </div>
    {:else}
      {@render children()}
      {#if isFetching && !isLoading}
        <div class="absolute right-2 top-2">
          <RefreshCw class="h-3 w-3 animate-spin text-neutral-300 dark:text-neutral-600" />
        </div>
      {/if}
      {#if updatedAt}
        <p class="mt-3 text-right text-xs text-neutral-400 dark:text-neutral-500">
          Updated {timeAgo}
        </p>
      {/if}
    {/if}
  </div>
</div>
