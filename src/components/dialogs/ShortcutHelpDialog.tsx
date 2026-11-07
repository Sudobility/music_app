/**
 * The web host's keyboard-shortcut help: the shared dialog from
 * `@sudobility/music_ui`, with this app's active language supplied (the dialog
 * reads no router of its own).
 */
import type { ComponentProps } from 'react';
import { ShortcutHelpDialog as LibShortcutHelpDialog } from '@sudobility/music_ui';
import { useCurrentLanguage } from '@/hooks/useLocalizedNavigate';

type LibProps = ComponentProps<typeof LibShortcutHelpDialog>;

export type ShortcutHelpDialogProps = Omit<LibProps, 'lang'>;

export function ShortcutHelpDialog(props: ShortcutHelpDialogProps) {
  const lang = useCurrentLanguage();
  return <LibShortcutHelpDialog {...props} lang={lang} />;
}
