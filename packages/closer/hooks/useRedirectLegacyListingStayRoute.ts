import { useRouter } from 'next/router';

import { useEffect } from 'react';

import {
  isStayMongoId,
  resolveLegacyListingStaySlugRedirect,
} from '../utils/stayRouting.helpers';

export function useRedirectLegacyListingStayRoute(slug: string | undefined) {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady || !slug || isStayMongoId(slug)) {
      return;
    }
    let cancelled = false;
    void resolveLegacyListingStaySlugRedirect(slug).then((href) => {
      if (!cancelled && href) {
        router.replace(href);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router, router.isReady, slug]);
}
