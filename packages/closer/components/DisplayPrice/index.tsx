import { CloserCurrencies, PaymentType, Price } from '../../types';
import { priceFormat } from '../../utils/helpers';

interface Props {
  paymentType: PaymentType;
  isEditMode?: boolean;
  totalFiat?: Price<CloserCurrencies> | undefined;
  rentalFiat?: Price<CloserCurrencies> | undefined;
  rentalToken?: Price<CloserCurrencies> | undefined;
  isTotalPrice?: boolean;
}

const DisplayPrice = ({
  paymentType,
  rentalFiat,
  isEditMode,
  totalFiat,
    rentalToken,
  isTotalPrice,
}: Props) => {
  switch (paymentType) {
    case PaymentType.PARTIAL_CREDITS:
      return (
        <>
          {isEditMode ? (
            <span>
              {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
            </span>
          ) : (
            <span>
              {priceFormat({ val: rentalToken?.val, cur: 'credits' })} +{' '}
              {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
            </span>
          )}
        </>
      );

    case PaymentType.FULL_CREDITS:
      return isEditMode && isTotalPrice ? (
            <span>
              {priceFormat({ val: rentalToken?.val, cur: 'credits' })}
              +{' '}
              {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
            </span>
          ): (
            <span>
                  {priceFormat({ val: rentalToken?.val, cur: 'credits' })}
                  
            </span>
          )
      
    case PaymentType.PARTIAL_TOKENS:
      return isEditMode ? (
        <span>
          {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
        </span>
      ) : (
        <span>
          {priceFormat({ val: rentalToken?.val, cur: rentalToken?.cur })} +{' '}
          {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
        </span>
      );
    case PaymentType.FULL_TOKENS:
      return (
        <span>
          {priceFormat({ val: rentalToken?.val, cur: rentalToken?.cur })}
        </span>
      );
    case PaymentType.FIAT:
      return isEditMode && isTotalPrice ? (
        <span>
          {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
        </span>
      ): (
        <span>
          {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
        </span>
      )
    default:
      return null;
  }
};

export default DisplayPrice;
