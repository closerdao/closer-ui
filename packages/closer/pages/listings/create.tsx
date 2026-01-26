import Head from 'next/head';
import { useRouter } from 'next/router';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import EditModel from '../../components/EditModel';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import api from '../../utils/api';
import { loadLocaleData } from '../../utils/locale.helpers';

interface Props {
  bookingConfig: any;
}

const CreateListing = ({ bookingConfig }: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  return (
    <>
      <Head>
        <title>{t('listings_create_title')}</title>
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <Heading level={2}>{t('listings_create_title')}</Heading>
        <EditModel
          endpoint={'/listing'}
          fields={models.listing}
          onSave={(listing) => router.push(`/stay/${listing.slug}`)}
        />
      </AdminLayout>
    </>
  );
};

CreateListing.getInitialProps = async (context: NextPageContext) => {
  try {
    const [bookingRes, messages] = await Promise.all([
      api.get('/config/booking').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const bookingConfig = bookingRes?.data?.results?.value;
    return {
      bookingConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      bookingConfig: null,
      messages: null,
    };
  }
};

export default CreateListing;
