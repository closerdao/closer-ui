import Countdown from 'react-countdown';

const TokenSalePage = () => {
  // Renderer callback with condition
  const renderer = ({ hours, minutes, seconds, completed }) => {
    if (completed) {
      // Render a completed state
      return <div>The waiting is over</div>;
    } else {
      // Render a countdown
      return (
        <div>
          <span>{Math.ceil(hours / 24)}</span>
          <span>{hours}:</span>
          <span>{minutes}:</span>
          <span>{seconds}</span>
        </div>
      );
    }
  };

  return <Countdown date={Date.now() + 5000} renderer={renderer} />;
};

export default TokenSalePage;
