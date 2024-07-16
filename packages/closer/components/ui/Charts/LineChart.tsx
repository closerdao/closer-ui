import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

import { CHART_COLORS } from './chartColors';

interface Props {
  data: Record<string, string | number>[];
}

interface CustomPayload {
  name: string;
  value: string | number;
}

const CustomTooltipContent = ({ payload, label }: any) => {
  if (!payload || !Array.isArray(payload)) return null;

  return (
    <div className="p-4 bg-white rounded-md border-0 shadow-lg ">
      <p className="text-md font-bold">{label}</p>
      {payload.map((entry: CustomPayload, index) => (
        <p
          key={index}
          className="text-md"
          style={{ color: CHART_COLORS[index] }}
        >{`${entry.name}: ${entry.value}`}</p>
      ))}
    </div>
  );
};

const LineCurvedChart = ({ data }: Props) => {
  return (
    <div className="w-full h-[400px] py-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />

          <Tooltip content={<CustomTooltipContent />} />
          <Line
            type="monotone"
            dataKey="Revenue"
            stroke={CHART_COLORS[0]}
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineCurvedChart;
