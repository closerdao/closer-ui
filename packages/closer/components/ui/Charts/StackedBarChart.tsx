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

const CustomTooltipContent = ({ payload, label, colorOverride }: any) => {
  if (!payload || !Array.isArray(payload)) return null;

  return (
    <div className="p-4 bg-white rounded-md border-0 shadow-lg">
      <p className="text-md font-bold">{label}</p>
      {payload.map((entry: CustomPayload, index) => (
        <div
          key={index}
          className="text-md"
          style={colorOverride ? { color: colorOverride } : { color: CHART_COLORS[index] }}
        >{`${entry.name}: ${entry.value}`}</div>
      ))}
    </div>
  );
};

const StackedBarChart = ({ data, layout = 'horizontal' }: Props) => {
  const dataWithTotalValues = data?.map((item) => ({
    ...item,
    total: Object.keys(item).reduce((sum, key) => {
      if (key !== 'name' && typeof item[key] === 'number') {
        return sum + (item[key] as number);
      }
      return sum;
    }, 0),
  }));

  return (
    <div className="w-full h-full py-4">
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
                  right: 0,
                  left: 80,
                  bottom: 10,
                }
              : {
                  top: 20,
                  right: 0,
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
              style={{ fontSize: '13px' }}
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
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={false}
              />
            </>
          )}

          {layout === 'horizontal' && (
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={<CustomTooltipContent />}
            />
          )}
          {layout === 'vertical' && (
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={<CustomTooltipContent colorOverride={CHART_COLORS[1]} />}
            />
          )}
          <Legend
            iconType="circle"
          />
          {layout === 'horizontal' && (
            <>
              <Bar dataKey="hospitality" stackId="a" fill={CHART_COLORS[0]} />
              <Bar dataKey="events" stackId="a" fill={CHART_COLORS[1]} />
              <Bar dataKey="spaces" stackId="a" fill={CHART_COLORS[2]} />
              <Bar dataKey="food" stackId="a" fill={CHART_COLORS[3]} />
              <Bar dataKey="subscriptions" stackId="a" fill={CHART_COLORS[4]} />
              {/* <Bar dataKey="tokens" stackId="a" fill={CHART_COLORS[5]}>
                <LabelList
                  style={{ fill: 'black', fontSize: '13px' }}
                  dataKey="total"
                  position="top"
                  formatter={(props: any) => {
                    return `${props}`;
                  }}
                />
              </Bar> */}
            </>
          )}
          {layout === 'vertical' && (
            <>
              <Bar dataKey="amount" stackId="a" fill={CHART_COLORS[1]}>
                <LabelList
                  dataKey="amount"
                  position="insideLeft"
                  // style={{ fill: 'silver' }}
                  content={(props) => {
                    const { x, y, height, value } = props;
                    const fill = Number(value) > 3 ? 'white' : 'silver';
                    return (
                      <text x={x} y={y} dy={Number(height) / 2 + 5} dx={5} textAnchor="center" fill={fill}>
                        {value}
                      </text>
                    );
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
