import Image from 'next/image';

import { useConfig } from '../../hooks/useConfig';
import { Listing } from '../../types/booking';
import { __, getCurrencySymbol } from '../../utils/helpers';
import { Card, Heading } from '../ui';

const ACCOMMODATION_IMAGES = [
  'illy-camping.png',
  'illy-glamping-private.png',
  'illy-glamping-tent.png',
  'illy-van-parking-space.png',
];

interface Props {
  listings: Listing[];
}

const AccommodationOptions = ({ listings }: Props) => {
  const { PLATFORM_NAME } = useConfig();

  return (
    <div className="flex flex-col sm:flex-row gap-[2%] flex-wrap">
      {listings.map((listing, i) => {
        return (
          <Card
            key={listing.slug}
            className="mb-8 px-4 py-6 text-center items-center flex flex-col justify-netween gap-4 w-full sm:w-[49%] lg:w-[23%]"
          >
            {listing.name.toLowerCase().includes('private') && (
              <>
                <div
                  className="
                       w-full flex flex-wrap justify-center"
                >
                  <Image
                    src={`/images/accommodation/${ACCOMMODATION_IMAGES[1]}`}
                    alt={listing.name}
                    width={233}
                    height={240}
                    className="w-full mb-3 max-w-[240px]"
                  />
                  <Heading level={3} className="uppercase text-center w-full">
                    {listing.name}
                  </Heading>
                </div>
                <div className="text-sm">
                  <p className="mb-4">
                    {__('pricing_and_product_glamping_text_1')}
                  </p>
                  <p className="mb-4">
                    {__('pricing_and_product_glamping_text_2')}
                  </p>
                  <p className="mb-4 font-bold">
                    {__('pricing_and_product_glamping_text_3')}
                  </p>
                </div>
              </>
            )}
            {listing.name.toLowerCase().includes('shared') && (
              <>
                <div
                  className="
                   w-full flex flex-wrap justify-center"
                >
                  <Image
                    src={`/images/accommodation/${ACCOMMODATION_IMAGES[2]}`}
                    alt={listing.name}
                    width={233}
                    height={240}
                    className="w-full mb-3 max-w-[240px]"
                  />
                  <Heading level={3} className="uppercase text-center w-full">
                    {listing.name}
                  </Heading>
                </div>
                <div className="text-sm">
                  <p className="mb-4">
                    {__('pricing_and_product_glamping_shared_text_1')}
                  </p>
                  <p className="mb-4 font-bold">
                    {__('pricing_and_product_glamping_shared_text_2')}
                  </p>
                </div>
              </>
            )}
            {listing.name.toLowerCase().includes('camping') && (
              <>
                {' '}
                <div
                  className="
               w-full flex flex-wrap justify-center"
                >
                  <Image
                    src={`/images/accommodation/${ACCOMMODATION_IMAGES[0]}`}
                    alt={listing.name}
                    width={233}
                    height={240}
                    className="w-full mb-3 max-w-[240px]"
                  />
                  <Heading level={3} className="uppercase text-center w-full">
                    {listing.name}
                  </Heading>
                </div>
                <div className="text-sm">
                  <p className="mb-4">
                    {__('pricing_and_product_camping_text_1')}
                  </p>
                  <p className="mb-4 font-bold">
                    {__('pricing_and_product_camping_text_2')}
                  </p>
                </div>
              </>
            )}
            {listing.name.toLowerCase().includes('van') && (
              <>
                <div
                  className="
               w-full flex flex-wrap justify-center"
                >
                  <Image
                    src={`/images/accommodation/${ACCOMMODATION_IMAGES[3]}`}
                    alt={listing.name}
                    width={233}
                    height={240}
                    className="w-full mb-3 max-w-[240px]"
                  />
                  <Heading level={3} className="uppercase text-center w-full">
                    {listing.name}
                  </Heading>
                </div>
                <div className="text-sm">
                  <p className="mb-4">
                    {__('pricing_and_product_van_parking_text_1')}
                  </p>
                  <p className="mb-4 font-bold">
                    {__('pricing_and_product_van_parking_text_2')}
                  </p>
                  <p className="mb-4 font-bold">
                    {__('pricing_and_product_van_parking_text_3')}
                  </p>
                </div>
              </>
            )}

            <div>
              <Heading
                level={4}
                className="uppercase text-center font-bold mb-4 text-sm"
              >
                {__('pricing_and_product_cost_per_night')}
              </Heading>
              <div className="flex items-center">
                <div className="text-xl font-bold px-2">
                  {' '}
                  {getCurrencySymbol(listing.fiatPrice.cur)}
                  {listing.fiatPrice.val}
                </div>
                <div className="flex justify-center flex-wrap">
                  <div className="w-full flex justify-center">
                    <div className="bg-neutral w-[2px] h-10"></div>
                  </div>
                  <div className="text-sm text-disabled">OR</div>
                  <div className="w-full flex justify-center">
                    <div className="bg-neutral w-[2px] h-10"></div>
                  </div>
                </div>
                <div className="text-xl font-bold px-2 flex flex-wrap justify-center items-center">
                  <Image
                    src="/images/tdf-logo-small.png"
                    alt={PLATFORM_NAME}
                    width={25}
                    height={25}
                    className="mr-1"
                  />
                  <span>{listing.tokenPrice.val}</span>
                </div>
                <div className="flex justify-center flex-wrap">
                  <div className="w-full flex justify-center">
                    <div className="bg-neutral w-[2px] h-10"></div>
                  </div>
                  <div className="text-sm text-disabled">OR</div>
                  <div className="w-full flex justify-center">
                    <div className="bg-neutral w-[2px] h-10"></div>
                  </div>
                </div>
                <div className="text-xl font-bold px-2">
                  🥕 {listing.tokenPrice.val}
                </div>
              </div>
              <p className="text-sm font-bold uppercase my-3">
                {__('pricing_and_product_utility_fee')}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default AccommodationOptions;
