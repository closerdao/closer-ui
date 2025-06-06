import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Listing } from '../types';
import { cdn } from '../utils/api';
import ListingPrice from './ListingPrice';
import Button from './ui/Button';
import Heading from './ui/Heading';

interface ListingCardProps {
  listing: Listing & { available?: boolean };
  bookListing: (listingId: string) => void;
  useTokens: boolean;
  bookingCategory: string;
  isAuthenticated: boolean;
  isVolunteerOrResidency: boolean;
  adults: number;
  durationInDays: number;
  discountRate: number;
}

const ListingCard = ({
  listing,
  bookListing,
  useTokens,
  bookingCategory,
  isAuthenticated,
  isVolunteerOrResidency,
  adults,
  durationInDays,
  discountRate,
}: ListingCardProps) => {
  const t = useTranslations();
  const router = useRouter();
  const { name, description } = listing;

  const numPrivateSpacesRequired = listing?.private
    ? Math.ceil(adults / (listing?.beds || 1))
    : 1;

  const accommodationFiatTotal = listing?.fiatPrice
    ? {
        val:
          listing.fiatPrice.val *
          (listing.private ? 1 : adults) *
          durationInDays *
          discountRate *
          numPrivateSpacesRequired,
        cur: listing.fiatPrice.cur,
      }
    : { val: 0, cur: listing.fiatPrice?.cur };

  const rentalToken = listing?.tokenPrice
    ? {
        val:
          listing.tokenPrice.val *
          (listing.private ? 1 : adults) *
          durationInDays *
          numPrivateSpacesRequired,
        cur: listing.tokenPrice.cur,
      }
    : { val: 0, cur: listing.tokenPrice?.cur };

  const [firstPHtml, setFirstPHtml] = useState('');

  useEffect(() => {
    const extractFirstParagraph = (html: string) => {
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
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
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
        {firstPHtml && (
          <li
            dangerouslySetInnerHTML={{
              __html: firstPHtml,
            }}
          />
        )}

        <li>
          {listing.private
            ? t('listing_preview_private', { var: listing.beds - 1 })
            : t('listing_preview_beds', { var: listing.beds - 1 })}
        </li>
      </ul>
      <div className="my-8">
        <ListingPrice
          rentalFiat={
            isVolunteerOrResidency
              ? { val: 0, cur: accommodationFiatTotal.cur }
              : accommodationFiatTotal
          }
          rentalToken={rentalToken}
          useTokens={useTokens}
          bookingCategory={bookingCategory}
        />
      </div>

      <Button
        onClick={handleBooking}
        variant="secondary"
        isEnabled={listing?.available !== false}
      >
        {isAuthenticated
          ? t('listing_preview_book')
          : t('listing_preview_sign_in_to_book')}
        {/* : t('listing_preview_not_available')} */}
      </Button>
    </div>
  );
};

export default ListingCard;
