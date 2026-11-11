/**
 * Where to find music worth importing — now an API-driven tile list.
 *
 * The catalog used to be a static, grouped list compiled into the app from
 * `@sudobility/music_lib`. It is now served per (app, locale) from the shared
 * Sudobility resources catalog (central `sudobility_api`, reached through
 * `music_api`'s `/api/v1/resources` forwarder) and rendered by the reusable
 * `@sudobility/resources_pages` tile grid — the same component every Sudobility
 * app uses. Curation moved out of the codebase and into the admin MCP/skill.
 *
 * The page keeps its own heading/intro (the shared component's own title is
 * suppressed with `title: ''`), so it still reads as part of this site. Each
 * tile carries the site's icon, name, description and host, and opens the
 * target in a new tab — the shared component handles all of that.
 */
import { useTranslation } from 'react-i18next';
import { Heading, Section, Text } from '@sudobility/components';
import { ResourcesPageConnected } from '@sudobility/resources_pages';
import { useCurrentLanguage } from '@/hooks/useLocalizedNavigate';

export default function ResourcesPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();

  return (
    <>
      <Section spacing="3xl">
        <Heading level={1} size="3xl" weight="bold">
          {t('resources.title')}
        </Heading>
        <Text as="p" size="lg" color="muted" className="mt-3 max-w-3xl">
          {t('resources.intro')}
        </Text>
      </Section>

      <Section spacing="lg">
        <ResourcesPageConnected
          locale={lang}
          labels={{
            title: '',
            empty: t('resources.empty', 'No resources available yet.'),
            errorTitle: t('resources.errorTitle', 'Couldn’t load resources'),
          }}
        />
      </Section>
    </>
  );
}
