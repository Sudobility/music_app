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
import { extendRoutes, route, type Navigator } from '@sudobility/routing';
import { createNavigatorContext } from '@sudobility/routing/react';
import { musicRoutes } from '@sudobility/music_lib';

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
export type WebNavigator = Navigator<WebRoutes>;

const { NavigatorProvider, useNavigator } = createNavigatorContext<WebRoutes>();

/** Navigate by route name. Must be used under {@link WebNavigatorProvider}. */
export { useNavigator };

/**
 * Builds the `Navigator` over react-router and the current language, and
 * provides it to the tree. Mounted once under `/:lang` so every screen (and the
 * shared UI inside them) can navigate by name; the `/:lang` prefix is applied
 * here so callers never think about it.
 */
export function WebNavigatorProvider({
  lang,
  children,
}: {
  lang: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const nav = useMemo<WebNavigator>(
    () => ({
      go: (name, params) => navigate(`/${lang}${webRoutes.build(name, params)}`),
      replace: (name, params) =>
        navigate(`/${lang}${webRoutes.build(name, params)}`, { replace: true }),
      back: () => navigate(-1),
      current: () => {
        // Strip the leading `/:lang` segment, then match the rest.
        const path = location.pathname.replace(/^\/[^/]+/, '') || '/';
        return webRoutes.parse(path);
      },
    }),
    [navigate, lang, location.pathname],
  );
  return <NavigatorProvider value={nav}>{children}</NavigatorProvider>;
}
