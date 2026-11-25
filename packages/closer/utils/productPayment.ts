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

// Legacy `POST /products/payment/confirmation`; true once the server answered 200 (tRPC mutations always do).
export const confirmProductPayment = async (
  input: PayInput,
): Promise<boolean> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.post('/products/payment/confirmation', input);
    return res.status === 200;
  }
  await trpc.product.confirmPayment.mutate(input).catch(throwApiError);
  return true;
};
