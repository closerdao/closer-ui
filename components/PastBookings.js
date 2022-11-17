import BookingListPreview from './BookingListPreview';
import { useEffect } from 'react';
import { __ } from '../utils/helpers';
import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import dayjs from 'dayjs';

const PastBookings = () => {
  const { user } = useAuth();
  const { platform } = usePlatform();
  const now = dayjs().format('YYYY-MM-DDTHH:mm')
  const pastBookingsFilter = user && { where: { createdBy: user._id, end: { $lt: now }  } };

  const loadData = async () => {
    await Promise.all([
      platform.booking.get(pastBookingsFilter),
      platform.listing.get(),
    ]);
  }

  useEffect(() => {
    if (user && user._id){
      loadData();
    }
  }, [user]);

  const pastBookings = platform.booking.find(pastBookingsFilter);
  const listings = platform.listing.find();

  if(error) {
    return <div className="validation-error">{ JSON.stringify(error) }</div>
  }
  
  if(!pastBookings) {
    return null;
  }
  
  const error = pastBookings && pastBookings.get('error')
  const noPastBookings = pastBookings.count() === 0;

  return (
    <div className="columns mt-8">
      <div className="col lg two-third">
        <div className="page-header">
          <h1 className="font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center">
            { __('past_bookings_title') }
          </h1>
        </div>
        <div className="bookings-list mt-8">
          { noPastBookings && <p className='mt-4'>{ __('no_past_bookings') }</p> }
          { pastBookings.map(booking => {
            const listingId = booking.get('listing');
            const listing = listings.find(listing => listing.get('_id') === listingId);
            const listingName = listing.get('name')

            return (
              <BookingListPreview 
                key={ booking.get('_id') } 
                booking={ booking } 
                listingName={listingName} 
              />
            )
          }) }
        </div>
      </div>
    </div>
  )
}

export default PastBookings