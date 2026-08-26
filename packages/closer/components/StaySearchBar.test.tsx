import React from 'react';

import { render, screen } from '@testing-library/react';

import StaySearchBar from './StaySearchBar';

jest.mock('next-intl', () => ({
  useTranslations: () =>
    (key: string, values?: Record<string, unknown>) => {
      if (key === 'bookings_dates_nights_selected') {
        return `${values?.count} nights`;
      }
      return key;
    },
}));

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({ user: null }),
}));

describe('StaySearchBar', () => {
  it('counts nights by calendar date when arrival and departure times differ', () => {
    render(
      <StaySearchBar
        bookingSettings={null}
        initialStart="2026-09-08T15:00:00.000Z"
        initialEnd="2026-10-06T12:00:00.000Z"
        onSearch={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('button', {
        name: /Sep 8 – Oct 6 · 28 nights/i,
      }),
    ).toBeInTheDocument();
  });
});
