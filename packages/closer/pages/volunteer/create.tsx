import Head from 'next/head';

import { CreateVolunteerView } from '../../components/CreateVolunteerView';

import { __ } from '../../utils/helpers';

const CreateVolunteerOportunity = () => {
  return (
    <>
      <Head>
        <title>{__('volunteer_create_page_title')}</title>
      </Head>
      <div className="main-content">
        <h2 className="mb-2">{__('volunteer_create_page_title')}</h2>
        <CreateVolunteerView />
      </div>
    </>
  );
};

export default CreateVolunteerOportunity;
