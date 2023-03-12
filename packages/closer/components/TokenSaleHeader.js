import { useRouter } from 'next/router';

import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { useHasMounted } from '../hooks/useHasMounted';
import Countdown from './Countdown';
import HeroImage from './HeroImage';

const TokenSaleHeader = ({ title, description, saleDate }) => {
  const router = useRouter();
  const componentHasMounted = useHasMounted();

  const redirectToTokenSale = () => {
    router.push('/token-sale');
  };
  console.log('header', title, description);

  if (!componentHasMounted || !saleDate) {
    // this prevents hydration errors
    return null;
  }

  return (
    <>
      <div className="md:basis-1/2 mb-8 md:mb-0">
        <h1 className="text-5xl md:text-8xl uppercase font-black">{title}</h1>
        {saleDate.isValid() && (
          <div className="mt-8 md:mt-16">
            <Countdown
              date={saleDate.toDate()}
              onComplete={redirectToTokenSale}
            />
          </div>
        )}
        {description && (
          <p className="mt-10 text-2xl leading-8 font-bold max-w-sm">
            {description}
          </p>
        )}
      </div>
      <HeroImage saleDate={saleDate} />
    </>
  );
};

// write propTypes based on props
TokenSaleHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  hasCountDown: PropTypes.bool,
  saleDate: PropTypes.instanceOf(dayjs),
};

export default TokenSaleHeader;
