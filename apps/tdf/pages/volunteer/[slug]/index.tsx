import { Metatags } from '@/components';
import NotFoundPage from '@/pages/404';

import { VolunteerEventView, VolunteerOpportunity, api } from 'closer';
import { NextPage } from 'next';

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
