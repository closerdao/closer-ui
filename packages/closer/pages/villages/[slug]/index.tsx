import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { Button, ErrorMessage, Heading, Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import {
  PLATFORM_SETUP_FEE_EUR,
  PLATFORM_SUBSCRIPTION_PRICE_EUR,
} from '../../constants/village.constants';
import { useAuth } from '../../contexts/auth';
import { Village } from '../../types/village';
import {
  canManageVillage,
  canRequestDeploy,
  getVillage,
  markVillageSubscribed,
  requestVillageDeploy,
  updateVillage,
} from '../../utils/village.utils';
import PageNotFound from '../not-found';

const VillageDetailPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const [project, setProject] = useState<Village | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const result = await getVillage(slug);
      if (!cancelled) {
        setProject(result);
        setIsLoading(false);
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

  if (!project) {
    return <PageNotFound error={t('villages_not_found')} />;
  }

  const isManager = canManageVillage(project, user?._id);
  const isAdmin = user?.roles?.includes('admin');
  const canDeploy = canRequestDeploy(project, user?._id);
  const subscribed =
    project.platformSubscription?.status === 'trialing' ||
    project.platformSubscription?.status === 'active';

  const refresh = async () => {
    const result = await getVillage(project.slug || project._id);
    setProject(result);
  };

  const handleSubscribe = async () => {
    try {
      setIsActing(true);
      setActionError(null);
      await markVillageSubscribed(project._id);
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t('villages_action_error'),
      );
    } finally {
      setIsActing(false);
    }
  };

  const handleDeployRequest = async () => {
    try {
      setIsActing(true);
      setActionError(null);
      await requestVillageDeploy(project._id);
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t('villages_action_error'),
      );
    } finally {
      setIsActing(false);
    }
  };

  const handleInviteOwner = async () => {
    if (!inviteEmail.trim() || !user?._id) return;
    try {
      setIsActing(true);
      setActionError(null);
      const note = `Owner invite pending for ${inviteEmail.trim()}`;
      const attributes = Array.from(
        new Set([...(project.attributes || []), note]),
      );
      await updateVillage(project._id, { attributes } as Partial<Village>);
      setInviteEmail('');
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t('villages_action_error'),
      );
    } finally {
      setIsActing(false);
    }
  };

  const handleVerify = async (badge: 'verified' | 'resonant' | 'pending') => {
    try {
      setIsActing(true);
      await updateVillage(project._id, {
        verificationBadge: badge,
      } as Partial<Village>);
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t('villages_action_error'),
      );
    } finally {
      setIsActing(false);
    }
  };

  return (
    <>
      <Head>
        <title>{project.name}</title>
      </Head>
      <div className="main-content w-full flex flex-col gap-6 py-8 max-w-3xl">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={1}>{project.name}</Heading>
            {project.closer ? (
              <span className="text-xs uppercase bg-accent/20 text-accent-foreground px-2 py-0.5 rounded">
                Closer
              </span>
            ) : null}
            {project.verificationBadge &&
            project.verificationBadge !== 'unverified' ? (
              <span className="text-xs uppercase bg-gray-100 px-2 py-0.5 rounded">
                {project.verificationBadge}
              </span>
            ) : null}
          </div>
          <p className="text-gray-600">{project.country}</p>
          <p className="text-gray-700">{project.description}</p>
          {project.website ? (
            <a
              href={project.website}
              target="_blank"
              rel="noreferrer"
              className="underline text-sm"
            >
              {project.website}
            </a>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {(project.tags || []).map((tag) => (
            <span key={tag} className="bg-gray-100 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
          <Heading level={3}>{t('villages_onboarding_title')}</Heading>
          <p className="text-sm text-gray-700">
            {t('villages_onboarding_status')}:{' '}
            <strong>{project.onboardingStatus || 'map_only'}</strong>
          </p>
          <p className="text-sm text-gray-600">
            {t('villages_tier1_commercial', {
              setup: PLATFORM_SETUP_FEE_EUR,
              price: PLATFORM_SUBSCRIPTION_PRICE_EUR,
            })}
          </p>
        </div>

        {isManager ? (
          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
            <Heading level={3}>{t('villages_manager_actions')}</Heading>
            <Link href={`/villages/${project.slug || project._id}/edit`}>
              {t('villages_edit_cta')}
            </Link>
            <div className="flex flex-col gap-2">
              <label className="text-sm">{t('villages_invite_owner')}</label>
              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="owner@example.com"
              />
              <Button
                onClick={handleInviteOwner}
                isLoading={isActing}
                isEnabled={!isActing}
                variant="secondary"
              >
                {t('villages_invite_submit')}
              </Button>
            </div>
            {!subscribed ? (
              <Button
                onClick={handleSubscribe}
                isLoading={isActing}
                isEnabled={!isActing}
              >
                {t('villages_subscribe_cta')}
              </Button>
            ) : (
              <p className="text-sm text-gray-700">
                {t('villages_subscribed_label')} (
                {project.platformSubscription?.status})
              </p>
            )}
            {canDeploy ? (
              <Button
                onClick={handleDeployRequest}
                isLoading={isActing}
                isEnabled={!isActing}
              >
                {t('villages_request_deploy_cta')}
              </Button>
            ) : null}
            {project.onboardingStatus === 'deploy_requested' ? (
              <p className="text-sm text-gray-600">
                {t('villages_deploy_pending')}
              </p>
            ) : null}
          </div>
        ) : null}

        {isAdmin ? (
          <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
            <Heading level={3}>{t('villages_admin_actions')}</Heading>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => handleVerify('pending')}
                isEnabled={!isActing}
              >
                pending
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleVerify('verified')}
                isEnabled={!isActing}
              >
                verified
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleVerify('resonant')}
                isEnabled={!isActing}
              >
                resonant
              </Button>
            </div>
            {project.onboardingStatus === 'deploy_requested' ? (
              <p className="text-sm text-gray-600">
                {t('villages_admin_deploy_queue_hint')}
              </p>
            ) : null}
          </div>
        ) : null}

        {actionError ? <ErrorMessage error={actionError} /> : null}
      </div>
    </>
  );
};

export default VillageDetailPage;
