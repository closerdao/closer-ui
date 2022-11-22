import { useState } from 'react';

import PropTypes from 'prop-types';

import { __ } from '../utils/helpers';
import { ListingPrice } from './ListingPrice';

export const ListingCard = ({ listing, bookListing }) => {
  const { name, description, rentalFiat, rentalToken, utilityFiat } = listing;
  const [selectedCurrency, selectCurrency] = useState(rentalFiat.cur);

  const handleBooking = () => {
    bookListing({
      listingId: listing._id,
      listingName: name,
      useToken: selectedCurrency === 'TDF',
      rentalFiat,
      rentalToken,
      utilityFiat,
    });
  };

  if (!listing) return null;

  return (
    <div className="flex flex-col rounded-lg p-4 mb-16 last:mb-0 shadow-4xl">
      <h2 className="text-2xl leading-10 font-normal mb-4">{name}</h2>
      <p>{description}</p>
      <div className="my-8">
        <ListingPrice
          fiatPrice={rentalFiat}
          utilityFiat={utilityFiat}
          tokenPrice={rentalToken}
          selectCurrency={selectCurrency}
          selectedCurrency={selectedCurrency}
        />
      </div>
      <button className="btn mt-8 uppercase" onClick={handleBooking}>
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
