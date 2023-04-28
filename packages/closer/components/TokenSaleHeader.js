import { useRouter } from 'next/router';

import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { useHasMounted } from '../hooks/useHasMounted';
import Countdown from './Countdown';
import HeroImage from './HeroImage';
import Heading from './ui/Heading';

const TokenSaleHeader = ({ title, description, saleDate }) => {
  const router = useRouter();
  const componentHasMounted = useHasMounted();

  const redirectToTokenSale = () => {
    router.push('/token-sale');
  };

  if (!componentHasMounted || !saleDate) {
    // this prevents hydration errors
    return null;
  }

  return (
    <>
      <div className="md:basis-1/2 mb-8 md:mb-0">
        <Heading className="text-5xl md:text-8xl uppercase font-black">
          {title}
        </Heading>
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
