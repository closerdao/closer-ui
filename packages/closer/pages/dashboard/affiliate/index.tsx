import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import StatsCard from '../../../components/Affiliate';
import AdminLayout from '../../../components/Dashboard/AdminLayout';
import Modal from '../../../components/Modal';
import { ErrorMessage, Information } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import Input from '../../../components/ui/Input';
import Spinner from '../../../components/ui/Spinner';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import PageNotAllowed from '../../../pages/401';
import { BookingConfig } from '../../../types/api';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

const AffiliateDashboardPage = ({
  bookingConfig,
}: {
  bookingConfig: BookingConfig;
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { platform }: any = usePlatform();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [data, setData] = useState<any>(null);
  const [allAffiliateUsers, setAllAffiliateUsers] = useState<any[]>([]);
  const [payoutAmount, setPayoutAmount] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const affiliateFilter = { where: { affiliate: { $ne: null, $exists: true } } };
  const affiliateCount = platform.user.findCount(affiliateFilter);

  const affiliatePageViewFilter = { 
    where: { 
      event: 'affiliate-page-view'
    } 
  };
  const affiliateLinkGeneratedFilter = { 
    where: { 
      event: 'affiliate-link-generated'
    } 
  };

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

  const recordPayout = async (payoutUserId: string) => {
    try {
      setIsSuccess(false);
      setIsLoading(true);
      await api.post('/charges/record-payout', {
        amount: Number(payoutAmount) || 0,
        userId: payoutUserId,
      });
      setIsSuccess(true);
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && platform) {
      (async () => {
        try {
          const [affiliateDataRes, affiliateUsersRes] = await Promise.all([
            api.get('/charges/affiliate'),
            platform.user.get({ ...affiliateFilter, limit: 1000 }),
          ]);
          const { affiliateData, payoutData } = affiliateDataRes.data.results;
          
          const usersResult = affiliateUsersRes?.results;
          const users = usersResult?.toJS ? usersResult.toJS() : (usersResult || []);
          setAllAffiliateUsers(users);
          setData({ affiliateData, payoutData });
        } catch (error) {
          setError(parseMessageFromError(error));
        }
      })();
    }
  }, [user, platform]);

  useEffect(() => {
    if (platform) {
      platform.user.getCount(affiliateFilter);
      platform.metric.getCount(affiliatePageViewFilter);
      platform.metric.getCount(affiliateLinkGeneratedFilter);
    }
  }, [platform, affiliateFilter, affiliatePageViewFilter, affiliateLinkGeneratedFilter]);

  const getAllAffiliateUsersWithRevenue = () => {
    if (!allAffiliateUsers.length) return [];

    const revenueMap = new Map();
    if (data?.affiliateData) {
      data.affiliateData.forEach((affiliate: any) => {
        revenueMap.set(affiliate.user._id, affiliate);
      });
    }

    const usersWithRevenue = allAffiliateUsers
      .filter((user: any) => revenueMap.has(user._id))
      .map((user: any) => ({
        user,
        affiliateData: revenueMap.get(user._id),
        totalRevenue: revenueMap.get(user._id)?.totalRevenue || 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const usersWithoutRevenue = allAffiliateUsers
      .filter((user: any) => !revenueMap.has(user._id))
      .map((user: any) => ({
        user,
        affiliateData: null,
        totalRevenue: 0,
      }));

    return [...usersWithRevenue, ...usersWithoutRevenue];
  };

  const allAffiliatesList = getAllAffiliateUsersWithRevenue();

  if (!user?.roles.includes('admin') && !user?.roles.includes('affiliate-manager')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('dashboard_affiliate_title')}</title>
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="max-w-screen-lg flex flex-col gap-6">
          <Heading level={1}>🤝 {t('dashboard_affiliate_title')}</Heading>

          <section>
            {error && <ErrorMessage error={error} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatsCard
                title={t('affiliate_dashboard_num_affiliates')}
                value={affiliateCount || 0}
              />
              <StatsCard
                title={t('affiliate_dashboard_total_revenue')}
                value={`€${totalRevenue?.toLocaleString() || '0'} `}
              />
              <StatsCard
                title={t('affiliate_dashboard_unpaid_balance')}
                value={`€${totalUnpaidBalance?.toLocaleString() || '0'} `}
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
          <section className="overflow-scroll">
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

              {allAffiliatesList.map((item: any) => {
                const affiliate = item.affiliateData;
                const user = item.user;
                const totalRevenue = item.totalRevenue;
                const unpaidBalance = affiliate
                  ? totalRevenue -
                    (data?.payoutData?.find((p: any) => {
                      return p?.user?._id === user?._id;
                    })?.totalPaid || 0)
                  : 0;
                const lastPaid = data?.payoutData
                  ?.find((p: any) => {
                    return p?.user?._id === user?._id;
                  })
                  ?.payouts.at(-1)?.created.slice(0, 10);

                return (
                  <tbody key={user._id}>
                    <tr className="bg-white border-b">
                      <td className="px-3 py-2 font-medium">
                        {user?.screenname}
                      </td>
                      <td className="px-3 py-2">{user?.email}</td>
                      <td className="px-3 py-2 text-right">
                        €{totalRevenue.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        €{unpaidBalance.toLocaleString()}
                      </td>
                      <td className="px-3 py-2">{lastPaid || '—'}</td>
                      <td className="px-3 py-2 flex justify-end gap-2">
                        <Button
                          size="small"
                          className="flex gap-2 h-[24px] w-fit"
                          isEnabled={!isLoading}
                          onClick={() => {
                            setSelectedAffiliate({ user, affiliateData: affiliate });
                            setIsInfoModalOpened(true);
                          }}
                        >
                          {t('affiliate_dashboard_record_payout')}
                        </Button>
                        {affiliate && (
                          <Button
                            size="small"
                            className="flex gap-2 h-[24px] w-fit"
                            isEnabled={!isLoading}
                            onClick={() => {
                              setSelectedAffiliate({ user, affiliateData: affiliate });
                              setIsExpanded(true);
                            }}
                          >
                            expand
                          </Button>
                        )}
                        {isInfoModalOpened && selectedAffiliate && selectedAffiliate.user?._id === user._id && (
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
                                onChange={(e) =>
                                  setPayoutAmount(Number(e.target.value))
                                }
                              />
                              <Button
                                size="small"
                                className="flex gap-2"
                                isEnabled={!isLoading}
                                onClick={() =>
                                  recordPayout(selectedAffiliate?.user?._id)
                                }
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
                      </td>
                    </tr>
                    {isExpanded &&
                      selectedAffiliate?.user?._id === user._id &&
                      affiliate && (
                        <tr>
                          <td colSpan={6} className="bg-white border p-3 py-5">
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
                                              href={`/bookings/${charge?.bookingId}`}
                                            >
                                              {charge.type}
                                            </Link>
                                          ) : (
                                            charge.type
                                          )}
                                        </p>
                                        <p className="text-right">
                                          €
                                          {charge?.amount?.total?.val?.toLocaleString()}
                                        </p>
                                        <p className="text-right">
                                          €
                                          {charge?.affiliateRevenue?.val?.toLocaleString()}
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
                                  {data?.payoutData
                                    ?.find((p: any) => {
                                      return p?.user?._id === user?._id;
                                    })
                                    ?.payouts.slice()
                                    .reverse()
                                    .map((payout: any) => (
                                      <div
                                        key={payout._id}
                                        className="grid grid-cols-2 gap-2 pt-1"
                                      >
                                        <p className="text-right">
                                          €
                                          {payout.amount.total.val.toLocaleString()}
                                        </p>
                                        <p className="text-right">
                                          {payout.created.slice(0, 10)}
                                        </p>
                                      </div>
                                    ))}
                                </div>
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
        </div>
      </AdminLayout>
    </>
  );
};

AffiliateDashboardPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, bookingRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      api.get('/config/booking').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const generalConfig = generalRes?.data?.results?.value;
    const bookingConfig = bookingRes?.data?.results?.value;

    return {
      generalConfig,
      bookingConfig,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      generalConfig: null,
      bookingConfig: null,
      messages: null,
    };
  }
};

export default AffiliateDashboardPage;
