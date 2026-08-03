<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  let {
    isDragging = false,
    isResizing = false,
    onDragStart,
    onResizeStart,
    children,
    class: className = '',
  }: {
    isDragging?: boolean;
    isResizing?: boolean;
    onDragStart?: (e: PointerEvent) => void;
    onResizeStart?: (e: PointerEvent, edge: 'right' | 'bottom' | 'corner') => void;
    children: Snippet;
    class?: string;
  } = $props();
</script>

<div
  role={onDragStart ? 'button' : undefined}
  tabindex={onDragStart ? -1 : undefined}
  class={cn('relative', (isDragging || isResizing) && 'opacity-30', className)}
  class:cursor-grab={onDragStart && !isDragging}
  class:cursor-grabbing={isDragging}
  onpointerdown={onDragStart}
>
  {@render children()}

  {#if onResizeStart}
    <div
      class="absolute right-0 top-8 bottom-1 w-1 cursor-col-resize transition-colors hover:bg-blue-400"
      class:bg-blue-400={isResizing}
      role="separator"
      aria-orientation="vertical"
      onpointerdown={(e) => onResizeStart(e, 'right')}
    ></div>
    <div
      class="absolute bottom-0 left-1 right-1 h-1 cursor-row-resize transition-colors hover:bg-blue-400"
      class:bg-blue-400={isResizing}
      role="separator"
      aria-orientation="horizontal"
      onpointerdown={(e) => onResizeStart(e, 'bottom')}
    ></div>
    <div
      class="absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize transition-colors hover:bg-blue-400"
      class:bg-blue-400={isResizing}
      role="separator"
      onpointerdown={(e) => onResizeStart(e, 'corner')}
    ></div>
  {/if}
</div>
