import { getBookingsWithRoomInfo } from '../../utils/dashboard.helpers';
import { Card } from '../ui';

interface Props {
  bookings: any;
  listings: any;
  TIME_ZONE: string;
}

const BookingsWithRoomInfo = ({ bookings, listings, TIME_ZONE }: Props) => {
  const bookingsWithRoomInfo = getBookingsWithRoomInfo(
    bookings,
    listings,
    TIME_ZONE,
  );

  return (
    <Card className="p-2 gap-2 h-[160px] overflow-scroll">
      <div className="flex flex-col gap-1">
        {bookingsWithRoomInfo.map((booking: any, index: number) => {
          const doesCheckoutToday =
            booking.doesCheckoutToday && booking.period === 'night';
          return (
            <p
              key={index}
              className={`${
                doesCheckoutToday ? 'text-error' : 'text-black'
              } flex justify-between gap-1`}
            >
              {booking.room}{' '}
              <span className="text-gray-400">{booking.period}</span>
            </p>
          );
        })}
      </div>
    </Card>
  );
};

export default BookingsWithRoomInfo;
