import { useRouter } from 'next/router';

import Countdown from '../../../components/Countdown';
import Layout from '../../../components/Layout';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import config from '../../../config';
import { useHasMounted } from '../../../hooks/useHasMounted';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

dayjs.extend(customParseFormat);

const InvitedByPage = ({ referredByUser }) => {
  const router = useRouter();
  const saleDate = dayjs(config.TOKEN_SALE_DATE, 'DD/MM/YYYY');
  const hasMounted = useHasMounted();

  const redirectToTokenSale = () => {
    router.push('/token-sale/');
  };

  if (!hasMounted) {
    return null;
  }

  return (
    <Layout>
      <div className="w-full px-20 mt-20">
        <div className="flex mb-4">
          <div className="basis-1/2">
            <h1 className="text-8xl uppercase font-black">
              {__('token_sale_invite_page_title')}
            </h1>
            {config.IS_COUNTDOWN_ON && saleDate.isValid() && (
              <div className="mt-16">
                <Countdown
                  date={saleDate.toDate()}
                  onComplete={redirectToTokenSale}
                />
              </div>
            )}
          </div>
          <div className="basis-1/2 w-[410px] h-[410px] bg-[url('/images/token_hero_placeholder.jpg')] bg-cover bg-center" />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="mt-8 text-4xl leading-snug">
            <span>{__('token_sale_invite_page_invited_by')}</span>
            <span>{' ' + referredByUser?.screenname}</span>
          </h2>
          <h3 className="mt-4 text-4xl leading-snug">
            {__('token_sale_invite_page_condition_title')}
          </h3>
          <ol className="list-decimal">
            <li className="mt-4 text-2xl leading-snug">
              {__('token_sale_invite_page_condition_1')}
            </li>
            <li className="mt-4 text-2xl leading-snug">
              {__('token_sale_invite_page_condition_2')}
            </li>
            <li className="mt-4 text-2xl leading-snug">
              {__('token_sale_invite_page_condition_3')}
            </li>
          </ol>
          <p>{__('token_sale_invite_page_process_description')}</p>
          <p>{__('token_sale_invite_page_process_price')}</p>
        </div>
      </div>
    </Layout>
  );
};

InvitedByPage.getInitialProps = async ({ query }) => {
  try {
    const res = await api.get(`/user/${query.referralId}`);

    return {
      referredByUser: res.data.results,
    };
  } catch (err) {
    console.log('Error', err.message);

    return {
      loadError: err.message,
    };
  }
};

export default InvitedByPage;
