import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import StayCheckoutPage from '../pages/stay/create/stayCheckoutPage';
import type { Stay } from '../types/stay';
import {
  claimStayAsFriend,
  getStay,
  sendStayToFriends,
  submitStay,
  updateStayOptions,
} from '../utils/stays.api';
import { renderWithNextIntl } from './utils';

const mockRouter = {
  query: {} as Record<string, string>,
  isReady: true,
  replace: jest.fn(),
  push: jest.fn(),
  prefetch: jest.fn(),
};
let mockUser = { _id: 'guest', roles: [] as string[] };
jest.mock('next/router', () => ({ useRouter: () => mockRouter }));
jest.mock('../contexts/auth', () => ({
  useAuth: () => ({ isAuthenticated: true, user: mockUser }),
}));
jest.mock('../contexts/platform', () => ({
  usePlatform: () => ({ platform: {} }),
}));
jest.mock('../components/Conditions', () => ({
  __esModule: true,
  default: ({ setComply }: any) => (
    <label>
      Accept terms
      <input type="checkbox" onChange={(e) => setComply(e.target.checked)} />
    </label>
  ),
}));
jest.mock('../utils/stays.api', () => ({
  ...jest.requireActual('../utils/stays.api'),
  getStay: jest.fn(),
  submitStay: jest.fn(),
  updateStayOptions: jest.fn(),
  sendStayToFriends: jest.fn(),
  claimStayAsFriend: jest.fn(),
}));
// Preparation must not depend on a card or wallet provider.
jest.mock('@stripe/react-stripe-js', () => ({}));

const draft = {
  _id: 'stay',
  status: 'draft',
  createdBy: 'guest',
  start: '2099-01-01',
  end: '2099-01-03',
  duration: 2,
  adults: 1,
  foodOption: 'no_food',
  fiatTarget: { val: 100, cur: 'EUR' },
} as Stay;
const renderPage = () =>
  renderWithNextIntl(
    <StayCheckoutPage
      bookingSettings={{} as any}
      generalConfig={null}
      volunteerConfig={null}
      foodOptions={[]}
    />,
  );
beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
  mockRouter.query = { slug: 'stay' };
  mockUser = { _id: 'guest', roles: [] };
  (getStay as jest.Mock).mockResolvedValue(draft);
  (updateStayOptions as jest.Mock).mockImplementation(async (_id, changes) => ({
    ...draft,
    ...changes,
  }));
  (submitStay as jest.Mock).mockResolvedValue({ ...draft, status: 'pending' });
});

it.each([
  [[], 'pending', 'Submit request', '/stay/stay/pending'],
  [['member'], 'confirmed', 'Continue to payment', '/stay/stay/payment'],
  [['member'], 'paid', 'Continue to payment', '/stay/stay/confirmation'],
])(
  'submits once with roles %j and follows the server status %s',
  async (roles, status, label, destination) => {
    mockUser.roles = roles as string[];
    let finish!: (stay: Stay) => void;
    (submitStay as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderPage();
    const button = await screen.findByRole('button', {
      name: label as string,
    });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Accept terms'));
    fireEvent.click(button);
    fireEvent.click(button);
    expect(submitStay).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).not.toHaveBeenCalled();
    await act(async () =>
      finish({ ...draft, status: status as Stay['status'] }),
    );
    expect(mockRouter.push).toHaveBeenCalledWith(destination);
  },
);

it('redirects an approved legacy preparation link to payment without saving options', async () => {
  (getStay as jest.Mock).mockResolvedValue({ ...draft, status: 'confirmed' });
  renderPage();
  await waitFor(() =>
    expect(mockRouter.replace).toHaveBeenCalledWith('/stay/stay/payment'),
  );
  expect(updateStayOptions).not.toHaveBeenCalled();
  expect(submitStay).not.toHaveBeenCalled();
});

it('allows an explicit owner edit and returns to payment without submitting again', async () => {
  mockRouter.query.edit = 'true';
  (getStay as jest.Mock).mockResolvedValue({ ...draft, status: 'confirmed' });
  renderPage();
  const button = await screen.findByRole('button', {
    name: 'Save and continue',
  });
  expect(mockRouter.replace).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText('Accept terms'));
  fireEvent.click(button);
  await waitFor(() =>
    expect(mockRouter.push).toHaveBeenCalledWith('/stay/stay/payment'),
  );
  expect(submitStay).not.toHaveBeenCalled();
});

it('claims an invited friend and requires terms before continuing to payment', async () => {
  mockRouter.query.isFriend = 'true';
  mockUser._id = 'friend';
  (getStay as jest.Mock)
    .mockRejectedValueOnce(new Error('not claimed'))
    .mockResolvedValue({
      ...draft,
      status: 'confirmed',
      isFriendsBooking: true,
    });
  renderPage();
  const button = await screen.findByRole('button', {
    name: 'Continue to payment',
  });
  expect(claimStayAsFriend).toHaveBeenCalledWith('stay');
  expect(button).toBeDisabled();
  expect(mockRouter.replace).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText('Accept terms'));
  fireEvent.click(button);
  await waitFor(() =>
    expect(mockRouter.push).toHaveBeenCalledWith('/stay/stay/payment'),
  );
  expect(submitStay).not.toHaveBeenCalled();
  expect(updateStayOptions).not.toHaveBeenCalled();
});

it('finishes sending friend invitations before any payment navigation', async () => {
  (getStay as jest.Mock).mockResolvedValue({
    ...draft,
    isFriendsBooking: true,
  });
  (submitStay as jest.Mock).mockResolvedValue({
    ...draft,
    isFriendsBooking: true,
    status: 'confirmed',
  });
  let finish!: (result: any) => void;
  (sendStayToFriends as jest.Mock).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  renderPage();
  const button = await screen.findByRole('button', { name: /send.*friend/i });
  fireEvent.click(screen.getByLabelText('Accept terms'));
  fireEvent.click(button);
  await waitFor(() => expect(sendStayToFriends).toHaveBeenCalledWith('stay'));
  expect(mockRouter.replace).not.toHaveBeenCalled();
  expect(mockRouter.push).not.toHaveBeenCalled();
  await act(async () => finish({ sent: true, invalidEmails: [] }));
  expect(await screen.findByText(/sent/i)).toBeInTheDocument();
});
