import Link from 'next/link';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { useConfig } from '../hooks/useConfig';
import TextWithLink from './TextWithLink';
import TokenSaleHeader from './TokenSaleHeader';

const TokenSaleGuestView = () => {
  const t = useTranslations();
  const { TELEGRAM_URL } = useConfig() || {};
  const saleDate = dayjs(process.env.NEXT_PUBLIC_TOKEN_SALE_DATE, 'DD/MM/YYYY');
  return (
    <>
      <div className="font-marketing w-full px-4 pb-20 mt-6">
        <div className="flex flex-col mb-4 md:flex-row">
          <TokenSaleHeader
            title={t('token_sale_invite_page_title')}
            saleDate={saleDate}
          />
        </div>
        <div className="w-full md:w-1/2">
          <p className="mt-10 text-2xl leading-8 font-bold">
            <TextWithLink
              text={t('token_sale_invite_page_description')}
              word="Telegram"
              link={TELEGRAM_URL}
            />
          </p>
          <p className="mt-4 text-2xl leading-8 font-bold">
            {t('token_sale_invite_page_cta')}
          </p>
          <div className="mt-8 md:mt-16 flex gap-4">
            <Link href="/login?back=/token" legacyBehavior>
              <button className="btn w-full md:w-fit uppercase">
                {t('navigation_sign_in')}
              </button>
            </Link>
            <Link href="/signup?back=/token" legacyBehavior>
              <button className="btn w-full md:w-fit uppercase">
                {t('navigation_register')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default TokenSaleGuestView;
