import React from 'react';

import BookingListPreview from '../components/BookingListPreview/BookingListPreview';
import BookingStatusTag from '../components/BookingStatusTag';

import { screen } from '@testing-library/react';
import { fromJS } from 'immutable';

import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'guest1', roles: [] } }),
}));

jest.mock('../contexts/platform', () => ({
  usePlatform: () => ({ platform: { bookings: {} } }),
}));

const confirmedStay = (overrides: Record<string, unknown> = {}) =>
  fromJS({
    _id: '6aac49ae0000000000000001',
    status: 'confirmed',
    start: '2027-01-10T00:00:00.000Z',
    end: '2027-01-14T00:00:00.000Z',
    created: '2026-09-01T00:00:00.000Z',
    createdBy: 'guest1',
    adults: 1,
    useTokens: true,
    tokensTarget: { val: 4, cur: 'TDF' },
    tokensStaked: { val: 4, cur: 'TDF' },
    fiatTarget: { val: 120, cur: 'EUR' },
    fiatPaid: { val: 0, cur: 'EUR' },
    priceLock: { total: { val: 120, cur: 'EUR' } },
    ...overrides,
  });

const renderPreview = (booking = confirmedStay()) =>
  renderWithNextIntl(
    <BookingListPreview
      booking={booking}
      listingName="Small Glamping"
      userInfo={null}
      eventName=""
      volunteerName=""
      link={null}
    />,
  );

describe('confirmed booking', () => {
  it('reads the same in the list as on the stay page', () => {
    const { unmount } = renderWithNextIntl(
      <BookingStatusTag status="confirmed" />,
    );
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    unmount();

    renderPreview();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.queryByText('Pending payment')).not.toBeInTheDocument();
  });

  it('says how much fiat is still owed once the tokens are staked', () => {
    renderPreview();
    expect(screen.getByText(/Still to pay: .*120[.,]00/)).toBeInTheDocument();
  });

  it('says nothing is owed once the fiat is paid', () => {
    renderPreview(confirmedStay({ fiatPaid: { val: 120, cur: 'EUR' } }));
    expect(screen.queryByText(/Still to pay/)).not.toBeInTheDocument();
  });
});
