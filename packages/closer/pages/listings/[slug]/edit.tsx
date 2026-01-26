import Head from 'next/head';
import { useRouter } from 'next/router';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import EditModel from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../../models';
import { Listing } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

interface Props {
  listing: Listing;
  bookingConfig: any;
}

const EditListing = ({ listing, bookingConfig }: Props) => {
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
        <Heading level={2}>
          {t('listings_edit_listing')} <i>{listing.name}</i>
        </Heading>
        <EditModel
          id={listing._id}
          endpoint={'/listing'}
          fields={models.listing}
          onSave={(listing) => router.push(`/stay/${listing.slug}`)}
          onUpdate={(name, value, option, actionType) =>
            onUpdate(name, value, option, actionType)
          }
          allowDelete
          deleteButton={t('listings_delete_listing')}
          onDelete={() => router.push('/listings')}
        />
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

    const [listingRes, bookingRes, messages] = await Promise.all([
      api.get(`/listing/${query.slug}`).catch(() => null),
      api.get('/config/booking').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const listing = listingRes?.data?.results;
    const bookingConfig = bookingRes?.data?.results?.value;

    return { listing, bookingConfig, messages };
  } catch (err: unknown) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: null,
    };
  }
};

export default EditListing;
