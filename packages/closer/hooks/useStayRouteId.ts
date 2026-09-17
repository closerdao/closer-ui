import { useRouter } from 'next/router';

import { isStayMongoId } from '../utils/stayRouting.helpers';
import { useRedirectLegacyListingStayRoute } from './useRedirectLegacyListingStayRoute';

export function useStayRouteId(): {
  stayId: string | undefined;
  isNotFound: boolean;
} {
  const router = useRouter();
  const param = router.query.slug ?? router.query.id;
  const rawId = typeof param === 'string' ? param : param?.[0];
  const isNotLegacySlug = useRedirectLegacyListingStayRoute(rawId);
  const stayId = isStayMongoId(rawId) ? rawId : undefined;

  return {
    stayId,
    isNotFound: router.isReady && !stayId && (!rawId || isNotLegacySlug),
  };
}
