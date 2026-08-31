import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useMemo, useState } from 'react';

import PageError from '../../../components/PageError';
import AgreementModal from '../../../components/Residency/AgreementModal';
import {
  DualRangeSlider,
  RangeSlider,
} from '../../../components/Residency/RangeSliders';
import SeasonSummary from '../../../components/Residency/SeasonSummary';
import TierLadderModal from '../../../components/Residency/TierLadderModal';
import { RESIDENCY_AGREEMENT_TEMPLATE } from '../../../components/Residency/agreementTemplate';
import {
  BackButton,
  Button,
  Checkbox,
  ErrorMessage,
  Heading,
} from '../../../components/ui';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

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
import { FoodOption } from '../../../types/food';
import {
  ResidencyMissingSetting,
  ResidencySelection,
} from '../../../types/residency';
import api from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { formatIsoFiatAmount } from '../../../utils/currencyFormat';
import {
  buildAgreementSubmission,
  buildResidencyPlan,
  getAgreementTemplate,
  getSeasonWindow,
  getUpcomingSeason,
  listingsToAccommodations,
  renderAgreement,
} from '../../../utils/residency.helpers';
import PageNotFound from '../../not-found';

/**
 * One line of plain English per setting the tool cannot lay out a season
 * without. Written out rather than built from the key so the strings are
 * literal enough for the locale tooling to find, and so each can say where the
 * value belongs.
 */
const RESIDENCY_MISSING_SETTING_KEYS: Record<ResidencyMissingSetting, string> =
  {
    associationName: 'residency_missing_association_name',
    legalFramework: 'residency_missing_legal_framework',
    noticeWeeks: 'residency_missing_notice_weeks',
    expenseReimbursementDays: 'residency_missing_expense_days',
    seasons: 'residency_missing_seasons',
    presenceTiers: 'residency_missing_presence_tiers',
    presenceScaleMax: 'residency_missing_presence_scale_max',
    sweatRate: 'residency_missing_sweat_rate',
    sweatMaxBonus: 'residency_missing_sweat_max_bonus',
    foodMonthly: 'residency_missing_food_monthly',
    utilitiesMonthly: 'residency_missing_utilities_monthly',
    tokenPrice: 'residency_missing_token_price',
    agreementVersion: 'residency_missing_agreement_version',
    accommodation: 'residency_missing_accommodation',
  };

interface Props {
  role: Role | null;
  /** The platform's own listings — the rooms a season can be spent in. */
  listings: Listing[];
  /** Its food options, which say whether the program feeds its volunteers. */
  foodOptions: FoodOption[];
  error?: string | null;
}

/**
 * The volunteer season tool. A role with `isResidency` opens here rather than
 * a mailto, and what it lays out is participation in an environmental
 * volunteer program: the season, the rhythm, the room and board the promoting
 * association covers, and the agreement that records all of it.
 *
 * Deliberately absent, because the law the program runs under is what makes it
 * lawful: any allocation, salary, cash-out or penalty. The association covers
 * the volunteer's costs (support in kind under the gratuitidade principle);
 * the volunteer may spend tokens they already hold on an optional upgrade; and
 * either side may end the season at any time, owing nothing. Paid team roles
 * are arranged separately, under a work or services contract.
 */
const RoleResidencyPage = ({ role, listings, foodOptions, error }: Props) => {
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
  /** The village's own fiat, so a non-euro platform prices in its currency. */
  const currency = String(paymentConfig?.fiatCur || 'EUR');

  const {
    params,
    missing,
    isEnabled: isResidencyEnabled,
    isLoading: isLoadingParams,
  } = useResidencyParams(foodOptions);
  const { standing, hasLiveBalances } = useResidencyStanding();
  /** Only an admin can act on a missing setting, so only they are sent there. */
  const isPlatformAdmin = Boolean(user?.roles?.includes('admin'));

  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const upcomingSeason = useMemo(
    () => getUpcomingSeason(params?.seasons ?? []),
    [params?.seasons],
  );

  // The booking config carries the duration discounts a long stay earns.
  const bookingConfig = getCachedConfig('booking');
  const accommodations = useMemo(
    () => listingsToAccommodations(listings, bookingConfig),
    [listings, bookingConfig],
  );

  /**
   * The role's own days per week, read as the ceiling of the indicative
   * rhythm: a volunteer arranges their half-days with the coordinator, and
   * this is the most the program would ever ask for.
   */
  const maxHalfDaysPerWeek = Math.max(1, Number(role?.daysPerWeek) || 5);

  /**
   * The starting point: the whole of the next season's window, in the room the
   * program covers. Derived rather than seeded in an effect so the first paint
   * — server-side included — is already the complete tool rather than a
   * spinner.
   */
  const defaultSelection = useMemo<ResidencySelection | null>(() => {
    if (!upcomingSeason || !accommodations.length) return null;
    const window = getSeasonWindow(upcomingSeason);
    const covered = [...accommodations].sort(
      (a, b) => a.fiatMonthly - b.fiatMonthly,
    )[0];
    return {
      seasonId: upcomingSeason.id,
      arrivalDayOffset: 0,
      departureDayOffset: window.totalDays - 1,
      accommodationId: covered.id,
      tokensSpent: 0,
      halfDaysPerWeek: maxHalfDaysPerWeek,
      needsAccommodation: true,
    };
  }, [upcomingSeason, accommodations, maxHalfDaysPerWeek]);

  /** Only what the volunteer has actually touched. */
  const [edits, setEdits] = useState<Partial<ResidencySelection>>({});

  const selection = useMemo<ResidencySelection | null>(
    () => (defaultSelection ? { ...defaultSelection, ...edits } : null),
    [defaultSelection, edits],
  );

  const plan = useMemo(() => {
    if (!role || !selection || !params) return null;
    return buildResidencyPlan({
      role,
      params,
      accommodations,
      standing,
      selection,
    });
  }, [role, params, accommodations, standing, selection]);

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
    if (!role || !plan || !params) return '';
    return renderAgreement({
      template: getAgreementTemplate(
        role,
        params,
        RESIDENCY_AGREEMENT_TEMPLATE,
      ),
      role,
      plan,
      params,
      volunteerName:
        user?.screenname || t('residency_agreement_member_fallback'),
      platformName,
      tokenSymbol: RESIDENCY_TOKEN_SYMBOL,
      formatCurrency,
      formatDate,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, plan, params, user?.screenname, platformName]);

  if (error) return <PageError error={error} />;
  if (!role) return <PageNotFound />;
  if (rolesConfig && rolesConfig.enabled === false) return <PageNotFound />;

  const patchSelection = (patch: Partial<ResidencySelection>) =>
    setEdits((current) => ({ ...current, ...patch }));

  const pickSeason = (seasonId: string) => {
    const season = params?.seasons.find((item) => item.id === seasonId);
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
    (params?.acknowledgements ?? []).every((item) =>
      acknowledgedIds.includes(item.id),
    );

  const handleSubmit = async () => {
    if (!plan || !selection || !params || !isFullyAcknowledged) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      /*
       * One call, deliberately: the endpoint creates the stay and stores the
       * agreed terms against it in a single transaction. Booking from the
       * client and then filing the agreement separately would leave an orphan
       * stay behind whenever the second call failed.
       *
       * Contract: docs/residency-agreements-endpoint.md
       */
      await api.post(
        '/residency-agreements',
        buildAgreementSubmission({
          role,
          plan,
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

  /*
   * Everything standing between this role and a season, named one by one. The
   * page states them rather than filling them in: these are one association's
   * legal frame, and a value this tool invented would be a value a volunteer
   * is asked to sign against.
   */
  const missingSettings: ResidencyMissingSetting[] = [
    ...missing,
    ...(accommodations.length ? [] : (['accommodation'] as const)),
  ];

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

        {role.isResidency && !isResidencyEnabled && (
          <div className="mt-6 rounded-xl border border-line bg-neutral p-5">
            <p className="m-0 text-complimentary-light">
              {t('residency_disabled')}
            </p>
          </div>
        )}

        {role.isResidency &&
          isResidencyEnabled &&
          isLoadingParams &&
          !params && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-line bg-neutral p-5"
            >
              <p className="m-0 text-complimentary-light">
                {t('residency_preparing_season')}
              </p>
            </div>
          )}

        {role.isResidency &&
          isResidencyEnabled &&
          !isLoadingParams &&
          missingSettings.length > 0 && (
            <div className="mt-6 rounded-xl border border-line bg-neutral p-5">
              <p className="m-0 font-semibold text-complimentary-core">
                {t('residency_not_configured')}
              </p>
              <ul className="m-0 mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm text-complimentary-light">
                {missingSettings.map((setting) => (
                  <li key={setting}>
                    {t(RESIDENCY_MISSING_SETTING_KEYS[setting])}
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-4 text-xs text-complimentary-light">
                {isPlatformAdmin ? (
                  <Link href="/admin/config" className="text-accent underline">
                    {t('residency_configure_cta')}
                  </Link>
                ) : (
                  t('residency_configure_ask_host')
                )}
              </p>
            </div>
          )}

        {role.isResidency && params && selection && plan && (
          <>
            {/*
             * The frame first, before any of the choices below it: what this
             * is, who runs it, and that it is unpaid. Everything further down
             * only makes sense — and is only lawful — read against it.
             */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 sm:p-5">
              <span
                aria-hidden
                className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full bg-success"
              />
              <div className="min-w-0">
                <p className="m-0 font-bold text-complimentary-core">
                  {t('residency_frame_title', {
                    association: params.associationName,
                  })}
                </p>
                <p className="m-0 mt-1 max-w-3xl text-[13px] text-complimentary-light">
                  {t('residency_frame_body', { law: params.legalFramework })}{' '}
                  {params.legalFrameworkUrl && (
                    <Link
                      href={params.legalFrameworkUrl}
                      className="font-semibold text-success underline"
                    >
                      {t('residency_frame_link')}
                    </Link>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
              <div className="flex min-w-0 flex-col gap-5">
                {/* ─────────────── 01 · journey ─────────────── */}
                <section className={sectionClassName}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <p className={eyebrowClassName}>
                        {t('residency_step_journey')}
                      </p>
                      <h2 className="m-0 mt-1 text-xl font-bold text-complimentary-core">
                        {user?.screenname ||
                          t('residency_agreement_member_fallback')}{' '}
                        <span className="font-medium text-complimentary-light">
                          · {t('residency_volunteer')}
                        </span>
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTierModalOpen(true)}
                      className="rounded-full border border-accent bg-accent-light px-3 py-1 text-xs font-semibold text-accent"
                    >
                      {t('residency_tier_badge', { tier: plan.tier.label })}
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

                  {!plan.isRoleUnlocked && (
                    <p className="m-0 rounded-lg border border-dashed border-accent-alt bg-neutral px-4 py-3 text-sm text-complimentary-core">
                      {t('residency_role_locked', {
                        role: role.title,
                        tier: plan.requiredTier.label,
                        required: role.minPresence ?? 0,
                        short: plan.presenceShortfall,
                      })}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        key: '$Presence',
                        value: standing.presence,
                        sub: t('residency_stat_presence_sub'),
                      },
                      {
                        key: RESIDENCY_TOKEN_SYMBOL,
                        value: standing.tokensHeld,
                        sub: t('residency_stat_tokens_sub', {
                          symbol: RESIDENCY_TOKEN_SYMBOL,
                        }),
                      },
                      {
                        key: '$Sweat',
                        value: standing.sweat,
                        sub: t('residency_stat_sweat_sub'),
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
                        {t('residency_participation_label')}
                      </p>
                      <p className="m-0 my-0.5 text-lg font-bold text-complimentary-core">
                        {plan.halfDaysPerWeek}{' '}
                        <span className="text-[13px] font-normal">
                          {t('residency_half_days_per_week')}
                        </span>
                      </p>
                      <p className="m-0 mb-1 text-[11px] text-complimentary-light">
                        {t('residency_participation_hint')}
                      </p>
                      <RangeSlider
                        ariaLabel={t('residency_participation_label')}
                        value={selection.halfDaysPerWeek}
                        min={1}
                        max={maxHalfDaysPerWeek}
                        step={1}
                        onChange={(value) =>
                          patchSelection({ halfDaysPerWeek: value })
                        }
                      />
                    </div>
                  </div>

                  <p className="m-0 rounded-lg border border-dashed border-accent bg-accent-light px-4 py-3 text-[13px] text-complimentary-core">
                    <span className="font-bold">{plan.tier.label}</span>
                    {plan.tier.unlocks && ` — ${plan.tier.unlocks}`}
                    {plan.nextTier && (
                      <>
                        {' · '}
                        {t('residency_growth_next_tier', {
                          days: Math.max(
                            0,
                            plan.nextTier.minPresence - standing.presence,
                          ),
                          next: plan.nextTier.label,
                        })}
                      </>
                    )}{' '}
                    {t('residency_growth_free_time')}
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
                            {formatDate(window.start)} →{' '}
                            {formatDate(window.end)}
                          </p>
                          <p className="m-0 mt-1 text-[11px] text-accent">
                            {season.pace === 'slow'
                              ? t('residency_season_slow')
                              : t('residency_season_high')}{' '}
                            ·{' '}
                            {t('residency_season_up_to', {
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
                          start: formatDate(plan.arrival),
                          end: formatDate(plan.departure),
                          days: plan.spanDays,
                          months: plan.months,
                        })}
                      </span>
                    </div>
                    <DualRangeSlider
                      min={0}
                      max={plan.window.totalDays - 1}
                      values={[
                        selection.arrivalDayOffset,
                        selection.departureDayOffset,
                      ]}
                      marks={plan.window.monthMarks}
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
                      <span>{formatDate(plan.window.start)}</span>
                      <span>
                        {t('residency_season_window', {
                          season: plan.season.label,
                        })}
                      </span>
                      <span>{formatDate(plan.window.end)}</span>
                    </div>

                    {/*
                     * Freely undertaken, freely ended: there is no penalty to
                     * warn about, only the courtesy the community asks for.
                     */}
                    <p className="m-0 mt-4 text-sm text-complimentary-light">
                      {t('residency_exit_note', { weeks: params.noticeWeeks })}
                    </p>
                  </div>
                </section>

                {/* ─────────────── 03 · stay, covered ─────────────── */}
                <section className={sectionClassName}>
                  <p className={eyebrowClassName}>
                    {t('residency_step_stay_covered')}
                  </p>
                  <p className="m-0 max-w-3xl text-[13px] text-complimentary-light">
                    {t('residency_stay_covered_intro', {
                      law: params.legalFramework,
                    })}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {accommodations.map((option) => {
                      const isActive =
                        plan.needsAccommodation &&
                        option.id === selection.accommodationId;
                      const isIncluded =
                        option.id === plan.includedAccommodation.id;
                      const upgradeFiat = Math.max(
                        0,
                        option.fiatMonthly -
                          plan.includedAccommodation.fiatMonthly,
                      );
                      const upgradeTokens = Math.max(
                        0,
                        option.tokensMonthly -
                          plan.includedAccommodation.tokensMonthly,
                      );
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            patchSelection({
                              needsAccommodation: true,
                              accommodationId: option.id,
                              // Cover the upgrade by default with whatever the
                              // connected wallet can actually spend.
                              tokensSpent: Math.min(
                                standing.lockableTokens,
                                upgradeTokens * plan.months,
                              ),
                            })
                          }
                          className={optionClassName(isActive)}
                        >
                          <span
                            className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${
                              isIncluded
                                ? 'bg-success/15 text-success'
                                : 'bg-accent-light text-accent'
                            }`}
                          >
                            {isIncluded
                              ? t('residency_pill_included')
                              : t('residency_pill_upgrade')}
                          </span>
                          <p className="m-0 text-sm font-semibold text-complimentary-core">
                            {option.label}
                          </p>
                          {option.note && (
                            <p className="m-0 mb-1.5 mt-0.5 text-[11px] text-complimentary-light">
                              {option.note}
                            </p>
                          )}
                          <p className="m-0 mt-1.5 text-xs text-complimentary-core">
                            {isIncluded ? (
                              <span className="text-success">
                                {t('residency_provided_by_program', {
                                  amount: formatCurrency(0),
                                })}
                              </span>
                            ) : (
                              <>
                                +{formatCurrency(upgradeFiat)}
                                {t('residency_per_month_suffix')}
                                {upgradeTokens > 0 && (
                                  <>
                                    {' '}
                                    <span className="text-complimentary-light">
                                      {t('residency_or')}
                                    </span>{' '}
                                    <span className="text-accent">
                                      {formatTokens(upgradeTokens)}{' '}
                                      {RESIDENCY_TOKEN_SYMBOL}
                                      {t('residency_per_month_suffix')}
                                    </span>
                                  </>
                                )}
                              </>
                            )}
                          </p>
                        </button>
                      );
                    })}

                    {/* housing yourself is a choice, so it sits with the rooms */}
                    <button
                      type="button"
                      onClick={() =>
                        patchSelection({
                          needsAccommodation: false,
                          tokensSpent: 0,
                        })
                      }
                      className={optionClassName(!plan.needsAccommodation)}
                    >
                      <p className="m-0 text-sm font-semibold text-complimentary-core">
                        {t('residency_no_accommodation')}
                      </p>
                      <p className="m-0 mb-1.5 mt-0.5 text-[11px] text-complimentary-light">
                        {t('residency_no_accommodation_note')}
                      </p>
                      <p className="m-0 mt-1.5 text-xs text-complimentary-core">
                        {formatCurrency(0)}
                        {t('residency_per_month_suffix')}
                      </p>
                    </button>
                  </div>
                </section>

                {/* ─────────────── 04 · spend tokens ─────────────── */}
                <section className={sectionClassName}>
                  <p className={eyebrowClassName}>
                    {t('residency_step_tokens', {
                      symbol: RESIDENCY_TOKEN_SYMBOL,
                    })}
                  </p>
                  {plan.seasonTokensDistributed > 0 && (
                    <div className="rounded-xl border border-line bg-neutral px-4 py-3">
                      <p className="m-0 flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-complimentary-core">
                          {t('residency_distribution_label', {
                            symbol: RESIDENCY_TOKEN_SYMBOL,
                          })}
                        </span>
                        <span className="text-base font-bold text-accent">
                          {t('residency_tokens_amount', {
                            amount: formatTokens(plan.seasonTokensDistributed),
                          })}
                        </span>
                      </p>
                      <p className="m-0 mt-1 text-[13px] text-complimentary-light">
                        {t('residency_distribution_explainer', {
                          monthly: formatTokens(plan.tokensDistributedMonthly),
                          months: plan.months,
                          symbol: RESIDENCY_TOKEN_SYMBOL,
                          value: formatCurrency(0),
                        })}
                      </p>
                    </div>
                  )}

                  <p className="m-0 text-[13px] text-complimentary-light">
                    {t('residency_tokens_explainer', {
                      symbol: RESIDENCY_TOKEN_SYMBOL,
                    })}
                  </p>

                  {plan.isUpgrade &&
                    (plan.upgradeTokensMonthly <= 0 ? (
                      <p className="m-0 text-[13px] text-complimentary-light">
                        {t('residency_tokens_not_priced', {
                          accommodation: plan.accommodation.label,
                          symbol: RESIDENCY_TOKEN_SYMBOL,
                          amount: formatCurrency(plan.seasonFiatOwed),
                        })}
                      </p>
                    ) : !hasLiveBalances ? (
                      // Spending tokens needs a wallet, so until one is
                      // connected this is simply the euro price plus an
                      // invitation.
                      <>
                        <p className="m-0 text-[13px] text-complimentary-core">
                          {t('residency_upgrade_fiat_due', {
                            amount: formatCurrency(plan.seasonFiatOwed),
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
                        <div>
                          <div className="mb-1.5 flex justify-between text-xs">
                            <span>0</span>
                            <span className="font-semibold text-accent">
                              {t('residency_tokens_spent_summary', {
                                spent: formatTokens(plan.tokensSpent),
                                needed: formatTokens(plan.tokensNeeded),
                                symbol: RESIDENCY_TOKEN_SYMBOL,
                                pct: Math.round(plan.coverage * 100),
                              })}
                            </span>
                            <span>{formatTokens(plan.spendableMax)}</span>
                          </div>
                          <RangeSlider
                            ariaLabel={t('residency_step_tokens', {
                              symbol: RESIDENCY_TOKEN_SYMBOL,
                            })}
                            value={plan.tokensSpent}
                            min={0}
                            max={Math.max(0.01, plan.spendableMax)}
                            // A hundred steps across whatever the range happens
                            // to be, so the ceiling — the whole upgrade — is
                            // always reachable even though listing rates rarely
                            // divide into whole tokens.
                            step={Math.max(plan.spendableMax / 100, 0.01)}
                            disabled={plan.spendableMax <= 0}
                            onChange={(value) =>
                              patchSelection({ tokensSpent: value })
                            }
                          />
                        </div>
                        <p className="m-0 text-[13px] text-complimentary-core">
                          {t('residency_upgrade_fiat_due', {
                            amount: formatCurrency(plan.seasonFiatOwed),
                          })}
                          {plan.spendableMax < plan.tokensNeeded && (
                            <span className="text-complimentary-light">
                              {' '}
                              {t('residency_tokens_short', {
                                held: formatTokens(standing.lockableTokens),
                                needed: formatTokens(plan.tokensNeeded),
                              })}
                            </span>
                          )}
                        </p>
                      </>
                    ))}

                  <p className="m-0 text-xs text-complimentary-light">
                    {t('residency_tokens_not_earned', {
                      symbol: RESIDENCY_TOKEN_SYMBOL,
                    })}
                  </p>
                </section>

                {/* ─────────────── 05 · agreement ─────────────── */}
                <section className={sectionClassName}>
                  <p className={eyebrowClassName}>
                    {t('residency_step_agreement')}
                  </p>
                  <p className="m-0 text-[13px] text-complimentary-light">
                    {t('residency_agreement_explainer', {
                      version: params.agreementVersion,
                      law: params.legalFramework,
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

                  {params.acknowledgements.length > 0 && (
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
                  )}

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
                      {t('residency_submit_cta', {
                        season: plan.season.label,
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

              {/* ─────────────── season summary ─────────────── */}
              <aside className="lg:sticky lg:top-4">
                <SeasonSummary
                  plan={plan}
                  params={params}
                  volunteerName={
                    user?.screenname || t('residency_agreement_member_fallback')
                  }
                  roleTitle={role.title}
                  tokenSymbol={RESIDENCY_TOKEN_SYMBOL}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              </aside>
            </div>
          </>
        )}
      </main>

      {plan && params && (
        <>
          <TierLadderModal
            isOpen={isTierModalOpen}
            onOpenChange={setIsTierModalOpen}
            params={params}
            presence={standing.presence}
            currentTier={plan.tier}
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
    const [roleRes, listingsRes, foodRes] = await Promise.all([
      api.get(`/role/${id}`).catch(() => null),
      api.get('/listing').catch(() => null),
      api.get('/food').catch(() => null),
    ]);

    return {
      role: roleRes?.data?.results || null,
      listings: listingsRes?.data?.results || [],
      foodOptions: foodRes?.data?.results || [],
    };
  } catch (err: unknown) {
    return {
      role: null,
      listings: [],
      foodOptions: [],
      error: parseMessageFromError(err),
    };
  }
};

export default RoleResidencyPage;
