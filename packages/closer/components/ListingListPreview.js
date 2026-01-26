import Link from 'next/link';

import { useAuth } from '../contexts/auth';
import { cdn } from '../utils/api';
import { priceFormat } from '../utils/helpers';
import Slider from './Slider';
import { useTranslations } from 'next-intl';

const ListingListPreview = ({ listing, isAdminPage, discounts }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isHourlyBooking = listing.get('priceDuration') === 'hour';

  const getWeeklyPrice = () => {
    if (!listing.get('fiatPrice') || listing.getIn(['fiatPrice', 'val']) === 0) {
      return null;
    }
    const dailyPrice = listing.getIn(['fiatPrice', 'val']);
    const weeklyDiscount = discounts?.weekly || 0;
    return dailyPrice * (1 - weeklyDiscount) * 7;
  };

  const weeklyPrice = getWeeklyPrice();

  return (
    <div className="flex flex-col bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        {listing.get('photos') && listing.get('photos').count() > 0 ? (
          <Slider
            link={`/stay/${listing.get('slug')}`}
            isListingPreview={true}
            slides={listing
              .get('photos')
              .toJS()
              .map((id) => ({
                image: `${cdn}${id}-post-md.jpg`,
              }))}
          />
        ) : (
          <Link
            href={`/stay/${listing.get('slug')}`}
            className="w-full h-full flex items-center justify-center"
          >
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </Link>
        )}
      </div>
      
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link
          href={`/stay/${listing.get('slug')}`}
          className="text-sm font-semibold text-gray-900 hover:text-accent line-clamp-1"
        >
          {listing.get('name')}
        </Link>

        {listing.get('description') && (
          <p
            className="text-xs text-gray-500 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: listing.get('description').slice(0, 80),
            }}
          />
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          {isHourlyBooking ? (
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-900">
                {priceFormat(
                  listing.getIn(['fiatHourlyPrice', 'val']),
                  listing.get(['fiatHourlyPrice', 'cur']),
                )}
              </span>
              <span className="text-gray-400"> / {t('listing_preview_hour')}</span>
            </p>
          ) : weeklyPrice ? (
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-900">
                {priceFormat(weeklyPrice, listing.get(['fiatPrice', 'cur']))}
              </span>
              <span className="text-gray-400"> / {t('listing_preview_week')}</span>
            </p>
          ) : listing.getIn(['fiatPrice', 'val']) === 0 ? (
            <span className="text-xs font-semibold text-green-600">{t('listing_free')}</span>
          ) : null}

          {user && user.roles.includes('space-host') && isAdminPage && (
            <Link
              href={`/listings/${listing.get('slug')}/edit`}
              className="text-xs text-gray-500 hover:text-accent"
            >
              {t('listing_preview_edit')}
            </Link>
          )}
        </div>

        {!isAdminPage && (
          <Link
            href={`/stay/${listing.get('slug')}`}
            className="mt-2 text-xs font-medium text-center py-1.5 text-accent border border-accent rounded hover:bg-accent hover:text-white transition-colors"
          >
            {t('listing_preview_book')}
          </Link>
        )}
      </div>
    </div>
  );
};

export default ListingListPreview;
