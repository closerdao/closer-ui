import Head from 'next/head';

import React from 'react';

import { VolunteerCard, type VolunteerOpportunity, api } from 'closer';
import { NextPage } from 'next';

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
      <section className="grid grid-cols-1 md:grid-cols-2">
        {opportunities?.length === 0 ? (
          <p>There are no volunteer opportunities at the moment.</p>
        ) : (
          opportunities?.map(
            ({
              start,
              end,
              photo,
              description,
              name,
              _id,
              slug,
            }: VolunteerOpportunity) => (
              <VolunteerCard
                key={_id}
                startDate={start}
                endDate={end}
                photo={photo}
                description={description}
                name={name}
                slug={slug}
              />
            ),
          )
        )}
      </section>
    </>
  );
};

VolunteerPage.getInitialProps = async () => {
  console.log('getting initial props');
  try {
    const {
      data: { results },
    } = await api.get('/volunteer');
    console.log(results);
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
