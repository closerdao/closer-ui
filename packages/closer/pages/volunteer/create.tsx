import Head from 'next/head';

import { CreateVolunteerView } from 'closer';

import Page401 from '../401';
import { useAuth } from '../../contexts/auth';

const CreateVolunteerOportunity = () => {
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  if (!hasStewardRole) return <Page401 />;

  return (
    <>
      <Head>
        <title>Create Volunteer Opportunity</title>
      </Head>
      <div>
        <h2 className="mb-2">Create a new volunteer opportunity</h2>
        <CreateVolunteerView />
      </div>
    </>
  );
};

export default CreateVolunteerOportunity;
