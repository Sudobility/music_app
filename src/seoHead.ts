import { type SEOHeadConfig } from '@sudobility/seo_lib';
import { SUPPORTED_LANGUAGES } from '@/config/languages';

const APP_NAME = (import.meta.env.VITE_APP_NAME as string) || 'Moosiac';
const APP_DOMAIN = (import.meta.env.VITE_APP_DOMAIN as string) || 'moosiac.com';

export const seoHeadConfig: SEOHeadConfig = {
  appName: APP_NAME,
  baseUrl: `https://${APP_DOMAIN}`,
  defaultOgImage: `https://${APP_DOMAIN}/logo.png`,
  supportedLanguages: SUPPORTED_LANGUAGES as unknown as string[],
  defaultLanguage: 'en',
  applicationCategory: 'BusinessApplication',
};
