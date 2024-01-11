import Image from 'next/image';
import Link from 'next/link';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import dayjs from 'dayjs';

import { cdn } from '../utils/api';
import { __ } from '../utils/helpers';

const UserBookingPreview = ({
  booking: bookingItem,
}) => {
  const {
    _id,
    start,
    end,
    userId,
    adults,
    children,
    infants,
    listingName,
    userInfo,
    doesNeedPickup,
    status,
  } = bookingItem;

  const photoUrl = userInfo ? `${cdn}${userInfo?.photo}-profile-lg.jpg` : null;

  const startFormatted = dayjs(start).format('DD/MM/YYYY');
  const endFormatted = dayjs(end).format('DD/MM/YYYY');

  // if they need pickup and haven't surely arrived yet, flag it
  const flagPickup = doesNeedPickup && start > new Date(Date.now() - 12 * 60 * 60 * 1000);

  return (
    <div className="sm:max-w-[330px] min-w-[220px] max-w-full w-full sm:w-1/3 bg-white rounded-lg p-4 shadow-xl flex-1  flex flex-col ">
      <div className="flex flex-col gap-3">        
        {flagPickup && (<div className="bg-red-400 rounded-md text-center justify-center">Pickup Needed</div>)}

        <Link passHref href={`/members/${userId}`}>
          <div className="bg-neutral rounded-md py-1.5 text-center flex items-center gap-2 hover:bg-accent hover:text-white justify-center">
            <div>
            {userInfo?.photo ? (
              <Image
                src={photoUrl}
                alt={userInfo?.name}
                width={160}
                height={160}
                className="rounded-full"
              />
            ) : (
              <FaUser className="text-success w-[3opx] h-[30px] " />
            )}
            </div>
            <div>
            {userInfo?.name}
            </div>
          </div>
        </Link>

        <div>
          <p className="card-feature">{__('booking_card_guests')}</p>
          <p>{adults + children + infants} Guests
            { children || infants ? `(${children} Children, ${infants} Infants)` : '' } 
          </p> 
        </div>

        <div>
          <p className="card-feature">{__('booking_card_status')}</p>
          <p>{status}</p> 
        </div>

        <div>
          <p className="card-feature">{__('user_data_diet')}</p>
          <p>{userInfo?.preferences?.diet}</p>
        </div>

        <div>
          <p className="card-feature">{__('booking_card_type')}</p>
          <p>{listingName}</p>
        </div>

        <div>
          <p className="card-feature">{__('user_preview_stay')}</p>
          <p>{startFormatted} - {endFormatted}</p>
        </div>

        <p className="card-feature">Booking # {_id}</p>

      </div>
    </div>
  );
};

export default UserBookingPreview;
