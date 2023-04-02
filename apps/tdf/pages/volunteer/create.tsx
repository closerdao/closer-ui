import Head from 'next/head';

import { CreateVolunteerView } from 'closer';

const CreateVolunteerOportunity = () => {
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
