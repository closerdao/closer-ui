import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import EventPreview from '../../components/EventPreview';

import { NextPage } from 'next';

import { useAuth } from '../../contexts/auth';
import { type VolunteerOpportunity } from '../../types';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';

interface Props {
  opportunities?: VolunteerOpportunity[];
}
const VolunteerPage: NextPage<Props> = ({ opportunities }) => {
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');
  return (
    <>
      <Head>
        <title>{__('volunteers_page_title')}</title>
      </Head>
      <section className="mb-8 w-full flex justify-between items-center">
        <h1>{__('volunteers_page_title')}</h1>
        {hasStewardRole && (
          <Link href="/volunteer/create">
            <button className="btn-primary">Create opportunity</button>
          </Link>
        )}
      </section>
      <section className="grid gap-8 md:grid-cols-2">
        {opportunities?.length === 0 ? (
          <p>{__('volunteers_page_empty')}</p>
        ) : (
          opportunities?.map((opportunity: VolunteerOpportunity) => (
            <EventPreview
              key={opportunity._id}
              event={opportunity}
              isVolunteerCard={true}
            />
          ))
        )}
      </section>
    </>
  );
};

VolunteerPage.getInitialProps = async () => {
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

export default VolunteerPage;
