import { fireEvent, screen, within } from '@testing-library/react';

import { renderWithNextIntl } from '../test/utils';
import SummaryDates from './SummaryDates';

const props = {
  isDayTicket: false,
  totalGuests: 1,
  kids: 0,
  infants: 0,
  pets: 0,
  startDate: '2026-10-05',
  endDate: '2026-10-10',
  listingName: 'Room',
  priceDuration: 'night',
  hideEmptyGuestRows: true,
};

test('omits zero or missing optional guest rows while retaining adults and positive counts', () => {
  const { rerender } = renderWithNextIntl(
    <SummaryDates {...props} infants={undefined} />,
  );
  expect(screen.getByText('Adults')).toBeInTheDocument();
  expect(screen.queryByText(/Children|Infants|Pets/)).not.toBeInTheDocument();
  rerender(<SummaryDates {...props} kids={2} infants={1} pets={1} />);
  expect(screen.getByText(/Children/)).toBeInTheDocument();
  expect(screen.getByText(/Infants/)).toBeInTheDocument();
  expect(screen.getByText('Pets')).toBeInTheDocument();
});

test('guest editing still permits increasing a zero count', () => {
  const setUpdatedChildren = jest.fn();
  renderWithNextIntl(
    <SummaryDates
      {...props}
      isEditMode
      setters={{ setUpdatedChildren }}
      collapseDatesEditor
    />,
  );
  const childrenRow = screen.getByText(/Children/).parentElement!;
  const buttons = within(childrenRow).getAllByRole('button');
  fireEvent.click(buttons[buttons.length - 1]);
  expect(setUpdatedChildren).toHaveBeenCalled();
  expect(screen.getByText(/Infants/)).toBeInTheDocument();
  expect(screen.getByText('Pets')).toBeInTheDocument();
});
