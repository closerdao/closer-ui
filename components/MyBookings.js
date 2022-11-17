import { useEffect } from 'react';
import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import BookingListPreview from './BookingListPreview';
import { __ } from '../utils/helpers';
import dayjs from 'dayjs';

const MyBookings = () => {
  const { user } = useAuth();
  const { platform } = usePlatform();
  const now = dayjs().format('YYYY-MM-DDTHH:mm')
  const myBookingsFilter = user && { where: { createdBy: user._id, status: ['pending', 'confirmed', 'checkedIn'], end: { $gt: now } } };

  const loadData = async () => {
    await Promise.all([
      platform.booking.get(myBookingsFilter),
      platform.listing.get(),
    ]);
  }

  useEffect(() => {
    if (user && user._id){
      loadData();
    }
  }, [user]);

  const myBookings = platform.booking.find(myBookingsFilter);
  const noBookings = myBookings && myBookings.count() === 0;
  const error = myBookings && myBookings.get('error')
  const listings = platform.listing.find();

  if(error) {
    return <div className="validation-error">{ JSON.stringify(error) }</div>
  }

  if(!myBookings || !listings) {
    return null;
  }
  
  return (
    <div className="columns mt-8">
      <div className="col lg two-third">
        <div className="page-header">
          <h1 className="font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center">
            <span>🏡 </span>
            <span>
              { __('bookings_title') }
            </span>
          </h1>
        </div>
        <div className="bookings-list mt-8">
          { noBookings && <p className='mt-4'>{ __('no_bookings') }</p> }
          { myBookings.map(booking => {
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

export default MyBookings