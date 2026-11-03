/**
 * The account control in the top bar, in the shape `AppTopBarWithFirebaseAuth`
 * expects.
 *
 * Every other app in the family (`sudojo_app`, `shapeshyft_app`) ships an
 * app-local `AuthAction` that reads auth *state* from its own context and
 * draws web-specific UI. This app does the same, with one extra wrinkle: it
 * must not mount any library auth provider, because it deliberately swaps
 * Firebase for an in-process shim under `VITE_E2E=1` (see
 * `config/initialize.ts`). Mounting a library provider would bypass that shim
 * and sign the user out from under every Playwright run. So the user comes
 * from this app's own `useAuth()`, never from `@sudobility/components`' retired
 * auth context.
 *
 * Logged out → a "Sign in" button. Logged in → the user's avatar (their
 * uploaded picture, or their initials) opening a dropdown of the given menu
 * items plus "Sign out".
 *
 * `building_blocks` injects this rather than importing it — "passed as a prop
 * to avoid hard dependency on auth-components" — which is the seam that lets
 * the app supply its own control.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AuthActionProps } from '@sudobility/building_blocks';
import { Button } from '@sudobility/components';
// Dropdown is bundled at runtime but not re-exported from the root type barrel
// in this components version; import from the typed subpath.
import { Dropdown } from '@sudobility/components/ui/dropdown';
import { useProfile } from '@sudobility/music_client';
import { useAuth } from '@/app/AuthContext';
import { getAppServices } from '@/config/initialize';

export function AuthActionAdapter({
  menuItems,
  onLoginClick,
  avatarSize = 32,
  dropdownAlign = 'right',
  loginButtonText,
  loginButtonClassName,
}: AuthActionProps) {
  const { t } = useTranslation();
  const { user, signOut, hookContext } = useAuth();
  const avatarId = useProfile(hookContext).data?.avatarId ?? null;
  // The picture the user uploaded on the dashboard's Account page, and null
  // until they have — we then fall back to initials. Never Firebase's own
  // `photoURL`: sign-in is email and Google without a photo sync, and the
  // picture a user chose here is the one they meant.
  const photoURL = avatarId ? getAppServices().musicClient.avatarUrl(avatarId) : null;

  const items = useMemo(
    () => [
      ...(menuItems ?? []).map((item) => ({
        id: item.id,
        label: item.label,
        onClick: () => item.onClick?.(),
        separator: item.dividerAfter,
      })),
      {
        id: 'sign-out',
        label: t('nav.signOut'),
        onClick: () => {
          void signOut();
        },
      },
    ],
    [menuItems, signOut, t],
  );

  if (!user) {
    return (
      <Button
        type="button"
        variant="primary"
        className={loginButtonClassName}
        onClick={() => onLoginClick?.()}
      >
        {loginButtonText ?? t('nav.signIn')}
      </Button>
    );
  }

  const initials = (user.email ?? user.displayName ?? '?').slice(0, 2).toUpperCase();

  return (
    <Dropdown
      align={dropdownAlign}
      trigger={
        // The trigger is the button; the avatar inside it must not also be
        // clickable, or the dropdown opens and closes on the same press.
        photoURL ? (
          <img
            src={photoURL}
            alt={user.email ?? user.displayName ?? ''}
            width={avatarSize}
            height={avatarSize}
            className="rounded-full object-cover"
            style={{ width: avatarSize, height: avatarSize }}
          />
        ) : (
          <span
            aria-label={user.email ?? user.displayName ?? undefined}
            className="flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium"
            style={{ width: avatarSize, height: avatarSize }}
          >
            {initials}
          </span>
        )
      }
      items={items}
    />
  );
}
