import React from 'react';

import SalesListDashboard from '../components/Dashboard/SalesListDashboard';

import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import type { Sale } from '../types/api';
import type { TokenDistributionStatus } from '../types/onchainAdmin';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "../../utils/api" the components import.
// Mocking the real file path gives us the instance they actually call.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  formatSearch: (where: unknown) =>
    typeof where !== 'undefined'
      ? encodeURIComponent(JSON.stringify(where))
      : '',
}));

const api = jest.requireMock('../utils/api.js').default as {
  get: jest.Mock;
  post: jest.Mock;
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const SALE_ID = '68f1a2b3c4d5e6f708192a3b';
const CHARGE_ID = '6a81ada7b43e22bc93b49d04';

const charge = {
  _id: CHARGE_ID,
  type: 'tokenSale',
  method: 'monerium',
  status: 'pending-payment',
  date: '2026-08-16T12:31:35.589Z',
  entity: 'OASA Verein',
  amount: { total: { val: 2632.47, cur: 'EUR' } },
  taxAmount: { val: 492.25, cur: 'EUR' },
  platformRevenue: { val: 131.62, cur: 'EUR' },
  netRevenue: { val: 2008.6, cur: 'EUR' },
  meta: { memoCode: 'YZ2ZY3', senderIban: 'DE89370400440532013000' },
};

const sale = {
  _id: SALE_ID,
  name: 'Sale',
  product_type: 'tokens',
  total_price: 2591,
  quantity: 10,
  status: 'paid',
  paymentMethod: 'bank',
  entity: 'OASA Verein',
  memoCode: 'MEMO123',
  created: '2026-08-01T10:00:00.000Z',
  updated: '2026-08-02T10:00:00.000Z',
  visibility: 'private',
  visibleBy: [],
  attributes: [],
  managedBy: [],
  createdBy: 'user-9',
  kyc: {
    legalName: 'Jeppe Liisberg',
    email: 'jeppe@example.net',
    TIN: 'DK12345678',
    address1: 'Main street 1',
    postalCode: '1000',
    city: 'Copenhagen',
    country: 'Denmark',
    kycStatus: 'verified',
  },
} as unknown as Sale;

const secondSale = {
  ...sale,
  _id: '78f1a2b3c4d5e6f708192a3c',
  name: 'Second sale',
  createdBy: 'user-10',
} as Sale;

const distributionStatus = (
  saleId: string,
  status: TokenDistributionStatus['status'],
): TokenDistributionStatus => ({
  id: `status-${saleId}`,
  saleId,
  status,
  active: true,
  safeTxHash: '',
  safeUrl: '',
  confirmationsSubmitted: status === 'pending' ? 1 : 2,
  confirmationsRequired: 2,
  executionTxHash: '',
  explorerUrl: '',
  lastError: '',
  entryLastError: '',
});

const dashboard = (sales: Sale[], onRefetch = jest.fn()) => (
  <SalesListDashboard
    sales={sales}
    saleCategory="tokens"
    platformDefaultCurrency="EUR"
    onRefetch={onRefetch}
  />
);

const renderDashboard = (
  roles: string[],
  onRefetch = jest.fn(),
  sales: Sale[] = [sale],
) => {
  (useAuth as jest.Mock).mockReturnValue({
    user: { _id: 'admin-1', roles },
  });
  return renderWithNextIntl(dashboard(sales, onRefetch));
};

describe('SalesListDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((url: string) => {
      if (url === '/charge') {
        return Promise.resolve({ data: { results: [charge] } });
      }
      return Promise.resolve({ data: { results: [] } });
    });
  });

  it('shows a truncated sale id with a copy button', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderDashboard(['admin']);

    const truncated = await screen.findAllByTitle(SALE_ID);
    expect(truncated[0]).toHaveTextContent('68f1a2…2a3b');

    await userEvent.click(screen.getAllByLabelText('Copy')[0]);
    expect(writeText).toHaveBeenCalledWith(SALE_ID);
  });

  it('reveals the KYC snapshot when the details dropdown is opened', async () => {
    renderDashboard(['admin']);

    const toggles = await screen.findAllByLabelText('Details');
    expect(screen.queryByText('KYC snapshot')).not.toBeInTheDocument();

    await userEvent.click(toggles[0]);

    // Both the mobile card and the desktop table render in jsdom.
    expect((await screen.findAllByText('KYC snapshot')).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText('Jeppe Liisberg').length).toBeGreaterThan(0);
    expect(screen.getAllByText('DK12345678').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MEMO123').length).toBeGreaterThan(0);
  });

  it('lists the charges booked against the sale', async () => {
    renderDashboard(['admin']);

    const toggles = await screen.findAllByLabelText('Details');
    await userEvent.click(toggles[0]);

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/charge',
        expect.objectContaining({
          params: expect.objectContaining({
            where: encodeURIComponent(JSON.stringify({ saleId: SALE_ID })),
          }),
        }),
      ),
    );

    expect((await screen.findAllByTitle(CHARGE_ID)).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/tokenSale · monerium · OASA Verein/).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/YZ2ZY3/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/€2,632.47/).length).toBeGreaterThan(0);
  });

  it('does not offer the manual sale action to users without admin or team', async () => {
    renderDashboard(['space-host']);

    await userEvent.click(screen.getByRole('button', { name: /Actions/i }));
    expect(
      screen.queryByRole('menuitem', { name: 'Add manual sale' }),
    ).not.toBeInTheDocument();
  });

  it('gives space hosts the token Safe controls and wallet view', async () => {
    api.get.mockImplementation((url: string) => {
      if (url === '/onchain-admin/recipients') {
        return Promise.resolve({
          data: {
            results: [
              {
                _id: 'user-9',
                screenname: 'Jeppe',
                hasWallet: true,
                walletAddress: '0x1111111111111111111111111111111111111111',
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { results: [] } });
    });

    renderDashboard(['space-host']);

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/onchain-admin/recipients',
        expect.objectContaining({ params: { ids: 'user-9' } }),
      ),
    );
    expect((await screen.findAllByText(/0x1111.*1111/)).length).toBeGreaterThan(
      0,
    );

    await userEvent.click(screen.getByRole('button', { name: /Actions/i }));
    expect(
      screen.getByRole('menuitem', { name: 'Mint Sweat' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Burn SWEAT' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Transfer TDF from Safe' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Sync now' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', {
        name: 'Mint TDF for paid sales via Safe',
      }),
    ).toBeInTheDocument();
  });

  it('ignores a superseded recipient response from the previous sales view', async () => {
    const firstRecipients = deferred<{ data: { results: unknown[] } }>();
    const secondRecipients = deferred<{ data: { results: unknown[] } }>();
    api.get.mockImplementation((url: string, config?: any) => {
      if (url === '/onchain-admin/recipients') {
        return config?.params?.ids === 'user-9'
          ? firstRecipients.promise
          : secondRecipients.promise;
      }
      return Promise.resolve({ data: { results: [] } });
    });

    const view = renderDashboard(['space-host']);
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/onchain-admin/recipients',
        expect.objectContaining({ params: { ids: 'user-9' } }),
      ),
    );

    view.rerender(dashboard([secondSale]));
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/onchain-admin/recipients',
        expect.objectContaining({ params: { ids: 'user-10' } }),
      ),
    );

    await act(async () => {
      secondRecipients.resolve({
        data: {
          results: [
            {
              _id: 'user-10',
              screenname: 'Latest buyer',
              hasWallet: true,
              walletAddress: '0x2222222222222222222222222222222222222222',
            },
          ],
        },
      });
    });
    expect((await screen.findAllByText(/0x2222.*2222/)).length).toBeGreaterThan(
      0,
    );

    await act(async () => {
      firstRecipients.resolve({
        data: {
          results: [
            {
              _id: 'user-9',
              screenname: 'Superseded buyer',
              hasWallet: true,
              walletAddress: '0x1111111111111111111111111111111111111111',
            },
          ],
        },
      });
    });
    await waitFor(() => {
      expect(screen.queryAllByText(/0x1111.*1111/)).toHaveLength(0);
      expect(screen.getAllByText(/0x2222.*2222/).length).toBeGreaterThan(0);
    });
  });

  it('ignores a superseded distribution-status response', async () => {
    const firstStatuses = deferred<{ data: { results: unknown[] } }>();
    const secondStatuses = deferred<{ data: { results: unknown[] } }>();
    api.get.mockImplementation((url: string, config?: any) => {
      if (url === '/onchain-admin/recipients') {
        const userId = config?.params?.ids;
        return Promise.resolve({
          data: {
            results: [
              {
                _id: userId,
                screenname: `Buyer ${userId}`,
                hasWallet: true,
                walletAddress:
                  userId === 'user-9'
                    ? '0x1111111111111111111111111111111111111111'
                    : '0x2222222222222222222222222222222222222222',
              },
            ],
          },
        });
      }
      if (url === '/safe/token-distribution-batches') {
        return config?.params?.saleIds === SALE_ID
          ? firstStatuses.promise
          : secondStatuses.promise;
      }
      return Promise.resolve({ data: { results: [] } });
    });

    const view = renderDashboard(['space-host']);
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/safe/token-distribution-batches',
        expect.objectContaining({
          params: expect.objectContaining({ saleIds: SALE_ID }),
        }),
      ),
    );

    view.rerender(dashboard([secondSale]));
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/safe/token-distribution-batches',
        expect.objectContaining({
          params: expect.objectContaining({ saleIds: secondSale._id }),
        }),
      ),
    );

    await act(async () => {
      secondStatuses.resolve({
        data: { results: [distributionStatus(secondSale._id, 'completed')] },
      });
    });
    expect(
      (
        await screen.findAllByText(
          'Distribution detected and completed automatically.',
        )
      ).length,
    ).toBeGreaterThan(0);

    await act(async () => {
      firstStatuses.resolve({
        data: { results: [distributionStatus(SALE_ID, 'pending')] },
      });
    });
    await waitFor(() => {
      expect(
        screen.getAllByText(
          'Distribution detected and completed automatically.',
        ).length,
      ).toBeGreaterThan(0);
      expect(
        screen.queryByText(/Safe proposal pending/),
      ).not.toBeInTheDocument();
    });
  });

  it('lets a team member record a manual token sale', async () => {
    const onRefetch = jest.fn();
    api.get.mockImplementation((url: string) => {
      if (url === '/user') {
        return Promise.resolve({
          data: {
            results: [
              {
                _id: 'user-9',
                screenname: 'Jeppe',
                email: 'jeppe@example.net',
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { results: [] } });
    });
    api.post.mockResolvedValue({
      data: { results: { saleId: SALE_ID } },
    });

    renderDashboard(['team'], onRefetch);

    await userEvent.click(screen.getByRole('button', { name: /Actions/i }));
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Add manual sale' }),
    );

    expect(
      await screen.findByText('Add manual sale', { selector: 'h2' }),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByPlaceholderText('Search for a member...'),
      'jeppe',
    );
    await userEvent.click(await screen.findByText('Jeppe'));

    // The selected user shows as a preview card linking to their profile.
    expect(screen.getByRole('link', { name: /View profile/i })).toHaveAttribute(
      'href',
      '/members/user-9',
    );
    expect(screen.getAllByTitle('user-9').length).toBeGreaterThan(0);

    const totalPrice = screen.getByLabelText('Total price');
    await userEvent.clear(totalPrice);
    await userEvent.type(totalPrice, '2591');

    await userEvent.click(screen.getByRole('button', { name: /Create sale/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post).toHaveBeenCalledWith(
      '/sale/manual',
      expect.objectContaining({
        userId: 'user-9',
        product_type: 'tokens',
        total_price: 2591,
        quantity: 1,
        status: 'paid',
        paymentMethod: 'bank',
        currency: 'EUR',
        createCharge: true,
      }),
    );
    expect(onRefetch).toHaveBeenCalled();
  });
});
