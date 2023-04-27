import Head from 'next/head';

import {
  CreateVolunteerView, // Page401,
  VolunteerOpportunity,
  api,
  useAuth,
} from 'closer';
import { NextPage } from 'next';

const EditVolunteerOportunity: NextPage<{
  volunteer: VolunteerOpportunity;
}> = ({ volunteer }) => {
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  // if (!hasStewardRole) return <Page401 />;
  return (
    <>
      <Head>
        <title>Edit Volunteer Opportunity</title>
      </Head>
      <div>
        <h2 className="mb-2">Edit volunteer opportunity</h2>
        <CreateVolunteerView isEditMode data={volunteer} />
      </div>
    </>
  );
};

EditVolunteerOportunity.getInitialProps = async (context) => {
  try {
    const id = context.query.slug;
    const {
      data: { results: volunteer },
    } = await api.get(`/volunteer/${id}`);
    return {
      volunteer,
    };
  } catch (error) {
    console.error(error);
    return {
      volunteer: null,
    };
  }
};

export default EditVolunteerOportunity;
