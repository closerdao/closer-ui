import Bookings from '../components/Bookings';

import { screen } from '@testing-library/react';
import { fromJS } from 'immutable';

import { renderWithNextIntl } from './utils';

const KNOWN_GUEST = 'aaaaaaaaaaaaaaaaaaaaaaa1';
const MISSING_GUEST = 'aaaaaaaaaaaaaaaaaaaaaaa2';

const bookings = fromJS([
  {
    _id: '6ab128dc296c22c774e31fc0',
    status: 'paid',
    start: '2026-09-22T00:00:00.000Z',
    end: '2026-09-24T00:00:00.000Z',
    created: '2026-09-21T00:00:00.000Z',
    createdBy: KNOWN_GUEST,
    adults: 1,
  },
  {
    _id: '6ab1280a296c22c774e30bbd',
    status: 'paid',
    start: '2026-09-22T00:00:00.000Z',
    end: '2026-09-24T00:00:00.000Z',
    created: '2026-09-21T00:00:00.000Z',
    createdBy: MISSING_GUEST,
    adults: 1,
  },
]);

const users: Record<string, unknown> = {
  [KNOWN_GUEST]: fromJS({ _id: KNOWN_GUEST, screenname: 'Known Guest' }),
};

let usersLoading: boolean | undefined;
const userGet = jest.fn((..._args: unknown[]) => Promise.resolve());
const bookingGetCount = jest.fn((..._args: unknown[]) => Promise.resolve());

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'host_1', roles: ['space-host'] } }),
}));

jest.mock('../hooks/useHostNotes', () => ({
  useHostNotes: () => ({ hostNotes: {} }),
}));

jest.mock('../contexts/platform', () => {
  const noop = () => Promise.resolve();
  const platform = {
    booking: {
      find: () => bookings,
      findOne: (id: string) => bookings.find((b: any) => b.get('_id') === id),
      findCount: () => 44,
      get: noop,
      getCount: (...args: unknown[]) => bookingGetCount(...args),
    },
    user: {
      findOne: (id: string) => users[id],
      areLoading: () => usersLoading,
      get: (...args: unknown[]) => userGet(...args),
    },
    listing: { find: () => undefined, findOne: () => undefined, get: noop },
    event: { findOne: () => undefined, get: noop },
    volunteer: { findOne: () => undefined, get: noop },
    bookings: {},
  };
  return { usePlatform: () => ({ platform }) };
});

const renderList = () =>
  renderWithNextIntl(
    <Bookings
      filter={{ where: { status: { $nin: ['open', 'draft'] } }, page: 1 }}
      page={1}
      setPage={jest.fn()}
    />,
  );

describe('admin bookings list guest names', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usersLoading = false;
  });

  it('fetches only the users referenced on the page', () => {
    renderList();

    expect(userGet).toHaveBeenCalledWith({
      where: { _id: { $in: [KNOWN_GUEST, MISSING_GUEST] } },
      limit: 2,
    });
    expect(userGet).not.toHaveBeenCalledWith({ limit: 2000 });
  });

  it('shows resolved names and an explicit fallback for users it cannot read', async () => {
    renderList();

    expect(await screen.findByText('Known Guest')).toBeInTheDocument();
    expect(screen.getByText('Unknown guest')).toBeInTheDocument();
  });

  it('shows a placeholder instead of a blank or fallback name while users load', async () => {
    usersLoading = true;
    renderList();

    await screen.findAllByRole('link', { name: /booking/i });
    expect(screen.queryByText('Unknown guest')).not.toBeInTheDocument();
    expect(document.querySelectorAll('[aria-busy="true"]')).toHaveLength(1);
  });

  it('takes the result count from the count endpoint', async () => {
    renderList();

    expect(await screen.findByText(/^44/)).toBeInTheDocument();
    expect(bookingGetCount).toHaveBeenCalledWith({
      where: { status: { $nin: ['open', 'draft'] } },
    });
  });
});
