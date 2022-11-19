import { createContext, useContext, useReducer } from 'react';

const BookingStateContext = createContext();
const BookingDispatchContext = createContext();

const BOOKING_STEPS = [
  '/bookings/new/guests',
  '/bookings/new/dates',
  '/bookings/new/accomodation',
  '/bookings/new/questionnaire',
  '/bookings/new/checkout',
  '/bookings/new/confirmation',
];

const initialState = {
  steps: BOOKING_STEPS.map((path) => ({
    path,
    next: BOOKING_STEPS[BOOKING_STEPS.indexOf(path) + 1] || null,
    data: {},
  })),
};

export const BookingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  const bookingReducer = (state, action) => {
    switch (action.type) {
      case 'SET_CURRENT_STEP':
        return {
          ...state,
          currentStep: action.payload,
        };
      case 'SET_STEP_DATA':
        return {
          ...state,
          steps: state.steps.map((step) => {
            if (step.path === action.payload.path) {
              return {
                ...step,
                data: action.payload.data,
              };
            }
            return step;
          }),
        };
      default:
        return state;
    }
  };

  const saveStepData = (path, data) => {
    if (!BOOKING_STEPS.includes(path)) {
      throw new Error(
        `Invalid step: ${path}, please use one of ${BOOKING_STEPS}`,
      );
    }
    dispatch({
      type: 'SET_STEP_DATA',
      payload: {
        path,
        data,
      },
    });
  };

  const bookingActions = {
    saveStepData,
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
