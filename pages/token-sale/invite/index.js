import Link from 'next/link';

import Layout from '../../../components/Layout';
import LinkText from '../../../components/LinkText';
import TokenSaleHeader from '../../../components/TokenSaleHeader';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { TELEGRAM_URL } from '../../../config';
import { useAuth } from '../../../contexts/auth';
import { __ } from '../../../utils/helpers';

dayjs.extend(customParseFormat);

const Invite = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <div className="font-marketing w-full px-4 pb-20 mt-6 md:px-20 md:mt-20 ">
        <div className="flex flex-col mb-4 md:flex-row">
          <TokenSaleHeader title={__('token_sale_invite_page_title')} />
        </div>
        <div className="w-full md:w-1/2">
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
          <div className="mt-8 md:mt-16 flex gap-4">
            {!isAuthenticated && (
              <Link
                href={`/login?back=${encodeURIComponent('/token-sale/invite')}`}
              >
                <button className="btn w-full md:w-fit uppercase">
                  {__('navigation_sign_in')}
                </button>
              </Link>
            )}
            <button className="btn w-full md:w-fit uppercase">
              {__('token_sale_invite_page_button_invite')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Invite;
