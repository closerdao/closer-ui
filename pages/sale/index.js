import Countdown from 'react-countdown';

import JoinList from '../../components/JoinList';
import Layout from '../../components/Layout';
import TokenSale from '../../components/TokenSale';
import TokenSaleCountdown from '../../components/TokenSaleCountdown';
import TokenSaleNavigation from '../../components/TokenSaleNavigation';

const COOUNTDOWN_TITLE = 'The first land-based DAO In Europe is here!';

const TokenSalePage = () => {
  // Renderer callback with condition
  const renderer = ({ hours, minutes, seconds, completed }) => {
    if (completed) {
      return <TokenSale />;
    }

    return (
      <Layout>
        <TokenSaleNavigation />
        <div className="max-w-6xl p-10">
          <div className="flex mb-4 items-center">
            <div className="basis-1/2">
              <h1 className="text-6xl uppercase font-black">
                {COOUNTDOWN_TITLE}
              </h1>
              <div className="my-4">
                <TokenSaleCountdown
                  hours={hours}
                  minutes={minutes}
                  seconds={seconds}
                />
              </div>
            </div>
            <div className="basis-1/2 w-[410px] h-[410px] bg-[url('/images/token_hero_placeholder.jpg')] bg-cover bg-center"></div>
          </div>
          <div className="my-4 max-w-sm">
            <JoinList />
          </div>
        </div>
      </Layout>
    );
  };

  return <Countdown date={Date.now() + 50000} renderer={renderer} />;
};

export default TokenSalePage;
