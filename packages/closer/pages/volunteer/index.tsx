import Head from 'next/head';
import Link from 'next/link';

import EventPreview from '../../components/EventPreview';
import { LinkButton } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { NextPage } from 'next';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { OpportunityByCategory, type VolunteerOpportunity } from '../../types';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';
import { getOpportunitiesByCategory } from '../../utils/volunteer.helpers';

interface Props {
  opportunities: VolunteerOpportunity[];
}
const VolunteerOpportunitiesPage: NextPage<Props> = ({ opportunities }) => {
  const { APP_NAME, SEMANTIC_URL } = useConfig() || {};
  const opportunitiesByCategory = getOpportunitiesByCategory(opportunities);

  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  const volunteerTerms = [
    __('volunteers_page_terms_1', APP_NAME),
    __('volunteers_page_terms_2', APP_NAME),
    __('volunteers_page_terms_3', APP_NAME),
    __('volunteers_page_terms_4', APP_NAME),
    __('volunteers_page_terms_5', APP_NAME),
    __('volunteers_page_terms_6', APP_NAME),
  ];

  const doesHaveVolunteerTerms =
    !volunteerTerms.every((item) => item === '') &&
    APP_NAME &&
    (APP_NAME.toLowerCase() === 'tdf' || APP_NAME.toLowerCase() === 'lios');

  return (
    <div className="flex justify-center">
      <Head>
        <title>{__('volunteers_page_title')}</title>
        <link
          rel="canonical"
          href={`https://${SEMANTIC_URL}/volunteer`}
          key="canonical"
        />
      </Head>

      <div className="flex flex-col gap-10 max-w-4xl">
        <section className="w-full flex justify-between  flex-col gap-6 sm:gap-2 sm:flex-row">
          <Heading level={1}>{__('volunteers_page_title')}</Heading>
          {hasStewardRole && (
            <Link href="/volunteer/create">
              <div className="btn-primary">Create opportunity</div>
            </Link>
          )}
        </section>

        <section className=" flex flex-col gap-6">
          <div className="bg-accent-light rounded-md p-6 flex flex-col gap-6">
            <p>{APP_NAME && __('volunteers_page_intro_text', APP_NAME)}</p>
            {doesHaveVolunteerTerms && (
              <ul>
                {volunteerTerms.map((term: string) => {
                  if (!term.includes('_missing')) {
                    return (
                      <li
                        key={term}
                        className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                      >
                        {term}
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
          {!__('volunteers_page_more_info', APP_NAME).includes('_missing') && (
            <div
              dangerouslySetInnerHTML={{
                __html: __('volunteers_page_more_info', APP_NAME),
              }}
            />
          )}
        </section>

        <div>
          {opportunities?.length === 0 &&
          APP_NAME &&
          APP_NAME.toLowerCase() === 'tdf' ? (
            <p>{__('volunteers_page_empty')}</p>
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

VolunteerOpportunitiesPage.getInitialProps = async () => {
  try {
    const {
      data: { results },
    } = await api.get('/volunteer');
    return {
      opportunities: results,
    };
  } catch (error) {
    console.error(error);
    return {
      opportunities: [],
    };
  }
};

export default VolunteerOpportunitiesPage;
