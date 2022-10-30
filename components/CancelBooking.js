import { priceFormat, __ } from '../utils/helpers';
import { useState } from 'react'
import api from '../utils/api';

const CancelBooking = ({ setCancelCompleted, bookingId }) => {
  const [error, setError] = useState(null)
  const cancelBooking = () => {
    try {
      api.post(`/bookings/${bookingId}/cancel`);
      setCancelCompleted(true)
    } catch (err) {
      console.error('Error', err.message);
      setError(err.message)
    }
  }

  const backToBookings = () => {
    router.push('/bookings')
  }
  
  return (
    <main className="main-content max-w-prose pb-16">
      <h1 className="text-[32px] leading-[48px] font-normal border-b border-[#e1e1e1] border-solid pb-2">
        <span className="text-red-500">!? </span><span>{ __('cancel_booking_title') }</span>
      </h1>
      <h2 className="text-2xl leading-10 font-normal my-16">
        { __('cancel_booking_details') }
      </h2>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      </p>
      <h2 className="text-2xl leading-10 font-normal my-16">
        { __('cancel_booking_refund_policy') }
      </h2>
      <h2 className="text-2xl leading-10 font-normal my-16 border-b border-[#e1e1e1] border-solid pb-2">
        { __('cancel_booking_refund_total') }
      </h2>
      <div className="flex justify-between mb-16">
        <p>{ __('cancel_booking_fiat_description') }</p>
        <p className="font-black">{priceFormat(300)}</p>
      </div>
      <div className="flex flex-col space-y-8">
        { error ? <p className="text-red-500">{error}</p> 
          : <button className="btn" onClick={cancelBooking}>
            { __('generic_yes').toUpperCase() }
          </button>
        }
        <button className="btn" onClick={backToBookings}>
          { __('generic_no').toUpperCase() }
        </button>
      </div>
    </main>
  )
}

export default CancelBooking