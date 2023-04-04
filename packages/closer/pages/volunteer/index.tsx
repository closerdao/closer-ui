import Head from 'next/head';

import React from 'react';

import EventPreview from '../../components/EventPreview';

import { NextPage } from 'next';

import { type VolunteerOpportunity } from '../../types';
import api from '../../utils/api';

interface Props {
  opportunities?: VolunteerOpportunity[];
}
const VolunteerPage: NextPage<Props> = ({ opportunities }) => {
  return (
    <>
      <Head>
        <title>
          Volunteer | Traditional Dream Factory | Regenerative coliving space in
          Alentejo, Portugal
        </title>
      </Head>
      <section className="mb-8 w-full">
        <h1>Volunteer at TDF</h1>
      </section>
      <section className="grid gap-8 md:grid-cols-2">
        {opportunities?.length === 0 ? (
          <p>There are no volunteer opportunities at the moment.</p>
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
