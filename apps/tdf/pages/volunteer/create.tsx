import Head from 'next/head';

import { CreateVolunteerView, Heading, useAuth } from 'closer';
import { NextPage } from 'next';

import Page401 from '../401';

const CreateVolunteerOportunity: NextPage = () => {
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  if (!hasStewardRole) return <Page401 />;
  return (
    <>
      <Head>
        <title>Create Volunteer Opportunity</title>
      </Head>
      <div>
        <Heading level={2} className="mb-2">
          Create a new volunteer opportunity
        </Heading>
        <CreateVolunteerView />
      </div>
    </>
  );
};

export default CreateVolunteerOportunity;
