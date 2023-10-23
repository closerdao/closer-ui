import Metatags from '../../../components/Metatags';
import VolunteerEventView from '../../../components/VolunteerEventView';

import { NextPage } from 'next';

import NotFoundPage from '../../404';
import { VolunteerOpportunity } from '../../../types/api';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

interface Props {
  volunteer: VolunteerOpportunity;
  descriptionText?: string;
}

const VolunteerPage: NextPage<Props> = ({ volunteer, descriptionText }) => {
  const { photo, name, description } = volunteer || {};

  if (!volunteer)
    return <NotFoundPage error={__('volunteer_page_does_not_exist')} />;

  return (
    <>
      <Metatags
        imageId={photo}
        title={name}
        description={descriptionText || ''}
      />
      <VolunteerEventView volunteer={volunteer} />
    </>
  );
};

VolunteerPage.getInitialProps = async (context) => {
  const { convert } = require('html-to-text');
  try {
    const id = context.query.slug;
    const {
      data: { results: volunteer },
    } = await api.get(`/volunteer/${id}`);
    const options = {
      baseElements: { selectors: ['p', 'h2', 'span'] },
    };
    const descriptionText = convert(volunteer.description, options)
      .trim()
      .slice(0, 100);

    return {
      volunteer,
      descriptionText,
    };
  } catch (error) {
    console.error(error);
    return {
      volunteer: null,
      descriptionText: null,
    };
  }
};

export default VolunteerPage;
