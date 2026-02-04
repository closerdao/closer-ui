import { CloserCurrencies, PaymentType, Price } from '../../types';
import { priceFormat } from '../../utils/helpers';

interface Props {
  paymentType: PaymentType;
  isEditMode?: boolean;
  totalFiat?: Price<CloserCurrencies> | undefined;
  rentalFiat?: Price<CloserCurrencies> | undefined;
  rentalToken?: Price<CloserCurrencies> | undefined;
  isTotalPrice?: boolean;
  isAccommodationPrice?: boolean;
  price?: Price<CloserCurrencies> | undefined;
}

const DisplayPrice = ({
  paymentType,
  rentalFiat,
  isEditMode = false,
  totalFiat,
  rentalToken,
  isTotalPrice = false,
  isAccommodationPrice = false,
}: Props) => {
  switch (paymentType) {
    case PaymentType.FULL_CREDITS:
    case PaymentType.PARTIAL_CREDITS:
      if (isEditMode && isTotalPrice) {
        return (
          <span>
            {priceFormat({ val: rentalToken?.val, cur: 'credits' })} +{' '}
            {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
          </span>
        );
      }

      if (isEditMode && isAccommodationPrice) {
        return (
          <span>
            {priceFormat({ val: rentalToken?.val, cur: 'credits' })}
            {rentalFiat?.val ? (
              <div>
                {' '}
                + {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
              </div>
            ) : null}
          </span>
        );
      }

      if (isTotalPrice && !isEditMode) {
        return (
          <span>
            {priceFormat({ val: rentalToken?.val, cur: 'credits' })} +{' '}
            {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
          </span>
        );
      }

      if (isAccommodationPrice && !isEditMode) {
        return (
          <span>
            {priceFormat({ val: rentalToken?.val, cur: 'credits' })} +{' '}
            {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
          </span>
        );
      }
      return (
        <span>
          {priceFormat({ val: rentalToken?.val, cur: 'credits' })} +{' '}
          {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
        </span>
      );

    case PaymentType.PARTIAL_TOKENS: {
      const tokenCur = rentalToken?.cur ?? CloserCurrencies.TDF;
      const tokenPrice = {
        val: rentalToken?.val,
        cur: tokenCur,
      };
      if (isEditMode && isTotalPrice) {
        return (
          <span>
            {priceFormat(tokenPrice)} +{' '}
            {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
          </span>
        );
      }

      if (isEditMode && isAccommodationPrice) {
        return (
          <span>
            {priceFormat(tokenPrice)}
            {rentalFiat?.val ? (
              <div>
                {' '}
                + {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
              </div>
            ) : null}
          </span>
        );
      }

      if (isTotalPrice && !isEditMode) {
        return (
          <span>
            {priceFormat(tokenPrice)} +{' '}
            {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
          </span>
        );
      }

      if (isAccommodationPrice && !isEditMode) {
        return (
          <span>
            {priceFormat(tokenPrice)} +{' '}
            {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
          </span>
        );
      }

      return (
        <span>
          {priceFormat(tokenPrice)} +{' '}
          {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
        </span>
      );
    }

    case PaymentType.FULL_TOKENS: {
      const tokenCur = rentalToken?.cur ?? CloserCurrencies.TDF;
      const tokenPrice = {
        val: rentalToken?.val,
        cur: tokenCur,
      };
      if (isEditMode && isTotalPrice) {
        return (
          <span>
            {priceFormat(tokenPrice)} +{' '}
            {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
          </span>
        );
      }

      if (isEditMode && isAccommodationPrice) {
        return (
          <span>
            {priceFormat(tokenPrice)}{' '}
            + {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
          </span>
        );
      }
      if (isAccommodationPrice && !isEditMode) {
        return (
          <span>
            {priceFormat(tokenPrice)}{' '}
            + {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
          </span>
        );
      }
      return (
        <span>
          {priceFormat(tokenPrice)}{' '}
          + {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
        </span>
      );
    }

    case PaymentType.FIAT:
      return isEditMode && isTotalPrice ? (
        <span>{priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}</span>
      ) : (
        <span>
          {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
        </span>
      );
    default:
      return null;
  }
};

export default DisplayPrice;
