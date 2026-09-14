import { screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import WalletPayButton from './index';

// One handler per mounted button — the real element registers it with Stripe,
// so the fake one hands it to the test instead.
let paymentMethodHandler: ((event: any) => void) | null = null;

const canMakePayment = jest.fn();
const update = jest.fn();

const paymentRequest = jest.fn(() => ({
  canMakePayment,
  update,
  on: (event: string, handler: (e: any) => void) => {
    if (event === 'paymentmethod') paymentMethodHandler = handler;
  },
  off: () => {
    paymentMethodHandler = null;
  },
}));

let stripe: any = { paymentRequest };

jest.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => stripe,
  PaymentRequestButtonElement: () => (
    <button type="button" data-testid="wallet-button">
      wallet
    </button>
  ),
}));

const fireWalletPayment = async () => {
  const complete = jest.fn();
  await paymentMethodHandler?.({
    paymentMethod: { id: 'pm_wallet_1' },
    complete,
  });
  return complete;
};

const renderButton = (
  props: Partial<Parameters<typeof WalletPayButton>[0]> = {},
) =>
  renderWithNextIntl(
    <WalletPayButton
      amount={12.5}
      label="Test purchase"
      onPaymentMethod={jest.fn()}
      {...props}
    />,
  );

describe('WalletPayButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    paymentMethodHandler = null;
    stripe = { paymentRequest };
    canMakePayment.mockResolvedValue({ applePay: true });
  });

  it('shows the wallet button when the browser offers Apple Pay', async () => {
    renderButton();

    expect(await screen.findByTestId('wallet-button')).toBeInTheDocument();
    expect(paymentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'eur',
        total: { label: 'Test purchase', amount: 1250 },
      }),
    );
  });

  it('stays hidden when no wallet is available', async () => {
    canMakePayment.mockResolvedValue(null);
    renderButton();

    await waitFor(() => expect(canMakePayment).toHaveBeenCalled());
    expect(screen.queryByTestId('wallet-button')).not.toBeInTheDocument();
  });

  it('stays hidden when only Link is available, which is not a wallet', async () => {
    canMakePayment.mockResolvedValue({ link: true });
    renderButton();

    await waitFor(() => expect(canMakePayment).toHaveBeenCalled());
    expect(screen.queryByTestId('wallet-button')).not.toBeInTheDocument();
  });

  it('stays hidden when there is nothing to charge', async () => {
    renderButton({ amount: 0 });

    await waitFor(() => expect(paymentRequest).not.toHaveBeenCalled());
    expect(screen.queryByTestId('wallet-button')).not.toBeInTheDocument();
  });

  it('does not break the checkout when Stripe cannot build a payment request', async () => {
    stripe = {};
    renderButton();

    await waitFor(() => expect(canMakePayment).not.toHaveBeenCalled());
    expect(screen.queryByTestId('wallet-button')).not.toBeInTheDocument();
  });

  it('hands the payment method over and closes the sheet on success', async () => {
    const onPaymentMethod = jest.fn().mockResolvedValue(undefined);
    renderButton({ onPaymentMethod });
    await screen.findByTestId('wallet-button');

    const complete = await fireWalletPayment();

    expect(onPaymentMethod).toHaveBeenCalledWith(
      'pm_wallet_1',
      expect.any(Function),
    );
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith('success');
  });

  it('closes the sheet as failed when the payment throws', async () => {
    const onError = jest.fn();
    const onPaymentMethod = jest
      .fn()
      .mockRejectedValue(new Error('card declined'));
    renderButton({ onPaymentMethod, onError });
    await screen.findByTestId('wallet-button');

    const complete = await fireWalletPayment();

    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith('fail');
    expect(onError).toHaveBeenCalledWith('card declined');
  });

  it('leaves the outcome alone once the caller has reported it', async () => {
    // A flow that needs 3DS closes the sheet itself, before the challenge —
    // completing again afterwards would throw inside Stripe.
    const onPaymentMethod = jest.fn(async (_id: string, complete: any) => {
      complete('success');
    });
    renderButton({ onPaymentMethod });
    await screen.findByTestId('wallet-button');

    const complete = await fireWalletPayment();

    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith('success');
  });

  it('refuses the payment while the button is disabled', async () => {
    const onPaymentMethod = jest.fn();
    renderButton({ onPaymentMethod, isEnabled: false });
    await screen.findByTestId('wallet-button');

    const complete = await fireWalletPayment();

    expect(onPaymentMethod).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledWith('fail');
  });

  it('pushes a changed total into the open payment request', async () => {
    const { rerender } = renderButton();
    await screen.findByTestId('wallet-button');

    rerender(
      <WalletPayButton
        amount={20}
        label="Test purchase"
        onPaymentMethod={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        total: { label: 'Test purchase', amount: 2000 },
      }),
    );
  });
});
