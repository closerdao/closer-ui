import { estimateNeededStakeForNewBooking } from '../helpers';
import bookedDatesMock from './bookedDates.json';

describe('estimateNeededStakeForNewBooking', () => {
  it('should return null if one of args is not set', () => {
    const res = estimateNeededStakeForNewBooking({
      bookedDates: bookedDatesMock,
      bookingYear: 2023,
      totalBookingTokenCost: 50,
    });
  });
});
