import { useRouter } from 'next/router';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { useTranslations } from 'next-intl';

import { CloserCurrencies, Price } from '../../types';
import HeadingRow from '../ui/HeadingRow';
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

  const buttonDisabled = false;

  if (!process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY) {
    throw new Error('NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY is not set');
  }

  const stripe = loadStripe(
    process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY,
    {
      stripeAccount: process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT,
    },
  );

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
