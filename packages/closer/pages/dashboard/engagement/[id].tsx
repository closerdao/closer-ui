import { useRouter } from 'next/router';

import { useEffect } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';

import { NextPageContext } from 'next';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

const EngagementOpportunityRedirectPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace('/dashboard/engagement');
  }, [router.isReady, router]);

  if (!user || !hasAccess('Engagement')) {
    return <PageNotAllowed />;
  }

  return (
    <AdminLayout>
      <div className="text-sm text-gray-600">Redirecting…</div>
    </AdminLayout>
  );
};

EngagementOpportunityRedirectPage.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return { messages };
  } catch (error) {
    return {
      messages: null,
      error: parseMessageFromError(error),
    };
  }
};

export default EngagementOpportunityRedirectPage;
