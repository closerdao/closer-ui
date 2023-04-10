import Image from 'next/image';

import PropTypes from 'prop-types';

import { cdn } from '../utils/api';
import { __ } from '../utils/helpers';
import ListingPrice from './ListingPrice';
import Button from './ui/Button';

const ListingCard = ({ listing, bookListing, useTokens }) => {
  const { name, description, rentalFiat, rentalToken, utilityFiat, available } =
    listing;

  const handleBooking = () => {
    bookListing(listing._id);
  };

  if (!listing) return null;

  return (
    <div className="flex flex-col rounded-lg p-4 shadow-4xl md:mb-0 md:basis-full md:h-full">
      <h2 className="text-2xl leading-10 font-normal">{name}</h2>
      {listing.photos && listing.photos.length > 0 && (
        <div className="relative h-48 rounded-lg my-4 overflow-hidden">
          <Image
            priority
            src={`${cdn}${listing.photos[0]}-post-md.jpg`}
            alt={name}
            fill
            sizes="100%"
          />
        </div>
      )}
      <ul className="list-disc px-4 flex-1">
        <li>{description}</li>
        <li>
          {listing.private
            ? __('listing_preview_private')
            : __('listing_preview_beds', listing.beds)}
        </li>
      </ul>
      <div className="my-8">
        <ListingPrice
          rentalFiat={rentalFiat}
          rentalToken={rentalToken}
          utilityFiat={utilityFiat}
          useTokens={useTokens}
        />
      </div>
      <Button onClick={handleBooking} disabled={!available}>
        {available
          ? __('listing_preview_book')
          : __('listing_preview_not_available')}
      </Button>
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
  useToken: PropTypes.bool,
};

export default ListingCard;
