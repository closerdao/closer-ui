import { useTranslations } from 'next-intl';

import { resolveBlockText } from '../../utils/blockI18n';
import { Heading } from '../ui';

export interface BarChartItem {
  label?: string;
  value?: string;
  amount?: number | string;
}

export interface BarChartContent {
  eyebrow?: string;
  title?: string;
  description?: string;
  items?: BarChartItem[];
  note?: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content?: BarChartContent;
}

const MIN_BAR_HEIGHT = 8;

/** Falls back to the digits in the displayed value when no amount is given. */
const toAmount = (item: BarChartItem): number => {
  if (item.amount != null && item.amount !== '') {
    const parsed = Number(item.amount);
    if (Number.isFinite(parsed)) return parsed;
  }
  const digits = String(item.value ?? '').replace(/[^\d.]/g, '');
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
};

const CustomBarChart = ({ content }: Props) => {
  const t = useTranslations();
  const items = Array.isArray(content?.items) ? content.items : [];

  const eyebrow = resolveBlockText(content?.eyebrow, t);
  const title = resolveBlockText(content?.title, t);
  const description = resolveBlockText(content?.description, t);
  const note = resolveBlockText(content?.note, t);

  if (items.length === 0) return null;

  const amounts = items.map(toAmount);
  const max = Math.max(...amounts, 0);

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-6">
        {eyebrow || title || description ? (
          <div className="text-center mb-10 flex flex-col gap-4">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <Heading
                level={2}
                className="text-2xl md:text-3xl text-gray-900 font-normal"
              >
                {title}
              </Heading>
            ) : null}
            {description ? (
              <p className="text-base text-gray-700 leading-relaxed font-light">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="bg-gray-50 rounded-lg p-8 border border-gray-300">
          <div className="flex items-end gap-4 h-44 mb-4">
            {items.map((item, index) => {
              const height =
                max > 0
                  ? Math.max((amounts[index] / max) * 100, MIN_BAR_HEIGHT)
                  : MIN_BAR_HEIGHT;
              return (
                <div
                  key={`${item.label}-${index}`}
                  className="flex-1 h-full flex items-end"
                >
                  <div
                    className="w-full bg-gray-900 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-4">
            {items.map((item, index) => (
              <div key={`${item.label}-label-${index}`} className="flex-1 text-center">
                <div className="text-xs font-semibold text-gray-900">
                  {resolveBlockText(item.value, t)}
                </div>
                <div className="text-xs text-gray-600 font-light">
                  {resolveBlockText(item.label, t)}
                </div>
              </div>
            ))}
          </div>
          {note ? (
            <p className="text-sm text-center text-gray-700 font-light mt-6">
              {note}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default CustomBarChart;
