import Image from 'next/image';

import { useState } from 'react';

import PropTypes from 'prop-types';

import { cdn } from '../utils/api';
import { __ } from '../utils/helpers';
import { ListingPrice } from './ListingPrice';

export const ListingCard = ({ listing, bookListing }) => {
  const {
    name,
    description,
    rentalFiat,
    rentalToken,
    utilityFiat,
    dailyRentalToken,
  } = listing;
  const [selectedCurrency, selectCurrency] = useState(rentalFiat.cur);

  const handleBooking = () => {
    bookListing({
      listingId: listing._id,
      listingName: name,
      useToken: selectedCurrency === 'TDF',
      rentalFiat,
      rentalToken,
      utilityFiat,
      dailyRentalToken,
    });
  };

  if (!listing) return null;

  return (
    <div className="flex flex-col rounded-lg p-4 mb-16 last:mb-0 shadow-4xl">
      <h2 className="text-2xl leading-10 font-normal">{name}</h2>
      {listing.photos && (
        <div className="relative h-48 rounded-lg my-4 overflow-hidden">
          <Image
            src={`${cdn}${listing.photos[0]}-post-md.jpg`}
            alt={name}
            layout="fill"
          />
        </div>
      )}
      <ul className="list-disc px-4">
        <li>{description}</li>
        <li>
          {listing.private
            ? __('listing_preview_private')
            : __('listing_preview_beds', listing.beds)}
        </li>
      </ul>
      <div className="my-8">
        <ListingPrice
          fiatPrice={rentalFiat}
          utilityFiat={utilityFiat}
          tokenPrice={rentalToken}
          selectCurrency={selectCurrency}
          selectedCurrency={selectedCurrency}
        />
      </div>
      <button className="btn uppercase" onClick={handleBooking}>
        {/* TO DO: check when it should be disabled */}
        {__('listing_preview_book')}
      </button>
    </div>
  );
};

ListingCard.propTypes = {
  listing: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    fiatPrice: PropTypes.shape({
      val: PropTypes.number,
      cur: PropTypes.string,
    }),
    tokenPrice: PropTypes.shape({
      val: PropTypes.number,
      cur: PropTypes.string,
    }),
    rentalFiat: PropTypes.shape({
      val: PropTypes.number,
      cur: PropTypes.string,
    }),
    rentalToken: PropTypes.shape({
      val: PropTypes.number,
      cur: PropTypes.string,
    }),
    utilityPrice: PropTypes.shape({
      val: PropTypes.number,
      cur: PropTypes.string,
    }),
  }),
  bookListing: PropTypes.func,
};
