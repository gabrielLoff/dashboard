# Modern Scrollbar Styles for Dashboard UI

## Summary

The CSS Scrollbars Styling Module Level 1 (`scrollbar-color` + `scrollbar-width`) reached **Baseline in December 2024** and is now supported in Chrome 121+, Firefox 64+, and Safari 26.2+. Tailwind CSS v4.3 (released May 8, 2026) added **first-party scrollbar utilities** (`scrollbar-thin`, `scrollbar-thumb-*`, `scrollbar-track-*`, `scrollbar-gutter-stable`) that abstract away browser differences. Since the project is on Tailwind v4, the simplest path is to **upgrade to v4.3+** and use the native utilities — no plugin needed.

## Findings

### Standard properties are now cross-browser (Baseline Dec 2024)

`scrollbar-color` and `scrollbar-width` are part of the CSS Scrollbars Styling Module Level 1 spec and work in all major engines. `scrollbar-width: thin` gives a slimmer scrollbar; `scrollbar-color: <thumb> <track>` sets colors. The old `::-webkit-scrollbar-*` pseudo-elements are non-standard and the CSS Working Group considers them a mistake.

**Source:** [MDN Web Docs — scrollbar-color](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-color) — "The scrollbar-color CSS property sets the color of the scrollbar's track and thumb."

### Tailwind v4.3 ships native scrollbar utilities

`scrollbar-auto`, `scrollbar-thin`, `scrollbar-none`, `scrollbar-thumb-*`, `scrollbar-track-*`, and `scrollbar-gutter-stable` are built-in. No third-party plugin required.

**Source:** [Tailwind CSS v4.3 Release Notes](https://tailwindcss.com/blog/tailwindcss-v4-3) — "New scrollbar utilities: scrollbar-thin, scrollbar-thumb-neutral-400, scrollbar-track-transparent, scrollbar-gutter-stable."

### `scrollbar-gutter: stable` prevents layout shift

Reserves space for the scrollbar before it appears, preventing content jump. Critical for dashboard layouts with side-by-side panels where one panel gains/loses a scrollbar on filter change.

**Source:** [MDN Web Docs — scrollbar-gutter](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter) — "The scrollbar-gutter CSS property reserves space for the scrollbar, preventing layout shift."

### `::-webkit-scrollbar-*` fallback for hover effects

The standard properties don't support hover-state color changes. WebKit pseudo-elements can add `:hover` thumb color changes in Chrome/Safari. Use `@supports` to layer them on top of the standard properties.

**Source:** [CSS-Tricks — Styling Scrollbars](https://css-tricks.com/almanac/properties/s/scrollbar/) — "For more control over scrollbar styling, you can use the webkit pseudo-elements, but they are non-standard."

### `tailwind-scrollbar` plugin as alternative for v4.1

If staying on Tailwind v4.1, the `tailwind-scrollbar` plugin provides `scrollbar`, `scrollbar-thin`, `scrollbar-thumb-*`, `scrollbar-track-*` utilities with both standards-track and WebKit fallback. But upgrading to v4.3 is cleaner.

**Source:** [tailwind-scrollbar GitHub](https://github.com/adoxography/tailwind-scrollbar) — "A plugin that provides utilities for styling scrollbars the modern way."

## Recommended approach

1. **Upgrade Tailwind to v4.3+** (if not already)
2. **Use native utilities** on scroll containers:
   ```
   class="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-400 scrollbar-track-transparent scrollbar-gutter-stable"
   ```
3. **Add WebKit hover fallback** in `app.css` via `@supports` for Chrome/Safari thumb hover effect
4. **No plugin needed** — everything is built-in

## Sources

- [MDN Web Docs — scrollbar-color](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-color)
- [MDN Web Docs — scrollbar-gutter](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter)
- [Tailwind CSS v4.3 Release Notes](https://tailwindcss.com/blog/tailwindcss-v4-3)
- [CSS-Tricks — Styling Scrollbars](https://css-tricks.com/almanac/properties/s/scrollbar/)
- [tailwind-scrollbar GitHub](https://github.com/adoxography/tailwind-scrollbar)
