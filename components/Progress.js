// make progress bar that contains a set of inline-blocks - divs with background: black
// this component receives a prop called progress, which is a number and a prop called total, which is a number
// the progress prop is the current step, and the total prop is the total number of steps
import React from 'react';

import PropTypes from 'prop-types';

export const Progress = ({ progress, total }) => {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center space-between">
      {steps.map((step) => (
        <div
          key={step}
          className={`flex-1 h-1 border border-solid rounded-xl mr-1 ${
            step <= progress
              ? 'bg-black border-black'
              : 'bg-zinc-300 border-zinc-300'
          }`}
        />
      ))}
    </div>
  );
};

Progress.propTypes = {
  progress: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};
