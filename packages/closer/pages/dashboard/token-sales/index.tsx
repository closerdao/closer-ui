import Head from 'next/head';

import { useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import TokenSalesDashboard from '../../../components/Dashboard/TokenSalesDashboard';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { User } from '../../../contexts/auth/types';
import { BookingConfig, TokenSale } from '../../../types/api';
import api, { formatSearch } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

const TokenSalesDashboardPage = ({
  sales: initialSales,
  buyers: initialBuyers,
  bookingConfig,
}: {
  sales: TokenSale[] | null;
  buyers: User[] | null;
  bookingConfig: BookingConfig;
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [sales, setSales] = useState<TokenSale[] | null>(initialSales);
  const [buyers, setBuyers] = useState<User[] | null>(initialBuyers);

  const refetchSales = async () => {
    try {

      const [saleRes, buyersRes] = await Promise.all([
        api.get('/sale').catch(() => null),
        api
          .get(
            '/user?where=' +
              formatSearch({
                _id: {
                  $in: sales?.map((sale: TokenSale) => sale.createdBy) || [],
                },
              }),
          )
          .catch(() => null),
      ]);

      const newSales = saleRes?.data?.results;
      const newBuyers = buyersRes?.data?.results;

      setSales(newSales);
      setBuyers(newBuyers);
    } catch (error) {
      console.error('Error refetching sales:', error);
    }
  };

  const salesWithBuyer = sales?.map((sale: TokenSale) => {
    const buyer = buyers?.find((buyer: User) => buyer._id === sale.createdBy);

    return {
      ...sale,
      buyer: buyer
        ? {
            email: buyer.email || '',
            screenname: buyer.screenname || '',
            walletAddress: buyer.walletAddress || '',
            _id: buyer._id || '',
          }
        : null,
    };
  });

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  if (!user?.roles.includes('admin')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('token_sales_dashboard_title')}</title>
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="max-w-screen-lg flex flex-col gap-6">
          <Heading level={1}>
            {t('token_sales_dashboard_title')}
            {/* {t('dashboard_affiliate_title')} */}
          </Heading>

          <section>
            <TokenSalesDashboard
              sales={salesWithBuyer || []}
              onSuccess={refetchSales}
            />
          </section>
        </div>
      </AdminLayout>
    </>
  );
};

TokenSalesDashboardPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [saleRes, bookingConfigRes, messages] = await Promise.all([
      api.get('/sale').catch(() => {
        return null;
      }),
      api.get('/config/booking').catch(() => {
        return null;
      }),

      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const sales = saleRes?.data?.results;

    const uniqueBuyerIds = [
      ...new Set(sales?.map((sale: TokenSale) => sale.createdBy)),
    ];
    const buyersRes = await api.get(
      `/user?where=${formatSearch({ _id: { $in: uniqueBuyerIds } })}`,
    );

    const buyers = buyersRes.data.results;

    console.log('buyers=', buyers);
    const bookingConfig = bookingConfigRes?.data?.results?.value;

    return {
      sales,
      bookingConfig,
      buyers,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      sales: null,
      bookingConfig: null,
      buyers: null,
      messages: null,
    };
  }
};

export default TokenSalesDashboardPage;
