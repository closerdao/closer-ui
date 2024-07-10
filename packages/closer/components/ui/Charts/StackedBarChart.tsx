import {
  Bar,
  BarChart,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CHART_COLORS } from './chartColors';

interface Props {
  data: Record<string, string | number>[];
  layout?: 'horizontal' | 'vertical';
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



const StackedBarChart = ({ data, layout = 'horizontal' }: Props) => {
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
          layout={layout || 'horizontal'}
          width={500}
          height={300}
          data={dataWithTotalValues}
          margin={
            layout === 'vertical'
              ? {
                  top: 20,
                  right: 30,
                  left: 120,
                  bottom: 10,
                }
              : {
                  top: 20,
                  right: 10,
                  left: 10,
                  bottom: 10,
                }
          }
        >
          {layout === 'horizontal' && (
            <XAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'black' }}
            />
          )}
          {layout === 'vertical' && (
            <>
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
            
                tick={{ fill: 'black', width: 180 }}
              />
              <XAxis type="number"  axisLine={false}
                tickLine={false}
                tick={false}
              />
                
                
            </>
          )}

          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={<CustomTooltipContent />}
          />
          <Legend />
          {layout === 'horizontal' && (
            <>
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
            </>
          )}
          {layout === 'vertical' && (
            <>
              <Bar dataKey="Platform" stackId="a" fill={CHART_COLORS[0]}>
              <LabelList dataKey="Platform" position="insideLeft" style={{ fill: 'white' }} />

              </Bar>

              <Bar dataKey="External" stackId="a" fill={CHART_COLORS[1]}>
              <LabelList dataKey="External" position="insideLeft" style={{ fill: 'white' }} />

                <LabelList
                  style={{ fill: 'black' }}
                  dataKey="total"
                  position={layout === 'vertical' ? 'right' : 'top'}
                  formatter={(props: any) => {
                    return `${props}`;
                  }}
                />
              </Bar>
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StackedBarChart;
