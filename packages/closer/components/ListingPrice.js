import PropTypes from 'prop-types';

import { priceFormat } from '../utils/helpers';

const ListingPrice = ({
  rentalFiat,
  rentalToken,
  utilityFiat,
  useTokens,
  bookingType,
}) => {
  return (
    <div>
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="text-2xl leading-9">
            {bookingType === 'volunteer' ? (
              <div>{priceFormat(0)}</div>
            ) : (
              priceFormat(useTokens ? rentalToken : rentalFiat)
            )}
          </div>
          {/* <p>{t('bookings_price_switch_accomodation')}</p> */}
        </div>
        {/* <div className="flex-1 flex justify-center">
          <PlusIcon width={16} height={16} />
        </div>
        <div className="flex flex-col items-center">
          <p className="text-2xl leading-9">{priceFormat(utilityFiat)}</p>
          <p>{t('bookings_price_switch_utility')}</p>
        </div> */}
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
