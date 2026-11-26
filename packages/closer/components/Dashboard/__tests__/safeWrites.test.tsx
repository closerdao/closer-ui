import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TRPCClientError } from '@trpc/client';

import { blockchainConfig } from '../../../config_blockchain';
import api from '../../../utils/api.js';
import { isTrpcEnabled, trpc } from '../../../utils/trpc';
import BurnSweatModal from '../BurnSweatModal';
import MintSweatModal from '../MintSweatModal';
import SalesListDashboard from '../SalesListDashboard';
import TransferTdfModal from '../TransferTdfModal';

jest.mock('../../../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('../../../utils/trpc', () => ({
  ...jest.requireActual('../../../utils/trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    safe: {
      propose: { mutate: jest.fn() },
      createDistributionBatch: { mutate: jest.fn() },
      syncDistributionBatches: { mutate: jest.fn() },
    },
  },
}));
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));
jest.mock('../../../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'admin-1', roles: ['admin'] } }),
}));
jest.mock('../TokenUserSearchInput', () => ({
  __esModule: true,
  default: ({ onSelect }: { onSelect: (user: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({
          _id: 'user-1',
          screenname: 'Ada',
          hasWallet: true,
          walletAddress: '0x00000000000000000000000000000000000000Aa',
        })
      }
    >
      pick-user
    </button>
  ),
}));

const post = api.post as jest.Mock;
const get = api.get as jest.Mock;
const enabled = isTrpcEnabled as jest.Mock;
const safe = trpc.safe as unknown as Record<string, { mutate: jest.Mock }>;
const chainId = blockchainConfig.BLOCKCHAIN_NETWORK_ID;
const today = new Date().toISOString().slice(0, 10);

const PROPOSAL = {
  safeAddress: '0xSafe',
  safeTxHash: '0xhash',
  safeNonce: 7,
  safeUrl: 'https://app.safe.global/queue',
  origin: 'origin',
  alreadyExisted: false,
  submittedCount: 1,
  skipped: [],
};

// The write flag is group 13.0d; the reads these components make stay on the old API here.
const flag = (on: boolean) =>
  enabled.mockImplementation((group?: string) => on && group === '13.0d');

const trpcFailure = (message: string, debug?: Record<string, unknown>) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32600,
        data: { code: 'UNPROCESSABLE_CONTENT', httpStatus: 422, debug },
      },
    },
  });
const legacyFailure = (message: string, extra?: Record<string, unknown>) =>
  Object.assign(new Error('Request failed with status code 422'), {
    isAxiosError: true,
    response: { status: 422, data: { error: message, ...extra } },
  });

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => 'request-1' },
  });
  get.mockResolvedValue({ data: { results: [] } });
});

const amount = (value: string) =>
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value } });

const MODALS = [
  {
    name: 'BurnSweatModal',
    fill: () => {
      render(<BurnSweatModal onClose={jest.fn()} />);
      fireEvent.click(screen.getByText('pick-user'));
      amount('3');
      fireEvent.click(screen.getByRole('checkbox'));
    },
    submit: 'token_sales_dashboard_burn_sweat_submit',
    payload: {
      requestId: 'request-1',
      chainId,
      operation: 'sweatBurn',
      userId: 'user-1',
      entries: [{ amount: '3', contributionDate: today }],
    },
  },
  {
    name: 'MintSweatModal',
    fill: () => {
      render(<MintSweatModal onClose={jest.fn()} />);
      fireEvent.click(screen.getByText('pick-user'));
      amount('5');
    },
    submit: 'token_sales_dashboard_mint_sweat_submit',
    payload: {
      requestId: 'request-1',
      chainId,
      operation: 'sweatMint',
      entries: [{ userId: 'user-1', amount: '5', contributionDate: today }],
    },
  },
  {
    name: 'TransferTdfModal',
    fill: () => {
      render(<TransferTdfModal onClose={jest.fn()} />);
      fireEvent.click(screen.getByText('pick-user'));
      amount('2');
      fireEvent.click(screen.getByRole('checkbox'));
    },
    submit: 'token_sales_dashboard_transfer_tdf_submit_with_sweat',
    payload: {
      requestId: 'request-1',
      chainId,
      operation: 'tdfTransfer',
      entries: [{ userId: 'user-1', amount: '2' }],
      sweatEntries: [
        { userId: 'user-1', amount: '2', contributionDate: today },
      ],
    },
  },
];

describe.each(MODALS)('$name', ({ fill, submit, payload }) => {
  const send = () => fireEvent.click(screen.getByText(submit));

  it('flag on: safe.propose gets the whole payload', async () => {
    flag(true);
    safe.propose.mutate.mockResolvedValue(PROPOSAL);
    fill();
    send();
    await screen.findByText('token_sales_dashboard_safe_proposal_created');
    expect(safe.propose.mutate.mock.calls).toEqual([[payload]]);
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText('token_sales_dashboard_open_safe')).toHaveAttribute(
      'href',
      PROPOSAL.safeUrl,
    );
  });

  it('flag off: POST /safe/proposals unchanged', async () => {
    flag(false);
    post.mockResolvedValue({ data: { results: PROPOSAL } });
    fill();
    send();
    await screen.findByText('token_sales_dashboard_safe_proposal_created');
    expect(post.mock.calls).toEqual([['/safe/proposals', payload]]);
    expect(safe.propose.mutate).not.toHaveBeenCalled();
  });

  it('shows a tRPC failure as it showed the old one', async () => {
    const message = 'Safe transaction 1 cannot be executed: reverted';
    flag(false);
    post.mockRejectedValue(legacyFailure(message));
    fill();
    send();
    await screen.findByText(message);

    flag(true);
    safe.propose.mutate.mockRejectedValue(
      trpcFailure(message, { code: 'SAFE_TRANSACTION_SIMULATION_FAILED' }),
    );
    send();
    await waitFor(() => expect(safe.propose.mutate).toHaveBeenCalled());
    await screen.findByText(message);
  });
});

it('error details beside the message survive the tRPC shape', async () => {
  flag(true);
  safe.propose.mutate.mockRejectedValue(
    trpcFailure('Could not propose', {
      code: 'X',
      explorerUrl: 'https://explorer.example/tx/0x1',
    }),
  );
  MODALS[0].fill();
  fireEvent.click(screen.getByText(MODALS[0].submit));
  await screen.findByText('Could not propose');
  expect(
    screen.getByText('token_sales_dashboard_check_proposer_transactions'),
  ).toHaveAttribute('href', 'https://explorer.example/tx/0x1');
});

describe('SalesListDashboard', () => {
  const SALE = {
    _id: '6d2800000000000000000100',
    status: 'paid',
    product_type: 'token',
    quantity: 2,
    total_price: 500,
    createdBy: 'user-1',
    created: '2026-11-01T00:00:00.000Z',
  };
  const open = async (item: string) => {
    render(
      <SalesListDashboard
        sales={[SALE] as any}
        saleCategory="tokens"
        platformDefaultCurrency="EUR"
        statusFilter="paid"
        totalSales={1}
      />,
    );
    fireEvent.click(screen.getByText('generic_actions'));
    fireEvent.click(await screen.findByText(item));
  };
  const BATCHES = {
    batches: [{ saleCount: 1, safeUrl: 'https://app.safe.global/queue' }],
    skipped: [],
    alreadyExisted: false,
  };
  const SYNC = {
    checked: 3,
    newlyFinalized: 1,
    pending: 2,
    inProgress: 2,
    completed: 0,
    completedWithWarnings: 0,
    failed: 0,
    superseded: 0,
    needsReview: 0,
  };
  const created =
    'token_sales_dashboard_safe_batch_created_summary:{"batches":1,"sales":1}';
  const synced =
    'token_sales_dashboard_safe_sync_summary:{"checked":3,"finalized":1,"pending":2,"review":0,"warnings":0}';

  beforeEach(() => {
    window.open = jest.fn();
  });

  it('flag on: safe.createDistributionBatch gets the whole payload', async () => {
    flag(true);
    safe.createDistributionBatch.mutate.mockResolvedValue(BATCHES);
    await open('token_sales_dashboard_create_batch_safe_tx');
    await screen.findByText(created);
    expect(safe.createDistributionBatch.mutate.mock.calls).toEqual([
      [{ requestId: 'request-1', chainId }],
    ]);
    expect(post).not.toHaveBeenCalled();
  });

  it('flag off: POST /safe/token-distribution-batches unchanged', async () => {
    flag(false);
    post.mockResolvedValue({ data: { results: BATCHES } });
    await open('token_sales_dashboard_create_batch_safe_tx');
    await screen.findByText(created);
    expect(post.mock.calls).toEqual([
      ['/safe/token-distribution-batches', { requestId: 'request-1', chainId }],
    ]);
  });

  it('flag on: safe.syncDistributionBatches gets the whole payload', async () => {
    flag(true);
    safe.syncDistributionBatches.mutate.mockResolvedValue(SYNC);
    await open('token_sales_dashboard_safe_sync_now');
    await screen.findByText(synced);
    expect(safe.syncDistributionBatches.mutate.mock.calls).toEqual([
      [{ chainId }],
    ]);
    expect(post).not.toHaveBeenCalled();
  });

  it('flag off: POST /safe/token-distribution-batches/sync unchanged', async () => {
    flag(false);
    post.mockResolvedValue({ data: { results: SYNC } });
    await open('token_sales_dashboard_safe_sync_now');
    await screen.findByText(synced);
    expect(post.mock.calls).toEqual([
      ['/safe/token-distribution-batches/sync', { chainId }],
    ]);
  });

  it.each([
    ['token_sales_dashboard_create_batch_safe_tx', 'createDistributionBatch'],
    ['token_sales_dashboard_safe_sync_now', 'syncDistributionBatches'],
  ])('%s shows a tRPC failure as it showed the old one', async (item, name) => {
    const message = 'PRIVATE_KEY is not configured';
    flag(true);
    safe[name].mutate.mockRejectedValue(trpcFailure(message));
    await open(item);
    await screen.findByText(message);
  });
});
