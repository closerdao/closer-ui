interface RowProps {
  rowKey: string;
  value: string | number;
  additionalInfo?: string;
}

const Row = ({ rowKey, value, additionalInfo }: RowProps) => {
  return (
    <>
      <div className="text-md flex justify-between mb-2">
        <div>{rowKey}</div>
        <div className="text-right">
          <div className="uppercase font-[700]">{value}</div>
          {additionalInfo && <div className="text-xs">{additionalInfo}</div>}
        </div>
      </div>
    </>
  );
};

export default Row;
