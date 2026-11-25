import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

const GROUP = '12.1a';

type PayInput = Parameters<typeof trpc.product.pay.mutate>[0];

type ProductPayment = {
  paymentIntent: {
    id: string;
    status: string;
    client_secret: string;
  };
};

// Legacy `POST /products/payment`: the unwrapped `results`.
export const payForProduct = async (
  input: PayInput,
): Promise<ProductPayment> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.post('/products/payment', input);
    return res.data.results;
  }
  const payment = await trpc.product.pay.mutate(input).catch(throwApiError);
  return payment as unknown as ProductPayment;
};

// Legacy `POST /products/payment/confirmation`; resolves once the server booked the payment.
export const confirmProductPayment = async (input: PayInput): Promise<void> => {
  if (!isTrpcEnabled(GROUP)) {
    await api.post('/products/payment/confirmation', input);
    return;
  }
  await trpc.product.confirmPayment.mutate(input).catch(throwApiError);
};
