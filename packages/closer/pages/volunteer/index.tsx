import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

// import { loadLocaleData } from 'closer/utils/locale.helpers';
import PageError from 'closer/components/PageError';
import { Heading, LinkButton } from 'closer/components/ui';

import { GeneralConfig, api } from 'closer';
import { useConfig } from 'closer/hooks/useConfig';
import useRBAC from 'closer/hooks/useRBAC';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface Props {
  generalConfig: GeneralConfig | null;
  error: string | null;
}

const VolunteerOpportunitiesPage = ({ generalConfig, error }: Props) => {
  const t = useTranslations();

  const defaultConfig = useConfig();
  const { hasAccess } = useRBAC();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  // Check if user has permission to create volunteers
  const canCreateVolunteer = hasAccess('VolunteerCreation');

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <div className="max-w-screen-lg mx-auto">
      <Head>
        <title>{`Volunteers Open Call - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className=" pb-24">
        <section className="w-full flex justify-center max-w-4xl mx-auto mb-4 relative">
          <Image
            alt="Traditional Dream Factory Volunteers open call"
            src="/images/tdf-volunteers-open-call.png"
            width={1344}
            height={600}
          />
        </section>
        <section className=" w-full flex justify-center">
          <div className="max-w-4xl w-full ">
            <div className="w-full py-2">
              <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-8">
                <div className="flex gap-1 items-center min-w-[120px]">
                  <Image
                    alt="calendar icon"
                    src="/images/icons/calendar-icon.svg"
                    width={20}
                    height={20}
                  />
                  <label className="text-sm uppercase font-bold flex gap-1">
                    Any time
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className=" w-full flex justify-center min-h-[400px]">
          <div className="max-w-4xl w-full">
            <div className="flex flex-col sm:flex-row">
              <div className="flex items-start justify-between gap-6 w-full">
                <div className="flex flex-col gap-6 w-full">
                  <div className="flex flex-col sm:flex-row justify-between gap-4 items-center pt-4">
                    <Heading level={1} className="md:text-4xl  font-bold">
                      {t('volunteers_open_call_title')}
                    </Heading>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {canCreateVolunteer && (
                        <div className="w-full sm:w-[250px]">
                          <LinkButton href="/volunteer/create">
                            {t('volunteers_create_volunteer_button')}
                          </LinkButton>
                        </div>
                      )}
                      <div className="w-full sm:w-[250px]">
                        <LinkButton href="/volunteer/apply">
                          {t('apply_submit_button')}
                        </LinkButton>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-6 max-w-2xl">
                    <p>{t('volunteers_intro_1')}</p>
                    <p>{t('volunteers_intro_2')}</p>
                    <p>
                      <strong className="uppercase">
                        {t('volunteers_requirements_label')}
                      </strong>{' '}
                      {t('volunteers_requirements_value')}
                    </p>
                    <p>
                      <strong className="uppercase">
                        {t('volunteers_community_culture_label')}
                      </strong>{' '}
                      {t('volunteers_community_culture_value')}
                    </p>
                    <Heading level={2}>
                      {t('volunteers_skills_and_qualifications_title')}
                    </Heading>
                    <ul className="mb-4 list-disc pl-5">
                      <li>
                        <strong>{t('volunteers_skill_gardening_label')}</strong>{' '}
                        {t('volunteers_skill_gardening_value')}
                      </li>
                      <li>
                        <strong>
                          {t('volunteers_skill_hospitality_label')}
                        </strong>{' '}
                        {t('volunteers_skill_hospitality_value')}
                      </li>
                      <li>
                        <strong>{t('volunteers_skill_kitchen_label')}</strong>{' '}
                        {t('volunteers_skill_kitchen_value')}
                      </li>
                      <li>
                        <strong>{t('volunteers_skill_building_label')}</strong>{' '}
                        {t('volunteers_skill_building_value')}
                      </li>
                      <li>
                        <strong>{t('volunteers_skill_others_label')}</strong>{' '}
                        {t('volunteers_skill_others_value')}
                      </li>
                    </ul>
                    <p>{t('volunteers_commitment')}</p>
                    <p>{t('volunteers_expectation')}</p>
                    <p>
                      {t('volunteers_recommend_read')}{' '}
                      <Link
                        href="https://docs.google.com/document/d/177JkHCy0AhplsaEEYpFHBsiI6d4uLk0TgURSKfBIewE/edit?tab=t.0"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('volunteers_pink_paper')}
                      </Link>
                      , {t('volunteers_pink_paper_details')}
                    </p>
                    <p>
                      {t('volunteers_vision_resonates')}{' '}
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://docs.google.com/document/d/198vWYEQCC1lELQa8f76Jcw3l3UDiPcBKt04PGFKnUvg/edit?tab=t.0"
                      >
                        {t('volunteers_visitors_guide')}
                      </Link>{' '}
                      {t('volunteers_schedule_call')}{' '}
                      <Link href="mailto:space@traditionaldreamfactory.com">
                        space@traditionaldreamfactory.com
                      </Link>
                      .
                    </p>
                    <p>{t('volunteers_recommended_stay')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

VolunteerOpportunitiesPage.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    const [messages, generalRes] = await Promise.all([
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      api.get('/config/general').catch(() => null),
    ]);

    const generalConfig = generalRes?.data?.results?.value;

    return { messages, generalConfig };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default VolunteerOpportunitiesPage;
