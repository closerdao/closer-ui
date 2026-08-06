import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import {
  GeneralConfig,
  PageNotFound,
  VolunteerConfig,
  getCachedConfig,
} from 'closer';
import { LinkButton } from 'closer/components/ui';
import { useConfig } from 'closer/hooks/useConfig';
import { CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';

const PINK_PAPER_URL =
  'https://docs.google.com/document/d/177JkHCy0AhplsaEEYpFHBsiI6d4uLk0TgURSKfBIewE/edit?tab=t.0';
const VISITORS_GUIDE_URL =
  'https://docs.google.com/document/d/198vWYEQCC1lELQa8f76Jcw3l3UDiPcBKt04PGFKnUvg/edit?tab=t.0';
const SPACE_HOST_EMAIL = 'space@traditionaldreamfactory.com';
const APPLY_HREF = '/volunteer/apply';

const SEASONS = [
  {
    labelKey: 'tdf_volunteers_season_spring_label',
    valueKey: 'tdf_volunteers_season_spring_value',
  },
  {
    labelKey: 'tdf_volunteers_season_fall_label',
    valueKey: 'tdf_volunteers_season_fall_value',
  },
];

/** `isFlagged` renders the pink left rule the mockup uses to single an item out. */
const THINGS_TO_KNOW: {
  id: string;
  isFlagged?: boolean;
  tagKeys?: string[];
}[] = [
  { id: 'contribution' },
  { id: 'minstay' },
  { id: 'arrivals' },
  {
    id: 'daily',
    tagKeys: [
      'tdf_volunteers_know_daily_tag_food',
      'tdf_volunteers_know_daily_tag_utilities',
      'tdf_volunteers_know_daily_tag_total',
    ],
  },
  { id: 'portuguese', isFlagged: true },
  { id: 'hours' },
  { id: 'children' },
  { id: 'resident' },
  { id: 'rituals' },
];

const SKILLS = [
  'gardening',
  'hospitality',
  'kitchen',
  'building',
  'mushroom',
  'marketing',
];

const linkClass =
  'text-accent-dark font-semibold border-b border-current hover:text-foreground';

const ApplyButton = ({ label }: { label: string }) => (
  <LinkButton
    href={APPLY_HREF}
    isFullWidth={false}
    className="px-12 text-sm tracking-[0.13em]"
  >
    {label}
  </LinkButton>
);

const VolunteerOpportunitiesPage = () => {
  const t = useTranslations();
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const volunteerConfig = getCachedConfig(
    'volunteering',
  ) as VolunteerConfig | null;
  const defaultConfig = useConfig();

  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const isVolunteerEnabled = volunteerConfig?.enabled === true;

  if (!isVolunteerEnabled) {
    return <PageNotFound />;
  }

  const pageTitle = `${t('tdf_volunteers_title')} — ${PLATFORM_NAME}`;

  return (
    <div className="max-w-[940px] mx-auto px-6 pb-24">
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={t('tdf_volunteers_meta_description')}
        />
        <meta property="og:title" content={pageTitle} />
        <meta
          property="og:description"
          content={t('tdf_volunteers_meta_description')}
        />
        <meta property="og:type" content="website" />
      </Head>

      <main>
        <section className="my-6">
          <Image
            alt={t('tdf_volunteers_hero_alt')}
            src="/images/tdf-volunteers-open-call.jpg"
            width={1344}
            height={600}
            className="w-full h-auto"
            priority
          />
        </section>

        <p className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.1em] mb-3.5">
          <CalendarDays className="w-[17px] h-[17px]" aria-hidden="true" />
          {t('tdf_volunteers_eyebrow')}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-7 mb-7">
          <h1 className="m-0 max-w-[16ch] font-black text-[34px] md:text-[54px] leading-[1.02] tracking-[-0.015em]">
            {t('tdf_volunteers_title')}
          </h1>
          <ApplyButton label={t('tdf_volunteers_apply')} />
        </div>

        <p className="mb-[18px] max-w-[68ch]">{t('tdf_volunteers_intro_1')}</p>
        <p className="mb-[18px] max-w-[68ch]">{t('tdf_volunteers_intro_2')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 mb-2">
          {SEASONS.map((season) => (
            <div key={season.labelKey} className="bg-neutral px-6 py-[22px]">
              <span className="block text-[13px] font-semibold uppercase tracking-[0.1em] text-gray-600">
                {t(season.labelKey)}
              </span>
              <strong className="block mt-1.5 font-black text-[22px] leading-[1.2]">
                {t(season.valueKey)}
              </strong>
            </div>
          ))}
        </div>

        <h2 className="mt-14 mb-5 font-black text-[26px] tracking-[-0.01em]">
          {t('tdf_volunteers_know_title')}
        </h2>

        <div className="border-b border-gray-200">
          {THINGS_TO_KNOW.map((item) => (
            <div key={item.id} className="border-t border-gray-200 py-6">
              <div
                className={item.isFlagged ? 'border-l-4 border-accent pl-5' : ''}
              >
                <h3 className="mb-2 font-black text-[19px]">
                  {t(`tdf_volunteers_know_${item.id}_title`)}
                </h3>
                <p className="m-0 max-w-[68ch] text-gray-600">
                  {t(`tdf_volunteers_know_${item.id}_body`)}
                </p>
                {item.tagKeys && (
                  <div className="flex flex-wrap gap-2.5 mt-4">
                    {item.tagKeys.map((tagKey) => (
                      <span
                        key={tagKey}
                        className="rounded-full bg-accent-light px-3.5 py-1.5 text-sm font-semibold text-accent-dark"
                      >
                        {t(tagKey)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-14 mb-5 font-black text-[26px] tracking-[-0.01em]">
          {t('tdf_volunteers_skills_title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px border border-gray-200 bg-gray-200">
          {SKILLS.map((skill) => (
            <div key={skill} className="bg-white px-6 py-[22px]">
              <strong className="block font-black text-[17px]">
                {t(`tdf_volunteers_skill_${skill}_label`)}
              </strong>
              <span className="block mt-0.5 text-[15px] text-gray-600">
                {t(`tdf_volunteers_skill_${skill}_value`)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-14 bg-neutral px-8 py-[30px]">
          <h3 className="mb-3.5 font-black text-[19px]">
            {t('tdf_volunteers_before_title')}
          </h3>
          <ul className="m-0 list-disc pl-5">
            <li className="mb-2.5">
              <Link
                href={PINK_PAPER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {t('tdf_volunteers_before_pink_paper')}
              </Link>
            </li>
            <li className="mb-2.5">
              <Link
                href={VISITORS_GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {t('tdf_volunteers_before_visitors_guide')}
              </Link>
            </li>
            <li className="mb-2.5">
              {t('tdf_volunteers_before_questions')}{' '}
              <Link href={`mailto:${SPACE_HOST_EMAIL}`} className={linkClass}>
                {SPACE_HOST_EMAIL}
              </Link>
            </li>
          </ul>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-6">
          <p className="m-0 text-gray-600">{t('tdf_volunteers_footer_note')}</p>
          <ApplyButton label={t('tdf_volunteers_apply')} />
        </div>
      </main>
    </div>
  );
};

export default VolunteerOpportunitiesPage;
