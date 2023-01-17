const TokenSaleCountdown = ({ hours, minutes, seconds }) => {
  return (
    <div className="flex gap-10">
      <div className="flex flex-col items-center">
        <p className="font-black text-4xl">{Math.ceil(hours / 24)}</p>
        <p>days</p>
      </div>
      <div className="flex flex-col items-center">
        <p className="font-black text-4xl">{hours}</p>
        <p>hours</p>
      </div>
      <div className="flex flex-col items-center">
        <p className="font-black text-4xl">{minutes}</p>
        <p>minutes</p>
      </div>
      <div className="flex flex-col items-center">
        <p className="font-black text-4xl">{seconds}</p>
        <p>seconds</p>
      </div>
    </div>
  );
};

export default TokenSaleCountdown;
