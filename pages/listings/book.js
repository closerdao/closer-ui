import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Head from 'next/head';
import { fromJS } from 'immutable';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';

import api, { cdn } from '../../utils/api';
import { priceFormat } from '../../utils/helpers';
import { __ } from '../../utils/helpers';

import Layout from '../../components/Layout';
import DateTimePicker from '../../components/DateTimePicker';
import Slider from '../../components/Slider';
import ListingListPreview from '../../components/ListingListPreview';

dayjs.extend(relativeTime);

const defaultStart = dayjs().add(3, 'days').set('hours', 18).set('seconds', 0).set('minutes', 0).toDate();
const defaultEnd = dayjs().add(6, 'days').set('hours', 11).set('seconds', 0).set('minutes', 0).toDate();

const roundPrice = price => Math.round(price * 100) / 100;
const rates = {
  dailyRate: {
    label: 'night',
    duration: 1
  },
  weeklyRate: {
    label: 'week',
    duration: 7
  },
  monthlyRate: {
    label: 'month',
    duration: 30
  },
};
const formatRate = rate => (rates[rate] || rates.dailyRate).label;

const Book = ({ token }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { platform } = usePlatform();
  const [listings, setListings] = useState(false);
  const [searchInProgress, setLoading] = useState(false);
  const [isAvailable, setAvailability] = useState(false);
  const [datesAvailable, setAvailableDates] = useState([]);
  const [checkedAvailability, setAvailabilityChecked] = useState(false);
  const [booking, setBooking] = useState({
    start: defaultStart,
    end: defaultEnd,
    rate: 'dailyRate',
    duration: 3
  });
  const updateBooking = async (booking) => {
    setAvailabilityChecked(false);
    setAvailability(false);
    booking.duration = Math.abs(Math.ceil(dayjs(booking.end).diff(booking.start, 'days'))) + 1;
    booking.rate = booking.duration >= 30 ? 'monthlyRate' : booking.duration >= 7 ? 'weeklyRate' : 'dailyRate';
    setBooking(booking);
  }

  const getBookingDays = (firstDay, duration) => {
    const start = dayjs(firstDay).set('hours', 0).set('seconds', 0).set('minutes', 0);
    const days = [start];
    if (duration < 1) {
      setAvailability(false);
    }
    for (let i = 1; i <= duration; i++) {
      days.push(start.add(i, 'days').set('hours', 0).set('seconds', 0).set('minutes', 0));
    }
    return days;
  }
  // The +1 is taking into account that checkout time must be before checkin time.
  const duration = Math.abs(Math.ceil(dayjs(booking.end).diff(booking.start, 'days'))) + 1;
  const listing = booking.listing && platform.listing.findOne(booking.listing);
  const createBooking = async (listing, booking) => {
    try {
      if (!listing) {
        throw new Error('Please select a listing first.');
      }
      const { data: { results: newBooking } } = await api.post('/bookings/request', {
        start: booking.start,
        end: booking.end,
        listing: listing.get('_id'),
        price: getPrice(listing, booking)
      });

      router.push(`/bookings/${newBooking._id}/contribution`);
    } catch (err) {
      console.log(err);
      alert('There was an error creating booking.');
    }
  }
  const getPrice = (listing, booking) => listing.get(booking.rate) && listing.get(booking.rate).get('val')/rates[booking.rate].duration * booking.duration;

  const loadInventory = async (booking) => {
    setLoading(true);
    try {
      const { data: { results: availableListings, available: available, availability: availability } } = await api.post('/booking/availability', booking);
      setLoading(false);
      setListings(fromJS(availableListings));
      setAvailability(fromJS(available));
      setAvailableDates(fromJS(availability));
      setAvailabilityChecked(true);

      console.log('availability', availability)
    } catch (err) {
      setLoading(false);
      alert(err);
    }
  }

  return (
    <Layout protect>
      <Head>
        <title>{ __('listings_book_title') }</title>
      </Head>
      <div className="main-content">
        { !searchInProgress && <section className="max-w-prose">
          <h2>{ __('listings_book_subtitle') }</h2>
          <p>{ __('listings_book_copy') }</p>
        </section> }
        <section className="mt-6">
          <form onSubmit={ e => { e.preventDefault(); loadInventory(booking); } }>
            <div className="card">
              <div className="card-body flex justify-start items-center">
                <fieldset className="mr-3 flex flex-col flex-grow justify-start items-start">
                  <label htmlFor="start">{ __('listings_book_check_in') }</label>
                  <DateTimePicker
                    id="start"
                    value={ booking.start }
                    onChange={start => updateBooking({
                      ...booking,
                      start,
                      end: dayjs(start).isAfter(booking.end) ?
                        dayjs(start).set('hours', 11).set('seconds', 0).set('minutes', 0).add(3, 'days').toDate() :
                        booking.end
                    })}
                    showTime={ false }
                  />
                </fieldset>
                <fieldset className="flex flex-col flex-grow justify-center items-start">
                  <label htmlFor="end">{ __('listings_book_check_out') }</label>
                  <DateTimePicker
                    id="end"
                    value={ booking.end }
                    onChange={end => updateBooking({
                      ...booking,
                      end
                    })}
                    showTime={ false }
                  />
                </fieldset>
                <fieldset>
                  <button type="submit" className="btn-primary">{__('generic_search')}</button>
                </fieldset>
              </div>
            </div>

            <div className="md:grid md:grid-cols-3 gap-6 mt-4">
              { searchInProgress && <div className="loading">{__('generic_loading')}</div> }
              { checkedAvailability && (
                isAvailable ?
                  listings && (
                    listings.count() > 0 ?
                      listings.map(listing => (
                        <ListingListPreview
                          key={ listing.get('_id') }
                          listing={ listing }
                          rate={ booking.rate }
                          book={ () => createBooking(listing, booking) }
                        />
                      )):
                      <div className="no-match">{__('booking_no_available_listings')}</div>
                  ):
                  <div className="no-match">{__('booking_no_available_listings')} ({(datesAvailable && datesAvailable.filter(d => d.available) || []).length}/{datesAvailable && datesAvailable.length})</div>
              )
              }
            </div>
          </form>
        </section>
      </div>
    </Layout>
  );
}

export default Book;
