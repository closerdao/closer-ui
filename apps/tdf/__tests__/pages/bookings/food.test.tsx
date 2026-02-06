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
    it('should show save-by-opting-out message when food toggle is OFF', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <FoodSelectionPage
          booking={bookingOpen}
          event={undefined}
          bookingConfig={bookingConfig}
          foodOptions={foodOptions}
        />,
      );
      const foodToggle = screen.getByRole('checkbox', { name: /basic/i });
      await user.click(foodToggle);
      expect(foodToggle).not.toBeChecked();
      expect(screen.getByText(/Save.*36[.,]00.*by opting out/i)).toBeInTheDocument();
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
      const foodToggle = screen.getByRole('checkbox', { name: /basic/i });
      expect(foodToggle).toBeChecked();
      expect(screen.getByText(/Total for your stay/i)).toBeInTheDocument();
      expect(screen.getByText(/36\.00|36,00/)).toBeInTheDocument();
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
      const foodToggle = screen.getByRole('checkbox', { name: /basic/i });

      expect(foodToggle).toBeChecked();
      expect(screen.getByText(/36\.00|36,00/)).toBeInTheDocument();

      await user.click(foodToggle);
      expect(screen.getByText(/Save.*36[.,]00.*by opting out/i)).toBeInTheDocument();

      await user.click(foodToggle);
      expect(screen.getByText(/36\.00|36,00/)).toBeInTheDocument();
    });
  });
});
