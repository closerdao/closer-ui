import { Cell, Legend, Pie, PieChart } from 'recharts';

import { CHART_COLORS } from './chartColors';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  value,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ fontWeight: 'bold', fontSize: '1.2rem' }}
    >
      {value}
    </text>
  );
};

interface Props {
  data: Record<string, unknown>[];
}

const DonutChart = ({ data }: Props) => {
  return (
    <div className="">
      <PieChart width={320} height={220}>
        <Pie
          data={data}
          cx={100}
          cy={110}
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={90}
          innerRadius={50}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Legend align="right" verticalAlign="middle" layout="vertical" />
      </PieChart>
    </div>
  );
};

export default DonutChart;
