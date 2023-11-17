import PropTypes from 'prop-types';

import MinusCircleIcon from './icons/MinusCircleIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';

const Counter = ({ value, minValue, maxValue, setFn }) => {
  const increment = () => {
    if (value < maxValue) {
      setFn((prevValue) => prevValue + 1);
    }
  }
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
  maxValue: -1,
  setFn: () => null,
};

Counter.propTypes = {
  value: PropTypes.number,
  minValue: PropTypes.number,
  maxValue: PropTypes.number,
  setFn: PropTypes.func,
};

export default Counter;
