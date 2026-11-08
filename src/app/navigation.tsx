/**
 * The web app's navigation layer, built on the shared `@sudobility/routing` kit.
 *
 * music_lib owns the registry of routes both apps share (`musicRoutes`); here we
 * `extendRoutes` it with the web-only content screens, then implement the
 * `Navigator` contract over react-router so shared UI can navigate by route name
 * (`useNavigator().go('projects')`) without knowing about react-router or the
 * `/:lang` URL prefix. The native app has its own adapter over react-navigation;
 * both share the registry so route names, paths and params cannot drift.
 */
import { useMemo, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { extendRoutes, route } from '@sudobility/routing';
import { musicRoutes } from '@sudobility/music_lib';
import type { MusicNavigator } from '@sudobility/music_lib';
// The Navigator context is owned by the shared UI library; this app only
// supplies the react-router-backed Navigator and mounts the provider.
import { NavigatorProvider, useNavigator } from '@sudobility/music_ui';

/**
 * The full web route registry: the shared routes plus the web-only ones. Native
 * folds several of these into Settings sections rather than giving them a route.
 */
export const webRoutes = extendRoutes(musicRoutes, {
  /** The landing page. */
  home: route('/'),
  /** Standalone sign-in page (native folds this into Settings' account section). */
  signin: route('/signin'),
  /** Credit history (native: a Settings section). */
  creditsHistory: route('/credits/history'),
  /** Legacy coupon URL, redirected to the credits page. */
  creditsCoupons: route('/credits/coupons'),
  /** API keys / entities (native: a Settings section), feature-flagged. */
  entities: route('/entities'),
  /** The account dashboard, distinct from the projects list. */
  userDashboard: route('/dashboard'),
  /** The standalone print view for an open project. */
  print: route<{ projectId: string }>('/project/:projectId/print'),
  /** Not-found. */
  notFound: route('/404'),
});

export type WebRoutes = typeof webRoutes.routes;

/** Navigate by route name. The context is the shared UI library's; re-exported here. */
export { useNavigator };

/**
 * Builds the shared `Navigator` (over the base music routes) on react-router and
 * the current language, and provides it through the UI library's context so the
 * shared UI navigates by name. The `/:lang` prefix is applied here. App-only
 * routes (home, signin, print, 404…) are navigated by the app's own router,
 * not through this contract.
 */
export function WebNavigatorProvider({ lang, children }: { lang: string; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const nav = useMemo<MusicNavigator>(
    () => ({
      go: (name, params) => navigate(`/${lang}${musicRoutes.build(name, params)}`),
      replace: (name, params) =>
        navigate(`/${lang}${musicRoutes.build(name, params)}`, {
          replace: true,
        }),
      back: () => navigate(-1),
      current: () => {
        // Strip the leading `/:lang` segment, then match the rest.
        const path = location.pathname.replace(/^\/[^/]+/, '') || '/';
        return musicRoutes.parse(path);
      },
    }),
    [navigate, lang, location.pathname],
  );
  return <NavigatorProvider value={nav}>{children}</NavigatorProvider>;
}
