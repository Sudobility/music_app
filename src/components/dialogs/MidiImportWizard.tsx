/**
 * The web host's MIDI import wizard: the shared dialog from
 * `@sudobility/music_ui`, with this app's platform MIDI service and error
 * reporting supplied. The dialog itself holds no composition root; the parse
 * pair comes from `getAppServices().io` and failures go through `reportError`.
 */
import type { ComponentProps } from 'react';
import { MidiImportWizard as LibMidiImportWizard } from '@sudobility/music_ui';
import { getAppServices } from '@/config/initialize';
import { reportError } from '@/app-library';

type LibProps = ComponentProps<typeof LibMidiImportWizard>;

export type MidiImportWizardProps = Omit<LibProps, 'midiService' | 'onError'>;

export function MidiImportWizard(props: MidiImportWizardProps) {
  return (
    <LibMidiImportWizard
      {...props}
      midiService={{
        analyze: async (buffer) => getAppServices().io.analyzeMidi(buffer),
        import: async (buffer, options) => getAppServices().io.openMidi(buffer, options),
      }}
      onError={(err, context) => reportError(err, { context, store: props.store })}
    />
  );
}
