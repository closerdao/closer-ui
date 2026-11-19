import { useState } from 'react';

import { fireEvent, screen, within } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import { getDateInZone } from './dateTimePicker.utils';
import DateTimePicker from './index';

const ZONE = 'Europe/Lisbon';
// 23:30 and 23:00 in Lisbon (UTC+1 in May): the next day east of it, earlier west of it.
const START = '2023-05-10T22:30:00.000Z';
const END = '2023-05-11T22:00:00.000Z';

const toIso = (value: string | Date | null) =>
  value ? new Date(value).toISOString() : value;

// Feeds the picked values back in as saved values, the way EditModel does.
const AdminForm = ({
  start,
  end,
  onChange,
}: {
  start?: string;
  end?: string;
  onChange: (start: string | null, end: string | null) => void;
}) => {
  const [data, setData] = useState<{
    start?: string | Date | null;
    end?: string | Date | null;
  }>({ start, end });
  return (
    <DateTimePicker
      isAdmin
      timeZone={ZONE}
      defaultMonth={new Date(2023, 4, 1)}
      savedStartDate={data.start}
      savedEndDate={data.end}
      setStartDate={(value) => {
        setData((prev) => ({ ...prev, start: value }));
        onChange(toIso(value), toIso(data.end ?? null));
      }}
      setEndDate={(value) => {
        setData((prev) => ({ ...prev, end: value }));
        onChange(toIso(data.start ?? null), toIso(value));
      }}
    />
  );
};

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

  describe(`in the platform zone, with the browser in ${process.env.TZ}`, () => {
    it('shows a late-evening event on its platform day and time', () => {
      renderWithNextIntl(
        <AdminForm start={START} end={END} onChange={jest.fn()} />,
      );

      expect(screen.getByTestId('dates')).toHaveTextContent(
        /May 10, 2023.*May 11, 2023/i,
      );
      expect(screen.getByLabelText(/start time/i)).toHaveValue('23:30');
      expect(screen.getByLabelText(/end time/i)).toHaveValue('23:00');
    });

    it('keeps the day when the time is edited', () => {
      const onChange = jest.fn();
      renderWithNextIntl(
        <AdminForm start={START} end={END} onChange={onChange} />,
      );

      fireEvent.change(screen.getByLabelText(/start time/i), {
        target: { value: '23:45' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        '2023-05-10T22:45:00.000Z',
        END,
      );
      expect(screen.getByTestId('dates')).toHaveTextContent(/May 10, 2023/i);
    });

    it('saves the same instant on create as edit reads back', () => {
      const onCreate = jest.fn();
      const { unmount } = renderWithNextIntl(<AdminForm onChange={onCreate} />);

      fireEvent.click(screen.getAllByRole('gridcell', { name: '10' })[0]);
      fireEvent.click(screen.getAllByRole('gridcell', { name: '11' })[0]);
      fireEvent.change(screen.getByLabelText(/start time/i), {
        target: { value: '23:30' },
      });
      fireEvent.change(screen.getByLabelText(/end time/i), {
        target: { value: '23:00' },
      });
      expect(onCreate).toHaveBeenLastCalledWith(START, END);
      unmount();

      renderWithNextIntl(
        <AdminForm start={START} end={END} onChange={jest.fn()} />,
      );
      expect(screen.getByTestId('dates')).toHaveTextContent(
        /May 10, 2023.*May 11, 2023/i,
      );
      expect(screen.getByLabelText(/start time/i)).toHaveValue('23:30');
      expect(screen.getByLabelText(/end time/i)).toHaveValue('23:00');
    });

    it('keeps the chosen time when a new day is picked', () => {
      const onChange = jest.fn();
      renderWithNextIntl(
        <AdminForm start={START} end={END} onChange={onChange} />,
      );
      fireEvent.change(screen.getByLabelText(/start time/i), {
        target: { value: '21:15' },
      });
      fireEvent.change(screen.getByLabelText(/end time/i), {
        target: { value: '20:45' },
      });

      // A click on a full range resets it to a new start day.
      fireEvent.click(screen.getAllByRole('gridcell', { name: '15' })[0]);
      expect(onChange).toHaveBeenCalledWith(
        '2023-05-15T20:15:00.000Z',
        '2023-05-11T19:45:00.000Z',
      );

      // The next click completes the range through the main path.
      fireEvent.click(screen.getAllByRole('gridcell', { name: '18' })[0]);
      expect(onChange).toHaveBeenCalledWith(
        '2023-05-15T20:15:00.000Z',
        '2023-05-18T19:45:00.000Z',
      );
      expect(screen.getByTestId('dates')).toHaveTextContent(
        /May 15, 2023.*May 18, 2023/i,
      );
      expect(screen.getByLabelText(/start time/i)).toHaveValue('21:15');
      expect(screen.getByLabelText(/end time/i)).toHaveValue('20:45');
    });

    it('reads a bare date as that calendar day', () => {
      expect(getDateInZone('2023-05-10', ZONE)).toBe('2023-05-10');
      expect(getDateInZone(START, ZONE)).toBe('2023-05-10');
      expect(getDateInZone(START)).toBe(
        new Date(START).toLocaleDateString('sv-SE'),
      );
    });
  });
});
