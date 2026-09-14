import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useCallback, useEffect, useState } from 'react';

import { Copy, Share2 } from 'lucide-react';
import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import UserAvatarPlaceholder from '../../components/UserAvatarPlaceholder';
import { Button, Card, Heading, Row } from '../../components/ui';
import Progress from '../../components/ui/ProgressBar/Progress';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import api, { cdn, formatSearch } from '../../utils/api';
import { getNextMonthName } from '../../utils/helpers';
import PageNotFound from '../not-found';

const today = new Date();
const firstDayOfCurrentMonth = dayjs(
  new Date(today.getFullYear(), today.getMonth(), 1),
).format('YYYY-MM-DD');
const lastDayOfCurrentMonth = dayjs(
  new Date(today.getFullYear(), today.getMonth() + 1, 0),
).format('YYYY-MM-DD');

interface ReferralConfigValue {
  creditsToReferrer?: number;
  creditsToFriend?: number;
  maxCreditsPerMonth?: number;
  tokensPerCitizenReferred?: number;
  bonusTokensPerCitizenReferred?: number;
  bonusEndDate?: string;
}

interface ReferralTokenReward {
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled';
}

interface ReferralProgressRow {
  _id: string;
  screenname?: string;
  slug?: string;
  photo?: string | null;
  isCitizen: boolean;
  progress: {
    hasApplied: boolean;
    isVouched: boolean;
    hasStayedForMinDuration: boolean;
    hasActiveFinancedPlan: boolean;
  } | null;
}

const ReferralsPage = () => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();
  const config = useConfig();
  const { SEMANTIC_URL } = config || {};
  const { isAuthenticated, user } = useAuth();

  const referralLink = `${SEMANTIC_URL}/signup/?referral=${user?._id}`;

  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [usersReferredByMe, setUsersReferredByMe] = useState();
  const [creditsEarnedFromReferrals, setCreditsEarnedFromReferrals] =
    useState();
  const [creditsErnedThisMonth, setCreditsErnedThisMonth] = useState();
  const [referralConfig, setReferralConfig] =
    useState<ReferralConfigValue | null>(null);
  const [citizensReferredByMe, setCitizensReferredByMe] = useState<number>();
  const [tokenRewards, setTokenRewards] = useState<ReferralTokenReward[]>([]);
  const [referralProgress, setReferralProgress] = useState<
    ReferralProgressRow[]
  >([]);

  const isCitizen = Boolean(user?.roles?.includes('member'));

  const creditsToReferrer = Number(referralConfig?.creditsToReferrer ?? 1);
  const creditsToFriend = Number(referralConfig?.creditsToFriend ?? 2);
  const maxCreditsPerMonth = Number(referralConfig?.maxCreditsPerMonth ?? 6);
  const baseTokensPerCitizen = Number(
    referralConfig?.tokensPerCitizenReferred ?? 0,
  );
  const bonusTokensPerCitizen = Number(
    referralConfig?.bonusTokensPerCitizenReferred ?? 0,
  );
  const bonusEndDate = referralConfig?.bonusEndDate || '';
  // The bonus rate applies through the configured day, matching the API.
  const isBonusActive = Boolean(
    bonusTokensPerCitizen > 0 &&
      bonusEndDate &&
      dayjs(bonusEndDate).isValid() &&
      !dayjs().isAfter(dayjs(bonusEndDate), 'day'),
  );
  const isCitizenProgramEnabled = baseTokensPerCitizen > 0;

  const tokensEarned = tokenRewards
    .filter((reward) => reward.status !== 'cancelled')
    .reduce((sum, reward) => sum + (reward.amount || 0), 0);
  const tokensPending = tokenRewards
    .filter((reward) => reward.status === 'pending')
    .reduce((sum, reward) => sum + (reward.amount || 0), 0);

  const referralsInProgress = referralProgress.filter(
    (row) => !row.isCitizen && row.progress,
  );

  const missingSteps = (
    progress: NonNullable<ReferralProgressRow['progress']>,
  ) =>
    [
      !progress.hasApplied && t('referrals_citizen_missing_apply'),
      !progress.isVouched && t('referrals_citizen_missing_vouch'),
      !progress.hasStayedForMinDuration &&
        t('referrals_citizen_missing_stay'),
      !progress.hasActiveFinancedPlan &&
        t('referrals_citizen_missing_finance'),
    ].filter(Boolean) as string[];

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function',
    );
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/config/referral');
        setReferralConfig(res?.data?.results?.value || null);
      } catch (err) {
        // Missing config falls back to the historical program defaults.
        setReferralConfig(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (user && isCitizen) {
      (async () => {
        try {
          const res = await Promise.all([
            api.get('/count/user', {
              params: {
                where: formatSearch({
                  referredBy: user._id,
                  roles: 'member',
                }),
              },
            }),
            api.get('/referralreward', {
              params: {
                where: formatSearch({ userId: user._id }),
              },
            }),
            api.get('/referrals/citizen-progress'),
          ]);
          setCitizensReferredByMe(res[0].data.results);
          setTokenRewards(res[1].data.results || []);
          setReferralProgress(res[2].data.results || []);
        } catch (err) {
          console.log('failed to load citizen referral stats', err);
        }
      })();
    }
  }, [user, isCitizen]);

  useEffect(() => {
    if (user) {
      (async () => {
        const res = await Promise.all([
          api.get('/count/user', {
            params: {
              where: formatSearch({ referredBy: user._id }),
            },
          }),
          api.get('/credit', {
            params: {
              where: formatSearch({
                userId: user._id,
                source: 'referral',
              }),
            },
          }),
          api.get('/credit', {
            params: {
              where: formatSearch({
                userId: user._id,
                source: 'referral',
                created: {
                  $gte: firstDayOfCurrentMonth,
                  $lte: lastDayOfCurrentMonth,
                },
              }),
            },
          }),
        ]);

        const creditsEarned = res[1].data.results.reduce(
          (acc: number, curr: { amount: number }) => {
            return acc + curr.amount;
          },
          0,
        );
        const creditsThisMonth = res[2].data.results.reduce(
          (acc: number, curr: { amount: number }) => {
            return acc + curr.amount;
          },
          0,
        );

        setUsersReferredByMe(res[0].data.results);
        setCreditsEarnedFromReferrals(creditsEarned);
        setCreditsErnedThisMonth(creditsThisMonth);
      })();
    }
  }, [user]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(
      () => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      },
      (err) => {
        console.log('failed to copy', err);
      },
    );
  }, [referralLink]);

  const handleShare = useCallback(async () => {
    if (typeof navigator.share !== 'function') {
      copyToClipboard();
      return;
    }
    try {
      await navigator.share({
        title: t('referrals_share_title'),
        text: `${t('referrals_share_text')}\n${referralLink}`,
        url: referralLink,
      });
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e?.name !== 'AbortError') {
        copyToClipboard();
      }
    }
  }, [copyToClipboard, referralLink, t]);

  if (!isAuthenticated || !user) {
    return <PageNotFound error="Please log in to see this page." />;
  }

  return (
    <>
      <Head>
        <title>{t('referrals_heading')}</title>
      </Head>
      <div className="max-w-lg mx-auto w-full min-h-screen main-content flex flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <span className="text-4xl md:text-5xl" aria-hidden>
            🤙🏽
          </span>
          <Heading level={1} className="text-2xl md:text-3xl font-bold">
            {t('referrals_heading')}
          </Heading>
          {APP_NAME ? (
            <p className="text-base text-muted-foreground max-w-md">
              {t('referrals_subheading')}
            </p>
          ) : null}
        </header>

        <section
          className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent-light to-background p-5 md:p-6 shadow-sm flex flex-col gap-4"
          aria-labelledby="referrals-invite-heading"
        >
          <div className="flex flex-col gap-1">
            <h2
              id="referrals-invite-heading"
              className="text-lg font-semibold text-foreground"
            >
              {t('referrals_your_link_heading')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('referrals_invite_hint')}
            </p>
          </div>
          <input
            readOnly
            value={referralLink}
            onFocus={(e) => e.currentTarget.select()}
            onClick={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 break-all font-mono"
            spellCheck={false}
            aria-label={t('referrals_your_link_heading')}
          />
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              type="button"
              onClick={copyToClipboard}
              variant="primary"
              isFullWidth={false}
              className="w-full sm:flex-1 min-h-[44px] inline-flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4 shrink-0" aria-hidden />
              {t('referrals_copy_link')}
            </Button>
            {canNativeShare ? (
              <Button
                type="button"
                onClick={handleShare}
                variant="secondary"
                isFullWidth={false}
                className="w-full sm:flex-1 min-h-[44px] inline-flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4 shrink-0" aria-hidden />
                {t('referrals_share_link')}
              </Button>
            ) : null}
          </div>
          {copied ? (
            <p className="text-sm font-medium text-accent text-center">
              {t('referrals_link_copied')}
            </p>
          ) : null}
        </section>

        <Card className="overflow-hidden border border-border shadow-sm p-0">
          <div className="grid md:grid-cols-2 md:divide-x divide-border divide-y md:divide-y-0">
            <div className="p-5 md:p-6 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-foreground">
                {t('referrals_monthly_progress_heading')}
              </h3>
              <Progress
                progress={creditsErnedThisMonth ?? 0}
                total={maxCreditsPerMonth}
              />
              <Row
                rowKey={t('referrals_next_refresh')}
                value={`${getNextMonthName()} 1`}
              />
            </div>
            <div className="p-5 md:p-6 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-foreground">
                {t('referrals_all_time_progress_heading')}
              </h3>
              <div className="flex flex-col gap-3">
                <Row
                  rowKey={t('referrals_successfull_referrals')}
                  value={usersReferredByMe}
                />
                <Row
                  rowKey={t('referrals_earned')}
                  value={`${APP_NAME ? t('carrots_balance') : ''} ${
                    creditsEarnedFromReferrals === undefined
                      ? ''
                      : creditsEarnedFromReferrals
                  }`}
                />
              </div>
            </div>
          </div>
        </Card>

        {isCitizen && isCitizenProgramEnabled ? (
          <section
            className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent-light to-background p-5 md:p-6 shadow-sm flex flex-col gap-4"
            aria-labelledby="referrals-citizen-heading"
          >
            <div className="flex flex-col gap-1">
              <h2
                id="referrals-citizen-heading"
                className="text-lg font-semibold text-foreground"
              >
                {t('referrals_citizen_heading')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('referrals_citizen_description', {
                  var: baseTokensPerCitizen,
                })}
              </p>
            </div>
            {isBonusActive ? (
              <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
                {t('referrals_citizen_bonus', {
                  bonus: bonusTokensPerCitizen,
                  base: baseTokensPerCitizen,
                  date: dayjs(bonusEndDate).format('MMM D, YYYY'),
                })}
              </p>
            ) : null}
            <div className="flex flex-col gap-3">
              <Row
                rowKey={t('referrals_citizen_onboarded')}
                value={citizensReferredByMe ?? 0}
              />
              <Row
                rowKey={t('referrals_citizen_tokens_earned')}
                value={tokensEarned}
              />
              {tokensPending > 0 ? (
                <Row
                  rowKey={t('referrals_citizen_tokens_pending')}
                  value={tokensPending}
                />
              ) : null}
            </div>
            {referralsInProgress.length > 0 ? (
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('referrals_citizen_in_progress_heading', {
                    count: referralsInProgress.length,
                  })}
                </h3>
                <ul className="flex flex-col gap-3">
                  {referralsInProgress.map((row) => {
                    const missing = missingSteps(row.progress!);
                    return (
                      <li key={row._id} className="flex items-start gap-3">
                        {row.photo ? (
                          <Image
                            src={`${cdn}${row.photo}-profile-sm.jpg`}
                            alt=""
                            width={32}
                            height={32}
                            className="rounded-full mt-0.5"
                          />
                        ) : (
                          <UserAvatarPlaceholder size="sm" />
                        )}
                        <div className="flex flex-col gap-1 min-w-0">
                          <Link
                            href={`/members/${row.slug || row._id}`}
                            className="text-sm font-medium text-foreground hover:underline truncate"
                          >
                            {row.screenname}
                          </Link>
                          {missing.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">
                                {t('referrals_citizen_missing_label')}
                              </span>
                              {missing.map((step) => (
                                <span
                                  key={step}
                                  className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent"
                                >
                                  {step}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {t('referrals_citizen_requirements_met')}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {APP_NAME && APP_NAME !== 'moos' ? (
          <details className="rounded-xl border border-border bg-card text-card-foreground open:shadow-sm">
            <summary className="cursor-pointer px-4 py-3 md:px-5 md:py-4 font-semibold text-foreground">
              {t('referrals_description_heading')}
            </summary>
            <div className="px-4 pb-4 pt-0 md:px-5 md:pb-5 border-t border-border flex flex-col gap-3 text-sm text-muted-foreground">
              <p>{t('referrals_description_text_1')}</p>
              <p>
                {t('referrals_description_rewards', {
                  referrer: creditsToReferrer,
                  friend: creditsToFriend,
                })}
              </p>
              <p>
                {t('referrals_description_cap', { max: maxCreditsPerMonth })}
              </p>
              <p>
                <Link
                  href="/settings/credits"
                  className="font-semibold text-accent hover:underline"
                >
                  {t('referrals_credits_link')}
                </Link>
              </p>
            </div>
          </details>
        ) : null}

        {APP_NAME && APP_NAME === 'moos' ? (
          <div className="flex flex-col gap-8 text-sm text-muted-foreground">
            <section className="flex flex-col gap-3">
              <p>
                To see what&apos;s possible when we activate our community, we
                are opening our doors to new organizations to come and make
                magic at MOOS. Know any teams or DAOs looking for a summer
                gathering spot in central Berlin? Now is the moment to let them
                know about MOOS.
              </p>
              <Heading level={3} hasBorder={true}>
                How It Works:
              </Heading>
              <ol className="list-decimal pl-5 flex flex-col gap-2">
                <li>
                  <span className="font-semibold text-foreground">
                    Share Your Link:
                  </span>{' '}
                  Use your personalized referral link above to invite teams and
                  DAOs to MOOS.
                </li>
                <li>
                  <span className="font-semibold text-foreground">
                    Automatic Association:
                  </span>{' '}
                  If your referral creates an account using your link, any Vybes
                  they purchase will be automatically associated with your
                  account.
                </li>
                <li>
                  <span className="font-semibold text-foreground">
                    Earn Rewards:
                  </span>{' '}
                  For every 10 Vybes your referrals buy, you earn 1 Vybe.
                  It&apos;s as simple as that - a 10% commission.
                </li>
              </ol>
            </section>
            <section className="flex flex-col gap-3">
              <Heading level={3} hasBorder={true}>
                The Rewards:
              </Heading>
              <ul className="list-disc pl-5 flex flex-col gap-2">
                <li>
                  Example: If a friend buys 500 Vybes, you get 50 Vybes (worth
                  250 Euros) as a reward. If a friend buys 1,000 Vybes, you get
                  100 Vybes (worth 500 Euros) as a reward.
                </li>
                <li>
                  Earn Vybes: Use your Vybes to book stays, attend events, or rent
                  spaces. Each Vybe is worth 5 Euros.
                </li>
                <li>
                  Vybes are valid for three years from the date of acquisition.
                </li>
              </ul>
            </section>
            <section className="flex flex-col gap-3">
              <Heading level={3} hasBorder={true}>
                Additional Referral Offer:
              </Heading>
              <p>
                Simply by creating an account using your referral link, both you
                and the account creator get a free Vybe, which can be used for
                play/stay at MOOS.
              </p>
            </section>
            <section className="flex flex-col gap-3">
              <Heading level={3} hasBorder={true}>
                Why Act Now:
              </Heading>
              <ul className="list-disc pl-5 flex flex-col gap-2">
                <li>
                  Vybe Launch Offer: For the first 100,000 Euros in Vybe
                  purchases (20,000 Vybes), Ambassadors (you) earn 1 Vybe for
                  every 10 Vybes purchased. This is a launch offer; we
                  don&apos;t plan on providing a commission like this in the
                  future.
                </li>
                <li>
                  Support Innovation: Your referrals help support The Y Berlin
                  and MOOS in leading community-driven solutions. Your support is
                  crucial for our upcoming community tech lab.
                </li>
              </ul>
            </section>
          </div>
        ) : null}
      </div>
    </>
  );
};

ReferralsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    return {};
  } catch (err: unknown) {
    return {};
  }
};

export default ReferralsPage;
