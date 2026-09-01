import Head from 'next/head';
import Link from 'next/link';

import { useCallback, useEffect, useMemo, useState } from 'react';

import AgreementModal from '../../components/Residency/AgreementModal';
import ResidencyAgreementCard from '../../components/Residency/ResidencyAgreementCard';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorMessage,
  Heading,
  Spinner,
  Textarea,
} from '../../components/ui';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { User } from '../../contexts/auth/types';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { RESIDENCY_TOKEN_SYMBOL } from '../../hooks/useResidencyParams';
import { GeneralConfig } from '../../types/api';
import { Listing } from '../../types/booking';
import {
  ResidencyAgreement,
  ResidencyAgreementStatus,
} from '../../types/residency';
import api from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../utils/common';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { canVolunteerCancelResidency } from '../../utils/residency.helpers';
import PageNotFound from '../not-found';

type StatusFilter = 'all' | ResidencyAgreementStatus;
type ScopeFilter = 'mine' | 'all';

const STATUS_FILTERS: StatusFilter[] = [
  'all',
  'pending',
  'countersigned',
  'cancelled',
];

const STATUS_FILTER_KEYS: Record<StatusFilter, string> = {
  all: 'residencies_filter_all',
  pending: 'residencies_status_pending',
  countersigned: 'residencies_status_countersigned',
  cancelled: 'residencies_status_cancelled',
};

/** How many seasons a page holds. There are never many; this is a backstop. */
const PAGE_SIZE = 50;

const chipClassName = (isActive: boolean) =>
  `rounded-full border px-3 py-1 text-[13px] transition-colors ${
    isActive
      ? 'border-accent bg-accent-light text-accent'
      : 'border-line bg-dominant text-complimentary-light hover:border-accent/50'
  }`;

/**
 * Every volunteer season that has been signed here.
 *
 * A volunteer sees their own and may end one right up until it starts; after
 * that it is a conversation with the coordinator rather than a button. A space
 * host sees everyone's, countersigns them for the association, and may end one
 * at any point. Nothing is charged or clawed back on either path — under the
 * volunteering framework the program runs under, both sides are free to stop.
 */
const ResidenciesPage = () => {
  const t = useTranslations();
  const { user, isAuthenticated, isLoading: isLoadingUser } = useAuth();
  const { platform }: any = usePlatform();
  const defaultConfig = useConfig();

  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const residencyConfig = getCachedConfig('residency');
  const paymentConfig = getCachedConfig('payment');
  const platformName =
    generalConfig?.platformName || defaultConfig?.platformName || '';
  const currency = String(paymentConfig?.fiatCur || 'EUR');

  /**
   * Who acts for the association: countersigns a season, ends one at any point,
   * and sees everyone's rather than only their own.
   */
  const isSpaceHost = Boolean(
    user?.roles?.some((role) => role === 'space-host' || role === 'admin'),
  );

  const [agreements, setAgreements] = useState<ResidencyAgreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [reading, setReading] = useState<ResidencyAgreement | null>(null);
  const [cancelling, setCancelling] = useState<ResidencyAgreement | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  /*
   * The endpoint already scopes a plain member to their own agreements, and
   * hands a space host everyone's; `mine` is how a host narrows back to
   * theirs. Results come back newest first, so there is no sort to ask for.
   */
  const params = useMemo(() => {
    const query: Record<string, unknown> = { limit: PAGE_SIZE };
    if (status !== 'all') query.status = status;
    if (isSpaceHost && scope === 'mine') query.mine = true;
    return query;
  }, [status, scope, isSpaceHost]);

  const loadAgreements = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get('/residencies', {
        params,
        // A season that was just approved or ended must not come back off
        // api.js's five-minute GET cache.
        cache: false,
      } as any);
      setAgreements(data?.results || []);
    } catch (err) {
      setLoadError(parseMessageFromError(err));
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAgreements();
  }, [isAuthenticated, loadAgreements]);

  /*
   * The agreement stores ids, not names: the volunteer who signed and the room
   * they took are looked up so the list reads in words. Both are cosmetic — a
   * lookup that fails leaves the card intact, minus a name.
   */
  const volunteerFilter = useMemo(
    () => ({
      where: {
        _id: {
          $in: Array.from(
            new Set(agreements.map((item) => item.createdBy).filter(Boolean)),
          ),
        },
      },
      limit: PAGE_SIZE,
    }),
    [agreements],
  );

  const listingFilter = useMemo(
    () => ({
      where: {
        _id: {
          $in: Array.from(
            new Set(
              agreements
                .filter((item) => item.program.needsAccommodation)
                .map((item) => item.program.accommodationId)
                .filter(Boolean),
            ),
          ),
        },
      },
      limit: PAGE_SIZE,
    }),
    [agreements],
  );

  useEffect(() => {
    if (!agreements.length) return;
    if (isSpaceHost) platform.user.get(volunteerFilter);
    platform.listing.get(listingFilter);
  }, [agreements.length, isSpaceHost, platform, volunteerFilter, listingFilter]);

  const volunteers = platform.user.find(volunteerFilter);
  const listings = platform.listing.find(listingFilter);

  const volunteerNames = useMemo(() => {
    const names = new Map<string, string>();
    (volunteers?.toJS() || []).forEach((item: User) => {
      if (item._id) names.set(item._id, item.screenname || '');
    });
    return names;
  }, [volunteers]);

  const listingNames = useMemo(() => {
    const names = new Map<string, string>();
    (listings?.toJS() || []).forEach((item: Listing) => {
      if (item._id) names.set(item._id, item.name || '');
    });
    return names;
  }, [listings]);

  const runAction = async (
    agreement: ResidencyAgreement,
    action: 'approve' | 'cancel',
  ) => {
    setBusyId(agreement._id);
    setActionError(null);
    try {
      // A reason is the leaver's own words, and optional: an empty box sends
      // nothing rather than an empty string.
      const body =
        action === 'cancel' && cancelReason.trim()
          ? { reason: cancelReason.trim() }
          : {};
      await api.post(`/residencies/${agreement._id}/${action}`, body);
      await loadAgreements();
      setCancelling(null);
      setCancelReason('');
    } catch (err) {
      setActionError(parseMessageFromError(err));
    } finally {
      setBusyId(null);
    }
  };

  const formatCurrency = (value: number) =>
    formatIsoFiatAmount(value, currency, { min: 0, max: 0 });

  if (residencyConfig && residencyConfig.enabled === false) {
    return <PageNotFound />;
  }

  const pageTitle = t('residencies_page_title');

  if (!isLoadingUser && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-16 sm:px-6">
        <Heading level={1}>{pageTitle}</Heading>
        <p className="mt-4 text-complimentary-light">
          {t('residencies_login_required')}
        </p>
        <Link href="/login" className="mt-4 inline-block text-accent underline">
          {t('residencies_login_cta')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 sm:px-6">
      <Head>
        <title>{`${pageTitle} - ${platformName}`}</title>
      </Head>

      <main className="pb-24 pt-6">
        <header className="flex flex-col gap-3">
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-accent">
            {t('residencies_eyebrow', { platform: platformName })}
          </p>
          <Heading level={1} className="text-3xl md:text-4xl">
            {pageTitle}
          </Heading>
          <p className="m-0 max-w-2xl text-complimentary-light">
            {isSpaceHost
              ? t('residencies_intro_host')
              : t('residencies_intro_volunteer')}
          </p>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={chipClassName(status === option)}
            >
              {t(STATUS_FILTER_KEYS[option])}
            </button>
          ))}

          {isSpaceHost && (
            <span className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={chipClassName(scope === 'all')}
              >
                {t('residencies_scope_all')}
              </button>
              <button
                type="button"
                onClick={() => setScope('mine')}
                className={chipClassName(scope === 'mine')}
              >
                {t('residencies_scope_mine')}
              </button>
            </span>
          )}
        </div>

        {loadError && (
          <div className="mt-6">
            <ErrorMessage error={loadError} />
          </div>
        )}
        {actionError && (
          <div className="mt-6">
            <ErrorMessage error={actionError} />
          </div>
        )}

        {isLoading ? (
          <div className="mt-10 flex justify-center">
            <Spinner />
          </div>
        ) : agreements.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-line bg-neutral p-6">
            <p className="m-0 text-complimentary-light">
              {t('residencies_empty')}
            </p>
            <Link
              href="/roles"
              className="mt-3 inline-block text-sm text-accent underline"
            >
              {t('residencies_empty_cta')}
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-5">
            {agreements.map((agreement) => {
              const isOwn = agreement.createdBy === user?._id;
              /*
               * A space host may end a season whenever; the volunteer may end
               * their own only before it starts. Both are recorded, neither is
               * charged for.
               */
              const canHostCancel =
                isSpaceHost && agreement.status !== 'cancelled';
              const canOwnerCancel =
                isOwn && canVolunteerCancelResidency(agreement);

              return (
                <ResidencyAgreementCard
                  key={agreement._id}
                  agreement={agreement}
                  volunteerName={
                    isSpaceHost && !isOwn
                      ? volunteerNames.get(agreement.createdBy) || undefined
                      : undefined
                  }
                  accommodationName={
                    // Null whenever the volunteer houses themselves.
                    agreement.program.accommodationId
                      ? listingNames.get(agreement.program.accommodationId)
                      : undefined
                  }
                  tokenSymbol={RESIDENCY_TOKEN_SYMBOL}
                  formatCurrency={formatCurrency}
                  canApprove={isSpaceHost && agreement.status === 'pending'}
                  canCancel={canHostCancel || canOwnerCancel}
                  cancelLockedNote={
                    isOwn && agreement.status !== 'cancelled' && !canOwnerCancel
                      ? t('residencies_cancel_locked')
                      : null
                  }
                  isBusy={busyId === agreement._id}
                  onApprove={() => runAction(agreement, 'approve')}
                  onCancel={() => {
                    setCancelReason('');
                    setCancelling(agreement);
                  }}
                  onReadAgreement={() => setReading(agreement)}
                />
              );
            })}
          </div>
        )}
      </main>

      {reading && (
        <AgreementModal
          isOpen={Boolean(reading)}
          onOpenChange={(isOpen) => !isOpen && setReading(null)}
          roleTitle={reading.roleTitle}
          agreementVersion={reading.agreementVersion}
          body={reading.agreementBody}
        />
      )}

      <Dialog
        open={Boolean(cancelling)}
        onOpenChange={(isOpen) => !isOpen && setCancelling(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('residencies_cancel_confirm_title')}</DialogTitle>
            <DialogDescription>
              {t('residencies_cancel_confirm_body', {
                season: cancelling?.program.seasonLabel || '',
                role: cancelling?.roleTitle || '',
              })}
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1.5 text-sm text-complimentary-light">
            {t('residencies_cancel_reason_label')}
            <Textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder={t('residencies_cancel_reason_placeholder')}
              rows={3}
            />
          </label>
          <DialogFooter>
            <Button
              variant="secondary"
              isFullWidth={false}
              onClick={() => setCancelling(null)}
            >
              {t('residencies_cancel_dismiss')}
            </Button>
            <Button
              isFullWidth={false}
              isEnabled={!busyId}
              onClick={() => cancelling && runAction(cancelling, 'cancel')}
            >
              {t('residencies_cancel_confirm_cta')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResidenciesPage;
