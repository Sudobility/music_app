# Audio assets (vendored)

These files back the web player's soundfont synth. They are committed rather
than copied at install time, so whatever is here is what ships.

| File | Source | Notes |
| --- | --- | --- |
| `FluidR3Mono_GM.sf3` | FluidR3Mono (SF3, Ogg-compressed) | The General MIDI soundfont, ~23MB. See `FluidR3Mono_License.md`. |
| `libfluidsynth-2.4.6-with-libsndfile.js` | libfluidsynth 2.4.6 WASM, built **with libsndfile** | The plain build cannot read SF3 (Ogg). |
| `js-synthesizer.worklet.min.js` | js-synthesizer **1.13.0** (`dist/js-synthesizer.worklet.min.js`) | **Patched — see below.** |
| `percussion/` | per-kit percussion packs | Used by the RN sample engine. |

## The js-synthesizer worklet is patched for lazy decode

The web player decodes the SF3 inside the AudioWorklet. Stock js-synthesizer
decodes the **entire** GM set at `sfload` and then `unlink`s the font from
MEMFS — a ~16-35s wait on a cold load before Play is ready. The native apps
never do this (iOS/macOS use FluidSynth `synth.dynamic-sample-loading`, Windows
uses `tsf_load_filename_programs`, Android loads per-instrument sample packs), so
the web was the outlier.

Two edits bring it in line, applied by **`scripts/patch-worklet-synth.mjs`**:

1. **Enable `synth.dynamic-sample-loading`** — `sfload` parses structure only and
   sample data decodes lazily when a preset is selected (`/*MOOSIAC-DSL*/`).
2. **Drop the post-`sfload` `unlink`** — the font stays in MEMFS so FluidSynth can
   read sample data on demand; without this, playback is fast but **silent**
   (`/*MOOSIAC-NOUNLINK*/`).

Measured effect: the worklet `sfload` drops from ~16-35s to ~2s, decoding only
the instruments a score uses.

### Refreshing the bundle (e.g. a js-synthesizer upgrade)

```sh
cp node_modules/js-synthesizer/dist/js-synthesizer.worklet.min.js \
   public/audio/js-synthesizer.worklet.min.js
node scripts/patch-worklet-synth.mjs
```

The script is idempotent and its anchors tolerate minifier variable renaming, but
it will **fail loudly** if the bundle's shape changed too much to place a patch —
re-derive the patch by hand then. `src/__worklet-synth-patch.test.ts` fails the
build if the shipped bundle is ever missing either patch.

> The **main-thread** js-synthesizer (`node_modules`, used only by audio
> **export** via `renderScoreAudio`) is intentionally **not** patched: export is
> an offline, one-shot render where up-front full decode is fine, and patching a
> `node_modules` file would need patch-package.
