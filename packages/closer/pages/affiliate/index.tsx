import Head from 'next/head';

import { useEffect, useMemo, useState } from 'react';

import Select from '../../components/ui/Select/Dropdown';
import { StatsCard } from './components/Affiliate';
import { Card, Heading } from 'closer/components/ui';

import { FaCalendarAlt } from '@react-icons/all-files/fa/FaCalendarAlt';
import { FaCoins } from '@react-icons/all-files/fa/FaCoins';
import { FaEuroSign } from '@react-icons/all-files/fa/FaEuroSign';
import { FaUsers } from '@react-icons/all-files/fa/FaUsers';
import { AffiliateConfig, api, usePlatform } from 'closer';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { User } from '../../contexts/auth/types';
import { DateRange } from '../../types/affiliate';
import {
  calculateAffiliateRevenue,
  getDays,
} from '../../utils/affiliate.utils';
import { loadLocaleData } from '../../utils/locale.helpers';

const DATE_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last 365 days' },
  { value: 'all', label: 'All time' },
] as const;

const AffiliateDashboard = ({
  affiliateConfig,
}: {
  affiliateConfig: AffiliateConfig;
}) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { user } = useAuth();

  const [dateRange, setDateRange] = useState<DateRange>(
    DATE_RANGES.find((range) => range.value === 'all') || DATE_RANGES[0],
  );

  const filters = useMemo(
    () => ({
      referralsFilter: {
        where: {
          referredBy: user?._id,
          ...(dateRange.value !== 'all' && {
            created: {
              $gte: new Date(
                new Date().setDate(new Date().getDate() - getDays(dateRange)),
              ),
            },
          }),
        },
      },
      referralChargesFilter: {
        where: {
          referredBy: user?._id,
          ...(dateRange.value !== 'all' && {
            date: {
              $gte: new Date(
                new Date().setDate(new Date().getDate() - getDays(dateRange)),
              ),
            },
          }),
        },
        limit: 1000,
      },
    }),
    [user?._id, dateRange],
  );

  const referralsCount = platform.user.findCount(filters.referralsFilter);
  const referrals = platform.user.find(filters.referralsFilter)?.toJS();
  const referralCharges = platform.charge
    .find(filters.referralChargesFilter)
    ?.toJS();
  const activeSubscriptionsCount = referrals?.filter(
    (user: User) =>
      user.subscription && JSON.stringify(user.subscription) !== '{}',
  ).length;

  const {
    totalRevenue,
    subscriptionsRevenue,
    staysRevenue,
    eventsRevenue,
    tokenSaleRevenue,
    financedTokenRevenue,
  } = calculateAffiliateRevenue(referralCharges, affiliateConfig);

  const loadData = async () => {
    await Promise.all([
      platform.user.getCount(filters.referralsFilter),
      platform.user.get(filters.referralsFilter),
      platform.charge.get(filters.referralChargesFilter),
    ]);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filters.referralChargesFilter]);

  return (
    <>
      <Head>
        <title>{`${t('affiliate_dashboard')}`}</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <div className="flex justify-between items-center ">
          <Heading level={1}>🤝 {t('affiliate_dashboard')}</Heading>

          <div className="flex gap-4">
            <Select
              id="dateRangeOptions"
              value={dateRange.value}
              options={DATE_RANGES.map((range) => ({
                value: range.value,
                label: range.label,
              }))}
              className="rounded-full border-black w-[170px] text-sm py-0.5"
              onChange={(value) => {
                const newRange = DATE_RANGES.find((r) => r.value === value);
                if (newRange) setDateRange(newRange);
              }}
              isRequired
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatsCard
            title={t('stats_total_earnings')}
            value={`€${totalRevenue}`}
            icon={<FaEuroSign className="fill-accent text-2xl" />}
            subtext={t('stats_earnings_subtext')}
          />
          <StatsCard
            title={t('stats_total_referrals')}
            value={referralsCount}
            icon={<FaUsers className="fill-accent text-2xl" />}
            subtext={t('stats_referrals_subtext')}
          />
          <StatsCard
            title={t('stats_active_subscriptions')}
            value={activeSubscriptionsCount?.toString()}
            icon={<FaCalendarAlt className="fill-accent text-2xl" />}
            subtext={t('stats_subscriptions_subtext')}
          />
          <StatsCard
            title={t('stats_token_sales')}
            value={`€${tokenSaleRevenue}`}
            icon={<FaCoins className="fill-accent text-2xl" />}
            subtext={t('stats_tokens_subtext')}
          />
        </div>

        <Card>
          <Heading level={2} className="text-lg font-normal">
            {t('earnings_breakdown')}
          </Heading>
          <div>
            <p className="font-bold">
              {t('earnings_breakdown_stays')} (
              {affiliateConfig.staysCommissionPercent}%)
            </p>
            <p>€{staysRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-bold">
              {t('earnings_breakdown_events')} (
              {affiliateConfig.eventsCommissionPercent}%)
            </p>
            <p>€{eventsRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-bold">
              {t('earnings_breakdown_subscriptions')} (
              {affiliateConfig.subscriptionCommissionPercent}%)
            </p>
            <p>€{subscriptionsRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-bold">
              {t('earnings_breakdown_token_sales')} (
              {affiliateConfig.tokenSaleCommissionPercent}%)
            </p>
            <p>€{tokenSaleRevenue.toFixed(2)}</p>
          </div>
        </Card>
      </div>
    </>
  );
};

AffiliateDashboard.getInitialProps = async (context: NextPageContext) => {
  try {
    const [affiliateConfigRes, messages] = await Promise.all([
      api.get('/config/affiliate').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const affiliateConfig = affiliateConfigRes?.data?.results?.value;

    return {
      affiliateConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      affiliateConfig: null,
      messages: null,
    };
  }
};

export default AffiliateDashboard;
