import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TRPCClientError } from '@trpc/client';

import api from '../../utils/api.js';
import { isTrpcEnabled, trpc } from '../../utils/trpc';
import CreditsCheckoutForm from './index';

const createPaymentMethod = jest.fn();
const confirmCardPayment = jest.fn();

jest.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => ({ createPaymentMethod, confirmCardPayment }),
  useElements: () => ({ getElement: () => ({}) }),
  CardElement: ({ onChange }: { onChange: (event: unknown) => void }) => (
    <button type="button" onClick={() => onChange({ complete: true })}>
      card
    </button>
  ),
}));
jest.mock('../WalletPayButton', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('../../utils/trpc', () => ({
  ...jest.requireActual('../../utils/trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    credit: {
      pay: { mutate: jest.fn() },
      confirmPayment: { mutate: jest.fn() },
    },
  },
}));
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const post = api.post as jest.Mock;
const enabled = isTrpcEnabled as jest.Mock;
const pay = trpc.credit.pay.mutate as unknown as jest.Mock;
const confirm = trpc.credit.confirmPayment.mutate as unknown as jest.Mock;
const onSuccess = jest.fn();

const flag = (on: boolean) =>
  enabled.mockImplementation((group?: string) => on && group === '13.0c');

const PAY = {
  creditsAmount: 30,
  email: 'member@example.com',
  paymentMethod: 'pm_1',
  currency: 'EUR',
};
const CONFIRM = { paymentMethod: 'pm_1', paymentId: 'pi_1' };
const intent = (status: string) => ({
  paymentIntent: { id: 'pi_1', status, client_secret: 'pi_1_secret' },
  stripeAccountId: 'acct_1',
});

const trpcFailure = (message: string, code: string, httpStatus: number) =>
  new TRPCClientError(message, {
    result: {
      error: { message, code: -32600, data: { code, httpStatus } },
    },
  });
const legacyFailure = (status: number, data: unknown) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data },
  });

const submit = async () => {
  render(
    <CreditsCheckoutForm
      userEmail="member@example.com"
      credits={30}
      total={900}
      onSuccess={onSuccess}
    />,
  );
  fireEvent.click(screen.getByText('card'));
  fireEvent.click(screen.getByText('checkout_pay'));
  await waitFor(() => expect(createPaymentMethod).toHaveBeenCalled());
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  createPaymentMethod.mockResolvedValue({ paymentMethod: { id: 'pm_1' } });
});

describe('flag on', () => {
  beforeEach(() => flag(true));

  it('credit.pay then credit.confirmPayment get the whole payloads', async () => {
    pay.mockResolvedValue(intent('succeeded'));
    confirm.mockResolvedValue({ result: 'ok' });
    await submit();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(pay.mock.calls).toEqual([[PAY]]);
    expect(confirm.mock.calls).toEqual([[CONFIRM]]);
    expect(post).not.toHaveBeenCalled();
  });

  it('confirms with the backend after a 3D Secure challenge', async () => {
    pay.mockResolvedValue(intent('requires_action'));
    confirmCardPayment.mockResolvedValue({
      paymentIntent: { status: 'succeeded' },
    });
    confirm.mockResolvedValue({ result: 'ok' });
    await submit();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(confirmCardPayment).toHaveBeenCalledWith('pi_1_secret');
    expect(confirm.mock.calls).toEqual([[CONFIRM]]);
  });

  it('shows a refused payment as the old API did', async () => {
    pay.mockRejectedValue(
      trpcFailure('Your card was declined.', 'BAD_REQUEST', 400),
    );
    await submit();
    await screen.findByText('Your card was declined.');
    expect(confirm).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows an already confirmed payment as the old API did', async () => {
    pay.mockResolvedValue(intent('succeeded'));
    confirm.mockRejectedValue(
      trpcFailure(
        'Credits have already been awarded',
        'INTERNAL_SERVER_ERROR',
        500,
      ),
    );
    await submit();
    await screen.findByText('Credits have already been awarded');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows an unanswered confirmation with the old 404 text', async () => {
    pay.mockResolvedValue(intent('succeeded'));
    confirm.mockRejectedValue(trpcFailure('Page not found', 'NOT_FOUND', 404));
    await submit();
    await screen.findByText('Request failed with status code 404');
  });
});

describe('flag off', () => {
  beforeEach(() => flag(false));

  it('posts to the old routes unchanged', async () => {
    post
      .mockResolvedValueOnce({ data: { results: intent('succeeded') } })
      .mockResolvedValueOnce({ status: 200, data: {} });
    await submit();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(post.mock.calls).toEqual([
      ['/credits/payment', PAY],
      ['/credits/payment/confirmation', CONFIRM],
    ]);
    expect(pay).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('shows the same texts for the same failures', async () => {
    post.mockRejectedValueOnce(
      legacyFailure(400, { error: 'Your card was declined.' }),
    );
    await submit();
    await screen.findByText('Your card was declined.');
  });

  it('shows the 404 text for an unanswered confirmation', async () => {
    post
      .mockResolvedValueOnce({ data: { results: intent('succeeded') } })
      .mockRejectedValueOnce(legacyFailure(404, 'Not Found'));
    await submit();
    await screen.findByText('Request failed with status code 404');
  });
});
