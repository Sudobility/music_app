/**
 * The web player decodes the 23MB FluidR3 SF3 inside the AudioWorklet, and the
 * vendored js-synthesizer worklet bundle is hand-patched (see
 * `scripts/patch-worklet-synth.mjs`) to decode lazily — `synth.dynamic-sample-loading`
 * plus keeping the font in MEMFS so samples can be read on demand. Without the
 * patch the whole General MIDI set decodes up front (~16-35s on a cold load), or,
 * if only half-applied, playback is fast but silent.
 *
 * The bundle is a committed vendored file with no install-time copy, so the one
 * way the patch silently disappears is someone refreshing it from a new
 * js-synthesizer release without re-running the script. This test turns that into
 * a build failure.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DSL_MARKER,
  NOUNLINK_MARKER,
  patchWorkletSource,
} from '../scripts/patch-worklet-synth.mjs';

const BUNDLE = resolve(process.cwd(), 'public/audio/js-synthesizer.worklet.min.js');

describe('vendored js-synthesizer worklet lazy-decode patch', () => {
  it('ships patched: dynamic-sample-loading + no-unlink', () => {
    const src = readFileSync(BUNDLE, 'utf8');
    expect(
      src.includes(DSL_MARKER) && src.includes('synth.dynamic-sample-loading'),
      'dynamic-sample-loading missing — run `node scripts/patch-worklet-synth.mjs`',
    ).toBe(true);
    expect(
      src.includes(NOUNLINK_MARKER),
      'post-sfload unlink not removed — run `node scripts/patch-worklet-synth.mjs`',
    ).toBe(true);
  });

  it('patcher is idempotent and tolerates minifier renaming', () => {
    const pristine =
      "E(n,'synth.chorus.speed',s.chorusSpeed),E(n,'synth.midi-channels',s.midiChannelCount)," +
      'go();z.writeFile(t,i);const r=h(this._synth,t,1);return(z.unlink(t),-1===r?rej():res(r));';
    const once = patchWorkletSource(pristine);
    expect(once).toContain('synth.dynamic-sample-loading');
    expect(once).toContain(DSL_MARKER);
    expect(once).toContain(NOUNLINK_MARKER);
    expect(once).not.toContain('z.unlink(t)');
    expect(patchWorkletSource(once)).toBe(once);
  });

  it('fails loudly when the bundle shape no longer matches', () => {
    expect(() => patchWorkletSource('nothing to anchor on')).toThrow();
  });
});
