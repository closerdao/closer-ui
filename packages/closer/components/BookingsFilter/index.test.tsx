import React from 'react';

import { fireEvent, screen } from '@testing-library/react';
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

  it('should apply the default where clause when no status is selected', () => {
    const setFilter = jest.fn();
    const defaultWhere = { status: { $nin: ['open', 'draft'] } };

    renderWithNextIntl(
      <BookingsFilter
        setPage={jest.fn()}
        page={1}
        defaultWhere={defaultWhere}
        setFilter={setFilter}
      />,
    );

    expect(setFilter).toHaveBeenCalledWith(
      expect.objectContaining({ where: defaultWhere }),
    );
  });

  it('should override the default where clause when drafts are selected', () => {
    const setFilter = jest.fn();
    const defaultWhere = { status: { $nin: ['open', 'draft'] } };

    renderWithNextIntl(
      <BookingsFilter
        setPage={jest.fn()}
        page={1}
        defaultWhere={defaultWhere}
        setFilter={setFilter}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'draft' },
    });

    const lastFilter = setFilter.mock.calls[setFilter.mock.calls.length - 1][0];
    expect(lastFilter.where).toEqual({ status: ['draft'] });
  });
});
