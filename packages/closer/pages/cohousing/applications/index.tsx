import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { NextPageContext } from 'next';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import Spinner from '../../../components/ui/Spinner';

const isCohousingAdminRole = (roles: string[] | undefined) =>
  Boolean(
    roles?.includes('admin') ||
      roles?.includes('community-curator') ||
      roles?.includes('team'),
  );

const CohousingApplicationsRedirectPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    void router.replace('/dashboard/cohousing');
  }, [router, router.isReady]);

  if (!user || !isCohousingAdminRole(user.roles)) {
    return <PageNotAllowed />;
  }

  return (
    <div className="flex justify-center py-24">
      <Spinner />
    </div>
  );
};

export default CohousingApplicationsRedirectPage;

export async function getStaticProps({ locale }: NextPageContext) {
  return {
    props: {},
  };
}
