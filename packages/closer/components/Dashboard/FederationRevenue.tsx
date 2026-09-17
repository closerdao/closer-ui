import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { DEFAULT_CURRENCY } from '../../constants';
import api from '../../utils/api';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { parseStatResponse } from '../../utils/dashboardStats.helpers';
import {
  FederationCharge,
  FederationVillage,
  VILLAGE_PLATFORM_FEE_CHARGE_TYPE,
  buildVillageEarningsRows,
  getBilledVillageIds,
  parseFederationCharges,
  parseFederationVillages,
  sumFederationCharges,
  sumFederationRefunds,
} from '../../utils/federationRevenue.helpers';
import { getStartAndEndDate } from '../../utils/performance.utils';
import { Heading } from '../ui';

/** Nightly reports are one charge per village per day; a year of 100 villages fits. */
const CHARGE_DOWNLOAD_LIMIT = 3000;
const VILLAGE_LOOKUP_LIMIT = 200;

interface Props {
  timeFrame: string;
  fromDate: string;
  toDate: string;
}

interface HeadlineTotals {
  /** `null` until the aggregate answers, so a failure falls back to the list. */
  platformFee: number | null;
  subscriptions: number | null;
}

const emptyTotals: HeadlineTotals = {
  platformFee: null,
  subscriptions: null,
};

const SummaryCard = ({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) => (
  <div className="bg-white overflow-hidden shadow rounded-lg min-w-0">
    <div className="p-3">
      <dl>
        <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
        <dd className="text-lg font-semibold text-gray-900">
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-6 w-20 rounded" />
          ) : (
            value
          )}
        </dd>
      </dl>
    </div>
  </div>
);

/**
 * The revenue view for a federation hub: what the network paid Closer, rather
 * than what a single village took at the door. See
 * `utils/federationRevenue.helpers` for why the two categories are the only
 * two there are.
 */
const FederationRevenue = ({ timeFrame, fromDate, toDate }: Props) => {
  const t = useTranslations();

  const [platformFeeCharges, setPlatformFeeCharges] = useState<
    FederationCharge[]
  >([]);
  const [subscriptionCharges, setSubscriptionCharges] = useState<
    FederationCharge[]
  >([]);
  const [villages, setVillages] = useState<FederationVillage[]>([]);
  const [totals, setTotals] = useState<HeadlineTotals>(emptyTotals);
  const [isLoading, setIsLoading] = useState(true);
  const [sumsLoading, setSumsLoading] = useState(true);

  const loadCharges = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getStartAndEndDate(
        timeFrame,
        fromDate,
        toDate,
      );
      const date = { $gte: startDate, $lte: endDate };

      const [platformFeeRes, subscriptionRes] = await Promise.all([
        api
          .get('/charge', {
            params: {
              where: { date, type: VILLAGE_PLATFORM_FEE_CHARGE_TYPE },
              limit: CHARGE_DOWNLOAD_LIMIT,
              sort_by: '-date',
            },
          })
          .catch(() => null),
        api
          .get('/charge', {
            params: {
              where: { date, type: 'subscription' },
              limit: CHARGE_DOWNLOAD_LIMIT,
              sort_by: '-date',
            },
          })
          .catch(() => null),
      ]);

      const fees = parseFederationCharges(platformFeeRes?.data, 'platformFee');
      const subscriptions = parseFederationCharges(
        subscriptionRes?.data,
        'subscription',
      );
      setPlatformFeeCharges(fees);
      setSubscriptionCharges(subscriptions);

      // Named villages for the earnings table. Only the ones that actually
      // billed, plus the ones a subscriber founded — the hub's directory holds
      // far more villages than run on it.
      const billedIds = getBilledVillageIds(fees);
      const founderIds = [
        ...new Set(
          subscriptions
            .map((charge) => charge.createdBy)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      if (billedIds.length === 0 && founderIds.length === 0) {
        setVillages([]);
        return;
      }

      const villageRes = await api
        .get('/village', {
          params: {
            where: {
              $or: [
                { _id: { $in: billedIds } },
                { createdBy: { $in: founderIds } },
              ],
            },
            limit: VILLAGE_LOOKUP_LIMIT,
          },
        })
        .catch(() => null);

      setVillages(parseFederationVillages(villageRes?.data));
    } catch (error) {
      console.error('Error fetching federation revenue:', error);
      setPlatformFeeCharges([]);
      setSubscriptionCharges([]);
      setVillages([]);
    } finally {
      setIsLoading(false);
    }
  }, [timeFrame, fromDate, toDate]);

  /**
   * Headline figures come from the API's aggregation endpoints so they stay
   * exact past the download limit the tables below are capped at.
   */
  const loadTotals = useCallback(async () => {
    setSumsLoading(true);
    try {
      const { startDate, endDate } = getStartAndEndDate(
        timeFrame,
        fromDate,
        toDate,
      );
      // The same instant bounds the list query uses. A `YYYY-MM-DD` upper
      // bound casts to midnight on that day and silently drops it, so the
      // headline would not reconcile with the table under it.
      const earned = {
        date: { $gte: startDate, $lte: endDate },
        status: { $ne: 'refunded' },
      };

      const [platformFeeRes, subscriptionsRes] = await Promise.all([
        api
          .get('/sum/charge/amount.total.val', {
            params: {
              where: { ...earned, type: VILLAGE_PLATFORM_FEE_CHARGE_TYPE },
            },
          })
          .catch(() => null),
        api
          .get('/sum/charge/amount.total.val', {
            params: { where: { ...earned, type: 'subscription' } },
          })
          .catch(() => null),
      ]);

      setTotals({
        platformFee: platformFeeRes
          ? parseStatResponse(platformFeeRes.data)
          : null,
        subscriptions: subscriptionsRes
          ? parseStatResponse(subscriptionsRes.data)
          : null,
      });
    } catch (error) {
      console.error('Error fetching federation revenue totals:', error);
      setTotals(emptyTotals);
    } finally {
      setSumsLoading(false);
    }
  }, [timeFrame, fromDate, toDate]);

  useEffect(() => {
    if (timeFrame === 'custom' && (!fromDate || !toDate)) return;
    const timeout = setTimeout(
      () => {
        loadCharges();
        loadTotals();
      },
      timeFrame === 'custom' ? 500 : 0,
    );
    return () => clearTimeout(timeout);
  }, [timeFrame, fromDate, toDate, loadCharges, loadTotals]);

  const rows = useMemo(
    () =>
      buildVillageEarningsRows(
        platformFeeCharges,
        subscriptionCharges,
        villages,
      ),
    [platformFeeCharges, subscriptionCharges, villages],
  );

  const categories = useMemo(() => {
    const preferServer = (server: number | null, fallback: number) =>
      server != null ? server : fallback;

    return {
      subscriptions: preferServer(
        totals.subscriptions,
        sumFederationCharges(subscriptionCharges),
      ),
      platformFee: preferServer(
        totals.platformFee,
        sumFederationCharges(platformFeeCharges),
      ),
    };
  }, [totals, subscriptionCharges, platformFeeCharges]);

  const totalRevenue = categories.subscriptions + categories.platformFee;
  const refunds =
    sumFederationRefunds(subscriptionCharges) +
    sumFederationRefunds(platformFeeCharges);

  const billingVillages = rows.filter((row) => row.reports > 0).length;
  const chargesBilled = platformFeeCharges.reduce(
    (total, charge) => total + charge.chargeCount,
    0,
  );

  // Both categories can be negative (a refund-heavy month), so the bar scale is
  // taken from the magnitudes and the bar itself is anchored at the baseline.
  const maxMagnitude = Math.max(
    Math.abs(categories.subscriptions),
    Math.abs(categories.platformFee),
  );
  const getBarHeight = (amount: number) => {
    if (maxMagnitude === 0) return 5;
    return Math.max((Math.abs(amount) / maxMagnitude) * 100, 5);
  };

  const money = (amount: number) =>
    formatIsoFiatAmount(amount, DEFAULT_CURRENCY);

  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard
          label={t('dashboard_revenue_total')}
          value={money(totalRevenue)}
          loading={sumsLoading}
        />
        <SummaryCard
          label={t('dashboard_revenue_subscriptions')}
          value={money(categories.subscriptions)}
          loading={sumsLoading}
        />
        <SummaryCard
          label={t('dashboard_revenue_platform_fee')}
          value={money(categories.platformFee)}
          loading={sumsLoading}
        />
        <SummaryCard
          label={t('dashboard_revenue_billing_villages')}
          value={billingVillages.toLocaleString()}
          loading={isLoading}
        />
        <SummaryCard
          label={t('dashboard_revenue_charges_billed')}
          value={chargesBilled.toLocaleString()}
          loading={isLoading}
        />
        <SummaryCard
          label={t('dashboard_revenue_refunded')}
          value={money(refunds)}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg lg:col-span-1">
          <div className="px-4 py-5 sm:p-4 space-y-6">
            <Heading level={3}>{t('dashboard_revenue_by_category')}</Heading>
            <div className="flex items-end justify-between gap-4 h-32">
              {[
                {
                  name: t('dashboard_revenue_subscriptions'),
                  amount: categories.subscriptions,
                  bgColor: 'bg-pink-200',
                  textColor: 'text-pink-800',
                  animateColor: 'bg-pink-300',
                },
                {
                  name: t('dashboard_revenue_platform_fee'),
                  amount: categories.platformFee,
                  bgColor: 'bg-blue-200',
                  textColor: 'text-blue-800',
                  animateColor: 'bg-blue-300',
                },
              ].map((category) => (
                <div
                  key={category.name}
                  className="flex flex-col items-center justify-end flex-1 h-full"
                >
                  <div
                    className={`${category.bgColor} rounded-t-lg w-full flex flex-col items-center justify-end pb-2`}
                    style={{ height: `${getBarHeight(category.amount)}%` }}
                  >
                    <div
                      className={`text-xs font-medium ${category.textColor}`}
                    >
                      {sumsLoading ? (
                        <div
                          className={`animate-pulse ${category.animateColor} h-3 w-8 rounded`}
                        />
                      ) : (
                        formatIsoFiatAmount(category.amount, DEFAULT_CURRENCY, {
                          min: 0,
                          max: 0,
                        })
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-2 text-center truncate max-w-full">
                    {category.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:p-4 space-y-4">
            <Heading level={3}>
              {t('dashboard_revenue_earnings_per_village')}
            </Heading>

            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 rounded" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {t('dashboard_revenue_no_village_earnings')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_revenue_village')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_revenue_subscriptions')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_revenue_platform_fee')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_revenue_reports')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_revenue_charges_billed')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_revenue_refunds_netted')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_revenue_total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rows.map((row) => (
                      <tr key={row.villageId || 'unattributed'}>
                        <td className="px-2 py-2 text-sm text-gray-900">
                          {row.isUnattributed ? (
                            <span className="text-gray-500 italic">
                              {t('dashboard_revenue_unattributed')}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{row.name}</span>
                              {row.onboardingStatus && (
                                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                                  {row.onboardingStatus}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-700 text-right">
                          {money(row.subscriptions)}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-700 text-right">
                          {money(row.platformFee)}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-500 text-right">
                          {row.reports.toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-500 text-right">
                          {row.chargesBilled.toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-500 text-right">
                          {row.refunds.toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-sm font-semibold text-gray-900 text-right">
                          {money(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-xs text-gray-500">
              {t('dashboard_revenue_village_attribution_note')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FederationRevenue;
