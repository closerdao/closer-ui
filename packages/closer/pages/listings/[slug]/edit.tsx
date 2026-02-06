import Head from 'next/head';
import { useRouter } from 'next/router';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import EditModel, { EditModelPageLayout } from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../../models';
import { Listing } from '../../../types';
import api from '../../../utils/api';
import { getBookingTokenCurrency } from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

interface Props {
  listing: Listing;
  bookingConfig: any;
  paymentConfig: any;
  web3Config: any;
}

const EditListing = ({ listing, bookingConfig, paymentConfig, web3Config }: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const onUpdate = async (
    name: any,
    value: any,
    option: any,
    actionType: any,
  ) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
      await api.post(`/moderator/listing/${listing._id}/add`, option);
    }
  };

  if (!listing) {
    return <Heading>{t('listings_slug_edit_error')}</Heading>;
  }

  return (
    <>
      <Head>
        <title>{`${listing.name} - ${t('listings_slug_edit_title')}`}</title>
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <EditModelPageLayout
          title={`${t('listings_edit_listing')} ${listing.name}`}
          backHref={`/stay/${listing.slug}`}
          isEdit
          fullWidth
        >
          <EditModel
          id={listing._id}
          endpoint={'/listing'}
          fields={models.listing}
          currencyConfig={{
            fiatCur: paymentConfig?.utilityFiatCur ?? bookingConfig?.utilityFiatCur ?? 'EUR',
            tokenCur: getBookingTokenCurrency(web3Config, bookingConfig),
          }}
          onSave={(listing) => router.push(`/stay/${listing.slug}`)}
          onUpdate={(name, value, option, actionType) =>
            onUpdate(name, value, option, actionType)
          }
          allowDelete
          deleteButton={t('listings_delete_listing')}
          onDelete={() => router.push('/listings')}
        />
        </EditModelPageLayout>
      </AdminLayout>
    </>
  );
};

EditListing.getInitialProps = async (context: NextPageContext) => {
  const { query } = context;
  try {
    if (!query.slug) {
      throw new Error('No listing');
    }

    const [listingRes, bookingRes, paymentRes, web3Res, messages] = await Promise.all([
      api.get(`/listing/${query.slug}`).catch(() => null),
      api.get('/config/booking').catch(() => null),
      api.get('/config/payment').catch(() => null),
      api.get('/config/web3').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const listing = listingRes?.data?.results;
    const bookingConfig = bookingRes?.data?.results?.value;
    const paymentConfig = paymentRes?.data?.results?.value;
    const web3Config = web3Res?.data?.results?.value;

    return { listing, bookingConfig, paymentConfig, web3Config, messages };
  } catch (err: unknown) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: null,
      paymentConfig: null,
      web3Config: null,
    };
  }
};

export default EditListing;
