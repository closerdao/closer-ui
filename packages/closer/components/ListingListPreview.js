import Link from 'next/link';

import React from 'react';

import { useAuth } from '../contexts/auth';
import { cdn } from '../utils/api';
import { priceFormat } from '../utils/helpers';
import { __ } from '../utils/helpers';
import Slider from './Slider';

const ListingListPreview = ({ listing }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-5 justify-between">
      <div className="flex flex-col gap-5">
        {listing.get('photos') && listing.get('photos').count() > 0 && (
          <Slider
            link={`/listings/${listing.get('slug')}`}
            isListingPreview={true}
            slides={listing
              .get('photos')
              .toJS()
              .map((id) => ({
                image: `${cdn}${id}-post-md.jpg`,
              }))}
          />
        )}
        <Link
          href={`/listings/${listing.get('slug')}`}
          className="hover:text-accent uppercase font-bold block text-left"
        >
          {listing.get('name')}
        </Link>

        {listing.get('description') && (
          <p
            className="rich-text text-left"
            dangerouslySetInnerHTML={{
              __html: `${listing.get('description').slice(0, 120)} ${
                listing.get('description').length > 120 && '...'
              }`,
            }}
          />
        )}
      </div>

      <div className="flex flex-col gap-7">
        {listing.get('fiatPrice') && (
          <div>
            <p className="text-left">
              <span className="font-bold">
                {priceFormat(
                  listing.get('fiatPrice').toJS().val,
                  listing.get('fiatPrice').toJS().cur,
                )}{' '}
              </span>
              {__('listing_preview_per_daily')}
            </p>
            <p className="text-left">
              <span className="">
                {priceFormat(
                  listing.get('fiatPrice').toJS().val *
                    (1 - discounts.weekly) *
                    7,
                  listing.get('fiatPrice').toJS().cur,
                )}{' '}
              </span>
              {__('listing_preview_per_weekly')}
            </p>
            <p className="text-left">
              <span className="">
                {priceFormat(
                  listing.get('fiatPrice').toJS().val *
                    (1 - discounts.monthly) *
                    30,
                  listing.get('fiatPrice').toJS().cur,
                )}{' '}
              </span>
              {__('listing_preview_per_monthly')}
            </p>
          </div>
        )}

        <Link
          href={`/listings/${listing.get('slug')}`}
          className="rounded-full flex py-2 uppercase text-accent bg-white border-2 justify-center border-accent"
        >
          {__('listing_preview_book')}
        </Link>

        {user && user.roles.includes('space-host') && (
          <div className="card-footer">
            {(user.roles.includes('admin') ||
              user.roles.includes('space-host')) && (
              <Link
                href={`/listings/${listing.get('slug')}/edit`}
                className="btn mr-2"
              >
                {__('listing_preview_edit')}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ListingListPreview.defaultProps = {
  rate: 'dailyRate',
};

export default ListingListPreview;
