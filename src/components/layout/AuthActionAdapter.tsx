/**
 * The account control in the top bar, in the shape `AppTopBarWithFirebaseAuth`
 * expects. The dropdown/menu/sign-out rendering now lives in
 * `building_blocks`' `AuthActionView`; this adapter only binds the app's own
 * `useAuth()` (never a library auth provider — the app swaps Firebase for an
 * in-process shim under `VITE_E2E=1`) and supplies the uploaded-picture avatar
 * (`useProfile` → `musicClient.avatarUrl`), falling back to initials.
 */
import { useTranslation } from 'react-i18next';
import { AuthActionView } from '@sudobility/building_blocks';
import type { AuthActionProps, AuthActionUser } from '@sudobility/building_blocks';
import { useProfile } from '@sudobility/music_client';
import { useAuth } from '@/app/AuthContext';
import { getAppServices } from '@/config/initialize';

export function AuthActionAdapter(props: AuthActionProps) {
  const { t } = useTranslation();
  const { user, signOut, hookContext } = useAuth();
  const avatarId = useProfile(hookContext).data?.avatarId ?? null;
  // The picture the user uploaded on the Account page (null until they have);
  // never Firebase's own `photoURL`.
  const photoURL = avatarId ? getAppServices().musicClient.avatarUrl(avatarId) : null;
  const avatarSize = props.avatarSize ?? 32;

  const renderAvatar = (u: AuthActionUser) =>
    photoURL ? (
      <img
        src={photoURL}
        alt={u.email ?? u.displayName ?? ''}
        width={avatarSize}
        height={avatarSize}
        className="rounded-full object-cover"
        style={{ width: avatarSize, height: avatarSize }}
      />
    ) : (
      <span
        aria-label={u.email ?? u.displayName ?? undefined}
        className="flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium"
        style={{ width: avatarSize, height: avatarSize }}
      >
        {(u.email ?? u.displayName ?? '?').slice(0, 2).toUpperCase()}
      </span>
    );

  return (
    <AuthActionView
      {...props}
      user={user}
      onSignOut={() => void signOut()}
      signOutLabel={t('nav.signOut')}
      loginButtonText={props.loginButtonText ?? t('nav.signIn')}
      renderAvatar={renderAvatar}
    />
  );
}
