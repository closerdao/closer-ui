import {
  Bar,
  BarChart,
  LabelList,
  Legend,
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
    <div className="p-4 bg-white rounded-md border-0 shadow-lg">
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

const StackedBarChart = ({ data }: Props) => {
  const dataWithTotalValues = data.map((item) => ({
    ...item,
    total: Object.keys(item).reduce((sum, key) => {
      if (key !== 'name' && typeof item[key] === 'number') {
        return sum + (item[key] as number);
      }
      return sum;
    }, 0),
  }));

  return (
    <div className="w-full h-[400px] py-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          width={500}
          height={300}
          data={dataWithTotalValues}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <XAxis dataKey="name" axisLine={false} tickLine={false} />

          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={<CustomTooltipContent />}
          />
          <Legend />
          <Bar dataKey="Hospitality" stackId="a" fill={CHART_COLORS[0]} />
          <Bar dataKey="Events" stackId="a" fill={CHART_COLORS[1]} />
          <Bar dataKey="Spaces" stackId="a" fill={CHART_COLORS[2]} />
          <Bar dataKey="Subscriptions" stackId="a" fill={CHART_COLORS[3]} />
          <Bar dataKey="Tokens" stackId="a" fill={CHART_COLORS[4]}>
            <LabelList
              style={{ fill: 'black' }}
              dataKey="total"
              position="top"
              formatter={(props: any) => {
                return `${props}`;
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StackedBarChart;
