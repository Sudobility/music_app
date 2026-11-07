/**
 * The web host's editor shell: the shared `AppLayout` from
 * `@sudobility/music_ui`, with this app's composition supplied.
 *
 * The library owns the three-pane layout, the app bar and its menus, the
 * transport, the status bar, and every shared dialog. What this wrapper injects
 * is everything the shell composes that is this app's alone: the active
 * language and auth context, the playback controller, the platform IO services,
 * audio rendering, the localized library copy, error reporting, the generation
 * client/token/live wiring (and the paywall on refusal), the MIDI/MusicXML
 * import services, the DOM-wired score-editor view, the credit badge (which
 * reaches consumables + the router), and the developer-settings dialog (which
 * reaches the perf benchmark and diagnostics export).
 *
 * This is composition, not UI, which is why it lives in the app; `router.tsx`
 * and the tests keep the same `{ store?, onNavigate? }` surface the local shell
 * had.
 */
import { useMemo } from 'react';
import type { ComponentProps } from 'react';
import { AppLayout as LibAppLayout } from '@sudobility/music_ui';
import { useCurrentLanguage } from '@/hooks/useLocalizedNavigate';
import { useMusicHookContext } from '@/app/AuthContext';
import { getAppServices, SOUNDFONT_ASSETS } from '@/config/initialize';
import { renderScoreAudio } from '@/config/web-player';
import { libraryCopy } from '@/i18n/library-copy';
import { playbackController, reportError } from '@/app-library';
import { reportGenerationError } from '@/features/credits/report-generation-error';
import { ScoreEditorView } from '@/features/score-editor/ScoreEditorView';
import { CreditBadge } from '@/features/credits/CreditBadge';
import { DeveloperSettingsDialog } from '@/components/dialogs/DeveloperSettingsDialog';

export type AppLayoutProps = Pick<ComponentProps<typeof LibAppLayout>, 'store' | 'onNavigate'>;

export function AppLayout(props: AppLayoutProps) {
  const lang = useCurrentLanguage();
  const hookContext = useMusicHookContext();

  // The composition root's services are a lazily-built singleton; read it once
  // and keep the derived generation wiring stable, so the poll timer in
  // `useProjectGeneration` is not torn down and rebuilt on every render.
  const generation = useMemo(() => {
    const services = getAppServices();
    return {
      io: services.io,
      client: services.musicClient,
      getToken: () => services.auth.getToken(),
      live: { baseUrl: services.baseUrl } as const,
    };
  }, []);

  return (
    <LibAppLayout
      {...props}
      lang={lang}
      hookContext={hookContext}
      controller={playbackController}
      io={generation.io}
      renderAudio={(score) => renderScoreAudio(score, SOUNDFONT_ASSETS)}
      libraryCopy={libraryCopy}
      reportError={reportError}
      generationClient={generation.client}
      generationGetToken={generation.getToken}
      generationLive={generation.live}
      onGenerationStartError={(error) => reportGenerationError(error, { store: props.store })}
      midiService={{
        analyze: async (buffer) => generation.io.analyzeMidi(buffer),
        import: async (buffer, options) => generation.io.openMidi(buffer, options),
      }}
      musicXmlService={{
        import: (text) => generation.io.openMusicXml(text, libraryCopy.musicXmlWarnings()),
      }}
      onImportError={(err, context) => reportError(err, { context, store: props.store })}
      renderScoreEditor={(editorProps) => <ScoreEditorView {...editorProps} />}
      creditBadge={<CreditBadge />}
      renderDeveloperSettings={(dsProps) => <DeveloperSettingsDialog {...dsProps} />}
    />
  );
}
