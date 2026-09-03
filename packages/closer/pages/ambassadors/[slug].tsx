import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import AmbassadorBadge from '../../components/AmbassadorBadge';
import ProfilePhoto from '../../components/ProfilePhoto';
import VillageCard from '../../components/VillageCard';
import {
  EmptyState,
  Eyebrow,
  PageShell,
  btnSmall,
} from '../../components/VillageUI';
import { Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import { AMBASSADOR_ROLE } from '../../constants/village.constants';
import { User } from '../../contexts/auth/types';
import { Village } from '../../types/village';
import api from '../../utils/api';
import { fetchUserVillageConnections } from '../../utils/village.utils';
import PageNotFound from '../not-found';

const AmbassadorProfilePage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { slug } = router.query;
  const [member, setMember] = useState<User | null>(null);
  const [villages, setVillages] = useState<Village[]>([]);
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

        const connections = await fetchUserVillageConnections(user._id);
        if (cancelled) return;
        setVillages(connections.map((connection) => connection.village));
      } catch (err) {
        if (!cancelled) setError(t('ambassadors_profile_not_found'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  if (isLoading) {
    return (
      <div className="bg-neutral-light min-h-screen flex justify-center py-24">
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
  const liveCount = villages.filter((village) => village.closer).length;

  return (
    <>
      <Head>
        <title>
          {member.screenname} — {t('ambassadors_profile_title')}
        </title>
      </Head>

      <PageShell>
        <header className="flex flex-col sm:flex-row sm:items-center gap-6 pb-10 border-b border-accent-medium">
          <div className="flex-none [&>span]:w-24 [&>span]:h-24">
            <ProfilePhoto user={member} size="24" stack={false} />
          </div>
          <div className="flex-1">
            {isAmbassador ? (
              <AmbassadorBadge className="mb-3" />
            ) : (
              <Eyebrow className="mb-2">
                {t('ambassadors_profile_title')}
              </Eyebrow>
            )}
            <h1 className="font-serif text-4xl md:text-5xl leading-tight">
              {member.screenname}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <span className="text-[13.5px] text-foreground/70">
                {t('ambassadors_profile_stats', {
                  villages: villages.length,
                  live: liveCount,
                })}
              </span>
              <Link href={`/members/${member.slug}`} className={btnSmall}>
                {t('ambassadors_view_member_profile')}
              </Link>
            </div>
          </div>
        </header>

        <section className="pt-12">
          <Eyebrow>{t('ambassadors_managed_villages')}</Eyebrow>
          <h2 className="font-serif text-3xl mt-3 mb-8">
            {t('ambassadors_managed_villages_headline')}
          </h2>
          {villages.length === 0 ? (
            <EmptyState
              title={t('ambassadors_no_villages')}
              description={t('ambassadors_no_villages_body')}
              action={{ href: '/map', label: t('ambassadors_cta_map') }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {villages.map((village) => (
                <VillageCard key={village._id} village={village} />
              ))}
            </div>
          )}
        </section>
      </PageShell>
    </>
  );
};

export default AmbassadorProfilePage;
