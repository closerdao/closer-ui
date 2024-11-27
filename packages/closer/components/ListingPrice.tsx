import PropTypes from 'prop-types';

import { CloserCurrencies, Price } from '../types';
import { priceFormat } from '../utils/helpers';

interface ListingPriceProps {
  rentalFiat: Price<CloserCurrencies>;
  rentalToken: Price<CloserCurrencies>;
  useTokens: boolean;
  bookingCategory: string;
}

const ListingPrice = ({
  rentalFiat,
  rentalToken,
  useTokens,
  bookingCategory,
}: ListingPriceProps) => {
  return (
    <div>
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="text-2xl leading-9">
            {['volunteer', 'residency'].includes(
              bookingCategory.toLowerCase(),
            ) ? (
              <div>{priceFormat(0)}</div>
            ) : (
              priceFormat(useTokens ? rentalToken : rentalFiat)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ListingPrice.propTypes = {
  rentalFiat: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
  rentalToken: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
  utilityFiat: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
  useTokens: PropTypes.bool,
};

export default ListingPrice;
