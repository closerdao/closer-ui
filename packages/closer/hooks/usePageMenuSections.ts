import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import { resolveBlockText } from '../utils/blockI18n';
import {
  buildPageMenuSections,
  fetchMenuPages,
  type PageMenuSection,
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
