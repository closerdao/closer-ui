import { useState } from 'react';

import PropTypes from 'prop-types';

import { PriceSwitch } from './PriceSwitch';

export const ListingCard = ({ listing, bookListing }) => {
  const { name, description, fiatPrice, tokenPrice, utilityFiat } = listing;
  const CURRENCY_NAMES = {
    fiat: fiatPrice.cur,
    token: tokenPrice.cur,
  };

  const [selectedCurrency, selectCurrency] = useState(CURRENCY_NAMES.fiat);
  const selectFiat = () => selectCurrency(CURRENCY_NAMES.fiat);
  const selectToken = () => selectCurrency(CURRENCY_NAMES.token);

  const handleClick = () => {
    bookListing({
      listingId: listing._id,
      useToken: selectedCurrency === CURRENCY_NAMES.token,
    });
  };

  if (!listing) return null;

  return (
    <div className="flex flex-col rounded-lg p-4 mb-16 last:mb-0 shadow-4xl">
      <h2 className="text-2xl leading-10 font-normal mb-4">{name}</h2>
      <p>{description}</p>
      <div className="my-8">
        <PriceSwitch
          fiatPrice={fiatPrice}
          utilityFiat={utilityFiat}
          tokenPrice={tokenPrice}
          selectFiat={selectFiat}
          selectToken={selectToken}
          isFiatSelected={selectedCurrency === CURRENCY_NAMES.fiat}
        />
      </div>
      <button className="btn mt-8 uppercase" onClick={handleClick}>
        Book
      </button>
    </div>
  );
};

ListingCard.propTypes = {
  listing: {
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
    utilityPrice: PropTypes.shape({
      val: PropTypes.number,
      cur: PropTypes.string,
    }),
  },
  bookListing: PropTypes.func,
};
