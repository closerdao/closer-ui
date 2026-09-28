import { useRouter } from 'next/router';

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { useBuyTokens } from '../hooks/useBuyTokens';
import TokenSaleCheckoutPage from '../pages/token/checkout';
import api from '../utils/api.js';

jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  formatSearch: JSON.stringify,
}));
jest.mock('../contexts/auth', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));
jest.mock('../contexts/wallet', () => ({
  WalletState: jest.requireActual('react').createContext({
    isWalletReady: true,
    balanceCeurAvailable: 10000,
    balanceCeloAvailable: 10,
  }),
}));
jest.mock('../hooks/useConfig', () => ({
  useConfig: () => ({ platformName: 'Test' }),
}));
jest.mock('../hooks/useBuyTokens', () => ({ useBuyTokens: jest.fn() }));
jest.mock('../utils/metrics', () => ({ logMetric: jest.fn() }));
jest.mock('../utils/tokenPurchaseAnalytics', () => ({
  trackTokenPurchaseOnce: jest.fn(),
}));
jest.mock('../components/Wallet', () => () => null);
jest.mock('../pages/not-found', () => () => <div>Not found</div>);
jest.mock('next-intl', () => {
  const translate = (key: string) => key;
  return { useTranslations: () => translate };
});
jest.mock('../components/ui', () => ({
  Button: ({ children, onClick, isEnabled = true }: any) => (
    <button onClick={onClick} disabled={!isEnabled}>
      {children}
    </button>
  ),
  BackButton: ({ children, handleClick }: any) => (
    <button onClick={handleClick}>{children}</button>
  ),
  Heading: ({ children }: any) => <div>{children}</div>,
  ErrorMessage: ({ error }: any) => <div role="alert">{error}</div>,
  Row: () => null,
  Spinner: () => <div role="status">Loading</div>,
  ProgressBar: () => null,
}));

const TX_HASH = `0x${'a'.repeat(64)}`;
const buyTokens = jest.fn();
const approveCeur = jest.fn();
const isCeurApproved = jest.fn();
const getTotalCost = jest.fn();
const replace = jest.fn();
const push = jest.fn();
const sale = (status: string) => ({
  _id: 'sale-1',
  status,
  quantity: 3,
  product_type: 'tokens',
  paymentMethod: 'crypto',
});
const purchaseLabel = 'token_sale_checkout_button_purchase_transaction';
const approvalLabel = 'token_sale_checkout_button_approve_transaction';
const retryLabel = 'token_sale_checkout_button_retry_validation';

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE = 'true';
  jest.mocked(useRouter).mockReturnValue({
    query: { saleId: 'sale-1' },
    isReady: true,
    pathname: '/token/checkout',
    asPath: '/token/checkout?saleId=sale-1',
    replace,
    push,
  } as unknown as ReturnType<typeof useRouter>);
  // Leave navigation pending so the checkout must be safe before it unmounts.
  replace.mockImplementation(() => new Promise(() => {}));
  buyTokens.mockResolvedValue({ success: true, txHash: TX_HASH });
  approveCeur.mockResolvedValue({ success: true });
  isCeurApproved.mockResolvedValue(true);
  getTotalCost.mockResolvedValue(100);
  jest.mocked(useBuyTokens).mockReturnValue({
    buyTokens,
    approveCeur,
    isCeurApproved,
    getTotalCost,
    isPending: false,
    isConfigReady: true,
  } as unknown as ReturnType<typeof useBuyTokens>);
  jest.mocked(api.get).mockResolvedValue({
    data: { results: [sale('pending-payment')] },
  });
  jest.mocked(api.post).mockResolvedValue({ data: {} });
});

it.each(['paid', 'completed'])(
  'blocks payment actions for a funded buyer with a %s sale during redirect',
  async (status) => {
    jest.mocked(api.get).mockResolvedValue({
      data: { results: [sale(status)] },
    });

    await act(async () => {
      render(<TokenSaleCheckoutPage generalConfig={null} />);
    });

    expect(replace).toHaveBeenCalledWith('/sale/sale-1');
    for (const name of [purchaseLabel, approvalLabel, retryLabel]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
    expect(buyTokens).not.toHaveBeenCalled();
    expect(approveCeur).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
    expect(api.get).toHaveBeenCalledTimes(2);
    for (const [, options] of jest.mocked(api.get).mock.calls) {
      expect(options).toEqual(expect.objectContaining({ cache: false }));
    }
  },
);

it('keeps payment actions unavailable while sale data is loading', async () => {
  jest.mocked(api.get).mockReturnValue(new Promise(() => {}));
  render(<TokenSaleCheckoutPage generalConfig={null} />);

  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: purchaseLabel }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: approvalLabel }),
  ).not.toBeInTheDocument();
  expect(buyTokens).not.toHaveBeenCalled();
});

it('keeps payment actions unavailable when the sale is missing', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: { results: [] } });
  render(<TokenSaleCheckoutPage generalConfig={null} />);

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'sale_summary_not_found',
  );
  expect(
    screen.queryByRole('button', { name: purchaseLabel }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: approvalLabel }),
  ).not.toBeInTheDocument();
});

it('allows approval for a pending sale', async () => {
  isCeurApproved.mockResolvedValue(false);
  render(<TokenSaleCheckoutPage generalConfig={null} />);

  const button = await screen.findByRole('button', { name: approvalLabel });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);

  await waitFor(() => expect(approveCeur).toHaveBeenCalledWith(100));
  expect(
    await screen.findByRole('button', { name: purchaseLabel }),
  ).toBeEnabled();
});

it('allows purchase for a pending sale and waits for completed status', async () => {
  render(<TokenSaleCheckoutPage generalConfig={null} />);
  const button = await screen.findByRole('button', { name: purchaseLabel });
  jest
    .mocked(api.get)
    .mockResolvedValue({ data: { results: [sale('completed')] } });
  fireEvent.click(button);

  await waitFor(() => expect(push).toHaveBeenCalledWith('/sale/sale-1'));
  expect(buyTokens).toHaveBeenCalledWith('3');
  expect(api.post).toHaveBeenCalledWith('/sale/sale-1/confirm-token-sale', {
    txHash: TX_HASH,
  });
});

it('retries pending sale validation without purchasing tokens again', async () => {
  jest
    .mocked(api.post)
    .mockRejectedValueOnce(new Error('Validation unavailable'));
  render(<TokenSaleCheckoutPage generalConfig={null} />);
  fireEvent.click(await screen.findByRole('button', { name: purchaseLabel }));
  const retry = await screen.findByRole('button', { name: retryLabel });
  jest
    .mocked(api.get)
    .mockResolvedValue({ data: { results: [sale('completed')] } });
  fireEvent.click(retry);

  await waitFor(() => expect(push).toHaveBeenCalledWith('/sale/sale-1'));
  expect(buyTokens).toHaveBeenCalledTimes(1);
  expect(api.post).toHaveBeenCalledTimes(2);
  expect(api.post).toHaveBeenLastCalledWith('/sale/sale-1/confirm-token-sale', {
    txHash: TX_HASH,
  });
});

it('keeps payment actions unavailable after a successful validation retry while navigation is pending', async () => {
  push.mockImplementation(() => new Promise(() => {}));
  jest
    .mocked(api.post)
    .mockRejectedValueOnce(new Error('Validation unavailable'));
  render(<TokenSaleCheckoutPage generalConfig={null} />);
  fireEvent.click(await screen.findByRole('button', { name: purchaseLabel }));
  const retry = await screen.findByRole('button', { name: retryLabel });
  jest
    .mocked(api.get)
    .mockResolvedValue({ data: { results: [sale('completed')] } });
  fireEvent.click(retry);

  await waitFor(() => expect(push).toHaveBeenCalledWith('/sale/sale-1'));
  expect(
    screen.queryByRole('button', { name: purchaseLabel }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: retryLabel }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: approvalLabel }),
  ).not.toBeInTheDocument();
  expect(buyTokens).toHaveBeenCalledTimes(1);
  expect(api.post).toHaveBeenCalledTimes(2);
});
