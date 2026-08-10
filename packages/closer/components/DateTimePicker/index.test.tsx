import { screen, within } from '@testing-library/react';

import DateTimePicker from './index';
import { renderWithNextIntl } from '../../test/utils';

describe('DateTimePicker', () => {
  it('should have proper title and have buttons enabled or disabled based on blocked date ranges', () => {
    const blockedDateRanges = [
      {
        from: new Date('2023-05-12T06:00:00.000Z'),
        to: new Date('2023-05-15T00:00:00.000Z'),
      },
      {
        from: new Date('2023-05-20T00:00:00.000Z'),
        to: new Date('2023-05-22T00:00:00.000Z'),
      },
      {
        before: '2023-05-08T00:00:00.000Z',
      },
      {
        after: 1686153881331,
      },
    ];

    renderWithNextIntl(
      <DateTimePicker
        setStartDate={jest.fn()}
        setEndDate={jest.fn()}
        maxDuration={14}
        blockedDateRanges={blockedDateRanges as any}
        savedStartDate={new Date('05-10-2023').toISOString()}
        savedEndDate={new Date('05-10-2023').toISOString()}
        defaultMonth={new Date('05-10-2023')}
      />,
    );

    const heading = screen.getByText(/may 2023/i);
    expect(heading).toBeInTheDocument();

    const row = screen.getByRole('row', {
      name: /7 8 9 10 11 12 13/i,
    });
    const row2 = screen.getByRole('row', {
      name: /18 19 20 21 22 23 24/i,
    });

    const buttonBlockedDate = within(row).getByRole('gridcell', {
      name: /13/i,
    });
    const buttonAvailableDate = within(row).getByRole('gridcell', {
      name: /10/i,
    });
    const buttonBlockedByMaxDuration = within(row2).getByRole('gridcell', {
      name: /24/i,
    });
    expect(buttonBlockedDate).toBeDisabled();
    expect(buttonBlockedByMaxDuration).toBeDisabled();
    expect(buttonAvailableDate).toBeEnabled();
  });

  it('should have dates field display proper dates based on selected dates', () => {
    const blockedDateRanges = [
      {
        from: new Date('2023-05-12T06:00:00.000Z'),
        to: new Date('2023-05-15T00:00:00.000Z'),
      },
      {
        from: new Date('2023-05-20T00:00:00.000Z'),
        to: new Date('2023-05-22T00:00:00.000Z'),
      },
      {
        before: '2023-05-08T00:00:00.000Z',
      },
      {
        after: 1686153881331,
      },
    ];

    renderWithNextIntl(
      <DateTimePicker
        setStartDate={jest.fn()}
        setEndDate={jest.fn()}
        maxDuration={14}
        blockedDateRanges={blockedDateRanges as any}
        savedStartDate={new Date('05-10-2023').toISOString()}
        savedEndDate={new Date('05-11-2023').toISOString()}
        defaultMonth={new Date('05-10-2023')}
      />,
    );

    const dates = screen.getByTestId('dates');
    expect(dates).toHaveTextContent(/May 10, 2023.*May 11, 2023/i);
  });
});
