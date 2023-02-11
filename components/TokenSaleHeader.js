import { useRouter } from 'next/router';

import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { TOKEN_SALE_DATE } from '../config';
import { useHasMounted } from '../hooks/useHasMounted';
import Countdown from './Countdown';
import HeroImage from './HeroImage';

const TokenSaleHeader = ({ title, description, hasCountDown }) => {
  const router = useRouter();
  const saleDate = dayjs(TOKEN_SALE_DATE, 'DD/MM/YYYY');
  const componentHasMounted = useHasMounted();

  const redirectToTokenSale = () => {
    router.push('/token-sale/');
  };

  if (!TOKEN_SALE_DATE) {
    throw new Error('TOKEN_SALE_DATE is not defined, please set it in config');
  }

  if (!componentHasMounted) {
    return null;
  }

  return (
    <>
      <div className="basis-1/2">
        <h1 className="text-8xl uppercase font-black">{title}</h1>
        {hasCountDown && saleDate.isValid() && (
          <div className="mt-16">
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
  saleDate: PropTypes.object,
};

export default TokenSaleHeader;
