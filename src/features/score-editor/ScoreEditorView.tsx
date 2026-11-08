/**
 * The web host's `ScoreEditorView`: the shared editor view from
 * `@sudobility/music_ui`, with this app's browser/DOM dependencies supplied.
 *
 * The library owns everything geometric and interactive about the score; the
 * parts that touch the DOM or this app's services stay here and are injected:
 * the canvas **surface** (`web-canvas-surface.ts` — a 2D context, a caret
 * `<div>`, a scroll box), the drag-autoscroll geometry (`autoscroll.ts`), the
 * localized **library copy** (`@/i18n/library-copy` — the library ships no
 * strings), the **voice-record** control (`MediaRecorder` + the app's
 * transcription service, `VoiceRecordButton`), and the playback **controller**
 * (the app-wide `playbackController`, defaulted here so callers that drive the
 * app-wide store pass nothing, while the published page passes its own).
 *
 * This is composition, not UI, which is why it lives in the app: every call
 * site keeps the same prop surface the local component had.
 */
import type { ComponentProps } from 'react';
import { ScoreEditorView as LibScoreEditorView } from '@sudobility/music_ui';
import { playbackController } from '@/app-library';
import { createWebCanvasSurface, webCanvasScheduler } from './web-canvas-surface';
import { autoscrollDelta } from './autoscroll';
import { libraryCopy } from '@/i18n/library-copy';
import { VoiceRecordButton } from './VoiceRecordButton';

type LibProps = ComponentProps<typeof LibScoreEditorView>;

export type ScoreEditorViewProps = Omit<
  LibProps,
  | 'createSurface'
  | 'scheduler'
  | 'autoscrollDelta'
  | 'libraryCopy'
  | 'renderVoiceRecord'
  | 'controller'
> & {
  /** Defaults to the app-wide `playbackController`; the published page passes its own binding. */
  controller?: LibProps['controller'];
};

export function ScoreEditorView({
  controller = playbackController,
  ...props
}: ScoreEditorViewProps) {
  return (
    <LibScoreEditorView
      {...props}
      controller={controller}
      createSurface={createWebCanvasSurface}
      scheduler={webCanvasScheduler}
      autoscrollDelta={autoscrollDelta}
      libraryCopy={libraryCopy}
      renderVoiceRecord={(opts) => <VoiceRecordButton {...opts} />}
    />
  );
}
