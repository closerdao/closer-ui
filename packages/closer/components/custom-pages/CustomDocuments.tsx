import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { resolveBlockText } from '../../utils/blockI18n';
import { Card, Heading } from '../ui';
import FeatureBlockIcon from './FeatureBlockIcon';

export interface DocumentItem {
  title?: string;
  href?: string;
  downloadLabel?: string;
  icon?: string;
}

export interface DocumentsContent {
  eyebrow?: string;
  title?: string;
  description?: string;
  items?: DocumentItem[];
}

interface Props {
  settings?: { numColumns?: number };
  content?: DocumentsContent;
}

const FALLBACK_ICONS = [
  'fileSpreadsheet',
  'map',
  'building',
  'barChart',
  'leaf',
  'droplets',
  'rocket',
];

const ICON_TINTS = [
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-slate-100 text-slate-700',
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-cyan-100 text-cyan-600',
  'bg-orange-100 text-orange-600',
];

const CustomDocuments = ({ content, settings }: Props) => {
  const t = useTranslations();
  const items = Array.isArray(content?.items) ? content.items : [];
  const numColumns = Number(settings?.numColumns) || 4;

  const eyebrow = resolveBlockText(content?.eyebrow, t);
  const title = resolveBlockText(content?.title, t);
  const description = resolveBlockText(content?.description, t);

  if (items.length === 0) return null;

  const gridClass =
    numColumns === 2
      ? 'md:grid-cols-2'
      : numColumns === 3
        ? 'md:grid-cols-2 lg:grid-cols-3'
        : 'md:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        {eyebrow || title || description ? (
          <div className="text-center mb-12 flex flex-col gap-4">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <Heading
                level={2}
                className="text-3xl md:text-4xl text-gray-900 font-normal"
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

        <div className={`grid gap-6 ${gridClass}`}>
          {items.map((item, index) => {
            const iconId = item.icon?.trim()
              ? item.icon
              : FALLBACK_ICONS[index % FALLBACK_ICONS.length];
            const tint = ICON_TINTS[index % ICON_TINTS.length];
            const [tintBg, ...tintText] = tint.split(' ');
            return (
              <Card
                key={`${item.href}-${index}`}
                className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow"
              >
                <Link
                  href={item.href || '#'}
                  target="_blank"
                  className="block"
                >
                  <div
                    className={`w-14 h-14 rounded-full ${tintBg} flex items-center justify-center mb-4 mx-auto`}
                  >
                    <FeatureBlockIcon
                      iconId={iconId}
                      className={`w-7 h-7 ${tintText.join(' ')}`}
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">
                    {resolveBlockText(item.title, t)}
                  </h3>
                  {item.downloadLabel ? (
                    <span className="text-gray-900 font-medium text-sm underline">
                      {resolveBlockText(item.downloadLabel, t)}
                    </span>
                  ) : null}
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CustomDocuments;
