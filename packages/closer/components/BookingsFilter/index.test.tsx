import React from 'react';

import { screen } from '@testing-library/react';
import { renderWithNextIntl } from '../../test/utils';

import BookingsFilter from './index';

describe('BookingsFilter', () => {
  it('should render the component and show proper controls', () => {
    renderWithNextIntl(
      <BookingsFilter
        setPage={jest.fn()}
        page={1}
        defaultWhere={{}}
        setFilter={jest.fn()}
      />,
    );

    const bookingNumberInput = screen.getByPlaceholderText(/booking id/i);
    const arrivalButton = screen.getByRole('button', {
      name: /arrival/i,
    });
    const newestFirstButton = screen.getByRole('button', {
      name: /newest first/i,
    });
    const departureButton = screen.getByRole('button', {
      name: /departure/i,
    });
    const datesButton = screen.getByRole('button', {
      name: /select dates/i,
    });

    expect(bookingNumberInput).toBeInTheDocument();
    expect(bookingNumberInput).toBeEnabled();

    expect(arrivalButton).toBeInTheDocument();
    expect(arrivalButton).toBeEnabled();
    expect(newestFirstButton).toBeInTheDocument();
    expect(departureButton).toBeEnabled();
    expect(datesButton).toBeInTheDocument();
  });
});
