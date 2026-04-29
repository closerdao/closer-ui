import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { Spinner } from '../../../components/ui';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { financeApplicationListFromGetAction } from '../../../utils/platformFinanceApplication';

function SuccessCitizenPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { platform } = usePlatform();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/signup?back=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!platform?.financeapplication) {
      router.replace('/token/financed');
      return;
    }
    (async () => {
      try {
        const params = {
          where: { userId: user._id },
          limit: 1,
          sort_by: '-created' as const,
        };
        const action = await platform.financeapplication.get(params, {
          force: true,
        });
        const rows = financeApplicationListFromGetAction(action);
        const latest = rows[0] || null;
        if (latest?._id) {
          router.replace(`/token/financed/${encodeURIComponent(latest._id)}`);
          return;
        }
      } catch {
        // Fall back to the list page.
      }
      router.replace('/token/financed');
    })();
  }, [isLoading, user, router]);

  return (
    <div className="w-full max-w-screen-sm mx-auto p-8 flex justify-center">
      <Spinner />
    </div>
  );
}

export default SuccessCitizenPage;
