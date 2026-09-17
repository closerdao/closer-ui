import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import {
  isStayMongoId,
  resolveLegacyListingStaySlugRedirect,
} from '../utils/stayRouting.helpers';

/** Returns true once `slug` is known not to be a legacy listing slug. */
export function useRedirectLegacyListingStayRoute(
  slug: string | undefined,
): boolean {
  const router = useRouter();
  const [unresolvedSlug, setUnresolvedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !slug || isStayMongoId(slug)) {
      return;
    }
    let cancelled = false;
    void resolveLegacyListingStaySlugRedirect(slug).then((href) => {
      if (cancelled) return;
      if (href) {
        router.replace(href);
      } else {
        setUnresolvedSlug(slug);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router, router.isReady, slug]);

  return Boolean(slug) && unresolvedSlug === slug;
}
