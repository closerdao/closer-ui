import Head from 'next/head';

import { CreateVolunteerView } from 'closer';

import Page401 from '../401';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const CreateVolunteerOportunity = () => {
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  if (!hasStewardRole) return <Page401 />;

  return (
    <>
      <Head>
        <title>{__('volunteer_create_page_title')}</title>
      </Head>
      <div>
        <h2 className="mb-2">{__('volunteer_create_page_title')}</h2>
        <CreateVolunteerView />
      </div>
    </>
  );
};

export default CreateVolunteerOportunity;
