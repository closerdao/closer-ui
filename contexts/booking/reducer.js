import { BOOKING_PATHS } from '../../utils/const';

export const initialState = {
  steps: BOOKING_PATHS.map((path) => ({
    path,
    next: BOOKING_PATHS[BOOKING_PATHS.indexOf(path) + 1] || null,
    data: {},
  })),
};

export const bookingReducer = (state, action) => {
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
    case 'RESET_BOOKING':
      return initialState;

    default:
      throw new Error(`Invalid action type: ${action.type}`);
  }
};
