import React from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithNextIntl } from '../../test/utils';

import BookingsFilter from './index';

jest.mock('../../utils/searchUser', () => ({
  fetchUsersBySearchQuery: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fetchUsersBySearchQuery } = require('../../utils/searchUser');

const lastWhere = (setFilter: jest.Mock) =>
  setFilter.mock.calls[setFilter.mock.calls.length - 1][0].where;

describe('BookingsFilter', () => {
  beforeEach(() => {
    (fetchUsersBySearchQuery as jest.Mock).mockReset();
    (fetchUsersBySearchQuery as jest.Mock).mockResolvedValue([]);
  });

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

  describe('guest search', () => {
    const defaultWhere = { status: { $nin: ['open', 'draft'] } };

    const renderFilter = () => {
      const setFilter = jest.fn();
      const setPage = jest.fn();
      renderWithNextIntl(
        <BookingsFilter
          setPage={setPage}
          page={1}
          defaultWhere={defaultWhere}
          setFilter={setFilter}
        />,
      );
      return { setFilter, setPage };
    };

    const typeSearch = (value: string) => {
      fireEvent.change(screen.getByPlaceholderText(/guest name/i), {
        target: { value },
      });
    };

    it('narrows bookings to the guests a name resolves to', async () => {
      (fetchUsersBySearchQuery as jest.Mock).mockResolvedValue([
        { _id: 'user-1', screenname: 'Ana Silva' },
        { _id: 'user-2', screenname: 'Ana Costa' },
      ]);
      const { setFilter } = renderFilter();

      typeSearch('Ana');

      await waitFor(() => {
        expect(fetchUsersBySearchQuery).toHaveBeenCalledWith(
          'Ana',
          expect.any(Number),
        );
      });

      await waitFor(() => {
        expect(lastWhere(setFilter)).toEqual({
          ...defaultWhere,
          $or: [
            { createdBy: { $in: ['user-1', 'user-2'] } },
            { paidBy: { $in: ['user-1', 'user-2'] } },
          ],
        });
      });
    });

    it('debounces rather than querying on every keystroke', async () => {
      const { setFilter } = renderFilter();

      typeSearch('A');
      typeSearch('An');
      typeSearch('Ana');

      await waitFor(() => {
        expect(fetchUsersBySearchQuery).toHaveBeenCalledTimes(1);
      });
      expect(fetchUsersBySearchQuery).toHaveBeenCalledWith(
        'Ana',
        expect.any(Number),
      );

      // No guest matched, so the list must come back empty rather than unfiltered.
      await waitFor(() => {
        expect(lastWhere(setFilter)).toEqual({
          ...defaultWhere,
          _id: { $in: [] },
        });
      });
    });

    it('matches a booking id without a guest lookup', async () => {
      const bookingId = '63fc8e8910354e3f945e249a';
      const { setFilter } = renderFilter();

      typeSearch(bookingId);

      await waitFor(() => {
        expect(lastWhere(setFilter)).toEqual({
          ...defaultWhere,
          $or: [{ _id: bookingId }],
        });
      });
      expect(fetchUsersBySearchQuery).not.toHaveBeenCalled();
    });

    it('matches bookings that span a searched date', async () => {
      const { setFilter } = renderFilter();

      typeSearch('2026-03-12');

      await waitFor(() => {
        const where = lastWhere(setFilter);
        expect(where.$or).toHaveLength(1);
        expect(where.$or[0].$and[0].start.$lte).toBeInstanceOf(Date);
        expect(where.$or[0].$and[1].end.$gte).toBeInstanceOf(Date);
      });
    });

    it('restores the unfiltered list when the search is cleared', async () => {
      const { setFilter } = renderFilter();

      typeSearch('Ana');
      await waitFor(() => {
        expect(lastWhere(setFilter)).toHaveProperty('_id');
      });

      typeSearch('');
      await waitFor(() => {
        expect(lastWhere(setFilter)).toEqual(defaultWhere);
      });
    });
  });
});
