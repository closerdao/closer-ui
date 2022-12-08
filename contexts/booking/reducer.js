import { data } from 'autoprefixer';

export const initialState = {
  steps: [
    'dates',
    'accomodation',
    'questions',
    'summary',
    'checkout',
    'confirmation',
  ],
  data: {
    questions: new Map(),
  },
};

export const bookingReducer = (state, action) => {
  switch (action.type) {
    case 'SAVE_STEP_DATA':
      return {
        ...state,
        data: {
          [action.payload.name]: data,
        },
      };

    case 'SAVE_ANSWER':
      const answer = action.payload;
      const answers = state.data.questions;
      const newMap = answers.size ? new Map(answers) : new Map();
      newMap.set(answer.name, answer.value);
      return {
        ...state,
        data: {
          questions: newMap,
        },
      };

    case 'RESET_BOOKING':
      return initialState;

    default:
      throw new Error(`Invalid action type: ${action.type}`);
  }
};
