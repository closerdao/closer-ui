interface PercentageBarProps {
  percentage: number;
}

const PercentageBar = ({ percentage }: PercentageBarProps) => {
  return (
    <div className="bg-gray-100 rounded-full">
      <div
        className="bg-accent h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${percentage}%`, maxWidth: '100%' }}
      />
    </div>
  );
};

export default PercentageBar;
