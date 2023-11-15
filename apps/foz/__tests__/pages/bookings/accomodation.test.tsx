import AccomodationSelector from '@/pages/bookings/create/accomodation';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import listingsMock from './listings.json';

describe.skip('Select accomodation type page', () => {
  it('should render and have a proper No available accomodation message in case empty array with listings is returned from the server', async () => {
    const props = {
      start: '2023-03-29',
      end: '2023-04-01 ',
      adults: '1',
      kids: '0',
      infants: '0',
      pets: '0',
      currency: 'EUR',
      useTokens: false,
      listings: [],
    };

    renderWithProviders(<AccomodationSelector {...props} />);

    const title = screen.getByRole('heading', {
      name: /Accommodation/i,
    });
    expect(title).toBeInTheDocument();
    const message = screen.getByText(
      /There are no accommodations available for these dates/i,
    );
    expect(message).toBeInTheDocument();
  });

  it('should render cards with acommodation options and have buttons enabled if listings array is returned from the server', async () => {
    const props = {
      start: '2023-03-29',
      end: '2023-04-01 ',
      adults: '1',
      kids: '1',
      infants: '1',
      pets: '1',
      currency: 'EUR',
      useTokens: false,
      listings: listingsMock,
    };
    renderWithProviders(<AccomodationSelector {...props} />);

    const cards = screen.getAllByRole('heading', { level: 4 });
    expect(cards).toHaveLength(2);
    const cardTitle = screen.getByRole('heading', { name: /magical cave/i });
    const button1 = screen.getAllByRole('button', {
      name: /log in to book/i,
    })[0];
    const button2 = screen.getAllByRole('button', {
      name: /log in to book/i,
    })[1];
    expect(cardTitle).toBeInTheDocument();
    expect(button1).toBeEnabled();
    expect(button2).toBeEnabled();
  });
});
