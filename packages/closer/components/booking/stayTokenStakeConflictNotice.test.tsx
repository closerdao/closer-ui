import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import type { Stay } from '../../types/stay';
import api from '../../utils/api.js';
import StayTokenStakeConflictNotice from './stayTokenStakeConflictNotice';

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'guest-1' } }),
}));

// The helper imports `./api`, which the moduleNameMapper does not redirect.
jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockGet = api.get as jest.Mock;

const stay = {
  _id: 'stay-new',
  start: '2027-01-10T12:00:00.000Z',
  end: '2027-01-14T12:00:00.000Z',
} as Stay;

const holdingStay = {
  _id: 'stay-held',
  start: '2027-01-08T12:00:00.000Z',
  end: '2027-01-12T12:00:00.000Z',
  status: 'paid',
  tokensStaked: { val: 4, cur: 'TDF' },
};

describe('StayTokenStakeConflictNotice', () => {
  beforeEach(() => mockGet.mockReset());

  it('names and links the guest booking that already holds the nights', async () => {
    mockGet.mockResolvedValue({ data: { results: [holdingStay] } });
    renderWithNextIntl(<StayTokenStakeConflictNotice stay={stay} />);

    expect(
      await screen.findByText(/Your booking for Jan 8 – Jan 12, 2027/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /view that booking/i }),
    ).toHaveAttribute('href', '/stay/stay-held');
    expect(mockGet).toHaveBeenCalledWith(
      '/booking',
      expect.objectContaining({
        params: expect.objectContaining({
          where: expect.objectContaining({
            createdBy: 'guest-1',
            _id: { $ne: 'stay-new' },
          }),
        }),
      }),
    );
  });

  it('falls back to the wallet copy when no own booking holds the nights', async () => {
    mockGet.mockResolvedValue({ data: { results: [] } });
    renderWithNextIntl(<StayTokenStakeConflictNotice stay={stay} />);

    expect(
      await screen.findByText(/This wallet already has tokens locked/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('offers to pay accommodation in fiat', async () => {
    mockGet.mockResolvedValue({ data: { results: [holdingStay] } });
    const onPayInFiat = jest.fn();
    renderWithNextIntl(
      <StayTokenStakeConflictNotice stay={stay} onPayInFiat={onPayInFiat} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /pay accommodation in fiat/i }),
    );
    expect(onPayInFiat).toHaveBeenCalledTimes(1);
  });

  it('hides the fiat offer when the stay can no longer switch', async () => {
    mockGet.mockResolvedValue({ data: { results: [holdingStay] } });
    renderWithNextIntl(<StayTokenStakeConflictNotice stay={stay} />);

    await screen.findByRole('link', { name: /view that booking/i });
    expect(
      screen.queryByRole('button', { name: /pay accommodation in fiat/i }),
    ).not.toBeInTheDocument();
  });
});
