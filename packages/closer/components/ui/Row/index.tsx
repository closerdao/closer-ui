interface RowProps {
  rowKey: string | undefined;
  value: string | number | undefined;
  additionalInfo?: string;
  className?: string;
}

const Row = ({ rowKey, value, additionalInfo, className }: RowProps) => {
  return (
    <>
      <div className={`text-md flex justify-between ${className || ''}`}>
        <div>{rowKey}</div>
        <div className="text-right">
          <div className="uppercase font-bold">{value}</div>
          {additionalInfo && <div className="text-xs">{additionalInfo}</div>}
        </div>
      </div>
    </>
  );
};

export default Row;
