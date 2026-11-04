import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import EditModel, { EditModelPageLayout } from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';
import Spinner from '../../../components/ui/Spinner';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import models from '../../../models';
import { Listing } from '../../../types';
import { getBookingTokenCurrency } from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { fetchListing, listingEditModelBackend } from '../../../utils/listings';

interface Props {
  bookingConfig: any;
  paymentConfig: any;
  web3Config: any;
}

const EditListing = ({ bookingConfig, paymentConfig, web3Config }: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const slugParam = router.query.slug;
  const slug =
    typeof slugParam === 'string' ? slugParam : (slugParam?.[0] ?? undefined);

  const [listing, setListing] = useState<Listing | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  const listingFiatCurrency =
    paymentConfig?.fiatCur ??
    paymentConfig?.utilityFiatCur ??
    bookingConfig?.utilityFiatCur ??
    'EUR';

  const showTokenRentalPrices =
    web3Config != null && web3Config.enabled === true;

  const listingFields = useMemo(() => {
    if (showTokenRentalPrices) {
      return models.listing;
    }
    return models.listing.filter(
      (field) =>
        field.name !== 'tokenPrice' && field.name !== 'tokenHourlyPrice',
    );
  }, [showTokenRentalPrices]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!slug) {
      setListLoading(false);
      setListing(null);
      setListError(t('listings_slug_edit_error'));
      return;
    }

    let cancelled = false;
    setListLoading(true);
    setListError(null);

    void (async () => {
      // The store's getOne resolved undefined on any failure, so every miss shows the same error.
      const loaded = await fetchListing(slug, { cache: false }).catch(
        () => undefined,
      );
      if (cancelled) return;
      if (!loaded?._id) {
        setListing(null);
        setListError(t('listings_slug_edit_error'));
      } else {
        setListing(loaded);
        setListError(null);
      }
      setListLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- slug drives reload
  }, [router.isReady, slug]);

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

  if (!router.isReady || listLoading) {
    return (
      <AdminLayout>
        <div
          className="flex flex-col justify-center items-center py-24 gap-3"
          role="status"
          aria-live="polite"
          aria-label={t('listings_slug_edit_loading')}
        >
          <Spinner />
          <span className="sr-only">{t('listings_slug_edit_loading')}</span>
        </div>
      </AdminLayout>
    );
  }

  if (!listing || listError) {
    return (
      <AdminLayout>
        <Heading>{listError || t('listings_slug_edit_error')}</Heading>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{`${listing.name} - ${t('listings_slug_edit_title')}`}</title>
      </Head>
      <AdminLayout>
        <EditModelPageLayout
          title={`${t('listings_edit_listing')} ${listing.name}`}
          backHref="/listings"
          isEdit
          fullWidth
        >
          <EditModel
            id={listing._id}
            endpoint={'/listing'}
            fields={listingFields}
            initialData={listing}
            transformDataBeforeSave={transformListingBeforeSave}
            currencyConfig={{
              fiatCur: listingFiatCurrency,
              tokenCur: getBookingTokenCurrency(web3Config, bookingConfig),
            }}
            onSave={() => router.push('/listings')}
            allowDelete
            deleteButton={t('listings_delete_listing')}
            onDelete={() => router.push('/listings')}
            {...listingEditModelBackend()}
          />
        </EditModelPageLayout>
      </AdminLayout>
    </>
  );
};

EditListing.getInitialProps = async (context: NextPageContext) => {
  try {
    return {
      bookingConfig: config.booking,
      paymentConfig: config.payment,
      web3Config: config.web3,
    };
  } catch (err: unknown) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: config.booking,
      paymentConfig: config.payment,
      web3Config: config.web3,
    };
  }
};

export default EditListing;
