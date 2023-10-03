import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import EventPreview from '../../components/EventPreview';
import Heading from '../../components/ui/Heading';

import { NextPage } from 'next';

import { useAuth } from '../../contexts/auth';
import { OpportunityByCategory, type VolunteerOpportunity } from '../../types';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';
import { getOpportunitiesByCategory } from '../../utils/volunteer.helpers';

interface Props {
  opportunities: VolunteerOpportunity[];
}
const VolunteerOpportunitiesPage: NextPage<Props> = ({ opportunities }) => {
  const opportunitiesByCategory = getOpportunitiesByCategory(opportunities);
  console.log(' opportunitiesByCategory=', opportunitiesByCategory);

  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  return (
    <div className="flex justify-center">
      <Head>
        <title>{__('volunteers_page_title')}</title>
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/volunteer"
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

        <section className=' flex flex-col gap-6'>
          <div className="bg-accent-light rounded-md p-6">
            <p>{__('volunteers_page_intro_text')}</p>
            <ul className=" my-4 list-none">
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {__('volunteers_page_terms_1')}
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {__('volunteers_page_terms_2')}
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {__('volunteers_page_terms_3')}
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {__('volunteers_page_terms_4')}
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {__('volunteers_page_terms_5')}
              </li>
            </ul>
          </div>
          <div dangerouslySetInnerHTML={{ __html:  __('volunteers_page_more_info') }} /> 


           {/* { __('volunteers_page_more_info')} */}
          {/* </div> */}
        </section>


        <div>
          {opportunities?.length === 0 ? (
            <p>{__('volunteers_page_empty')}</p>
        ) : (
          <section className="flex flex-col gap-8">
            {opportunitiesByCategory?.map(
              (opportunityGroup: OpportunityByCategory) => (
                <div key={opportunityGroup.category} className="flex flex-col gap-6">
                  <Heading level={2} className='uppercase text-xl'>{opportunityGroup.category}</Heading>
                  <div className='flex-col flex gap-6'>
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
            </section>)}
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
