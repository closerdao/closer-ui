import Head from 'next/head';

import CreateVolunteerView from '../../../components/CreateVolunteerView';

import { NextPage } from 'next';

import { Page401 } from '../../..';
import { useAuth } from '../../../contexts/auth';
import { VolunteerOpportunity } from '../../../types';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const EditVolunteerOportunity: NextPage<{
  volunteer: VolunteerOpportunity;
}> = ({ volunteer }) => {
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  if (!hasStewardRole) return <Page401 />;
  return (
    <>
      <Head>
        <title>{__('volunteer_edit_page_title')}</title>
      </Head>
      <div>
        <h2 className="mb-2">{__('volunteer_edit_page_title')}</h2>
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
