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
  isEditMode=false,
  totalFiat,
  rentalToken,
  isTotalPrice=false,
  isAccommodationPrice=false,
  price,
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
              {priceFormat({ val: rentalToken?.val, cur: 'credits' })} {' '}+{' '}
              {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
            </span>
          )}
        </>
      );

    case PaymentType.FULL_CREDITS:

      
      if(isEditMode && (isTotalPrice)){
        return (
          <span>
            isTotalPrice={isTotalPrice}
            {priceFormat({ val: rentalToken?.val, cur: 'credits' })}{' '}+{' '}
            {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
          </span>
        )
      }

      if(isEditMode && (isAccommodationPrice)){
        return (
          <span>
            isAccommodationPrice={isAccommodationPrice}
            {priceFormat({ val: rentalToken?.val, cur: 'credits' })}{' '}+{' '}
            {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
          </span>
        )
      }
      return (
        <span>
          {priceFormat({ val: rentalToken?.val, cur: 'credits' })}{' '}+{' '}
          {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
        </span>)
      

    case PaymentType.PARTIAL_TOKENS:
      return isEditMode ? (
        <span>
          {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
        </span>
      ) : (
        <span>
          {priceFormat({ val: rentalToken?.val, cur: rentalToken?.cur })} {' '}+{' '}
          {priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}
        </span>
      );
    case PaymentType.FULL_TOKENS:
      if(isEditMode && (isTotalPrice)){
        return (
          <span>
            {priceFormat({ val: rentalToken?.val, cur: rentalToken?.cur})}{' '}+{' '}
            {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}
          </span>
        )
      }

      if(isEditMode && (isAccommodationPrice)){
        return (
          <span>
            {priceFormat({ val: rentalToken?.val, cur: rentalToken?.cur })}
            {rentalFiat?.val ? <div>{' '}+{' '}{priceFormat({ val: rentalFiat?.val, cur: rentalFiat?.cur })}</div>: null}
          </span>
        )
      }
      return (
        <span>
          {priceFormat({ val: rentalToken?.val, cur: rentalToken?.cur })}{' '}
          {rentalFiat?.val ? <div>{' '}+{' '} {priceFormat({ val: totalFiat?.val, cur: totalFiat?.cur })}</div> : null}
        </span>)
      
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
