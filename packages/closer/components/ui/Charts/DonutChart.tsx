import { Cell, Legend, Pie, PieChart } from 'recharts';

import { CHART_COLORS } from './chartColors';

import { isMobile } from 'react-device-detect';
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
    <div className=''>

      <PieChart width={isMobile ? 190 : 370} height={isMobile ? 280 : 220}>
        <Pie
          data={data}
          cx={isMobile ? 90 : 100}
          cy={110}
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={90}
          innerRadius={50}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Legend
          payload={data.map((item: Record<string, unknown>, index: number) => ({
            id: item.name as string,
            type: 'circle',
            value: item.name as string,
            color: CHART_COLORS[index % CHART_COLORS.length],
          }))}
          align={isMobile ? 'center' : 'right'}

          // verticalAlign="top"
          verticalAlign={isMobile ? 'bottom' : 'top'}
             layout={isMobile ? 'horizontal' : 'vertical' }
           
          // layout="vertical"
            // layout="horizontal"
          wrapperStyle={{ marginTop: '50px' }} // Add top margin here

        />
      </PieChart>
    </div>
  );
};

export default DonutChart;
