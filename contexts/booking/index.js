import { useRouter } from 'next/router';

import { createContext, useContext, useReducer } from 'react';

import PropTypes from 'prop-types';

import { bookingReducer, initialState } from './reducer';

const BookingStateContext = createContext();
const BookingDispatchContext = createContext();

export const BookingProvider = ({ children }) => {
  const router = useRouter();
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  const { steps } = state;
  const currentStep = steps.find((step) => router.pathname.includes(step));

  const saveStepData = (data) => {
    if (!data) {
      console.error('saveStepData: data is required');
      return;
    }
    dispatch({
      type: 'SAVE_STEP_DATA',
      payload: {
        name: currentStep,
        data,
      },
    });
  };

  const saveAnswer = (answer) => {
    if (!answer) {
      console.error('saveAnswer: answer is required');
      return;
    }
    dispatch({
      type: 'SAVE_ANSWER',
      payload: answer,
    });
  };

  const startNewBooking = () => {
    dispatch({
      type: 'RESET_BOOKING',
    });
    router.push('/bookings/create');
  };

  const goBack = () => {
    router.back();
  };

  const resetBooking = () => {
    dispatch({
      type: 'RESET_BOOKING',
    });
  };

  const bookingActions = {
    saveStepData,
    saveAnswer,
    startNewBooking,
    goBack,
    resetBooking,
  };

  return (
    <BookingStateContext.Provider value={state}>
      <BookingDispatchContext.Provider value={bookingActions}>
        {children}
      </BookingDispatchContext.Provider>
    </BookingStateContext.Provider>
  );
};

export const useBookingState = () => {
  const context = useContext(BookingStateContext);
  if (context === undefined) {
    throw new Error('useBookingState must be used within a BookingProvider');
  }
  return context;
};

export const useBookingActions = () => {
  const context = useContext(BookingDispatchContext);
  if (context === undefined) {
    throw new Error('useBookingDispatch must be used within a BookingProvider');
  }
  return context;
};

BookingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
