/**
 * Language configuration. `SUPPORTED_LANGUAGES` is the single source of truth
 * for which languages the app supports, and must stay in sync with the
 * translation directories under `public/locales/`. `src/i18n.ts` reads it for
 * `supportedLngs`.
 *
 * The set matches the rest of the family — the fifteen UI languages
 * `sudojo_lib` lists and `sudojo_app`/`sudojo_app_rn` ship — so the music apps
 * offer the same languages as their siblings.
 *
 * To add a language:
 * 1. Add its code here.
 * 2. Add its display name to `LANGUAGE_NAMES` and a flag to `LANGUAGE_FLAGS`.
 * 3. Create `public/locales/<code>/app.json`.
 *
 * No language is compiled into the bundle: every one is fetched at runtime from
 * `public/locales/`, so a new one ships without an import or a rebuild.
 * `languages.test.ts` checks each code here has a matching directory whose keys
 * match English, since the two going out of sync is silent — i18next falls back
 * to English for a missing key and shows the raw key for a missing file.
 *
 * All fifteen are now translated, so `PENDING_TRANSLATION` is empty and the
 * strict "actually translates" check in `languages.test.ts` runs for every
 * language. The set is kept as the seam for the next language added: scaffold
 * its bundle as an English copy, list its code there so the app can ship it
 * while the translation is pending, then clear the code once it is translated.
 */
export const SUPPORTED_LANGUAGES = [
  'en',
  'de',
  'es',
  'fr',
  'it',
  'ja',
  'ko',
  'pt',
  'ru',
  'sv',
  'th',
  'uk',
  'vi',
  'zh',
  'zh-hant',
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Languages present as English-copy placeholders, awaiting translation.
 *
 * Empty: every supported language is translated. Keep it in sync with reality
 * — a language listed here is one the app offers but has not yet translated,
 * and listing it skips only the strict "actually translates" check in
 * `languages.test.ts` (key parity and placeholder preservation still apply).
 * Removing a code turns that check on for it.
 */
export const PENDING_TRANSLATION: ReadonlySet<SupportedLanguage> = new Set([]);

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  // Native names, as every other app in the family lists them: a reader
  // looking for their own language is not scanning for the English word for it.
  // Taken from sudojo_lib's shared `SUPPORTED_LANGUAGES` table so the whole
  // family names a language the same way.
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  pt: 'Português',
  ru: 'Русский',
  sv: 'Svenska',
  th: 'ไทย',
  uk: 'Українська',
  vi: 'Tiếng Việt',
  zh: '简体中文',
  'zh-hant': '繁體中文',
};

export function isLanguageSupported(code: string): code is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}

/**
 * The shape the top bar's `LanguageSelector` wants — code, native name, flag.
 *
 * Derived from `SUPPORTED_LANGUAGES` rather than written out again, so a
 * language cannot end up offered in the picker without a bundle behind it. That
 * matters because the selector ships its own default list of 16 languages: hand
 * it that and it offers locales this app has no translations for, and every
 * string renders as its raw key.
 *
 * Flags are a rough convention, not a claim about nationhood — a language is
 * not a country, and several here are spoken in many.
 */
const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '\u{1F1FA}\u{1F1F8}', // 🇺🇸
  de: '\u{1F1E9}\u{1F1EA}', // 🇩🇪
  es: '\u{1F1EA}\u{1F1F8}', // 🇪🇸
  fr: '\u{1F1EB}\u{1F1F7}', // 🇫🇷
  it: '\u{1F1EE}\u{1F1F9}', // 🇮🇹
  ja: '\u{1F1EF}\u{1F1F5}', // 🇯🇵
  ko: '\u{1F1F0}\u{1F1F7}', // 🇰🇷
  pt: '\u{1F1E7}\u{1F1F7}', // 🇧🇷
  ru: '\u{1F1F7}\u{1F1FA}', // 🇷🇺
  sv: '\u{1F1F8}\u{1F1EA}', // 🇸🇪
  th: '\u{1F1F9}\u{1F1ED}', // 🇹🇭
  uk: '\u{1F1FA}\u{1F1E6}', // 🇺🇦
  vi: '\u{1F1FB}\u{1F1F3}', // 🇻🇳
  zh: '\u{1F1E8}\u{1F1F3}', // 🇨🇳
  'zh-hant': '\u{1F1F9}\u{1F1FC}', // 🇹🇼
};

export const LANGUAGE_OPTIONS: Array<{ code: string; name: string; flag: string }> =
  SUPPORTED_LANGUAGES.map((code) => ({
    code,
    name: LANGUAGE_NAMES[code],
    flag: LANGUAGE_FLAGS[code],
  }));

/*
 * The language to open when the URL does not name one is music_types'
 * `preferredLanguage`, called with `SUPPORTED_LANGUAGES` — see `router.tsx`.
 *
 * The *rule* used to live here and, separately, in music_app_rn, where it
 * compared whole tags rather than language subtags: a reader who had chosen
 * Chinese there and so had a stored `zh-Hans` was quietly given English. Which
 * languages a build ships is a fact about the build (the web fetches a
 * directory per language, the native app bundles a JSON) and stays here; how a
 * stored tag is matched against them is not, and is shared.
 */
