import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { BookingBackButton } from '../../../components/BookingBackButton';
import { BookingProgress } from '../../../components/BookingProgress';
import DateTimePicker from '../../../components/DateTimePicker';
import Layout from '../../../components/Layout';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useAuth } from '../../../contexts/auth';
import { useBookingActions, useBookingState } from '../../../contexts/booking';
import { __ } from '../../../utils/helpers';

dayjs.extend(relativeTime);

const defaultStart = dayjs()
  .add(3, 'days')
  .set('hours', 18)
  .set('seconds', 0)
  .set('minutes', 0)
  .toDate();
const defaultEnd = dayjs()
  .add(6, 'days')
  .set('hours', 11)
  .set('seconds', 0)
  .set('minutes', 0)
  .toDate();

const DatesSelector = () => {
  const { user } = useAuth();
  const isMember = user?.roles.includes('member');

  const { steps, settings } = useBookingState();

  const router = useRouter();
  const currentStep = steps.find((step) => step.path === router.pathname);
  const savedData = currentStep.data;
  const { saveStepData, goToNextStep, startNewBooking } = useBookingActions();
  const [startDate, setStartDate] = useState(
    savedData.startDate || defaultStart,
  );
  const [endDate, setEndDate] = useState(savedData.endDate || defaultEnd);
  const totalNights =
    Math.abs(Math.ceil(dayjs(startDate).diff(endDate, 'days'))) + 1;

  const handleNext = () => {
    saveStepData({
      startDate,
      endDate,
      totalNights,
    });
    goToNextStep();
  };

  const guestsDataUndefined =
    steps.find((step) => step.path === '/bookings/new/guests').data.adults ===
    undefined;

  useEffect(() => {
    if (guestsDataUndefined) {
      startNewBooking();
    }
  }, []);

  if (!settings.conditions) {
    return null;
  }

  const memberConditions = settings.conditions.member;
  const guestConditions = settings.conditions.guest;

  return (
    <Layout>
      <div className="max-w-screen-sm mx-auto p-8 h-full">
        <BookingBackButton />
        <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">📆</span>
          <span>{__('bookings_dates_step_title')}</span>
        </h1>
        <BookingProgress />
        <h2 className="text-2xl leading-10 font-normal mt-16 mb-4">
          {__('bookings_dates_step_subtitle')}
        </h2>
        <p>
          {isMember &&
            __(
              'bookings_dates_step_member_book_horizon',
              memberConditions.maxBookingHorizon,
            ) +
              ', ' +
              __(
                'bookings_dates_step_book_duration',
                memberConditions.maxDuration,
              )}
          {!isMember &&
            __(
              'bookings_dates_step_guest_book_horizon',
              guestConditions.maxBookingHorizon,
            ) +
              ', ' +
              __(
                'bookings_dates_step_book_duration',
                guestConditions.maxDuration,
              )}
        </p>
        <div className="mt-16 flex justify-between items-center md:px-20">
          <div>
            <label className="capitalize font-normal" htmlFor="start">
              {__('listings_book_check_in')}
            </label>
            <DateTimePicker
              id="start"
              value={startDate}
              minValue={dayjs().format('YYYY-MM-DD')}
              maxValue={dayjs()
                .add(
                  isMember
                    ? memberConditions.maxBookingHorizon
                    : guestConditions.maxBookingHorizon,
                  'days',
                )
                .format('YYYY-MM-DD')}
              onChange={setStartDate}
              showTime={false}
            />
          </div>
          <div>
            <label className="capitalize font-normal mb-0" htmlFor="end">
              {__('listings_book_check_out')}
            </label>
            <DateTimePicker
              id="end"
              value={endDate}
              minValue={dayjs(startDate).add(1, 'days').format('YYYY-MM-DD')}
              maxValue={dayjs(startDate)
                .add(
                  isMember
                    ? memberConditions.maxDuration
                    : guestConditions.maxDuration,
                  'days',
                )
                .format('YYYY-MM-DD')}
              onChange={setEndDate}
              showTime={false}
            />
          </div>
        </div>
        <div className="mt-8 mb-16 flex justify-between">
          <p>{__('bookings_dates_step_total')}</p>
          <p className="font-bold">{totalNights}</p>
        </div>
        <button className="booking-btn" onClick={handleNext}>
          {__('generic_search')}
        </button>
      </div>
    </Layout>
  );
};

export default DatesSelector;
