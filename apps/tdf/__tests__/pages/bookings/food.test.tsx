import { FoodSelectionPage } from 'closer';
import { renderWithProviders } from '@/test/utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { booking, listing } from '@/__tests__/mocks';
import { bookingConfig } from '@/__tests__/mocks/bookingConfig';
import { mockAuthContext } from '@/__tests__/mocks/mockAuthContext';

jest.mock('closer/contexts/auth', () => {
  const actual = jest.requireActual<typeof import('closer/contexts/auth')>('closer/contexts/auth');
  return { ...actual, useAuth: () => mockAuthContext };
});

jest.mock('closer/utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('FoodSelectionPage', () => {
  const foodOptions = [
    { _id: 'food-1', name: 'Basic', price: 12, isDefault: true, photos: [], description: '' },
    { _id: 'food-2', name: 'Chef', price: 18, isDefault: false, photos: [], description: '' },
  ];

  const bookingOpen = { ...booking, status: 'open' };

  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
  });

  it('renders food selection when booking config has food enabled', () => {
    renderWithProviders(
      <FoodSelectionPage
        booking={bookingOpen}
        event={undefined}
        bookingConfig={bookingConfig}
        foodOptions={foodOptions}
      />,
    );
    const foodHeadings = screen.getAllByRole('heading', { name: /food/i });
    expect(foodHeadings.length).toBeGreaterThan(0);
  });

  it('renders next button to continue', () => {
    renderWithProviders(
      <FoodSelectionPage
        booking={bookingOpen}
        event={undefined}
        bookingConfig={bookingConfig}
        foodOptions={foodOptions}
      />,
    );
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  describe('Toggle State Persistence', () => {
    it('should show food cost €0.00 when food toggle is OFF', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <FoodSelectionPage
          booking={bookingOpen}
          event={undefined}
          bookingConfig={bookingConfig}
          foodOptions={foodOptions}
        />,
      );
      const foodToggle = screen.getByRole('checkbox', { name: /add.*basic/i });
      await user.click(foodToggle);
      expect(foodToggle).not.toBeChecked();
      const foodRow = screen.getByText(/Food:/i).closest('div');
      expect(foodRow).toHaveTextContent('€0.00');
    });

    it('should show food cost when food toggle is ON', () => {
      renderWithProviders(
        <FoodSelectionPage
          booking={bookingOpen}
          event={undefined}
          bookingConfig={bookingConfig}
          foodOptions={foodOptions}
        />,
      );
      const foodToggle = screen.getByRole('checkbox', { name: /add.*basic/i });
      expect(foodToggle).toBeChecked();
      const foodRow = screen.getByText(/Food:/i).closest('div');
      expect(foodRow).toHaveTextContent('€12.00');
    });

    it('should update food cost display in real-time when toggle changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <FoodSelectionPage
          booking={bookingOpen}
          event={undefined}
          bookingConfig={bookingConfig}
          foodOptions={foodOptions}
        />,
      );
      const foodToggle = screen.getByRole('checkbox', { name: /add.*basic/i });
      const foodRow = () => screen.getByText(/Food:/i).closest('div');

      expect(foodToggle).toBeChecked();
      expect(foodRow()).toHaveTextContent('€12.00');

      await user.click(foodToggle);
      expect(foodRow()).toHaveTextContent('€0.00');

      await user.click(foodToggle);
      expect(foodRow()).toHaveTextContent('€12.00');
    });
  });
});
