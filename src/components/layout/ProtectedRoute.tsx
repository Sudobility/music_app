/**
 * Route guard for the pages that need an account.
 *
 * Signed out, the page is replaced by its signed-out state (what is missing +
 * a Sign in button) and the sign-in modal opens over it; the reader stays at
 * the URL they asked for. The gate itself is `building_blocks`' provider-
 * agnostic `RequireSignIn`; this binds it to the app's `useAuth`/`useSignIn`
 * and copy. Closing the modal auto-happens on navigation (the modal derives
 * open from the pathname), so no `closeSignIn` is needed.
 */
import type { ComponentType, ReactNode } from 'react';
import { createRequireSignIn } from '@sudobility/building_blocks';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@sudobility/components';
import { useAuth } from '@/app/AuthContext';
import { useSignIn } from '@/features/auth/SignInModal';

// Annotated (not just inferred) so the type does not reference the linked
// building_blocks' own @types/react copy (TS2883 under bun link).
export const ProtectedRoute: ComponentType<{ children: ReactNode }> = createRequireSignIn({
  useAuth,
  useSignIn,
  useText: () => {
    const { t } = useTranslation();
    return { body: t('library.authRequired'), button: t('nav.signIn') };
  },
  loadingFallback: (
    <div className="grid min-h-screen place-items-center" role="status" aria-live="polite">
      <Spinner ariaLabel="Loading" size="large" />
    </div>
  ),
});
