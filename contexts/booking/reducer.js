import { BOOKING_PATHS } from '../../utils/const';

export const initialState = {
  steps: BOOKING_PATHS.map((path) => ({
    path,
    next: BOOKING_PATHS[BOOKING_PATHS.indexOf(path) + 1] || null,
    data: {},
  })),
  settings: {},
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
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.payload,
      };

    case 'RESET_BOOKING':
      return initialState;

    default:
      throw new Error(`Invalid action type: ${action.type}`);
  }
};

// // state.settings:
// {
//   "utilityFiat": {
//       "val": 10,
//       "cur": "EUR"
//   },
//   "utilityToken": {
//       "val": 0.04504504504504504,
//       "cur": "$TDF"
//   },
//   "checkinTime": 14,
//   "checkoutTime": 11,
//   "maxDuration": 180,
//   "minDuration": 1,
//   "conditions": {
//       "member": {
//           "maxDuration": 180,
//           "maxBookingHorizon": 365
//       },
//       "guest": {
//           "maxDuration": 14,
//           "maxBookingHorizon": 30
//       }
//   },
//   "discounts": {
//       "weekly": 0.3,
//       "monthly": 0.5,
//       "highseason": 0.3
//   },
//   "cancellationPolicy": {
//       "lastday": 0,
//       "lastweek": 0,
//       "lastmonth": 0.5,
//       "default": 1
//   },
//   "questions": [
//       {
//           "type": "text",
//           "name": "What brings you to Closer?",
//           "required": true
//       },
//       {
//           "type": "text",
//           "name": "Do you have any dietary needs?"
//       },
//       {
//           "type": "select",
//           "name": "How do you like your mattress?",
//           "options": [
//               "soft",
//               "medium",
//               "hard"
//           ]
//       }
//   ],
//   "visitorsGuide": "https://docs.google.com/document/d/198vWYEQCC1lELQa8f76Jcw3l3UDiPcBKt04PGFKnUvg/edit#",
//   "bookingQuestionnaire": [
//       {
//           "fieldType": "text",
//           "name": "What brings you to Closer?"
//       },
//       {
//           "fieldType": "text",
//           "name": "Do you have any dietary needs?"
//       },
//       {
//           "fieldType": "select",
//           "name": "How do you like your mattress?",
//           "options": [
//               "soft",
//               "medium",
//               "hard"
//           ]
//       }
//   ]
// }
