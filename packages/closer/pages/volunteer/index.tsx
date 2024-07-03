import Head from 'next/head';
import Link from 'next/link';

import EventPreview from '../../components/EventPreview';
import { LinkButton } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import {
  OpportunityByCategory,
  VolunteerConfig,
  type VolunteerOpportunity,
} from '../../types';
import api from '../../utils/api';
import { loadLocaleData } from '../../utils/locale.helpers';
import { getOpportunitiesByCategory } from '../../utils/volunteer.helpers';

interface Props {
  opportunities: VolunteerOpportunity[];
  volunteerConfig: VolunteerConfig | null;
}
const VolunteerOpportunitiesPage: NextPage<Props> = ({
  opportunities,
  volunteerConfig,
}) => {
  const t = useTranslations();
  const { APP_NAME, SEMANTIC_URL } = useConfig() || {};
  const opportunitiesByCategory = getOpportunitiesByCategory(opportunities);

  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  const volunteerTerms = [
    'volunteers_page_terms_1',
    'volunteers_page_terms_2',
    'volunteers_page_terms_3',
    'volunteers_page_terms_4',
    'volunteers_page_terms_5',
    'volunteers_page_terms_6',
  ];

  const doesHaveVolunteerTerms =
    !volunteerTerms.every((item) => t(item) === '') &&
    APP_NAME &&
    (APP_NAME.toLowerCase() === 'tdf' || APP_NAME.toLowerCase() === 'lios');

  const isVolunteeringEnabled =
    volunteerConfig?.enabled === true &&
    process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING === 'true';
  
  console.log('isVolunteeringEnabled===',isVolunteeringEnabled);

  if (!isVolunteeringEnabled) {
    return <PageNotFound />;
  }

  return (
    <div className="flex justify-center">
      <Head>
        <title>{t('volunteers_page_title')}</title>
        <link
          rel="canonical"
          href={`https://${SEMANTIC_URL}/volunteer`}
          key="canonical"
        />
      </Head>

      <div className="flex flex-col gap-10 max-w-4xl">
        <section className="w-full flex justify-between  flex-col gap-6 sm:gap-2 sm:flex-row">
          <Heading level={1}>{t('volunteers_page_title')}</Heading>
          {hasStewardRole && (
            <Link href="/volunteer/create">
              <div className="btn-primary">Create opportunity</div>
            </Link>
          )}
        </section>

        <section className=" flex flex-col gap-6">
          <div className="bg-accent-light rounded-md p-6 flex flex-col gap-6">
            <p>{t('volunteers_page_intro_text')}</p>
            {doesHaveVolunteerTerms && (
              <ul>
                {volunteerTerms.map((term: string) => {
                  if (term !== t(term)) {
                    return (
                      <li
                        key={term}
                        className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                      >
                        {t(term)}
                      </li>
                    );
                  }
                })}
              </ul>
            )}
          </div>
          {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
            <LinkButton
              className="w-[300px]"
              href="https://t.me/+EYSkTvSomodkMWUx"
            >
              Join Telegram group
            </LinkButton>
          )}

          {t('volunteers_page_more_info') !== 'volunteers_page_more_info' && (
            <div
              dangerouslySetInnerHTML={{
                __html: t('volunteers_page_more_info'),
              }}
            />
          )}
        </section>

        <div>
          {opportunities?.length === 0 &&
          APP_NAME &&
          APP_NAME.toLowerCase() === 'tdf' ? (
            <p>{t('volunteers_page_empty')}</p>
          ) : (
            <section className="flex flex-col gap-8">
              {opportunitiesByCategory?.map(
                (opportunityGroup: OpportunityByCategory) => (
                  <div
                    key={opportunityGroup.category}
                    className="flex flex-col gap-6"
                  >
                    <Heading level={2} className="uppercase text-xl">
                      {opportunityGroup.category}
                    </Heading>
                    <div className="flex-col flex gap-6">
                      {opportunityGroup.opportunities.map(
                        (opportunity: VolunteerOpportunity) => {
                          return (
                            <EventPreview
                              key={opportunity.name}
                              event={opportunity}
                              isVolunteerCard={true}
                            />
                          );
                        },
                      )}
                    </div>
                  </div>
                ),
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

VolunteerOpportunitiesPage.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    const [opportunitiesRes, volunteerConfigRes, messages] = await Promise.all([
      api.get('/volunteer').catch(() => {
        return null;
      }),
      api.get('/config/volunteering').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),

    ]);

    const opportunities = opportunitiesRes?.data?.results || null;
    const volunteerConfig = volunteerConfigRes?.data?.results?.value || null;

    return {
      opportunities,
      volunteerConfig,
      messages
    };
  } catch (error) {
    console.error(error);
    return {
      opportunities: [],
      volunteerConfig: null,
      messages: null
    };
  }
};

export default VolunteerOpportunitiesPage;
