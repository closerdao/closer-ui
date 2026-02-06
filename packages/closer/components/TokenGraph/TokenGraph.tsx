import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, Heading } from '../ui';
import { CHART_COLORS } from '../ui/Charts/chartColors';
import api from '../../utils/api';
import {
  TokenGraphDataPoint,
  TokenGraphResponse,
} from '../../types/token';
import { formatThousands } from '../../utils/dashboard.helpers';

interface ChartDataPoint {
  name: string;
  value: number;
}

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

const formatGraphData = (
  raw: TokenGraphResponse,
): { supply: ChartDataPoint[]; price: ChartDataPoint[] } => {
  const supply: ChartDataPoint[] = [];
  const price: ChartDataPoint[] = [];
  const cutoff = new Date(Date.now() - TWELVE_MONTHS_MS).getTime();

  if (raw.data?.length) {
    raw.data
      .filter((point) => new Date(point.date).getTime() >= cutoff)
      .forEach((point: TokenGraphDataPoint) => {
      const label =
        point.date?.length > 10
          ? new Date(point.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: '2-digit',
            })
          : point.date;
      if (point.supply != null)
        supply.push({ name: label, value: point.supply });
      if (point.tokenPrice != null)
        price.push({ name: label, value: point.tokenPrice });
    });
  }

  if (raw.supply?.length && supply.length === 0) {
    raw.supply
      .filter((point) => new Date(point.date).getTime() >= cutoff)
      .forEach((point) => {
      const label =
        point.date?.length > 10
          ? new Date(point.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: '2-digit',
            })
          : point.date;
      supply.push({ name: label, value: point.value });
    });
  }

  if (raw.price?.length && price.length === 0) {
    raw.price
      .filter((point) => new Date(point.date).getTime() >= cutoff)
      .forEach((point) => {
      const label =
        point.date?.length > 10
          ? new Date(point.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: '2-digit',
            })
          : point.date;
      price.push({ name: label, value: point.value });
    });
  }

  return { supply, price };
};

interface SingleChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  color: string;
  valueFormatter?: (v: number) => string;
}

const SingleLineChart = ({
  data,
  dataKey,
  color,
  valueFormatter = (v) => v.toLocaleString(),
}: SingleChartProps) => {
  const TooltipContent = ({ payload, label }: any) => {
    if (!payload?.[0]) return null;
    return (
      <div className="p-4 bg-white rounded-md border shadow-lg">
        <p className="text-md font-bold mb-1">{label}</p>
        <p className="text-md" style={{ color }}>
          {valueFormatter(Number(payload[0].value))}
        </p>
      </div>
    );
  };

  return (
    <div className="w-full h-[220px] py-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={220}
          data={data}
          margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
        >
          <XAxis
            dataKey="name"
            style={{ fontSize: '12px' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v) => formatThousands(v)}
            style={{ fontSize: '12px' }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip content={<TooltipContent />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const TokenGraph = () => {
  const t = useTranslations();
  const [supplyData, setSupplyData] = useState<ChartDataPoint[]>([]);
  const [priceData, setPriceData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<TokenGraphResponse>('/token/graph');
        const raw = res?.data;
        if (raw) {
          const { supply, price } = formatGraphData(raw);
          setSupplyData(supply);
          setPriceData(price);
        }
      } catch (err) {
        console.error('Error fetching token graph:', err);
        setError('token_graph_error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraph();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <Heading level={3} className="mb-4 text-xl">
          {t('token_price_history_title')}
        </Heading>
        <div className="bg-gray-50 rounded-lg p-12 text-center min-h-[200px] flex items-center justify-center">
          <p className="text-gray-500">{t('token_graph_loading')}</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Heading level={3} className="mb-4 text-xl">
          {t('token_price_history_title')}
        </Heading>
        <div className="bg-gray-50 rounded-lg p-12 text-center min-h-[200px] flex items-center justify-center">
          <p className="text-gray-500">{t('token_graph_error')}</p>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          {t('token_price_history_note')}
        </p>
      </Card>
    );
  }

  const hasData = supplyData.length > 0 || priceData.length > 0;
  if (!hasData) {
    return (
      <Card className="p-6">
        <Heading level={3} className="mb-4 text-xl">
          {t('token_price_history_title')}
        </Heading>
        <div className="bg-gray-50 rounded-lg p-12 text-center min-h-[200px] flex items-center justify-center">
          <p className="text-gray-500">
            {t('token_price_history_placeholder')}
          </p>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          {t('token_price_history_note')}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {supplyData.length > 0 && (
        <Card className="p-6">
          <Heading level={3} className="mb-4 text-xl">
            {t('token_graph_supply_title')}
          </Heading>
          <SingleLineChart
            data={supplyData}
            dataKey="value"
            color={CHART_COLORS[2]}
          />
        </Card>
      )}
      {priceData.length > 0 && (
        <Card className="p-6">
          <Heading level={3} className="mb-4 text-xl">
            {t('token_price_history_title')}
          </Heading>
          <SingleLineChart
            data={priceData}
            dataKey="value"
            color={CHART_COLORS[3]}
            valueFormatter={(v) => `€${v.toLocaleString()}`}
          />
          <p className="text-sm text-gray-600 mt-4">
            {t('token_price_history_note')}
          </p>
        </Card>
      )}
    </div>
  );
};

export default TokenGraph;
