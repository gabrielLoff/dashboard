<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  export interface CarouselItem {
    id: string;
    icon: typeof import('lucide-svelte').Icon;
    label: string;
  }

  let {
    items,
    children,
    activeIndex = $bindable(0),
    class: className = '',
  }: {
    items: CarouselItem[];
    children: Snippet<[string]>;
    activeIndex?: number;
    class?: string;
  } = $props();

  let direction = $state<'left' | 'right'>('right');
  let touchStartX = $state(0);
  let touchStartY = $state(0);
  let isSwiping = $state(false);

  function goTo(index: number) {
    if (index < 0 || index >= items.length || index === activeIndex) return;
    direction = index > activeIndex ? 'right' : 'left';
    activeIndex = index;
  }

  function handleIconClick(index: number) {
    goTo(index);
  }

  function handleWheel(e: WheelEvent) {
    if (Math.abs(e.deltaY) < 10) return;
    if (e.deltaY > 0) {
      goTo(activeIndex + 1);
    } else {
      goTo(activeIndex - 1);
    }
  }

  function handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isSwiping = false;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!touchStartX) return;
    const touch = e.touches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isSwiping = true;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (!isSwiping) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartX;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        goTo(activeIndex + 1);
      } else {
        goTo(activeIndex - 1);
      }
    }
    touchStartX = 0;
    isSwiping = false;
  }
</script>

<div class={cn('flex h-full flex-col', className)}>
  <div class="flex items-center justify-center gap-1 pb-3">
    {#each items as item, i (item.id)}
      {@const IconComponent = item.icon}
      <button
        onclick={() => handleIconClick(i)}
        class={cn(
          'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
          i === activeIndex
            ? 'font-semibold text-neutral-900 dark:text-neutral-100'
            : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300'
        )}
        aria-label={item.label}
        aria-current={i === activeIndex ? 'true' : undefined}
      >
        <IconComponent class="h-4 w-4" />
        <span>{item.label}</span>
      </button>
    {/each}
  </div>

  <div
    class="relative flex-1 overflow-hidden"
    onwheel={handleWheel}
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
    role="region"
    aria-label="Carousel content"
  >
    {#each items as item, i (item.id)}
      <div
        class={cn(
          'absolute inset-0 transition-transform duration-300 ease-in-out',
          i === activeIndex
            ? 'translate-x-0'
            : direction === 'right'
              ? i < activeIndex
                ? '-translate-x-full'
                : 'translate-x-full'
              : i < activeIndex
                ? '-translate-x-full'
                : 'translate-x-full'
        )}
        style:visibility={i === activeIndex ? 'visible' : 'hidden'}
        aria-hidden={i !== activeIndex}
      >
        {@render children(item.id)}
      </div>
    {/each}
  </div>
</div>
