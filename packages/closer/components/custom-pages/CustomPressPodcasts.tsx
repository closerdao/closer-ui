import React from 'react';

import { useTranslations } from 'next-intl';

import { resolveBlockText } from '../../utils/blockI18n';

interface PodcastItem {
  title: string;
  date?: string;
  duration?: string;
  host?: string;
  speaker?: string;
  url: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    eyebrow?: string;
    description?: string;
    items?: PodcastItem[];
  };
}

const CustomPressPodcasts = ({ content }: Props) => {
  const t = useTranslations();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const eyebrow = pick(content?.eyebrow, t('press_podcasts_title'));
  const description = pick(content?.description, t('press_podcasts_subtitle'));

  const defaultItems: PodcastItem[] = [
    {
      title: t('press_podcast_green_planet_title'),
      date: t('press_podcast_green_planet_date'),
      url: 'https://podcasts.apple.com/gb/podcast/ep-322-sam-delesque-regenerative-entrepreneur-developing/id1265643891?i=1000595309300',
    },
    {
      title: t('press_podcast_refi_title'),
      date: t('press_podcast_refi_date'),
      url: 'https://blog.refidao.com/building-regenerative-villages-with-samuel-delesque-season-3-episode-8/',
    },
    {
      title: t('press_podcast_crypto_altruism_title'),
      date: t('press_podcast_crypto_altruism_date'),
      url: 'https://www.cryptoaltruism.org/blog/crypto-altruism-podcast-episode84-oasa-using-web3-to-build-for-a-regenerative-future',
    },
    {
      title: t('press_podcast_blockchain_socialist_title'),
      date: t('press_podcast_blockchain_socialist_date'),
      url: 'https://theblockchainsocialist.com/a-regenerative-village-as-a-dao-in-portugal-traditional-dream-factory/',
    },
    {
      title: t('press_podcast_strangers_title'),
      date: t('press_podcast_strangers_date'),
      url: 'https://thenewmvt.com/podcast/sam-delesque/',
    },
    {
      title: t('press_podcast_primal_title'),
      date: t('press_podcast_primal_date'),
      url: 'https://podcasts.apple.com/ng/podcast/from-ownership-to-stewardship-samuel-delesque-founder/id1591874552?i=1000540529193',
    },
  ];

  const resolveOptional = (raw: string | undefined) =>
    raw?.trim() ? resolveBlockText(raw, t) : undefined;

  const items =
    content?.items && content.items.length > 0
      ? content.items.map((item) => ({
          title: pick(item.title, item.title),
          date: resolveOptional(item.date),
          duration: resolveOptional(item.duration),
          host: resolveOptional(item.host),
          speaker: resolveOptional(item.speaker),
          url: item.url,
        }))
      : defaultItems;

  return (
    <section className="bg-gray-50 py-24 md:py-32 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
        <div className="flex flex-col gap-4 items-center text-center">
          {eyebrow ? (
            <p className="text-xs uppercase tracking-wider text-gray-600 font-medium">
              {eyebrow}
            </p>
          ) : null}
          {description ? (
            <p className="text-sm text-gray-700 max-w-2xl font-light">
              {description}
            </p>
          ) : null}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          {items.map((item, index) => {
            const metaParts = [
              item.date,
              item.duration,
              item.host,
              item.speaker,
            ].filter(Boolean);

            return (
              <a
                key={`${item.title}-${index}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 bg-white border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all flex flex-col gap-2"
              >
                <p className="font-medium text-gray-900">{item.title}</p>
                {metaParts.length > 0 ? (
                  <p className="text-sm text-gray-600 font-light">
                    {metaParts.join(' · ')}
                  </p>
                ) : null}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CustomPressPodcasts;
