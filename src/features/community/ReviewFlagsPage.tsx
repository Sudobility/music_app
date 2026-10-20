/**
 * The site-admin flag review queue.
 *
 * Each submitted report shows the snapshot it is about, the reason and the
 * reader's explanation, with a link to the shared page and two actions: Reject
 * dismisses it and leaves the snapshot public; Confirm upholds it and the
 * snapshot leaves the Community. Resolving one drops it from the list.
 *
 * The server enforces admin access; this page is only reachable from the
 * admin-only dashboard section.
 */
import { useTranslation } from 'react-i18next';
import { Button } from '@sudobility/components';
import { flagReasonLabelKey, type SnapshotFlag } from '@sudobility/music_types';
import { useReviewFlags } from '@sudobility/music_client';
import { useAuth } from '@/app/AuthContext';
import { LocalizedLink } from '@/components/layout/LocalizedLink';
import { usePendingAction } from '@/hooks/usePendingAction';

export function ReviewFlagsPage() {
  const { t } = useTranslation();
  const { hookContext } = useAuth();
  const { flags, isLoading, error, reject, confirm } = useReviewFlags(hookContext);

  return (
    <div className="space-y-4 p-3">
      <p className="text-sm text-muted-foreground">{t('flag.reviewHint')}</p>
      {error ? (
        <p className="text-sm text-destructive">{t('flag.reviewFailed')}</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : !flags || flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('flag.reviewEmpty')}</p>
      ) : (
        <ul className="space-y-3">
          {flags.map((flag) => (
            <FlagRow key={flag.id} flag={flag} onReject={reject} onConfirm={confirm} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FlagRow({
  flag,
  onReject,
  onConfirm,
}: {
  flag: SnapshotFlag;
  onReject: (id: string) => Promise<unknown>;
  onConfirm: (id: string) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [rejecting, runReject] = usePendingAction();
  const [confirming, runConfirm] = usePendingAction();
  const busy = rejecting || confirming;

  return (
    <li className="rounded border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <LocalizedLink to={`/p/${flag.publicId}`} className="font-medium text-foreground underline">
          {flag.publicName}
        </LocalizedLink>
        <span className="text-sm text-muted-foreground">
          {t('community.sharedBy', { name: flag.publisherName })}
        </span>
        <span className="rounded bg-muted px-2 py-0.5 text-xs text-foreground">
          {t(flagReasonLabelKey(flag.reason))}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{flag.details}</p>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => void runReject(() => onReject(flag.id))}
        >
          {rejecting ? t('common.loading') : t('flag.reject')}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={busy}
          onClick={() => void runConfirm(() => onConfirm(flag.id))}
        >
          {confirming ? t('common.loading') : t('flag.confirm')}
        </Button>
      </div>
    </li>
  );
}
