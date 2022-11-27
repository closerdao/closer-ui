import { useRouter } from 'next/router';

import { createContext, useContext, useEffect, useReducer } from 'react';

import PropTypes from 'prop-types';

import api from '../../utils/api';
import { bookingReducer, initialState } from './reducer';

const BookingStateContext = createContext();
const BookingDispatchContext = createContext();

export const BookingProvider = ({ children }) => {
  const router = useRouter();
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  const { steps, settings } = state;
  const currentStep = steps.find((step) => step.path === router.pathname);

  useEffect(() => {
    const hasNoSettings = Object.keys(settings).length === 0;
    const fetchSettings = async () => {
      const {
        data: { results },
      } = await api.get('/bookings/settings');
      dispatch({ type: 'SET_SETTINGS', payload: results });
    };
    if (hasNoSettings) {
      fetchSettings();
    }
  });

  const saveStepData = (data) => {
    if (!data) {
      console.error('saveStepData: data are required');
      return;
    }
    dispatch({
      type: 'SET_STEP_DATA',
      payload: {
        path: router.pathname,
        data,
      },
    });
  };

  const goToNextStep = () => {
    const nextStepPath = currentStep.next;
    if (!nextStepPath) {
      return;
    }
    router.push(nextStepPath);
  };

  const startNewBooking = () => {
    dispatch({
      type: 'RESET_BOOKING',
    });
    router.push('/bookings/new');
  };

  const goBack = () => {
    const currentStepIndex = steps.indexOf(currentStep);
    const previousStepPath = steps[currentStepIndex - 1]?.path;
    if (!previousStepPath) {
      return;
    }
    router.push(previousStepPath);
  };

  const resetBooking = () => {
    dispatch({
      type: 'RESET_BOOKING',
    });
  };
  

  const bookingActions = {
    saveStepData,
    goToNextStep,
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
