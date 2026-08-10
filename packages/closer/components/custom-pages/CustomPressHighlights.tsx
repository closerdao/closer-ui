import React from 'react';

import { useTranslations } from 'next-intl';

import { resolveBlockText } from '../../utils/blockI18n';

interface HighlightItem {
  outlet: string;
  date?: string;
  title: string;
  url: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    eyebrow?: string;
    items?: HighlightItem[];
  };
}

const CustomPressHighlights = ({ content }: Props) => {
  const t = useTranslations();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const eyebrow = pick(content?.eyebrow, t('press_highlight_title'));

  const defaultItems: HighlightItem[] = [
    {
      outlet: 'Expresso',
      date: 'June 26, 2025',
      title: t('press_highlight_expresso_title'),
      url: 'https://expresso.pt/economia/economia_imobiliario/2025-06-26-nomadas-digitais-criam-aldeia-tecnologica-no-alentejo-354f740a',
    },
    {
      outlet: 'Forbes Portugal',
      date: 'August 26, 2025',
      title: t('press_highlight_forbes_title'),
      url: 'https://www.forbespt.com/portugal-e-o-setimo-destino-favorito-dos-nomadas-digitais/',
    },
    {
      outlet: 'Diário de Notícias',
      date: 'August 24, 2025',
      title: t('press_highlight_dn_title'),
      url: 'https://www.dn.pt/edicao-impressa/alentejo-v%C3%AA-nascer-primeira-aldeia-regenerativa-da-europa-financiada-com-tokens',
    },
    {
      outlet: 'EFE Verde',
      date: 'September 21, 2025',
      title: t('press_highlight_efe_title'),
      url: 'https://efeverde.com/regenerar-para-avanzar-el-futuro-del-campo-pasa-por-la-innovacion-social-y-ecologica-por-samuel-delesque-traditional-dream-factory-tdf/',
    },
    {
      outlet: 'Idealista',
      date: 'December 18, 2025',
      title: t('press_highlight_idealista_title'),
      url: 'https://www.idealista.pt/news/imobiliario/habitacao/2025/12/18/73120-primeira-aldeia-regenerativa-tokenizada-da-europa-nasce-no-alentejo',
    },
    {
      outlet: 'Jornal Económico',
      date: '2025',
      title: t('press_highlight_jornal_title'),
      url: 'https://jornaleconomico.sapo.pt/noticias/48-dos-portugueses-sonham-trocar-a-cidade-pelo-campo/',
    },
  ];

  const items =
    content?.items && content.items.length > 0
      ? content.items.map((item) => ({
          outlet: pick(item.outlet, item.outlet),
          date: item.date?.trim()
            ? resolveBlockText(item.date, t)
            : undefined,
          title: pick(item.title, item.title),
          url: item.url,
        }))
      : defaultItems;

  return (
    <section className="bg-white py-24 md:py-32 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-wider text-gray-600 font-medium text-center">
            {eyebrow}
          </p>
        ) : null}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          {items.map((item, index) => (
            <a
              key={`${item.outlet}-${index}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">
                  {item.outlet}
                </span>
                {item.date ? (
                  <span className="text-xs text-gray-400">{item.date}</span>
                ) : null}
              </div>
              <h3 className="font-medium text-base text-gray-900 leading-relaxed">
                {item.title}
              </h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomPressHighlights;
