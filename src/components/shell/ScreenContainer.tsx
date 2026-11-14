/**
 * Route-level page shell: `AppShell` from `@sudobility/building_blocks` provides
 * the top bar, breadcrumbs, content area and footer, and owns the page-config
 * context (pages override layout via `useSetPageConfig`). Mounted once as a
 * layout route — never per page.
 *
 * The bar and the footer are configuration, built by `useTopBarConfig` and
 * `useFooterConfig`, so this file is only the arrangement. Breadcrumbs are
 * opt-in per page via this app's own `BreadcrumbContext` (kept here — the
 * shared shell takes the resolved items as a prop).
 */
import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AppShell } from '@sudobility/building_blocks';
import type { BreadcrumbItem } from '@sudobility/building_blocks';
import { BreadcrumbContext } from '@/context/breadcrumbContextDef';
import { useBreadcrumbItems } from '@/hooks/useBreadcrumbs';
import { useFooterConfig } from '@/hooks/useFooterConfig';
import { useTopBarConfig } from '@/hooks/useTopBarConfig';
import { LinkWrapper } from '@/components/layout/LinkWrapper';
import type { LanguagePrefStore } from '@/hooks/useLocalizedNavigate';

type ScreenContainerProps = {
  children: ReactNode;
  /** Where a language switch is remembered; defaults to the app-wide store. */
  store?: LanguagePrefStore;
};

function ScreenContainerInner({ children, store }: ScreenContainerProps) {
  const location = useLocation();
  const isHomePage = location.pathname.split('/').filter(Boolean).length <= 1;

  const topBar = useTopBarConfig(store);
  // Full on the home page, compact everywhere else.
  const footer = useFooterConfig(isHomePage ? 'full' : 'compact');
  const breadcrumbItems = useBreadcrumbItems();

  return (
    <AppShell
      topBar={topBar}
      breadcrumbs={
        breadcrumbItems ? { items: breadcrumbItems, LinkComponent: LinkWrapper } : undefined
      }
      footer={footer}
      pageDefaults={{
        layoutMode: 'full',
        maxWidth: '7xl',
        contentPadding: 'none',
        contentClassName: 'w-full min-w-0',
      }}
    >
      {children}
    </AppShell>
  );
}

export function ScreenContainer({ children, store }: ScreenContainerProps) {
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[] | null>(null);
  return (
    <BreadcrumbContext.Provider value={{ items: breadcrumbItems, setItems: setBreadcrumbItems }}>
      <ScreenContainerInner store={store}>{children}</ScreenContainerInner>
    </BreadcrumbContext.Provider>
  );
}
