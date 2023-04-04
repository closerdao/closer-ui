import Metatags from '../../../components/Metatags';

import { VolunteerEventView, VolunteerOpportunity, api } from 'closer';
import { NextPage } from 'next';

import NotFoundPage from '../../404';

interface Props {
  volunteer: VolunteerOpportunity;
}

const VolunteerPage: NextPage<Props> = ({ volunteer }) => {
  const { photo, name, description } = volunteer || {};

  if (!volunteer)
    return <NotFoundPage error="Volunteering opportunity does not exist" />;

  return (
    <>
      <Metatags imageId={photo} title={name} description={description} />
      <VolunteerEventView
        volunteer={volunteer}
        location="Traditional Dream Factory, Abela "
      />
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
