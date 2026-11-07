/**
 * The colour scheme the app is drawn in.
 *
 * The browser-generic half — the `prefers-color-scheme` query, resolving a
 * preference to `light`/`dark`, the reduced-motion read, and the
 * `useResolvedColorScheme` hook the notation canvas and keyboard draw from —
 * now lives in `@sudobility/music_ui` (shared with any web host of the editor)
 * and is re-exported here so this app's call sites are unchanged. What stays
 * is the one thing that is this app's alone: applying the answer to *this*
 * document's `<html>`.
 */
export {
  useResolvedColorScheme,
  resolveColorScheme,
  getSystemColorScheme,
  prefersReducedMotion,
} from '@sudobility/music_ui';
export type { ColorSchemeMode, ResolvedColorScheme } from '@sudobility/music_ui';

import type { ResolvedColorScheme } from '@sudobility/music_ui';

/**
 * Applies a resolved color scheme to the document by toggling the `dark`
 * class on `<html>` (Tailwind `darkMode: 'class'`, see `tailwind.config.js`
 * and the `.dark { ... }` variable block in `src/index.css`). No-op outside
 * a DOM environment (SSR/tests that don't set up jsdom's `document`).
 */
export function applyDocumentTheme(scheme: ResolvedColorScheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', scheme === 'dark');
}
