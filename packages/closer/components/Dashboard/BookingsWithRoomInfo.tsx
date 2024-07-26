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
    <Card className="p-0 flex flex-col gap-1 h-[160px] overflow-hidden justify-start relative">
      <div className="z-1000 absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      <div className="p-2 overflow-scroll pb-10">
        <div className="flex flex-col gap-1">
          {bookingsWithRoomInfo.map((booking: any, index: number) => {
            const doesCheckoutToday =
              booking.doesCheckoutToday && booking.period === 'night';
            return (
              <div
                key={booking.room + index}
                className={`${
                  doesCheckoutToday ? 'text-error' : 'text-black'
                } flex justify-between gap-1`}
              >
                <p>{booking.room} </p>
                <p className="text-gray-400 text-right whitespace-nowrap">
                  {booking.period}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default BookingsWithRoomInfo;
