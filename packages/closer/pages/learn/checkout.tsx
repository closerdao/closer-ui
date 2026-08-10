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
import { mergePaymentValueWithBookingCurrencyFallback } from '../../utils/config.utils';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../utils/common';

interface Props {
  error?: string;
  lesson: Lesson | null;
}

const LearnCheckout = ({ error, lesson }: Props) => {
  const paymentConfig = (mergePaymentValueWithBookingCurrencyFallback(
    getCachedConfig('payment'),
    getCachedConfig('booking'),
  ) ?? null) as PaymentConfig | null;
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
  const { query } = context;
  try {
    const lessonRes = await api
      .get(`/lesson/${query.lessonId}`)
      .catch(() => null);

    const lesson = lessonRes?.data?.results;
    return {
      error: null,
      lesson,
    };
  } catch (err) {
    console.log(err);
    return {
      error: parseMessageFromError(err),
      lesson: null,
      };
  }
};

export default LearnCheckout;
