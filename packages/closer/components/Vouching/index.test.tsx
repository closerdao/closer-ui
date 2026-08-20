import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import Vouching from './index';

const vouchers = [
  { _id: 'voucher-1', screenname: 'Ana', photo: null },
  { _id: 'voucher-2', screenname: 'Bruno', photo: null },
];

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

jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() =>
      Promise.resolve({ data: { results: { totalNights: 27 } } }),
    ),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
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
  patch: jest.Mock;
  delete: jest.Mock;
};

const stayedNights = (totalNights: number) =>
  api.get.mockResolvedValue({ data: { results: { totalNights } } });

beforeEach(() => {
  stayedNights(27);
  api.post.mockResolvedValue({ data: {} });
  api.patch.mockResolvedValue({ data: {} });
  api.delete.mockResolvedValue({ data: {} });
  jest.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
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

// Vouching fetches the guest's stay nights on mount. Tests that only assert on
// the first render still have to let that promise settle, or its state updates
// land after the test has ended and React warns about updates outside act().
const settleMountFetch = () => act(async () => undefined);

describe('Vouching', () => {
  it('lists each voucher with a link to their profile and their vouch', async () => {
    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="viewer-1"
        minVouchingStayDuration={14}
      />,
    );
    await settleMountFetch();

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

  it('encourages a citizen who has not vouched yet', async () => {
    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="viewer-1"
        minVouchingStayDuration={14}
      />,
    );
    await settleMountFetch();

    expect(screen.getByText(/Do you know Sam\?/i)).toBeInTheDocument();
  });

  it('encourages being the first voucher when there are no vouches', async () => {
    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={[]}
        myId="viewer-1"
        minVouchingStayDuration={14}
      />,
    );
    await settleMountFetch();

    expect(
      screen.getByText(/Be the first to vouch for them/i),
    ).toBeInTheDocument();
  });

  it('lets the voucher edit or delete their own vouch instead of nudging them again', async () => {
    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="voucher-1"
        minVouchingStayDuration={14}
      />,
    );
    await settleMountFetch();

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.queryByText(/Do you know Sam\?/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/You have already vouched for this member/i),
    ).not.toBeInTheDocument();
  });

  it('does not let you edit or delete someone elses vouch', async () => {
    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="voucher-1"
        minVouchingStayDuration={14}
      />,
    );
    await settleMountFetch();

    expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(1);
  });

  it('shows vouches on your own profile without asking you to vouch', async () => {
    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="member-1"
        minVouchingStayDuration={14}
      />,
    );
    await settleMountFetch();

    expect(screen.getByRole('link', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.queryByText(/Do you know Sam\?/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /edit/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i }),
    ).not.toBeInTheDocument();
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

  it('patches the vouch message when the voucher saves an edit', async () => {
    api.patch.mockResolvedValue({
      data: {
        results: {
          user: {
            vouched: [
              {
                vouchedBy: 'voucher-1',
                vouchedAt: new Date('2026-01-15'),
                message: 'Ana still holds the space.',
              },
              vouchData[1],
            ],
          },
        },
      },
    });

    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="voucher-1"
        minVouchingStayDuration={14}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    const textarea = screen.getByPlaceholderText(
      /Share how you know them and why you trust them/i,
    );
    expect(textarea).toHaveValue('Ana knows how to hold a space.');
    fireEvent.change(textarea, {
      target: { value: 'Ana still holds the space.' },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /save/i })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/users/member-1/vouch', {
        message: 'Ana still holds the space.',
      }),
    );
    expect(
      await screen.findByText('Ana still holds the space.'),
    ).toBeInTheDocument();
  });

  it('deletes the vouch after confirmation', async () => {
    api.delete.mockResolvedValue({
      data: {
        results: {
          user: {
            vouched: [vouchData[1]],
          },
        },
      },
    });

    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="voucher-1"
        minVouchingStayDuration={14}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith('/users/member-1/vouch'),
    );
    await waitFor(() =>
      expect(
        screen.queryByText('Ana knows how to hold a space.'),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Do you know Sam\?/i),
    ).toBeInTheDocument();
  });

  it('does not delete the vouch when confirmation is cancelled', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);

    renderWithNextIntl(
      <Vouching
        userId="member-1"
        memberName="Sam"
        vouchData={vouchData}
        myId="voucher-1"
        minVouchingStayDuration={14}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(api.delete).not.toHaveBeenCalled();
    expect(
      screen.getByText('Ana knows how to hold a space.'),
    ).toBeInTheDocument();
  });
});
