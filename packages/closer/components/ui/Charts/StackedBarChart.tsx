import { useTranslations } from 'next-intl';
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

import { useConfig } from '../../../hooks/useConfig';
import { formatThousands } from '../../../utils/dashboard.helpers';
import { CHART_COLORS } from './chartColors';

interface Props {
  data: Record<string, string | number>[];
  layout?: 'horizontal' | 'vertical';
}

interface CustomPayload {
  name: string;
  value: string | number;
}

const CustomTooltipContent = ({ payload, label, layout }: any) => {
  const t = useTranslations();

  if (!payload || !Array.isArray(payload)) return null;

  // Debug logging
  console.log('StackedBarChart Tooltip Debug:', {
    payload,
    label,
    payloadValues: payload.map((entry: CustomPayload) => ({
      name: entry.name,
      value: entry.value,
      valueType: typeof entry.value,
      isNaN: isNaN(Number(entry.value)),
    })),
  });

  const total = Math.floor(
    payload.reduce((sum: number, entry: CustomPayload) => {
      const value = Number(entry.value);
      return sum + (isNaN(value) ? 0 : value);
    }, 0),
  );

  return (
    <div className="p-4 bg-white rounded-md border-0 shadow-lg">
      <p className="text-md font-bold">{label}</p>
      {payload.map((entry: CustomPayload, index) => (
        <div
          key={index}
          className="text-md"
          style={{ color: CHART_COLORS[index] }}
        >{`${entry.name}: ${entry.value} `}</div>
      ))}

      {layout === 'horizontal' && (
        <div className="font-bold">
          {t('dashboard_total')} {total}{' '}
        </div>
      )}
    </div>
  );
};

const StackedBarChart = ({ data, layout = 'horizontal' }: Props) => {
  const { APP_NAME } = useConfig();

  return (
    <div className="w-full h-full py-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout={layout || 'horizontal'}
          width={500}
          height={300}
          data={data}
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
              content={
                <CustomTooltipContent
                  layout={layout}
                  colorOverride={CHART_COLORS[4]}
                />
              }
            />
          )}
          <Legend iconType="circle" />
          {layout === 'horizontal' && (
            <>
              <Bar dataKey="events" stackId="a" fill={CHART_COLORS[0]} />
              <Bar dataKey="spaces" stackId="a" fill={CHART_COLORS[1]} />
              <Bar dataKey="food" stackId="a" fill={CHART_COLORS[2]} />

              <Bar dataKey="hospitality" stackId="a" fill={CHART_COLORS[3]}>
                {APP_NAME !== 'tdf' && (
                  <LabelList
                    dataKey="totalOperations"
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
                          {value}
                        </text>
                      );
                    }}
                  />
                )}{' '}
              </Bar>
              {APP_NAME === 'tdf' && (
                <>
                  <Bar
                    dataKey="fiat token sales"
                    stackId="a"
                    fill={CHART_COLORS[5]}
                  >
                    <LabelList
                      dataKey="totalOperations"
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
                            €{formatThousands(Number(value))}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                  <Bar
                    dataKey="crypto token sales"
                    stackId="a"
                    fill={CHART_COLORS[6]}
                  />
                  <Bar
                    dataKey="subscriptions"
                    stackId="a"
                    fill={CHART_COLORS[4]}
                  />
                </>
              )}
            </>
          )}
          {layout === 'vertical' && (
            <>
              <Bar dataKey="amount" stackId="a" fill={CHART_COLORS[1]}>
                <LabelList
                  dataKey="amount"
                  position="insideLeft"
                  content={(props) => {
                    const { x, y, height, width, value } = props;

                    const fill = Number(width) > 40 ? 'white' : 'silver';
                    return (
                      <text
                        x={x}
                        y={y}
                        dy={Number(height) / 2 + 5}
                        dx={5}
                        textAnchor="center"
                        fill={fill}
                      >
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
