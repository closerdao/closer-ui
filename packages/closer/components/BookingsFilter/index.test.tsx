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

    const bookingNumberInput = screen.getByPlaceholderText(/enter booking #/i);
    const arrivalButton = screen.getByRole('button', {
      name: /arrival date/i,
    });
    const departureButton = screen.getByRole('button', {
      name: /departure date/i,
    });
    const datesButton = screen.getAllByRole('button', {
      name: /select dates/i,
    });

    expect(bookingNumberInput).toBeInTheDocument();
    expect(bookingNumberInput).toBeEnabled();

    expect(arrivalButton).toBeInTheDocument();
    expect(arrivalButton).toBeDisabled();
    expect(departureButton).toBeEnabled();
    expect(datesButton[0]).toBeInTheDocument();
    expect(datesButton[1]).toBeInTheDocument();
  });
});
