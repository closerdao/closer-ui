import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { logMetric } from '../utils/metrics';

export function useNavigationMetrics(): void {
  const router = useRouter();

  useEffect(() => {
    const onRouteChangeComplete = (url: string) => {
      void logMetric({ category: 'navigation', event: url });
    };

    router.events.on('routeChangeComplete', onRouteChangeComplete);
    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
  }, [router]);
}
