import React from 'react';

import PropTypes from 'prop-types';

const Progress = ({ progress, total }) => {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center space-between">
      {steps.map((step) => (
        <div
          key={step}
          className={`flex-1 h-1 border border-solid rounded-xl mr-1 ${
            step <= progress
              ? 'bg-primary border-primary'
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

export default Progress;
