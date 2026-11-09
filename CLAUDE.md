# music_app (Moosiac)

> **Git policy — never auto-commit or auto-push.** Leave your work in the working
> tree. Run `git commit`, `git push`, `gh pr create` or `scripts/push_all.sh`
> **only when the user explicitly asks in that turn.** Approval for an earlier
> change does not carry forward, and finishing a task is not permission to commit
> it. Stay on the current branch; do not use feature branches.

The Moosiac web app: routing, pages and UI only. One of the family (see Related
projects). **All business logic lives in `@sudobility/music_lib`** (platform-free:
score model, commands, rendering adapters, the Zustand store); every
platform-bound capability — playback, XML parsing, file export, the MIDI codec —
is an interface in `music_types` implemented by `music_io` (one import serves web
and RN via a `react-native` export condition). Networking is `music_client`; the
backend (OpenAI proxy + project persistence) is the sibling `music_api` repo. See
`docs/architecture.md` for the full picture and request flows. **This repo is UI
and only UI — if you are about to write score maths, a command, an adapter or a
store slice, it belongs in a library.**

This is the web app the React Native apps (`music_app_rn`) mirror: its prose,
layout order and copy are the source of truth, pinned cross-app from the RN side.

## Tech stack

- React 19, TypeScript (strict), Vite, React Router
- **Tailwind** (`@sudobility/design` preset, `darkMode: 'class'`) — **no MUI/Emotion**
- `@sudobility/components` / `building_blocks` / `auth-components` for shared UI
- Zustand store, VexFlow rendering (windowed **canvas** via `CanvasScoreRenderer`,
  one canvas, no per-glyph DOM), soundfont playback (`js-synthesizer`, **not**
  Tone.js) — all via `music_lib`, never imported directly
- `@tanstack/react-query` for server state via `music_client`
- Firebase Auth, or an in-process e2e shim (`VITE_E2E=1` — never enable outside Playwright/dev)
- Bun for scripts; Vitest + Testing Library + jsdom for unit/component; Playwright for e2e

## Commands

- `bun install`
- `bun run dev` — Vite dev server, port 5039
- `bun run verify` — typecheck + lint + test:unit + build. Before any push.
- `bun run test:unit` / `bun run test:watch` — Vitest
- `bun run test:e2e` — Playwright (`e2e/*.spec.ts`); boots `music_api` from `../music_api`
  (`AI_TEST_MODE=1`, no real OpenAI) and the dev server (`VITE_E2E=1`) — needs a local
  Postgres `music_test` DB and `../music_api`'s deps installed. Kill anything on 5039/8023
  first (`reuseExistingServer` silently attaches otherwise).
- `bun run build` — `tsc -b && vite build`

## Package boundaries

Each library has one job; `src/__architecture.test.ts` enforces it. A move between
packages leaves **no re-export in the old home** — an import that stops resolving
after a library update points at an old home; fix the import, not with a shim.

- **`music_types`** — the model, Zod schemas, the pure primitives both frontend and backend
  need (pitch/tick math, score factory, quantization, ties, voices, `outOfRangeNoteIds`), and
  **every shared type and closed vocabulary**. No deps, hooks or async; targets ES2020, so no `.at()`.
- **`music_codecs`** — every score file format that carries notes (MIDI, MusicXML, tracker
  modules, `.moo`). Free of `music_lib`/`music_io`/`vexflow`/`tone`.
- **`music_client`** — the network: typed client for `music_api`, React Query hooks.
- **`music_io`** — files and audio files: the `open*`/`save*` layer over the codecs,
  audio formats, filesystem, XML parsing, MIDI input.
- **`music_player`** — the playback scheduler (`IMusicPlayer`, soundfont engine, plan
  building). Drives a `SynthBackend` but makes no sound itself.
- **`music_synth`** — the web synth: libfluidsynth (WASM) in an AudioWorklet, plus the
  offline export renderer. (`music_synth_rn`/`music_sample_engine` are the RN synths.)
- **`music_drawing`** — canvas/keyboard geometry and presentation: `ScoreCanvas`, hit
  testing, lit keys, print layout, render themes. Does not decide what a press _means_.
- **`music_editing`** — editing only, incl. what a press means (`classifyPress`,
  `routeScorePress`). No playback binding, documents, export planning, docs or prefs.
  Depends on neither `music_codecs` nor `music_player`.
- **`music_lib`** — frontend logic above editing: composed/per-document stores, autosave,
  `bindPlayer`, `planExport`, `decideClose`/`decideQuit`, docs content, generation
  builders, credits, device prefs. **Re-exports `music_types` and `music_editing`**, so a
  name from either resolves through `music_lib` too.

Placement rules (the user's): type definitions and vocabulary → `music_types`; pure
helpers used by both frontend and backend → `music_types`; `music_editing` is editing
only. **Canvas geometry is `music_drawing`'s; app layout geometry stays here** — the
line is the canvas edge. Anything reasoning about the _drawn score_ (where a note went,
which measure/track a point lands in, stave-position pitch, playing-measure position,
VexFlow colours) is `music_drawing`'s, because two apps draw the same score; a scroll
container or panel is this app's.

## Gotchas

- **Colour is a design token** (`src/__design-tokens.test.ts`): write `text-foreground`,
  `bg-card`, `bg-destructive text-destructive-foreground` etc. No hex/`rgb()`/palette
  classes (`bg-red-600`) outside the guard's written exceptions; a token background needs
  its foreground in the same state. VexFlow render-theme colours (`LIGHT_/DARK_RENDER_THEME`
  in `ScoreEditorView.tsx`) are literal hex deliberately — VexFlow draws to canvas, not CSS.
- **The theme is configured before any library module loads**: `src/config/theme.ts` is
  `main.tsx`'s (and the test setup's) first import, because some `@sudobility/components`
  modules read the theme at load time (`__theme-order.test.tsx`). No MUI/Emotion anywhere —
  dark mode is a Tailwind `dark` class on `<html>` via `applyDocumentTheme()`.
- **Canvas notation**: `ScoreEditorView` draws through `CanvasScoreRenderer` into a single
  viewport-pinned canvas; drawing only the visible systems per frame IS the virtualization
  (O(visible), unbounded scores). All interactions are geometric (`hit-test.ts`) — no
  `vf-*` DOM. jsdom stubs `getContext` with `createMock2DContext`; e2e resolves ids to
  coordinates via the dev-only `window.__scoresmith` handle.
- **Note state is colour, not an overlay**: `buildNoteColors` maps `eventId → role`
  applied via VexFlow `setStyle`; an inactive track dims whole; only the active track's
  sounding notes light up. Colours are the literal-hex render themes (shared with the
  piano roll).
- **The score is immutable while the transport plays**: `dispatchCommand`/`undo`/`redo`
  refuse a `content` command while playing — one guard per entry point. **Mix is exempt**
  (`kind: 'mix'` reaches the engine live). **A score arriving from outside** (generation,
  snapshot) must stop the transport first (`adoptOutsideScore`), or the lock never sees it.
- **The engine is handed a plan, never a score**: `IMusicPlayer.load(score)` is the
  surface; `music_player` owns `playbackPlan`. A mix change while playing calls
  `applyMix(tracks)`, not a full reload.
- **Nothing high-frequency may be read at a large component's top level.** `positionTick`
  arrives 30×/sec; each position-driven readout (`StatusPosition`, `MeasureBeatReadout`,
  `PositionScrubber`, `Timecode`, `CreditBadge`) is its own subscriber, the caret is not a
  React subscriber at all, and lit-note repaints paint one track via layered canvas. Both
  have regression tests; don't undo without re-measuring.
- **The reader is shown a _bar_; the code keeps `Measure`.** `Measure` is the model type;
  `bar` is the human number (`barNumberAt` answers `null` for a pickup — a measure index
  is not a bar number). UI copy says "bar"; keys keep the model's word (`replaceMeasures`
  → "Replace Bars"). Chinese 小节 covers both.

### Tests & single source

- **One fact, one declaration** (`src/__single-source.test.ts`): a constant restated in a
  second package drifts silently. A closed vocabulary is `const X = [...] as const` with the
  type read off it; a label/option list keyed by it is a `Record<T,...>`, never a parallel
  array. Score fixtures live once in `music_types/test`.
- **A missing translation is invisible, so it is tested** (`locale-parity.test.ts`): both
  locales define the same keys **and** every zh string contains CJK (key parity alone passes
  when English is copied across). A string with no key is invisible to every parity test —
  grep `aria-label={'` / `ariaLabel: '` before adding a control; the fix is always a key.
  Published vocabularies carry their own `labelKey` (a wrong one prints the key).
- **Cross-app copy parity lives in `music_app_rn`** (798 shared keys, this app authoritative),
  because only a test that sees both hosts can see it.

### Build & dependency model

- **Keep `music_synth` out of Vite dep pre-bundling** (`optimizeDeps.exclude`, beside
  `music_lib`/`music_io`/`music_player`): it lazily `import('js-synthesizer')` and the
  pre-bundler resolves worklet asset URLs wrong — symptom is a blank page, no console error.
- **`resolve.dedupe: ['react','react-dom','zustand']`** — a local `bun link` of music_lib
  exposes a second React and breaks every hook. Don't remove.
- **rsync-ing a local `@sudobility/*` build requires deleting `node_modules/.vite`** (Vite
  pre-bundles, else the browser runs stale code). `bun run build` doesn't clean `dist` —
  `bun run clean && bun run build` first. Any `bun add`/`bun remove` reinstalls from the
  registry and replaces what you rsynced — re-sync after.
- **The app owns the platform synth**: `music_synth` declares `js-synthesizer` an optional
  peer, so this app adds it; a fresh install fails loudly rather than shipping wrong audio.
- **There is no worker in this stack** — quantize and MIDI import run synchronously; don't
  reintroduce one without measuring (`postMessage` structure-clones both ways).
- **music_lib is told about its environment, never sniffs it** — `setErrorLogging(DEV)`;
  reading `import.meta.env` in a lib breaks RN at parse time (guard test forbids it).
- **`consumables_client` is inlined in `test.server.deps`** (like `music_lib`): it's `tsc`
  with extensionless imports Node's ESM loader rejects; Vite resolves it, only vitest hits
  Node. Don't add `.js` extensions upstream. `ConsumablesApiClient` carries no token, so it
  gets `AuthenticatedNetworkClient` (bearer per request, after `authStateReady()`).
- **Platform services come from `getAppServices().io`**, never `music_lib` directly.
  Component tests rendering `AppLayout` or an import dialog need `installTestAppServices()`;
  `resetTestAppServices()` clears the registry. Component tests need `withQueryClient`.

### Server, credits, auth

- **Generation is a server-side job; the project's status is the source of truth.** The
  editor polls `GET /projects/:id/status` (status only), watches the _project_ not its own
  job, and reloads on `updatedAt` change (awaited before the overlay clears). One candidate,
  always. Cadence: 3s running, 30s idle, nothing while hidden.
- **Reads return the score; writes return metadata.** Don't put `.score` back on a write
  response — take it from what you sent. Autosave omits the score when unchanged (identity),
  sending `{name, uiPrefs}`. Both directions gzipped (requests by `MusicClient`, gated on
  `CompressionStream`). `serverUpdatedAt` tells own writes from foreign; a write around the
  autosaver must `noteServerVersion`.
- **Snapshots**: creating one flushes the live score first (`saveNow` as `flush`). History
  is a tree (`parentId`), immutable by the _absence_ of a PATCH/PUT/DELETE route.
- **Credits are quoted, not calculated** (`bars × tracks`, "about"). The New Project gate is
  `music_lib`'s `newProjectCreditState` (both apps call it); a 402 opens the paywall
  (`CreditPaywallDialog`, the one non-`FormModal` modal), not a toast, and deletes the empty
  project it created. Site admins are never gated. `CreditBadge` is its own subscriber.
- **The URL names the language** (`/:lang/…`); the `language` pref answers only a bare `/`
  (`preferredLanguage`). The redirect reads the pref from storage, not the store.
- **No app-wide auth gate**: each gated page is wrapped in `ProtectedRoute`; published links
  and Community render signed out. **Sign-in is a page where you go to do it** (`LoginPage`,
  the `/:lang/signin` route) **and a modal where it interrupts** (`LoginModal` via
  `useSignIn().openSignIn`, opened over the page once on arrival). Never `navigate('/signin')`
  from an interruption. The form is `LoginView`, handlers in `useSignInForm`.
- **Every modal is `FormModal`** (no bare `Dialog`): it owns the title, the accessible name
  and the content scroll — the body must not repeat them. A footer with a Cancel must set
  `closeAriaLabel`.
- **A CTA that starts async work spins on itself and refuses a second press** (`PendingButton`,
  `usePendingAction`, `FormModal` `loading`/`saving`, `ConfirmDialog` `busy`). A dialog whose
  CTA starts the work stays open until done.

## Structure

- `src/app/` — `App.tsx` (composition root), `theme.ts`, `router.tsx`, `AuthContext.tsx`
- `src/config/initialize.ts` — the actual construction: `createMusicIo()`, the web player
  (`config/web-player.ts`: `music_player` scheduler over `music_synth`), `MusicClient`,
  auth/e2e backend, prefs storage, `music_lib`'s `StoreContext`
- `src/components/` — `layout/`, `transport/`, `inspector/`, `dialogs/`, `shell/`
- `src/features/` — `score-editor/` (ScoreEditorView, EditorToolbar, hit-test, render-theme),
  `piano-keyboard/`, `generation/`, `projects/`, `auth/`, `snapshots/`, `community/`, `docs/`
- `src/pages/` — content pages (`HomePage`, `ResourcesPage`, `LoginPage`, `SettingsPage`)
- `src/stubs/` — stand-ins for `building_blocks`' optional peer deps, aliased in `vite.config.ts`
- `src/test/` — `app-services.ts` (`installTestAppServices`), `query.tsx`, `setup.ts`
- `e2e/` — Playwright specs + `global-setup.ts` (truncates `music_test`, needs `CASCADE`)
- `docs/` — `architecture.md`, `parity-checklist.md`, `spec.md`

## Related projects

`music_types` · `music_codecs` · `music_drawing` · `music_player` · `music_synth` ·
`music_io` · `music_editing` · `music_client` · `music_lib` · `music_app_rn` ·
`music_api` (backend: Hono + Drizzle + PostgreSQL, private)
