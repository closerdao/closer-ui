import Link from 'next/link';

import { TELEGRAM_URL } from '../config';
import { __ } from '../utils/helpers';
import Layout from './Layout';
import TextWithLink from './TextWithLink';
import TokenSaleHeader from './TokenSaleHeader';

const TokenSaleGuestView = () => {
  return (
    <Layout>
      <div className="font-marketing w-full px-4 pb-20 mt-6 md:px-20 md:mt-20 ">
        <div className="flex flex-col mb-4 md:flex-row">
          <TokenSaleHeader title={__('token_sale_invite_page_title')} />
        </div>
        <div className="w-full md:w-1/2">
          <p className="mt-10 text-2xl leading-8 font-bold">
            <TextWithLink
              text={__('token_sale_invite_page_description')}
              word="Telegram"
              link={TELEGRAM_URL}
            />
          </p>
          <p className="mt-4 text-2xl leading-8 font-bold">
            {__('token_sale_invite_page_cta')}
          </p>
          <div className="mt-8 md:mt-16 flex gap-4">
            <Link href="/login?back=/token-sale" legacyBehavior>
              <button className="btn w-full md:w-fit uppercase">
                {__('navigation_sign_in')}
              </button>
            </Link>
            <Link href="/signup?back=/token-sale" legacyBehavior>
              <button className="btn w-full md:w-fit uppercase">
                {__('navigation_register')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TokenSaleGuestView;
