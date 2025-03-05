import { useRouter } from 'next/router';

import BookingBackButton from '../../components/BookingBackButton';
import CheckoutTotal from '../../components/CheckoutTotal';
import PageError from '../../components/PageError';
import ProductCheckout from '../../components/ProductCheckout';
import Heading from '../../components/ui/Heading';
import ProgressBar from '../../components/ui/ProgressBar';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../401';
import { PRODUCT_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { CloserCurrencies, PaymentConfig } from '../../types';
import { Lesson } from '../../types/lesson';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';

interface Props {
  error?: string;
  lesson: Lesson | null;
  paymentConfig: PaymentConfig | null;
}

const LearnCheckout = ({ error, lesson, paymentConfig }: Props) => {
  const t = useTranslations();


  const { isAuthenticated } = useAuth();

  const vatRateFromConfig = Number(paymentConfig?.vatRate);
  const defaultVatRate = Number(process.env.NEXT_PUBLIC_VAT_RATE) || 0;
  const vatRate = vatRateFromConfig || defaultVatRate;

  const router = useRouter();

  const goBack = () => {
    router.push(`/learn/${lesson?._id}`);
  };

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton onClick={goBack} name={t('buttons_back')} />
        <Heading level={1} className="pb-4 mt-8">
          <span className="mr-1">💰</span>
          <span>{t('bookings_checkout_step_title')}</span>
        </Heading>
        <ProgressBar steps={PRODUCT_SALE_STEPS} />

        <div className="mt-16 flex flex-col gap-16">
          <CheckoutTotal
            productName={lesson?.title}
            total={lesson?.price}
            useTokens={false}
            useCredits={false}
            rentalToken={{ val: 0, cur: CloserCurrencies.EUR }}
            vatRate={vatRate}
            priceInCredits={0}
          />

          <ProductCheckout
            total={lesson?.price || { val: 0, cur: CloserCurrencies.EUR }}
            productType="lesson"
            productId={lesson?._id || ''}
          />
        </div>
      </div>
    </>
  );
};

LearnCheckout.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  try {
    const [lessonRes, paymentConfigRes, messages] = await Promise.all([
      api.get(`/lesson/${query.lessonId}`).catch(() => {
        return null;
      }),
      api.get('/config/payment').catch(() => {
        return null;
      }),

      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const lesson = lessonRes?.data?.results;
    const paymentConfig = paymentConfigRes?.data?.results?.value;
    return {
      error: null,
      paymentConfig,
      messages,
      lesson,
    };
  } catch (err) {
    console.log(err);
    return {
      error: parseMessageFromError(err),
      paymentConfig: null,
      lesson: null,
      messages: null,
    };
  }
};

export default LearnCheckout;
