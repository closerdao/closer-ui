import { useRouter } from 'next/router';

import Countdown from '../../../components/Countdown';
import Layout from '../../../components/Layout';
import LinkText from '../../../components/LinkText';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import {
  IS_COUNTDOWN_ON,
  TELEGRAM_URL,
  TOKEN_SALE_DATE,
} from '../../../config';
import { __ } from '../../../utils/helpers';

dayjs.extend(customParseFormat);

const Invite = () => {
  const router = useRouter();
  const saleDate = dayjs(TOKEN_SALE_DATE, 'DD/MM/YYYY');

  const redirectToTokenSale = () => {
    router.push('/token-sale/');
  };

  return (
    <Layout>
      <div className="w-full px-20 mt-20">
        <div className="flex mb-4">
          <div className="basis-1/2">
            <h1 className="text-8xl uppercase font-black">
              {__('token_sale_invite_page_title')}
            </h1>
            {IS_COUNTDOWN_ON && saleDate.isValid() && (
              <div className="mt-16">
                <Countdown
                  date={saleDate.toDate()}
                  onComplete={redirectToTokenSale}
                />
              </div>
            )}
            <p className="mt-10 text-2xl leading-8 font-bold">
              <LinkText
                text={__('token_sale_invite_page_description')}
                word="Telegram"
                link={TELEGRAM_URL}
              />
            </p>
            <p className="mt-4 text-2xl leading-8 font-bold">
              {__('token_sale_invite_page_cta')}
            </p>
            <div className="mt-16 flex gap-4">
              <button className="btn w-fit uppercase">
                {__('navigation_sign_in')}
              </button>
              <button className="btn w-fit uppercase">
                {__('token_sale_invite_page_button_invite')}
              </button>
            </div>
          </div>
          <div className="basis-1/2 w-[410px] h-[410px] bg-[url('/images/token_hero_placeholder.jpg')] bg-cover bg-center"></div>
        </div>
      </div>
    </Layout>
  );
};

export default Invite;
