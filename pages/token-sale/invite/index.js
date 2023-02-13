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
      <div className="w-full px-20 mt-20 font-marketing">
        <div className="flex mb-4">
          <TokenSaleHeader title={__('token_sale_invite_page_title')} />
        </div>
        <div className="w-1/2">
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
            {!isAuthenticated && (
              <Link
                href={`/login?r=${encodeURIComponent('/token-sale/invite')}`}
              >
                <button className="btn w-fit uppercase">
                  {__('navigation_sign_in')}
                </button>
              </Link>
            )}
            <button className="btn w-fit uppercase">
              {__('token_sale_invite_page_button_invite')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Invite;
