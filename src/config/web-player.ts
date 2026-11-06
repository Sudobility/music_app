/**
 * The web player and audio export, assembled from the scheduler and the synth.
 *
 * `@sudobility/music_player` is the platform-neutral scheduler and
 * `@sudobility/music_synth` the concrete web synth (libfluidsynth in an
 * `AudioWorklet`); neither depends on the other, so the composition root joins
 * them. This is the only place that knows both — the former home of
 * `createMusicPlayer`/`renderScoreAudio`, now that those left music_player with
 * the synth.
 */
import { MusicPlayer, SoundfontPlaybackEngine, renderScoreWith } from '@sudobility/music_player';
import {
  createWebSynthBackend,
  renderSamples,
  type SoundfontAssets,
} from '@sudobility/music_synth';
import type { DecodedAudio, Score } from '@sudobility/music_types';

/**
 * The web player, built fresh. Hand it to `initializeMusicPlayer`.
 *
 * Carries `setAudioOutputDevice`/`getAudioOutputDeviceId` for the output picker,
 * which read them straight off the player (`AudioOutputSelect`).
 */
export function createWebMusicPlayer({ soundfont }: { soundfont: SoundfontAssets }): MusicPlayer {
  const backend = createWebSynthBackend({ soundfont });
  const player = new MusicPlayer(new SoundfontPlaybackEngine({ backend }));
  return Object.assign(player, {
    setAudioOutputDevice: (deviceId: string) => backend.setAudioOutputDevice(deviceId),
    getAudioOutputDeviceId: () => backend.getAudioOutputDeviceId(),
  });
}

/**
 * A score rendered to PCM through the soundfont playback uses — the whole of an
 * audio export short of encoding it. `renderEvents` (in music_player, via
 * `renderScoreWith`) builds the plan; `renderSamples` (in music_synth) voices
 * it through the same font, so the file is a recording of what was heard. The
 * caller encodes and saves; this touches no files.
 */
export function renderScoreAudio(score: Score, soundfont: SoundfontAssets): Promise<DecodedAudio> {
  return renderScoreWith(score, renderSamples(soundfont));
}
