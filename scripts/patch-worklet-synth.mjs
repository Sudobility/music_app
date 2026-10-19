#!/usr/bin/env node
/**
 * Re-applies Moosiac's patches to the vendored js-synthesizer AudioWorklet
 * bundle (`public/audio/js-synthesizer.worklet.min.js`).
 *
 * The web player decodes the 23MB FluidR3 SF3 inside the AudioWorklet. By
 * default js-synthesizer (a) does not enable FluidSynth's lazy sample loading
 * and (b) `unlink`s the soundfont from MEMFS right after `sfload`. Together
 * that decodes the *whole* General MIDI set up front — ~16-35s on a cold load —
 * where the native apps (iOS/macOS FluidSynth `dynamic-sample-loading`, Windows
 * `tsf_load_filename_programs`) only ever decode the instruments a score uses.
 *
 * This brings the web in line with two edits:
 *   1. enable `synth.dynamic-sample-loading` → `sfload` parses structure only,
 *      sample data decodes lazily when a preset is selected.
 *   2. drop the post-`sfload` `unlink` → the font stays in MEMFS so FluidSynth
 *      can read sample data on demand (without it playback is fast but SILENT).
 *
 * The bundle is a committed vendored file (no install-time copy), so the patched
 * copy is what ships. Run this only when refreshing the bundle from a new
 * js-synthesizer release:
 *
 *     cp node_modules/js-synthesizer/dist/js-synthesizer.worklet.min.js \
 *        public/audio/js-synthesizer.worklet.min.js
 *     node scripts/patch-worklet-synth.mjs
 *
 * It is idempotent. The anchors are deliberately tolerant of minifier variable
 * renaming but will FAIL LOUDLY if the bundle's shape changed enough that a
 * patch cannot be placed — that is the signal to re-derive the patch by hand,
 * not to ship an unpatched (slow/silent) worklet. `__worklet-synth-patch.test.ts`
 * fails the build if either patch is ever missing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const DSL_MARKER = '/*MOOSIAC-DSL*/';
export const NOUNLINK_MARKER = '/*MOOSIAC-NOUNLINK*/';

/** Apply both patches to `src`, returning the patched text. Throws if an anchor is missing. */
export function patchWorkletSource(src) {
  let out = src;

  // 1. Enable dynamic-sample-loading, mirroring the `synth.midi-channels` set
  //    (same setter fn + settings var, whatever the minifier named them).
  if (!out.includes('synth.dynamic-sample-loading')) {
    const anchor =
      /([A-Za-z$_][\w$]*)\(\s*([A-Za-z$_][\w$]*)\s*,\s*(['"])synth\.midi-channels\3\s*,[^)]*\),/;
    const m = anchor.exec(out);
    if (!m) {
      throw new Error(
        'patch-worklet-synth: could not find the `synth.midi-channels` anchor — ' +
          'the bundle shape changed; re-derive the dynamic-sample-loading patch.',
      );
    }
    const [whole, setFn, settingsVar, q] = m;
    const injection = `${DSL_MARKER}${setFn}(${settingsVar},${q}synth.dynamic-sample-loading${q},1),`;
    out = out.replace(whole, `${whole}${injection}`);
  }

  // 2. Drop the `unlink` that removes the font MEMFS entry after `sfload`.
  if (!out.includes(NOUNLINK_MARKER)) {
    const anchor = /([A-Za-z$_][\w$]*)\.unlink\(\s*([A-Za-z$_][\w$]*)\s*\),/;
    const m = anchor.exec(out);
    if (!m) {
      throw new Error(
        'patch-worklet-synth: could not find the post-sfload `unlink(...)` — ' +
          'the bundle shape changed; re-derive the no-unlink patch.',
      );
    }
    out = out.replace(m[0], NOUNLINK_MARKER);
  }

  return out;
}

function main() {
  const BUNDLE = fileURLToPath(
    new URL('../public/audio/js-synthesizer.worklet.min.js', import.meta.url),
  );
  const before = readFileSync(BUNDLE, 'utf8');
  const after = patchWorkletSource(before);
  const hasDsl = after.includes('synth.dynamic-sample-loading');
  const hasNoUnlink = after.includes(NOUNLINK_MARKER);
  if (!hasDsl || !hasNoUnlink) {
    throw new Error('patch-worklet-synth: patches not fully applied after run.');
  }
  if (after === before) {
    console.log('patch-worklet-synth: already patched; no change.');
    return;
  }
  writeFileSync(BUNDLE, after);
  console.log('patch-worklet-synth: applied dynamic-sample-loading + no-unlink.');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
