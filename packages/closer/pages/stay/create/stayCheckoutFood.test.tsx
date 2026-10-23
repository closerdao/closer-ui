import { useRouter } from 'next/router';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WalletProvider } from '../../../contexts/wallet';
import { renderWithNextIntl } from '../../../test/utils';
import { fetchListing } from '../../../utils/listings';
import { getStay, updateStayOptions } from '../../../utils/stays.api';
import StayCheckoutPage from './stayCheckoutPage';

jest.mock('../../../utils/stays.api', () => ({
  ...jest.requireActual('../../../utils/stays.api'),
  getStay: jest.fn(),
  updateStayOptions: jest.fn(),
}));

jest.mock('../../../utils/listings', () => ({
  fetchListing: jest.fn(),
}));

jest.mock('../../../utils/metrics', () => ({
  ...jest.requireActual('../../../utils/metrics'),
  logMetric: jest.fn(),
}));

jest.mock('../../../contexts/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { _id: 'user-1', email: 'guest@example.com', roles: [] },
    isLoading: false,
  }),
}));

const STAY_ID = 'stay-1';
const FOOD_ID = 'food-1';

const foodOptions = [
  {
    _id: FOOD_ID,
    name: 'Chef meals',
    description: '',
    price: 20,
    photos: [],
    isDefault: true,
    availableFor: ['guests'],
  },
];

const draftStay = {
  _id: STAY_ID,
  status: 'draft',
  listing: 'listing-1',
  start: '2026-11-01',
  end: '2026-11-04',
  duration: 3,
  adults: 1,
  children: 0,
  infants: 0,
  foodOption: 'food_package',
  foodOptionId: FOOD_ID,
  createdBy: 'user-1',
  managedBy: ['user-1'],
};

const renderCheckout = (category: string) => {
  (fetchListing as jest.Mock).mockResolvedValue({
    _id: 'listing-1',
    name: category === 'van' ? 'Van parking space' : 'Glamping',
    category,
    photos: [],
  });
  return renderWithNextIntl(
    <WalletProvider>
      <StayCheckoutPage
        bookingSettings={{ foodOptionEnabled: true } as any}
        generalConfig={null}
        volunteerConfig={null}
        foodOptions={foodOptions as any}
      />
    </WalletProvider>,
  );
};

const foodSwitch = () => screen.findByRole('checkbox', { name: /chef meals/i });

describe('/stay/create/[id] food package', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRouter).mockReturnValue({
      query: { slug: STAY_ID },
      isReady: true,
    } as any);
    (getStay as jest.Mock).mockResolvedValue(draftStay);
    (updateStayOptions as jest.Mock).mockImplementation(async (_id, patch) => ({
      ...draftStay,
      ...patch,
    }));
  });

  it('cannot be opted out of for a non-van listing', async () => {
    renderCheckout('glamping');

    const toggle = await foodSwitch();
    await waitFor(() => expect(toggle).toBeDisabled());
    expect(toggle).toBeChecked();
    expect(updateStayOptions).not.toHaveBeenCalledWith(
      STAY_ID,
      expect.objectContaining({ foodOption: 'no_food' }),
    );
  });

  it('can be opted out of for a van listing', async () => {
    renderCheckout('van');

    const toggle = await foodSwitch();
    await waitFor(() => expect(toggle).toBeEnabled());
    await userEvent.click(toggle);

    await waitFor(() =>
      expect(updateStayOptions).toHaveBeenCalledWith(STAY_ID, {
        foodOption: 'no_food',
        foodOptionId: null,
      }),
    );
  });
});
