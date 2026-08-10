import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import AmbassadorBadge from '../../components/AmbassadorBadge';
import LandProjectCard from '../../components/LandProjectCard';
import { Heading, Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import { AMBASSADOR_ROLE } from '../../constants/landProject.constants';
import { User } from '../../contexts/auth/types';
import { LandProject } from '../../types/landProject';
import api from '../../utils/api';
import { fetchLandProjects } from '../../utils/landProject.utils';
import PageNotFound from '../not-found';

const AmbassadorProfilePage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { slug } = router.query;
  const [member, setMember] = useState<User | null>(null);
  const [projects, setProjects] = useState<LandProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/user/${slug}`);
        const user = (data?.results || data) as User;
        if (cancelled) return;
        setMember(user);

        const all = await fetchLandProjects({ limit: 200 });
        if (cancelled) return;
        const owned = all.filter(
          (project) =>
            project.referredBy === user._id ||
            project.ambassadorId === user._id ||
            project.createdBy === user._id ||
            project.managedBy?.includes(user._id),
        );
        setProjects(owned);
      } catch (err) {
        if (!cancelled) setError('Ambassador not found');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="main-content py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !member) {
    return <PageNotFound error={error || undefined} />;
  }

  const isAmbassador = Boolean(
    member.affiliate || member.roles?.includes(AMBASSADOR_ROLE),
  );

  return (
    <>
      <Head>
        <title>
          {member.screenname} — {t('ambassadors_profile_title')}
        </title>
      </Head>
      <div className="main-content w-full flex flex-col gap-6 py-8 max-w-3xl">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Heading level={1}>{member.screenname}</Heading>
            {isAmbassador ? <AmbassadorBadge size="md" /> : null}
          </div>
          <p className="text-gray-600">
            <Link href={`/members/${member.slug}`} className="underline">
              {t('ambassadors_view_member_profile')}
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Heading level={2}>{t('ambassadors_managed_villages')}</Heading>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t('ambassadors_no_villages')}
            </p>
          ) : (
            projects.map((project) => (
              <LandProjectCard key={project._id} project={project} />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default AmbassadorProfilePage;
