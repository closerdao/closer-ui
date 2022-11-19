// create a counter component with three inline elements: value, increment, and decrement
// increment and decrement should be buttons that PLusCircleIcon and MinusCircleIcon
// value should be a span
//
// the counter component should accept a value and a setFn prop
// the value prop should be the current value of the counter
// the setFn prop should be a function that updates the value prop
//
// the counter component should have a default value of 0
// Path: components/Counter.js
import PropTypes from 'prop-types';

import MinusCircleIcon from './icons/MinusCircleIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';

export const Counter = ({ value, minValue, setFn }) => {
  const increment = () => setFn((prevValue) => prevValue + 1);
  const decrement = () => {
    if (value > minValue) {
      setFn((prevValue) => prevValue - 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {value}
      <button className="" onClick={decrement}>
        <MinusCircleIcon />
      </button>
      <button className="" onClick={increment}>
        <PlusCircleIcon />
      </button>
    </div>
  );
};

Counter.defaultProps = {
  value: 0,
  minValue: 0,
  setFn: () => {},
};

Counter.propTypes = {
  value: PropTypes.number,
  minValue: PropTypes.number,
  setFn: PropTypes.func,
};
