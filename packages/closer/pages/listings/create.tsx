import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import EditModel, { EditModelPageLayout } from '../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import config from '../../configCached';
import { getBookingTokenCurrency } from '../../utils/booking.helpers';
import { loadLocaleData } from '../../utils/locale.helpers';

interface Props {
  bookingConfig: unknown;
  paymentConfig: unknown;
  web3Config: unknown;
}

const CreateListing = ({ bookingConfig, paymentConfig, web3Config }: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const booking = bookingConfig as { utilityFiatCur?: string } | null;

  const payment = paymentConfig as {
    fiatCur?: string;
    utilityFiatCur?: string;
  } | null;

  const listingFiatCurrency =
    payment?.fiatCur ??
    payment?.utilityFiatCur ??
    booking?.utilityFiatCur ??
    'EUR';

  const showTokenRentalPrices =
    (web3Config as { enabled?: boolean } | null | undefined)?.enabled === true;

  const listingFields = useMemo(() => {
    if (showTokenRentalPrices) {
      return models.listing;
    }
    return models.listing.filter(
      (field) =>
        field.name !== 'tokenPrice' && field.name !== 'tokenHourlyPrice',
    );
  }, [showTokenRentalPrices]);

  const transformListingBeforeSave = (data: Record<string, unknown>) => ({
    ...data,
    fiatPrice:
      data.fiatPrice &&
      typeof data.fiatPrice === 'object' &&
      data.fiatPrice !== null
        ? {
            ...(data.fiatPrice as object),
            cur: listingFiatCurrency,
          }
        : data.fiatPrice,
    fiatHourlyPrice:
      data.fiatHourlyPrice &&
      typeof data.fiatHourlyPrice === 'object' &&
      data.fiatHourlyPrice !== null
        ? {
            ...(data.fiatHourlyPrice as object),
            cur: listingFiatCurrency,
          }
        : data.fiatHourlyPrice,
  });

  return (
    <>
      <Head>
        <title>{t('listings_create_title')}</title>
      </Head>
      <AdminLayout>
        <EditModelPageLayout
          title={t('listings_create_title')}
          subtitle={t('edit_model_create_intro')}
        >
          <EditModel
            endpoint={'/listing'}
            fields={listingFields}
            transformDataBeforeSave={transformListingBeforeSave}
            currencyConfig={{
              fiatCur: listingFiatCurrency,
              tokenCur: getBookingTokenCurrency(
                web3Config as { bookingToken?: string } | null | undefined,
                bookingConfig as { utilityTokenCur?: string } | null | undefined,
              ),
            }}
            onSave={(listing) =>
              router.push(`/stay/create?listingId=${listing._id}`)
            }
          />
        </EditModelPageLayout>
      </AdminLayout>
    </>
  );
};

CreateListing.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    const bookingConfig = config.booking;
    const paymentConfig = config.payment;
    const web3Config = config.web3;
    return {
      bookingConfig,
      paymentConfig,
      web3Config,
      messages,
    };
  } catch {
    return {
      bookingConfig: null,
      paymentConfig: null,
      web3Config: null,
      messages: null,
    };
  }
};

export default CreateListing;
