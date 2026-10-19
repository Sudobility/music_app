/** Marker inserted before the injected `synth.dynamic-sample-loading` setter. */
export const DSL_MARKER: string;
/** Marker that replaces the post-`sfload` `unlink(...)` call. */
export const NOUNLINK_MARKER: string;
/**
 * Apply both lazy-decode patches to the js-synthesizer worklet bundle source,
 * returning the patched text. Idempotent; throws if an anchor cannot be placed.
 */
export function patchWorkletSource(src: string): string;
