import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import {
  EventPreview,
  Heading,
  type VolunteerOpportunity,
  api,
  useAuth,
} from 'closer';
import { NextPage } from 'next';

interface Props {
  opportunities?: VolunteerOpportunity[];
}
const VolunteerPage: NextPage<Props> = ({ opportunities }) => {
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  return (
    <div className="max-w-6xl mx-auto">
      <Head>
        <title>
          Volunteer | Traditional Dream Factory | Regenerative coliving space in
          Alentejo, Portugal
        </title>
      </Head>
      <section className="mb-8 w-full flex justify-between items-center">
        <Heading>Volunteer at TDF</Heading>
        {hasStewardRole && (
          <Link href="/volunteer/create">
            <button className="btn-primary">Create opportunity</button>
          </Link>
        )}
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
    </div>
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
