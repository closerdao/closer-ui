import Head from 'next/head';
import Link from 'next/link';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import process from 'process';

import StatsCard from '../../../components/Affiliate';
import AdminLayout from '../../../components/Dashboard/AdminLayout';
import AffiliateApplications from '../../../components/Dashboard/AffiliateApplications';
import Modal from '../../../components/Modal';
import { ErrorMessage, Information } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import Input from '../../../components/ui/Input';
import Spinner from '../../../components/ui/Spinner';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import PageNotAllowed from '../../../pages/401';
import { BookingConfig } from '../../../types/api';
import api from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { formatIsoFiatAmount } from '../../../utils/currencyFormat';

const AffiliateDashboardPage = () => {
  const bookingConfig = getCachedConfig('booking') as BookingConfig | null;
  const formatEurAmount = (amount: number) => formatIsoFiatAmount(amount || 0, 'EUR');
  const t = useTranslations();
  const { user } = useAuth();
  const { platform }: any = usePlatform();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [data, setData] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [affiliateToRemove, setAffiliateToRemove] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Memoized so the effect below does not re-run (and re-dispatch) on every render.
  const affiliateFilter = useMemo(
    () => ({ where: { affiliate: { $ne: null, $exists: true } } }),
    [],
  );
  const affiliatePageViewFilter = useMemo(
    () => ({ where: { event: 'affiliate-page-view' } }),
    [],
  );
  const affiliateLinkGeneratedFilter = useMemo(
    () => ({ where: { event: 'affiliate-link-generated' } }),
    [],
  );

  const affiliateCount = platform.user.findCount(affiliateFilter);
  const affiliatePageViewCount = platform.metric.findCount(affiliatePageViewFilter) || 0;
  const affiliateLinkGeneratedCount = platform.metric.findCount(affiliateLinkGeneratedFilter) || 0;

  const totalRevenue = data?.affiliateData?.reduce(
    (acc: number, curr: any) => acc + curr.totalRevenue,
    0,
  );

  const totalUnpaidBalance =
    totalRevenue -
    data?.payoutData?.reduce(
      (acc: number, curr: any) => acc + curr.totalPaid,
      0,
    );

  const closeModal = () => {
    setIsInfoModalOpened(false);
    setIsSuccess(false);
    setSelectedAffiliate(null);
  };

  const loadAffiliateData = useCallback(async () => {
    try {
      const affiliateDataRes = await api.get('/charges/affiliate');
      const { affiliateData, payoutData } = affiliateDataRes.data.results;

      setData({ affiliateData, payoutData });
    } catch (error) {
      setError(parseMessageFromError(error));
    }
  }, []);

  const recordPayout = async (payoutUserId: string) => {
    try {
      setIsSuccess(false);
      setIsLoading(true);
      await api.post('/charges/record-payout', {
        amount: Number(payoutAmount) || 0,
        userId: payoutUserId,
      });
      setIsSuccess(true);
      await loadAffiliateData();
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const loadCounts = useCallback(() => {
    platform.user.getCount(affiliateFilter);
    platform.metric.getCount(affiliatePageViewFilter);
    platform.metric.getCount(affiliateLinkGeneratedFilter);
  }, [
    platform,
    affiliateFilter,
    affiliatePageViewFilter,
    affiliateLinkGeneratedFilter,
  ]);

  const removeAffiliate = async (affiliateUserId: string) => {
    setIsRemoving(true);
    setError(null);
    try {
      await api.post('/affiliates/remove', { userId: affiliateUserId });
      setAffiliateToRemove(null);
      setExpandedId(null);
      await loadAffiliateData();
      loadCounts();
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setIsRemoving(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user, loadAffiliateData]);

  useEffect(() => {
    if (platform) {
      loadCounts();
    }
  }, [platform, loadCounts]);

  if (!user?.roles.includes('admin') && !user?.roles.includes('affiliate-manager')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('dashboard_affiliate_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <Heading level={2}>{t('dashboard_affiliate_title')}</Heading>
        </div>

        <div className="mt-6">
          <AffiliateApplications
            onReviewed={() => {
              loadAffiliateData();
              loadCounts();
            }}
          />
        </div>

        <section className="mt-6">
            {error && <ErrorMessage error={error} />}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              <StatsCard
                title={t('affiliate_dashboard_num_affiliates')}
                value={affiliateCount || 0}
              />
              <StatsCard
                title={t('affiliate_dashboard_total_revenue')}
                value={formatEurAmount(totalRevenue || 0)}
              />
              <StatsCard
                title={t('affiliate_dashboard_unpaid_balance')}
                value={formatEurAmount(totalUnpaidBalance || 0)}
              />
              <StatsCard
                title={t('affiliate_dashboard_page_views')}
                value={affiliatePageViewCount || 0}
              />
              <StatsCard
                title={t('affiliate_dashboard_links_generated')}
                value={affiliateLinkGeneratedCount || 0}
              />
            </div>
          </section>
          <section className="overflow-x-auto max-w-full">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-white">
                <tr className="border-b">
                  <th scope="col" className="px-3 py-3 font-medium">
                    {t('affiliate_dashboard_name')}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {t('affiliate_dashboard_email')}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium text-right">
                    {t('affiliate_dashboard_total_revenue')}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium text-right">
                    {t('affiliate_dashboard_unpaid_balance')}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {t('affiliate_dashboard_last_paid')}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium text-right">
                    {t('affiliate_dashboard_actions')}
                  </th>
                </tr>
              </thead>

              {data?.affiliateData?.map((affiliate: any) => {
                const affiliateUserId = affiliate?.user?._id;
                const isExpanded = expandedId === affiliateUserId;
                const rowRevenue = Number(affiliate?.totalRevenue) || 0;
                const rowPayouts =
                  data?.payoutData?.find((p: any) => {
                    return p?.user?._id === affiliateUserId;
                  });
                const rowPaid = Number(rowPayouts?.totalPaid) || 0;
                const rowUnpaid = rowRevenue - rowPaid;

                return (
                <tbody key={affiliate._id}>
                  <tr className="bg-white border-b">
                    <td className="px-3 py-2 font-medium">
                      {affiliate?.user?.screenname}
                    </td>
                    <td className="px-3 py-2">{affiliate?.user?.email}</td>
                    <td className="px-3 py-2 text-right">
                      {formatEurAmount(rowRevenue)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatEurAmount(rowUnpaid)}
                    </td>
                    <td className="px-3 py-2">
                      {rowPayouts?.payouts?.at(-1)?.created.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2 flex justify-end gap-2">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        className="flex items-center gap-1 h-[24px] px-3 rounded-full border border-accent text-accent text-xs uppercase tracking-wide"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : affiliateUserId)
                        }
                      >
                        {t('affiliate_dashboard_details')}
                        <ChevronDown
                          className={`h-3 w-3 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-white border p-3 py-5">
                          <div className="flex flex-col gap-6">
                          <div className="flex gap-10">
                            <div className="flex flex-col gap-2 w-1/2">
                              <Heading level={3} className="text-md uppercase">
                                {t('affiliate_dashboard_transactions')}
                              </Heading>
                              <div>
                                <div className="grid grid-cols-4 gap-2 border-b py-1">
                                  <p>{t('affiliate_dashboard_type')}</p>
                                  <p className="text-right">
                                    {t('affiliate_dashboard_amount')}
                                  </p>
                                  <p className="text-right">
                                    {t('affiliate_dashboard_affiliate_revenue')}
                                  </p>
                                  <p className="text-right">
                                    {t('affiliate_dashboard_date')}
                                  </p>
                                </div>
                                {affiliate.data
                                  .slice()
                                  .reverse()
                                  .map((charge: any) => (
                                    <div
                                      key={charge._id}
                                      className="grid grid-cols-4 gap-2 pt-1"
                                    >
                                      <p>
                                        {charge.type === 'booking' ? (
                                          <Link
                                            href={`/stay/${charge?.bookingId}`}
                                          >
                                            {charge.type}
                                          </Link>
                                        ) : (
                                          charge.type
                                        )}
                                      </p>
                                      <p className="text-right">
                                        {formatEurAmount(charge?.amount?.total?.val || 0)}
                                      </p>
                                      <p className="text-right">
                                        {formatEurAmount(charge?.affiliateRevenue?.val || 0)}
                                      </p>
                                      <p className="text-right">
                                        {charge?.created?.slice(0, 10)}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 w-1/2">
                              <Heading level={3} className="text-md uppercase">
                                {t('affiliate_dashboard_payouts')}
                              </Heading>
                              <div>
                                <div className="grid grid-cols-2 gap-2 border-b py-1">
                                  <p className="text-right">
                                    {t('affiliate_dashboard_amount')}
                                  </p>
                                  <p className="text-right">
                                    {t('affiliate_dashboard_date')}
                                  </p>
                                </div>
                                {rowPayouts?.payouts
                                  ?.slice()
                                  .reverse()
                                  .map((payout: any) => (
                                    <div
                                      key={payout._id}
                                      className="grid grid-cols-2 gap-2 pt-1"
                                    >
                                      <p className="text-right">
                                        {formatEurAmount(payout.amount.total.val || 0)}
                                      </p>
                                      <p className="text-right">
                                        {payout.created.slice(0, 10)}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 items-center justify-end border-t pt-4">
                            {affiliate?.user?.slug && (
                              <Link
                                className="text-accent underline text-sm"
                                href={`/members/${affiliate.user.slug}`}
                              >
                                {t('affiliate_dashboard_view_profile')}
                              </Link>
                            )}
                            <button
                              type="button"
                              className="text-accent underline text-sm"
                              onClick={() => {
                                setPayoutAmount(0);
                                setSelectedAffiliate(affiliate);
                                setIsInfoModalOpened(true);
                              }}
                            >
                              {t('affiliate_dashboard_record_payout')}
                            </button>
                            <button
                              type="button"
                              className="text-error underline text-sm"
                              onClick={() => setAffiliateToRemove(affiliate)}
                            >
                              {t('affiliate_dashboard_remove')}
                            </button>
                          </div>
                          </div>
                        </td>
                      </tr>
                    )}
                </tbody>
              );
              })}
            </table>
        </section>

        {isInfoModalOpened && selectedAffiliate && (
          <Modal closeModal={closeModal}>
            <div className="flex flex-col gap-6 py-4 text-left">
              <div>
                <Heading level={3}>
                  {selectedAffiliate?.user?.screenname}
                </Heading>
                <p>{selectedAffiliate?.user?.email}</p>
              </div>
              <Input
                type="number"
                label={t('affiliate_dashboard_payout_amount')}
                value={payoutAmount.toString()}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
              />
              <Button
                size="small"
                className="flex gap-2"
                isEnabled={!isLoading}
                onClick={() => recordPayout(selectedAffiliate?.user?._id)}
              >
                {isLoading && <Spinner />}{' '}
                {t('affiliate_dashboard_record_payout')}
              </Button>
              {isSuccess && (
                <Information>
                  {t('affiliate_dashboard_payout_success')}
                </Information>
              )}
            </div>
          </Modal>
        )}

        {affiliateToRemove && (
          <Modal closeModal={() => setAffiliateToRemove(null)}>
            <div className="flex flex-col gap-6 py-4 text-left">
              <Heading level={3}>{t('affiliate_dashboard_remove')}</Heading>
              <p>
                {t('affiliate_dashboard_remove_confirm', {
                  name:
                    affiliateToRemove?.user?.screenname ||
                    affiliateToRemove?.user?.email ||
                    '',
                })}
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  size="small"
                  variant="secondary"
                  isFullWidth={false}
                  isEnabled={!isRemoving}
                  onClick={() => setAffiliateToRemove(null)}
                >
                  {t('generic_cancel')}
                </Button>
                <Button
                  size="small"
                  isFullWidth={false}
                  isEnabled={!isRemoving}
                  isLoading={isRemoving}
                  onClick={() =>
                    removeAffiliate(affiliateToRemove?.user?._id)
                  }
                >
                  {t('affiliate_dashboard_remove')}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AdminLayout>
    </>
  );
};

export default AffiliateDashboardPage;
