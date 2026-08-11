import React, { useEffect } from 'react';

import { useTranslations } from 'next-intl';

import ListingListPreview from '../ListingListPreview';
import { Heading } from '../ui';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { resolveBlockText } from '../../utils/blockI18n';

const LISTINGS_LIMIT = 6;

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    title?: string;
  };
}

const CustomListingsPreviews = ({ content }: Props) => {
  const t = useTranslations();
  const config = useConfig();
  const { APP_NAME } = config || {};
  const { platform }: { platform?: any } = usePlatform() as { platform?: any };
  const { user } = useAuth();

  const bookingSettings = config?.booking;
  const discounts = {
    daily: bookingSettings?.discountsDaily,
    weekly: bookingSettings?.discountsWeekly,
    monthly: bookingSettings?.discountsMonthly,
  };

  const isTeamMember = Boolean(
    user?.roles?.some((role) =>
      ['space-host', 'steward', 'land-manager', 'team'].includes(role),
    ),
  );

  const listingFilter = {
    where: {
      availableFor: {
        $in: ['guests', isTeamMember ? 'team' : null].filter(Boolean),
      },
    },
    ...(APP_NAME === 'lios' ? { sort_by: 'created' } : {}),
    limit: LISTINGS_LIMIT,
  };

  useEffect(() => {
    if (!platform?.listing) return;
    void platform.listing.get(listingFilter);
  }, [platform, isTeamMember]);

  const listings = platform?.listing?.find?.(listingFilter);
  const hasListings = listings && listings.count && listings.count() > 0;

  const title =
    content?.title?.trim()
      ? resolveBlockText(content.title, t)
      : t('stay_chose_accommodation');

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-6">
        {title ? (
          <Heading level={2} className="text-2xl font-normal text-gray-900">
            {title}
          </Heading>
        ) : null}
        {hasListings ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
            {listings.map((listing: any) => (
              <ListingListPreview
                discounts={discounts}
                isAdminPage={false}
                key={listing.get('_id')}
                listing={listing}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500">
            {t('listing_no_listings_found')}
          </p>
        )}
      </div>
    </section>
  );
};

export default CustomListingsPreviews;
