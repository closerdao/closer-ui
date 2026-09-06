import { useRouter } from 'next/router';

import { useMemo } from 'react';

import { Elements } from '@stripe/react-stripe-js';

import { useTranslations } from 'next-intl';

import { CloserCurrencies, Price } from '../../types';
import { PaymentConfig } from '../../types/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import {
  createStripePromise,
  isCardPaymentReady,
} from '../../utils/stripeConnect.helpers';
import HeadingRow from '../ui/HeadingRow';
import { Information } from '../ui';
import ProductCheckoutForm from './ProductCheckoutForm';

interface ProductCheckoutProps {
  productType: string;
  productId: string;
  total: Price<CloserCurrencies>;
}

const ProductCheckout = ({
  productType,
  productId,
  total,
}: ProductCheckoutProps) => {
  const t = useTranslations();

  const router = useRouter();
  const paymentConfig = getCachedConfig('payment') as PaymentConfig | null;
  const cardPaymentReady = isCardPaymentReady(paymentConfig);
  const stripe = useMemo(
    () => createStripePromise(paymentConfig),
    [paymentConfig],
  );

  const buttonDisabled = false;

  if (!process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY) {
    throw new Error('NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY is not set');
  }

  if (!cardPaymentReady) {
    return (
      <div>
        <HeadingRow>
          <span className="mr-2">💲</span>
          <span>{t('bookings_checkout_step_payment_title')}</span>
        </HeadingRow>
        <Information>{t('stay_create_card_unavailable')}</Information>
      </div>
    );
  }

  const onSuccess = () => {
    router.push(`/learn/${productId}/confirmation`);
  };

  return (
    <div>
      <HeadingRow>
        <span className="mr-2">💲</span>
        <span>{t('bookings_checkout_step_payment_title')}</span>
      </HeadingRow>

      <Elements stripe={stripe}>
        <ProductCheckoutForm
          productType={productType}
          productId={productId}
          onSuccess={onSuccess}
          cardElementClassName="w-full h-14 rounded-2xl bg-background border border-neutral-200 px-4 py-4"
          buttonDisabled={buttonDisabled}
          total={total}
        />
      </Elements>
    </div>
  );
};

export default ProductCheckout;
