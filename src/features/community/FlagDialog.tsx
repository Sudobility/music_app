/**
 * Report a shared snapshot.
 *
 * A reason (copyright, offensive, other) and a required explanation. Submitting
 * sends it to the site-admin review queue; on success the dialog shows a short
 * acknowledgement rather than closing silently, so the reader knows it landed.
 * Flagging requires sign-in, which the caller handles before opening this.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormModal,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sudobility/components';
import { FLAG_REASONS, flagReasonLabelKey, type FlagReason } from '@sudobility/music_types';
import { usePendingAction } from '@/hooks/usePendingAction';

export type FlagDialogProps = {
  open: boolean;
  /** Sends the report; rejects on failure, which is shown in the dialog. */
  onSubmit: (reason: FlagReason, details: string) => Promise<void>;
  onClose: () => void;
};

export function FlagDialog({ open, onSubmit, onClose }: FlagDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<FlagReason>(FLAG_REASONS[0]);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, runSubmit] = usePendingAction();

  useEffect(() => {
    if (open) {
      setReason(FLAG_REASONS[0]);
      setDetails('');
      setError(null);
      setDone(false);
    }
  }, [open]);

  const trimmed = details.trim();

  if (done) {
    return (
      <FormModal
        open={open}
        title={t('flag.title')}
        onClose={onClose}
        size="small"
        closeAriaLabel={t('common.closeDialog')}
        actions={[{ label: t('common.close'), onClick: onClose, variant: 'primary' }]}
      >
        <p className="text-sm text-muted-foreground">{t('flag.thanks')}</p>
      </FormModal>
    );
  }

  return (
    <FormModal
      open={open}
      title={t('flag.title')}
      onClose={onClose}
      size="small"
      closeAriaLabel={t('common.closeDialog')}
      saving={submitting}
      actions={[
        { label: t('common.cancel'), onClick: onClose, variant: 'ghost', disabled: submitting },
        {
          label: t('flag.submit'),
          variant: 'primary',
          loading: submitting,
          loadingLabel: t('flag.submitting'),
          onClick: () =>
            void runSubmit(async () => {
              if (trimmed.length === 0) {
                setError(t('flag.detailsRequired'));
                return;
              }
              setError(null);
              try {
                await onSubmit(reason, trimmed);
                setDone(true);
              } catch {
                setError(t('flag.failed'));
              }
            }),
        },
      ]}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{t('flag.hint')}</p>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t('flag.reasonLabel')}</span>
          <Select value={reason} onValueChange={(v) => setReason(v as FlagReason)}>
            <SelectTrigger aria-label={t('flag.reasonLabel')} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FLAG_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(flagReasonLabelKey(r))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t('flag.detailsLabel')}</span>
          <textarea
            aria-label={t('flag.detailsLabel')}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
            placeholder={t('flag.detailsPlaceholder')}
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </FormModal>
  );
}
