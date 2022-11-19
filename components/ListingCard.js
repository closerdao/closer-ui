import PropTypes from 'prop-types';

import { PriceSelector } from './PriceSelector';

export const ListingCard = ({ listing, bookListing }) => {
  console.log(listing);
  return (
    <div className="flex flex-col rounded-lg p-4 mb-16 last:mb-0 shadow-4xl">
      <h2 className="text-2xl leading-10 font-normal mb-4">{listing.name}</h2>
      <p>{listing.description}</p>
      <div className="my-8">
        <PriceSelector
          fiatPrice={listing.fiatPrice}
          utilityFiat={listing.utilityFiat}
          tokenPrice={listing.tokenPrice}
        />
      </div>
      <button className="btn mt-8 uppercase" onClick={bookListing}>
        Book
      </button>
    </div>
  );
};

ListingCard.propTypes = {
  listing: {
    // use listing object above to list all its properties here:
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
  },
  bookListing: PropTypes.func,
};
