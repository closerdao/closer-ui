import { useRouter } from 'next/router';

import { useEffect } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';

import { NextPageContext } from 'next';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import { parseMessageFromError } from '../../../utils/common';

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
    return {};
  } catch (error) {
    return {
      error: parseMessageFromError(error),
    };
  }
};

export default EngagementOpportunityRedirectPage;
