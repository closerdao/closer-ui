import dayjs from 'dayjs';

export const getBookedDatesObjects = (bookings) => {
  // returns Array<Date>
  // given booking.start and booking.end,
  // return an array of booked dates in the format of Date objects
  const bookedDates = [];
  bookings.forEach((booking) => {
    const start = dayjs(booking.start);
    const end = dayjs(booking.end);
    const duration = end.diff(start, 'days') + 1; // + the last day of the booking
    for (let i = 0; i < duration; i++) {
      const date = start.add(i, 'day').toDate();
      bookedDates.push(date);
    }
  });
  return bookedDates;
};
