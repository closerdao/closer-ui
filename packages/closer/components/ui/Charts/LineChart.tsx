import {
  CartesianGrid,
  LabelList,
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
        <div
          key={index}
          className="text-md"
          style={{ color: CHART_COLORS[index] }}
        >{`${entry.name}: ${entry.value}`}</div>
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
            top: 25,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            style={{ fontSize: '13px' }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltipContent />} />
          <Line
            type="monotone"
            dataKey="tokens"
            stroke={CHART_COLORS[2]}
            activeDot={{ r: 8 }}
            strokeWidth={2}
          >
            {' '}
            <LabelList
              dataKey="tokens"
              position="top"
              content={(props) => {
                const { x, y, width, value } = props;
                return (
                  <text
                    x={Number(x) + (Number(width) || 0) / 2}
                    y={y}
                    dy={-10}
                    textAnchor="middle"
                    fill="#000000"
                    fontSize="12"
                  >
                    {Math.floor(Number(value))}
                  </text>
                );
              }}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineCurvedChart;
