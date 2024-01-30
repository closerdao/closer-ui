import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { cdn } from '../utils/api';
import { __ } from '../utils/helpers';
import ListingPrice from './ListingPrice';
import Button from './ui/Button';
import Heading from './ui/Heading';

const ListingCard = ({
  listing,
  bookListing,
  useTokens,
  bookingType,
  isAuthenticated,
  adults,
}) => {
  const router = useRouter();
  const { name, description, rentalFiat, rentalToken, utilityFiat, available } =
    listing;
  
  const [firstPHtml, setFirstPHtml] = useState('');

  // const firstParagraphHTML = extractFirstParagraph(description);

  useEffect(() => {
    const extractFirstParagraph = (html) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      const paragraphs = div.querySelectorAll('p');
      if (paragraphs.length > 0) {
        return paragraphs[0].outerHTML;
      }
      return '';
    };
    setFirstPHtml(extractFirstParagraph(description));
  }, []);

  const handleBooking = () => {
    if (!isAuthenticated) {
      router.push(`/login?back=${router.asPath}`);
      // TODO fix back link
    }
    bookListing(listing._id);
  };

  if (!listing) return null;

  return (
    <div className="flex flex-col rounded-lg p-4 shadow-4xl md:mb-0 md:basis-full md:h-full">
      <Heading level={4} className="mb-4">
        {name}
      </Heading>
      {listing.photos && listing.photos.length > 0 && (
        <div className="relative h-48 rounded-lg my-4 overflow-hidden">
          <Image
            className="object-cover"
            priority
            src={`${cdn}${listing.photos[0]}-post-md.jpg`}
            alt={name}
            fill
            sizes="100%"
          />
        </div>
      )}
      <ul className="list-disc px-4 flex-1">
        {firstPHtml  && <li
          dangerouslySetInnerHTML={{
            __html: firstPHtml,
          }}
        /> }

        <li>
          {listing.private
            ? __('listing_preview_private', listing.beds - 1)
            : __('listing_preview_beds', listing.beds - 1)}
        </li>
      </ul>
      <div className="my-8">
        <ListingPrice
          rentalFiat={rentalFiat}
          rentalToken={rentalToken}
          utilityFiat={utilityFiat}
          useTokens={useTokens}
          bookingType={bookingType}
        />
      </div>

      {adults > listing.beds && listing.private && (
        <div className="my-6 font-bold">
          {name} {__('listing_preview_max_beds', listing.beds)}{' '}
        </div>
      )}
      <Button
        onClick={handleBooking}
        type="secondary"
        isEnabled={available !== false && !(listing.private && adults > listing.beds)}
      >
        {available !== false
          ? isAuthenticated
            ? __('listing_preview_book')
            : __('listing_preview_sign_in_to_book')
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
  adults: PropTypes.number,
};

export default ListingCard;
