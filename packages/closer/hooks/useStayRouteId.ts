import { useRouter } from 'next/router';

import { isStayMongoId } from '../utils/stayRouting.helpers';
import { useRedirectLegacyListingStayRoute } from './useRedirectLegacyListingStayRoute';

export function useStayRouteId(): {
  stayId: string | undefined;
  isNotFound: boolean;
  isResolving: boolean;
} {
  const router = useRouter();
  const param = router.query.slug ?? router.query.id;
  const rawId = typeof param === 'string' ? param : param?.[0];
  const isNotLegacySlug = useRedirectLegacyListingStayRoute(rawId);
  const stayId = isStayMongoId(rawId) ? rawId : undefined;
  const isNotFound = router.isReady && !stayId && (!rawId || isNotLegacySlug);

  return {
    stayId,
    isNotFound,
    isResolving: !stayId && !isNotFound,
  };
}
