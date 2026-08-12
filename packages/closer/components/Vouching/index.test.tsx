import { screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import Vouching from './index';

const vouchers = [
  { _id: 'voucher-1', screenname: 'Ana', photo: null },
  { _id: 'voucher-2', screenname: 'Bruno', photo: null },
];

/** Platform collections are Immutable-ish: the component only calls toJS(). */
const list = (items: unknown[]) => ({ toJS: () => items });

const platformMock = {
  user: {
    find: () => list(vouchers),
    get: jest.fn().mockResolvedValue(undefined),
  },
};

jest.mock('../../contexts/platform', () => ({
  usePlatform: () => ({ platform: platformMock }),
}));

// The component reaches the real utils/api through the package barrel, so the
// real file path is what has to be mocked here.
jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() =>
      Promise.resolve({ data: { results: { totalNights: 27 } } }),
    ),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: {} },
  },
  cdn: '',
  formatSearch: () => '',
}));

const api = jest.requireMock('../../utils/api.js').default as {
  get: jest.Mock;
  post: jest.Mock;
};

const stayedNights = (totalNights: number) =>
  api.get.mockResolvedValue({ data: { results: { totalNights } } });

beforeEach(() => {
  stayedNights(27);
});

const vouchData = [
  {
    vouchedBy: 'voucher-1',
    vouchedAt: new Date('2026-01-15'),
    message: 'Ana knows how to hold a space.',
  },
  {
    vouchedBy: 'voucher-2',
    vouchedAt: new Date('2026-03-02'),
    message: 'Bruno showed up for every work day.',
  },
];

describe('Vouching', () => {
  it('lists each voucher with a link to their profile and their vouch', () => {
    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="viewer-1"
        minVouchingStayDuration={14}
      />,
    );

    expect(screen.getByRole('link', { name: 'Ana' })).toHaveAttribute(
      'href',
      '/members/voucher-1',
    );
    expect(screen.getByRole('link', { name: 'Bruno' })).toHaveAttribute(
      'href',
      '/members/voucher-2',
    );
    expect(
      screen.getByText('Ana knows how to hold a space.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Bruno showed up for every work day.'),
    ).toBeInTheDocument();
    expect(screen.getByText('2 vouches')).toBeInTheDocument();
  });

  it('encourages a citizen who has not vouched yet', () => {
    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="viewer-1"
        minVouchingStayDuration={14}
      />,
    );

    expect(screen.getByText(/Do you know Sam\?/i)).toBeInTheDocument();
  });

  it('encourages being the first voucher when there are no vouches', () => {
    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={[]}
        myId="viewer-1"
        minVouchingStayDuration={14}
      />,
    );

    expect(
      screen.getByText(/Be the first to vouch for them/i),
    ).toBeInTheDocument();
  });

  it('tells a citizen who already vouched instead of nudging them again', () => {
    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="voucher-1"
        minVouchingStayDuration={14}
      />,
    );

    expect(
      screen.getByText(/You have already vouched for this member/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Do you know Sam\?/i)).not.toBeInTheDocument();
  });

  it('shows vouches on your own profile without asking you to vouch', () => {
    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="member-1"
        minVouchingStayDuration={14}
      />,
    );

    expect(screen.getByRole('link', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.queryByText(/Do you know Sam\?/i)).not.toBeInTheDocument();
  });

  it('lets you vouch once the stays endpoint reports enough nights', async () => {
    stayedNights(27);

    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="viewer-1"
        minVouchingStayDuration={14}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Vouch/i })).toBeEnabled(),
    );
    expect(api.get).toHaveBeenCalledWith('/stays/nights/member-1');
    expect(
      screen.queryByText(/needs to stay for at least/i),
    ).not.toBeInTheDocument();
  });

  it('blocks vouching when the guest has not stayed enough nights', async () => {
    stayedNights(5);

    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="viewer-1"
        minVouchingStayDuration={14}
      />,
    );

    expect(
      await screen.findByText(/at least 14 nights to be eligible/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vouch/i })).toBeDisabled();
  });
});
