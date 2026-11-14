/**
 * PageConfig context — now the shared one from `@sudobility/building_blocks`.
 * `AppShell` provides it and `useSetPageConfig`/`usePageConfig` read it. Kept as
 * a re-export so existing `@/context/pageConfigContextDef` imports resolve.
 */
export { PageConfigContext, type PageConfigContextValue } from '@sudobility/building_blocks';
