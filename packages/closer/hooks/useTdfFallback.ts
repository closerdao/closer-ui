import { useTranslations } from 'next-intl';

import { useIsTdfApp } from './useConfig';

// Shared blocks fall back to TDF's own copy; other apps have none, so an empty field stays empty.
export const useTdfFallback = () => {
  const t = useTranslations();
  const isTdf = useIsTdfApp();
  const tdf = (key: string, values?: Record<string, string | number>) =>
    isTdf ? t(key, values) : '';
  return { isTdf, tdf };
};
