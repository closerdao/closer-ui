import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageError from '../../../components/PageError';
import AgreementModal from '../../../components/Residency/AgreementModal';
import {
  DualRangeSlider,
  RangeSlider,
} from '../../../components/Residency/RangeSliders';
import SettlementSlip from '../../../components/Residency/SettlementSlip';
import TierLadderModal from '../../../components/Residency/TierLadderModal';
import {
  BackButton,
  Button,
  Checkbox,
  ErrorMessage,
  Heading,
} from '../../../components/ui';

import { useAuth } from '../../../contexts/auth';
import { WalletDispatch } from '../../../contexts/wallet';
import { useConfig } from '../../../hooks/useConfig';
import {
  RESIDENCY_TOKEN_SYMBOL,
  useResidencyParams,
  useResidencyStanding,
} from '../../../hooks/useResidencyParams';
import { GeneralConfig, Role } from '../../../types/api';
import { Listing } from '../../../types/booking';
import { Stay } from '../../../types/stay';
import { ResidencySelection } from '../../../types/residency';
import api, { formatSearch } from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { formatIsoFiatAmount } from '../../../utils/currencyFormat';
import {
  buildAgreementSubmission,
  buildResidencyQuote,
  getAgreementTemplate,
  listingsToAccommodations,
  getSeasonWindow,
  getUpcomingSeason,
  renderAgreement,
} from '../../../utils/residency.helpers';
import PageNotFound from '../../not-found';

interface Props {
  role: Role | null;
  /** The platform's own listings — the accommodation a season books into. */
  listings: Listing[];
  error?: string | null;
}

/**
 * The seasonal team & residency tool. The role is the URL — everything the
 * quote needs beyond it comes from the `residency` config (DAO-editable) and
 * the member's on-chain balances ($Presence, $Sweat, the DAO token), which are
 * strictly read only here.
 */
const RoleResidencyPage = ({ role, listings, error }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const defaultConfig = useConfig();
  const { connectWallet } = useContext(WalletDispatch);

  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const rolesConfig = getCachedConfig('roles');
  const paymentConfig = getCachedConfig('payment');
  const platformName =
    generalConfig?.platformName || defaultConfig?.platformName || '';
  /** The village's own fiat, so a non-euro platform quotes in its currency. */
  const currency = String(paymentConfig?.fiatCur || 'EUR');

  const { params, isEnabled: isResidencyEnabled } = useResidencyParams();
  const { standing, hasLiveBalances } = useResidencyStanding();

  const [existingStays, setExistingStays] = useState<Stay[]>([]);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const upcomingSeason = useMemo(
    () => getUpcomingSeason(params.seasons),
    [params.seasons],
  );

  // The booking config carries the duration discounts a long stay earns.
  const bookingConfig = getCachedConfig('booking');
  const accommodations = useMemo(
    () => listingsToAccommodations(listings, bookingConfig),
    [listings, bookingConfig],
  );

  const fullDaysPerWeek = Math.max(1, Number(role?.daysPerWeek) || 5);

  /**
   * The starting point: the whole of the next season's window, at full
   * commitment. Derived rather than seeded in an effect so the first paint —
   * server-side included — is already the complete tool rather than a spinner.
   */
  const defaultSelection = useMemo<ResidencySelection | null>(() => {
    if (!upcomingSeason || !accommodations.length) return null;
    const window = getSeasonWindow(upcomingSeason);
    return {
      seasonId: upcomingSeason.id,
      arrivalDayOffset: 0,
      departureDayOffset: window.totalDays - 1,
      accommodationId: accommodations[0].id,
      tokensLocked: 0,
      cashRequested: 0,
      daysPerWeek: fullDaysPerWeek,
      stayPct: 100,
    };
  }, [upcomingSeason, accommodations, fullDaysPerWeek]);

  /** Only what the member has actually touched. */
  const [edits, setEdits] = useState<Partial<ResidencySelection>>({});

  const selection = useMemo<ResidencySelection | null>(
    () => (defaultSelection ? { ...defaultSelection, ...edits } : null),
    [defaultSelection, edits],
  );

  /**
   * The member's own upcoming stays. Nights they have already booked inside a
   * season must not be charged for a second time by the season plan, so they
   * are credited against it. Needs the signed-in user, hence client-side.
   */
  useEffect(() => {
    if (!user?._id) {
      setExistingStays([]);
      return;
    }
    let isCancelled = false;

    api
      .get(
        `/booking?where=${formatSearch({
          createdBy: user._id,
          status: { $nin: ['cancelled', 'rejected'] },
          end: { $gte: new Date().toISOString() },
        })}&limit=100`,
      )
      .then(({ data }) => {
        if (!isCancelled) setExistingStays(data?.results || []);
      })
      .catch(() => {
        // A season still prices without the credit; it just cannot apply one.
        if (!isCancelled) setExistingStays([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [user?._id]);

  const quote = useMemo(() => {
    if (!role || !selection) return null;
    return buildResidencyQuote({
      role,
      params,
      accommodations,
      standing,
      selection,
      existingStays,
    });
  }, [role, params, accommodations, standing, selection, existingStays]);

  const formatCurrency = (value: number) =>
    formatIsoFiatAmount(value, currency, { min: 0, max: 0 });
  /**
   * dayjs rather than `toLocaleDateString`: Node and the browser disagree on
   * the default locale's short date ("Sep 1, 2026" vs "1 Sept 2026"), and that
   * mismatch fails hydration for the whole page.
   */
  const formatDate = (date: Date) => dayjs(date).format('D MMM YYYY');
  /**
   * Token amounts come off nightly listing rates, so they are rarely whole.
   * Trim to two decimals and drop trailing zeros — "10.2", not "10.20".
   */
  const formatTokens = (value: number) => String(Number(value.toFixed(2)));

  const agreementBody = useMemo(() => {
    if (!role || !quote) return '';
    return renderAgreement({
      template: getAgreementTemplate(role, params),
      role,
      quote,
      params,
      standing,
      memberName: user?.screenname || t('residency_agreement_member_fallback'),
      platformName,
      tokenSymbol: RESIDENCY_TOKEN_SYMBOL,
      formatCurrency,
      formatDate,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, quote, params, standing, user?.screenname, platformName]);

  if (error) return <PageError error={error} />;
  if (!role) return <PageNotFound />;
  if (rolesConfig && rolesConfig.enabled === false) return <PageNotFound />;

  const patchSelection = (patch: Partial<ResidencySelection>) =>
    setEdits((current) => ({ ...current, ...patch }));

  const pickSeason = (seasonId: string) => {
    const season = params.seasons.find((item) => item.id === seasonId);
    if (!season) return;
    const window = getSeasonWindow(season);
    patchSelection({
      seasonId,
      arrivalDayOffset: 0,
      departureDayOffset: window.totalDays - 1,
    });
  };

  const toggleAcknowledgement = (id: string) =>
    setAcknowledgedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const isFullyAcknowledged =
    hasAgreed &&
    params.acknowledgements.every((item) =>
      acknowledgedIds.includes(item.id),
    );

  const handleSubmit = async () => {
    if (!quote || !selection || !isFullyAcknowledged) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      /*
       * One call, deliberately: the endpoint creates the stay and stores the
       * agreed conditions against it in a single transaction. Booking from the
       * client and then filing the agreement separately would leave an orphan
       * stay behind whenever the second call failed.
       *
       * Contract: docs/residency-agreements-endpoint.md
       */
      await api.post(
        '/residency-agreements',
        buildAgreementSubmission({
          role,
          quote,
          params,
          standing,
          selection,
          agreementBody,
          acknowledgedIds,
        }),
      );
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(parseMessageFromError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionClassName =
    'flex flex-col gap-4 rounded-2xl border border-line bg-dominant p-5 sm:p-6';
  const eyebrowClassName =
    'm-0 text-[11px] uppercase tracking-[0.18em] text-accent';
  const optionClassName = (isActive: boolean) =>
    `relative rounded-xl border-[1.5px] p-3 text-left transition-colors ${
      isActive
        ? 'border-accent bg-accent-light'
        : 'border-line bg-dominant hover:border-accent/50'
    }`;

  const pageTitle = `${role.title} — ${t('residency_page_title')}`;

  /* The tool needs a season and a place to sleep before it can quote. */
  const isConfigured =
    isResidencyEnabled &&
    params.seasons.length > 0 &&
    accommodations.length > 0;

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
      <Head>
        <title>{`${pageTitle} - ${platformName}`}</title>
      </Head>

      <main className="pb-24 pt-6">
        <BackButton handleClick={() => router.push('/roles')}>
          {t('residency_back_to_roles')}
        </BackButton>

        <header className="mt-4 flex flex-col gap-3">
          <p className={eyebrowClassName}>
            {t('residency_eyebrow', { platform: platformName })}
          </p>
          <Heading level={1} className="text-3xl md:text-4xl">
            {t('residency_heading', { role: role.title })}
          </Heading>
          <p className="m-0 max-w-2xl text-complimentary-light">
            {t('residency_intro')}
          </p>
        </header>

        {!role.isResidency && (
          <div className="mt-6 rounded-xl border border-line bg-neutral p-5">
            <p className="m-0 text-complimentary-light">
              {t('residency_not_a_residency_role')}
            </p>
            {role.description && (
              <div
                className="prose prose-sm mt-3 max-w-none text-complimentary-light [&_a]:text-accent [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: role.description }}
              />
            )}
            <Link
              href="/roles"
              className="mt-4 inline-block text-sm text-accent underline"
            >
              {t('residency_back_to_roles')}
            </Link>
          </div>
        )}

        {role.isResidency && !isConfigured && (
          <div className="mt-6 rounded-xl border border-line bg-neutral p-5">
            <p className="m-0 text-complimentary-light">
              {t('residency_not_configured')}
            </p>
          </div>
        )}

        {role.isResidency && isConfigured && selection && quote && (
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex min-w-0 flex-col gap-5">
              {/* ─────────────── 01 · standing ─────────────── */}
              <section className={sectionClassName}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className={eyebrowClassName}>
                      {t('residency_step_standing')}
                    </p>
                    <h2 className="m-0 mt-1 text-xl font-bold text-complimentary-core">
                      {user?.screenname ||
                        t('residency_agreement_member_fallback')}{' '}
                      <span className="font-medium text-complimentary-light">
                        · {role.title}
                      </span>
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTierModalOpen(true)}
                    className="rounded-full border border-accent bg-accent-light px-3 py-1 text-xs font-semibold text-accent"
                  >
                    {t('residency_tier_badge', { tier: quote.tier.label })}
                  </button>
                </div>

                {!hasLiveBalances && (
                  <p className="m-0 flex flex-wrap items-baseline gap-2 text-xs text-complimentary-light">
                    <span>{t('residency_cached_balances_note')}</span>
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="underline hover:text-accent"
                    >
                      {t('residency_connect_wallet_cta')}
                    </button>
                  </p>
                )}

                {!quote.isRoleUnlocked && (
                  <p className="m-0 rounded-lg border border-dashed border-accent-alt bg-neutral px-4 py-3 text-sm text-complimentary-core">
                    {t('residency_role_locked', {
                      role: role.title,
                      tier: quote.requiredTier.label,
                      required: role.minPresence ?? 0,
                      short: quote.presenceShortfall,
                    })}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      key: '$Presence',
                      value: standing.presence,
                      sub: t('residency_stat_presence_sub', {
                        pct: quote.tier.cashPct,
                      }),
                    },
                    {
                      key: RESIDENCY_TOKEN_SYMBOL,
                      value: standing.tokensHeld,
                      sub: t('residency_stat_tokens_sub', {
                        value: formatCurrency(
                          standing.tokensHeld * params.tokenValue,
                        ),
                      }),
                    },
                    {
                      key: '$Sweat',
                      value: standing.sweat,
                      sub: t('residency_stat_sweat_sub', {
                        bonus: formatCurrency(quote.sweatBonus),
                      }),
                    },
                  ].map((stat) => (
                    <div
                      key={stat.key}
                      className="rounded-xl border border-line px-3.5 py-3"
                    >
                      <p className="m-0 text-[10px] uppercase tracking-[0.12em] text-complimentary-light">
                        {stat.key}
                      </p>
                      <p className="m-0 my-0.5 text-lg font-bold text-complimentary-core">
                        {stat.value}
                      </p>
                      <p className="m-0 text-[11px] text-complimentary-light">
                        {stat.sub}
                      </p>
                      <p className="m-0 mt-2 text-[9px] uppercase tracking-[0.08em] text-complimentary-light/70">
                        {hasLiveBalances
                          ? t('residency_onchain_read_only')
                          : t('residency_cached_read_only')}
                      </p>
                    </div>
                  ))}

                  <div className="rounded-xl border border-line px-3.5 py-3">
                    <p className="m-0 text-[10px] uppercase tracking-[0.12em] text-complimentary-light">
                      {t('residency_commitment_label')}
                    </p>
                    <p className="m-0 my-0.5 text-lg font-bold text-complimentary-core">
                      {selection.daysPerWeek}{' '}
                      <span className="text-[13px] font-normal">
                        {t('residency_days_per_week')}
                      </span>
                    </p>
                    <p className="m-0 mb-1 text-[11px] text-complimentary-light">
                      {t('residency_commitment_hint', {
                        days: fullDaysPerWeek,
                      })}
                    </p>
                    <RangeSlider
                      ariaLabel={t('residency_commitment_label')}
                      value={selection.daysPerWeek}
                      min={0.5}
                      max={fullDaysPerWeek}
                      step={0.5}
                      onChange={(value) =>
                        patchSelection({ daysPerWeek: value })
                      }
                    />
                  </div>
                </div>

                <p className="m-0 rounded-lg border border-dashed border-accent bg-accent-light px-4 py-3 text-[13px] text-complimentary-core">
                  {quote.tier.cashPct === 0
                    ? t('residency_growth_no_cash', {
                        threshold: quote.firstCashTier?.minPresence ?? 0,
                        next: quote.nextTier?.label ?? quote.tier.label,
                        days: Math.max(
                          0,
                          (quote.nextTier?.minPresence ?? standing.presence) -
                            standing.presence,
                        ),
                      })
                    : quote.nextTier
                      ? t('residency_growth_next_tier', {
                          days: quote.nextTier.minPresence - standing.presence,
                          next: quote.nextTier.label,
                          pct: quote.nextTier.cashPct,
                        })
                      : t('residency_growth_top_tier')}{' '}
                  {quote.sweatBonus < params.sweatMaxBonus &&
                    params.sweatRate > 0 &&
                    t('residency_growth_sweat', {
                      sweat: Math.ceil(
                        (params.sweatMaxBonus - quote.sweatBonus) /
                          params.sweatRate,
                      ),
                      remaining: formatCurrency(
                        params.sweatMaxBonus - quote.sweatBonus,
                      ),
                    })}
                </p>
              </section>

              {/* ─────────────── 02 · season ─────────────── */}
              <section className={sectionClassName}>
                <p className={eyebrowClassName}>
                  {t('residency_step_season')}
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {params.seasons.map((season) => {
                    const window = getSeasonWindow(season);
                    const isActive = season.id === selection.seasonId;
                    return (
                      <button
                        key={season.id}
                        type="button"
                        onClick={() => pickSeason(season.id)}
                        className={optionClassName(isActive)}
                      >
                        {season.id === upcomingSeason?.id && (
                          <span className="absolute -top-2 right-2 rounded-full bg-accent px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-accent-foreground">
                            {t('residency_season_up_next')}
                          </span>
                        )}
                        <p className="m-0 text-base font-bold text-complimentary-core">
                          {season.label}
                        </p>
                        <p className="m-0 text-[11px] text-complimentary-light">
                          {formatDate(window.start)} → {formatDate(window.end)}
                        </p>
                        <p className="m-0 mt-1 text-[11px] text-accent">
                          {season.pace === 'slow'
                            ? t('residency_season_slow')
                            : t('residency_season_high')}{' '}
                          · {t('residency_season_up_to', {
                            months: season.durationMonths,
                          })}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-complimentary-light">
                      {t('residency_arrive_leave')}
                    </span>
                    <span className="text-[13px] text-complimentary-core">
                      {t('residency_stay_summary', {
                        start: formatDate(quote.arrival),
                        end: formatDate(quote.departure),
                        days: quote.spanDays,
                        months: quote.months,
                      })}
                    </span>
                  </div>
                  <DualRangeSlider
                    min={0}
                    max={quote.window.totalDays - 1}
                    values={[
                      selection.arrivalDayOffset,
                      selection.departureDayOffset,
                    ]}
                    marks={quote.window.monthMarks}
                    lowLabel={t('residency_arrival')}
                    highLabel={t('residency_departure')}
                    onChange={([arrival, departure]) =>
                      patchSelection({
                        arrivalDayOffset: arrival,
                        departureDayOffset: departure,
                      })
                    }
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-complimentary-light">
                    <span>{formatDate(quote.window.start)}</span>
                    <span>
                      {t('residency_season_window', {
                        season: quote.season.label,
                      })}
                    </span>
                    <span>{formatDate(quote.window.end)}</span>
                  </div>

                  {quote.nightsAlreadyBooked > 0 && (
                    <p className="m-0 mt-3 rounded-lg border border-dashed border-accent bg-accent-light px-4 py-3 text-xs text-complimentary-core">
                      {t('residency_nights_already_booked', {
                        nights: quote.nightsAlreadyBooked,
                        total: quote.spanDays,
                      })}
                    </p>
                  )}

                  {quote.boundaryPenalty > 0 ? (
                    <p className="m-0 mt-3 rounded-lg border border-dashed border-accent-alt bg-neutral px-4 py-3 text-xs text-complimentary-core">
                      {t('residency_boundary_penalty_warning', {
                        late: quote.daysLateIn,
                        early: quote.daysEarlyOut,
                        grace: params.graceDays,
                        multiplier: params.boundaryPenalty,
                        amount: formatCurrency(quote.boundaryPenalty),
                      })}
                    </p>
                  ) : (
                    (quote.daysLateIn > 0 || quote.daysEarlyOut > 0) && (
                      <p className="m-0 mt-3 text-xs text-accent">
                        {t('residency_boundary_within_grace', {
                          grace: params.graceDays,
                        })}
                      </p>
                    )
                  )}
                </div>
              </section>

              {/* ─────────────── 03 · accommodation ─────────────── */}
              <section className={sectionClassName}>
                <p className={eyebrowClassName}>
                  {t('residency_step_accommodation')}
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {accommodations.map((option) => {
                    const isActive = option.id === selection.accommodationId;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          patchSelection({
                            accommodationId: option.id,
                            // Cover the stay by default with whatever the
                            // connected wallet can actually spend.
                            tokensLocked: Math.min(
                              standing.lockableTokens,
                              option.tokensMonthly * quote.months,
                            ),
                          })
                        }
                        className={optionClassName(isActive)}
                      >
                        <p className="m-0 text-sm font-semibold text-complimentary-core">
                          {option.label}
                        </p>
                        {option.note && (
                          <p className="m-0 mb-1.5 mt-0.5 text-[11px] text-complimentary-light">
                            {option.note}
                          </p>
                        )}
                        <p className="m-0 mt-1.5 text-xs text-complimentary-core">
                          {formatCurrency(option.fiatMonthly)}
                          {t('residency_per_month_suffix')}
                          {option.tokensMonthly > 0 && (
                            <>
                              {' '}
                              <span className="text-complimentary-light">
                                {t('residency_or')}
                              </span>{' '}
                              <span className="text-accent">
                                {formatTokens(option.tokensMonthly)}{' '}
                                {RESIDENCY_TOKEN_SYMBOL}
                                {t('residency_per_month_suffix')}
                              </span>
                            </>
                          )}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ─────────────── 04 · token cover ─────────────── */}
              <section className={sectionClassName}>
                <p className={eyebrowClassName}>
                  {t('residency_step_tokens', {
                    symbol: RESIDENCY_TOKEN_SYMBOL,
                  })}
                </p>
                {quote.tokensNeeded <= 0 ? (
                  <p className="m-0 text-[13px] text-complimentary-light">
                    {t('residency_tokens_not_priced', {
                      accommodation: quote.accommodation.label,
                      symbol: RESIDENCY_TOKEN_SYMBOL,
                      amount: formatCurrency(quote.accommodationFiatMonthly),
                    })}
                  </p>
                ) : !hasLiveBalances ? (
                  // Spending tokens needs a wallet, so until one is connected
                  // this is simply the cash price plus an invitation.
                  <>
                    <p className="m-0 text-[13px] text-complimentary-core">
                      {t('residency_accommodation_fiat_due', {
                        amount: formatCurrency(quote.accommodationFiatMonthly),
                      })}
                    </p>
                    <div>
                      <Button
                        variant="secondary"
                        className="!w-auto"
                        onClick={connectWallet}
                      >
                        {t('residency_connect_wallet_to_discount', {
                          symbol: RESIDENCY_TOKEN_SYMBOL,
                        })}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="m-0 text-[13px] text-complimentary-light">
                      {t('residency_tokens_explainer', {
                        symbol: RESIDENCY_TOKEN_SYMBOL,
                      })}
                    </p>
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span>0</span>
                        <span className="font-semibold text-accent">
                          {t('residency_tokens_locked_summary', {
                            locked: formatTokens(quote.tokensLocked),
                            needed: formatTokens(quote.tokensNeeded),
                            symbol: RESIDENCY_TOKEN_SYMBOL,
                            pct: Math.round(quote.coverage * 100),
                          })}
                        </span>
                        <span>{formatTokens(quote.lockableMax)}</span>
                      </div>
                      <RangeSlider
                        ariaLabel={t('residency_step_tokens', {
                          symbol: RESIDENCY_TOKEN_SYMBOL,
                        })}
                        value={quote.tokensLocked}
                        min={0}
                        max={Math.max(0.01, quote.lockableMax)}
                        // A hundred steps across whatever the range happens to
                        // be, so the ceiling — full cover — is always reachable
                        // even though listing rates rarely divide into whole
                        // tokens.
                        step={Math.max(quote.lockableMax / 100, 0.01)}
                        disabled={quote.lockableMax <= 0}
                        onChange={(value) =>
                          patchSelection({ tokensLocked: value })
                        }
                      />
                    </div>
                    <p className="m-0 text-[13px] text-complimentary-core">
                      {t('residency_accommodation_fiat_due', {
                        amount: formatCurrency(quote.accommodationFiatMonthly),
                      })}
                      {quote.lockableMax < quote.tokensNeeded && (
                        <span className="text-complimentary-light">
                          {' '}
                          {t('residency_tokens_short', {
                            held: formatTokens(standing.lockableTokens),
                            needed: formatTokens(quote.tokensNeeded),
                          })}
                        </span>
                      )}
                    </p>
                  </>
                )}
              </section>

              {/* ─────────────── 05 · cash out ─────────────── */}
              <section className={sectionClassName}>
                <p className={eyebrowClassName}>{t('residency_step_cash')}</p>
                {quote.cashCap <= 0 ? (
                  <p className="m-0 text-[13px] text-complimentary-light">
                    {t('residency_cash_locked', {
                      threshold: quote.firstCashTier?.minPresence ?? 0,
                      tier: quote.firstCashTier?.label ?? '',
                      symbol: RESIDENCY_TOKEN_SYMBOL,
                    })}
                  </p>
                ) : (
                  <>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span>{formatCurrency(0)}</span>
                      <span className="font-semibold text-accent">
                        {t('residency_cash_summary', {
                          requested: formatCurrency(quote.cashRequested),
                          paid: formatCurrency(quote.cashReceived),
                          multiplier: params.cashMultiplier,
                        })}
                      </span>
                      <span>{formatCurrency(quote.cashCap)}</span>
                    </div>
                    <RangeSlider
                      ariaLabel={t('residency_step_cash')}
                      value={quote.cashRequested}
                      min={0}
                      max={Math.round(quote.cashCap)}
                      step={10}
                      onChange={(value) =>
                        patchSelection({ cashRequested: value })
                      }
                    />
                    <p className="m-0 text-xs text-complimentary-light">
                      {t('residency_cash_explainer', {
                        pct: quote.tier.cashPct,
                        cap: formatCurrency(params.maxCashOut),
                        multiplier: params.cashMultiplier,
                        symbol: RESIDENCY_TOKEN_SYMBOL,
                        price: formatCurrency(params.tokenValue),
                      })}
                    </p>
                  </>
                )}
              </section>

              {/* ─────────────── 06 · agreement ─────────────── */}
              <section className={sectionClassName}>
                <p className={eyebrowClassName}>
                  {t('residency_step_agreement')}
                </p>
                <p className="m-0 text-[13px] text-complimentary-light">
                  {t('residency_agreement_explainer', {
                    version: params.agreementVersion,
                  })}
                </p>
                <div>
                  <Button
                    variant="secondary"
                    className="!w-auto"
                    onClick={() => setIsAgreementOpen(true)}
                  >
                    {t('residency_agreement_read_cta')}
                  </Button>
                </div>

                <div className="flex flex-col gap-1 rounded-xl border border-line bg-neutral p-4">
                  {params.acknowledgements.map((item) => (
                    <Checkbox
                      key={item.id}
                      id={`residency-ack-${item.id}`}
                      isChecked={acknowledgedIds.includes(item.id)}
                      onChange={() => toggleAcknowledgement(item.id)}
                    >
                      <span className="text-sm">{item.label}</span>
                    </Checkbox>
                  ))}
                </div>

                <Checkbox
                  id="residency-agree"
                  isChecked={hasAgreed}
                  onChange={() => setHasAgreed((value) => !value)}
                >
                  <span className="text-sm font-semibold text-complimentary-core">
                    {t('residency_agreement_accept_label', {
                      role: role.title,
                      version: params.agreementVersion,
                    })}
                  </span>
                </Checkbox>

                {submitError && <ErrorMessage error={submitError} />}

                {isSubmitted ? (
                  <p className="m-0 rounded-lg border border-accent bg-accent-light px-4 py-3 text-sm text-complimentary-core">
                    {t('residency_submitted')}
                  </p>
                ) : (
                  <Button
                    isEnabled={
                      isFullyAcknowledged && !isSubmitting && isAuthenticated
                    }
                    isLoading={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {quote.tokensLocked > 0
                      ? t('residency_submit_cta_with_lock', {
                          season: quote.season.label,
                          tokens: formatTokens(quote.tokensLocked),
                          symbol: RESIDENCY_TOKEN_SYMBOL,
                        })
                      : t('residency_submit_cta', {
                          season: quote.season.label,
                        })}
                  </Button>
                )}
                {!isAuthenticated && (
                  <p className="m-0 text-center text-xs text-complimentary-light">
                    {t('residency_login_required')}
                  </p>
                )}
              </section>
            </div>

            {/* ─────────────── settlement slip ─────────────── */}
            <aside className="lg:sticky lg:top-4">
              <SettlementSlip
                quote={quote}
                params={params}
                memberName={
                  user?.screenname || t('residency_agreement_member_fallback')
                }
                roleTitle={role.title}
                sweatHeld={standing.sweat}
                fullDaysPerWeek={fullDaysPerWeek}
                tokenSymbol={RESIDENCY_TOKEN_SYMBOL}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            </aside>
          </div>
        )}
      </main>

      {quote && (
        <>
          <TierLadderModal
            isOpen={isTierModalOpen}
            onOpenChange={setIsTierModalOpen}
            params={params}
            presence={standing.presence}
            currentTier={quote.tier}
          />
          <AgreementModal
            isOpen={isAgreementOpen}
            onOpenChange={setIsAgreementOpen}
            roleTitle={role.title}
            agreementVersion={params.agreementVersion}
            body={agreementBody}
          />
        </>
      )}
    </div>
  );
};

RoleResidencyPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const { id } = context.query;
    const [roleRes, listingsRes] = await Promise.all([
      api.get(`/role/${id}`).catch(() => null),
      api.get('/listing').catch(() => null),
    ]);

    return {
      role: roleRes?.data?.results || null,
      listings: listingsRes?.data?.results || [],
    };
  } catch (err: unknown) {
    return { role: null, listings: [], error: parseMessageFromError(err) };
  }
};

export default RoleResidencyPage;
