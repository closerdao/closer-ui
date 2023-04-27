import Metatags from '../../../components/Metatags';
import VolunteerEventView from '../../../components/VolunteerEventView';

import { NextPage } from 'next';

import NotFoundPage from '../../404';
import { VolunteerOpportunity } from '../../../types/api';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

interface Props {
  volunteer: VolunteerOpportunity;
}

const VolunteerPage: NextPage<Props> = ({ volunteer }) => {
  const { photo, name, description } = volunteer || {};

  if (!volunteer)
    return <NotFoundPage error={__('volunteer_page_does_not_exist')} />;

  return (
    <>
      <Metatags imageId={photo} title={name} description={description} />
      <VolunteerEventView volunteer={volunteer} />
    </>
  );
};

VolunteerPage.getInitialProps = async (context) => {
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

export default VolunteerPage;
