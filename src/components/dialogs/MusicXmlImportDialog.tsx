/**
 * The web host's MusicXML import dialog: the shared dialog from
 * `@sudobility/music_ui`, with this app's platform parser (and its localized
 * warning copy) and error reporting supplied.
 */
import type { ComponentProps } from 'react';
import { MusicXmlImportDialog as LibMusicXmlImportDialog } from '@sudobility/music_ui';
import { getAppServices } from '@/config/initialize';
import { libraryCopy } from '@/i18n/library-copy';
import { reportError } from '@/app-library';

type LibProps = ComponentProps<typeof LibMusicXmlImportDialog>;

export type MusicXmlImportDialogProps = Omit<LibProps, 'musicXmlService' | 'onError'>;

export function MusicXmlImportDialog(props: MusicXmlImportDialogProps) {
  return (
    <LibMusicXmlImportDialog
      {...props}
      musicXmlService={{
        import: (text: string) =>
          getAppServices().io.openMusicXml(text, libraryCopy.musicXmlWarnings()),
      }}
      onError={(err, context) => reportError(err, { context, store: props.store })}
    />
  );
}
