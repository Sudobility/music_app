/**
 * Application boundary for ScoreSmith.
 *
 * `music_lib` is the business package. The application store, its injected
 * context, persistence and the player binding now live there (shared with the
 * native app) and arrive through `export * from '@sudobility/music_lib'`; what
 * stays here is the browser-only glue around them — the app-wide player
 * adapter, error-to-toast mapping, export planning, library copy and the perf
 * benchmark — plus the test store-context helper.
 */
export * from '@sudobility/music_lib';
export * from '@sudobility/music_editing';
export * from '@sudobility/music_codecs';
export * from '@sudobility/music_drawing';
export * from '@sudobility/music_io';
export * from '@sudobility/music_player';

export * from './services/errors.js';
export * from './services/export/export-plan.js';
export * from './services/library-copy.js';
export * from './services/playback/adapter.js';
export * from './services/perf/benchmark.js';
export * from './test/store-context.js';
export { PlaybackBus } from '@sudobility/music_player/core';
