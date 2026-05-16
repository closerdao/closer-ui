import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import EditModel, { EditModelPageLayout } from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';
import Spinner from '../../../components/ui/Spinner';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../../models';
import { Listing } from '../../../types';
import config from '../../../configCached';
import api from '../../../utils/api';
import { usePlatform } from '../../../contexts/platform';
import { getBookingTokenCurrency } from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';

interface Props {
  bookingConfig: any;
  paymentConfig: any;
  web3Config: any;
}

const EditListing = ({ bookingConfig, paymentConfig, web3Config }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { platform }: any = usePlatform();

  const slugParam = router.query.slug;
  const slug =
    typeof slugParam === 'string' ? slugParam : slugParam?.[0] ?? undefined;

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
      try {
        const action = await platform.listing.getOne(slug, { force: true });
        if (cancelled) return;
        const payload = action?.results;
        if (!payload) {
          setListing(null);
          setListError(t('listings_slug_edit_error'));
          return;
        }
        const js = (
          typeof payload.toJS === 'function'
            ? payload.toJS()
            : payload
        ) as Listing | undefined;
        if (!js?._id) {
          setListing(null);
          setListError(t('listings_slug_edit_error'));
        } else {
          setListing(js);
          setListError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setListing(null);
          setListError(parseMessageFromError(err));
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- platform from closure; slug drives reload
  }, [router.isReady, slug]);

  const onUpdate = async (
    name: any,
    value: any,
    option: any,
    actionType: any,
  ) => {
    if (
      actionType === 'ADD' &&
      name === 'visibleBy' &&
      option._id &&
      listing?._id
    ) {
      await api.post(`/moderator/listing/${listing._id}/add`, option);
    }
  };

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
            onSave={(saved) =>
              router.push(`/stay/create?listingId=${saved._id}`)
            }
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
  try {
    return {
      bookingConfig: config.booking,
      paymentConfig: config.payment,
      web3Config: config.web3,
    };
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
