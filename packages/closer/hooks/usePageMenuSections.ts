import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { resolveBlockText } from '../utils/blockI18n';
import {
  type PageMenuSection,
  buildPageMenuSections,
  fetchMenuPages,
} from '../utils/pageMenu';

/**
 * Menu sections derived from page metadata. The underlying `/page` request is
 * shared app-wide, so mounting this in several menus stays a single API call.
 */
export const usePageMenuSections = (): PageMenuSection[] => {
  const t = useTranslations();
  const router = useRouter();
  const [sections, setSections] = useState<PageMenuSection[]>([]);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    let cancelled = false;
    void fetchMenuPages().then((pages) => {
      if (cancelled) return;
      setSections(
        buildPageMenuSections(pages, (value) =>
          resolveBlockText(value, tRef.current),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [router.locale]);

  return sections;
};

export default usePageMenuSections;
