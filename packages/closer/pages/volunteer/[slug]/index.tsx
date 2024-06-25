import Metatags from '../../../components/Metatags';
import VolunteerEventView from '../../../components/VolunteerEventView';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { VolunteerOpportunity } from '../../../types/api';
import api from '../../../utils/api';
import { loadLocaleData } from '../../../utils/locale.helpers';
import NotFoundPage from '../../not-found';

interface Props {
  volunteer: VolunteerOpportunity;
  descriptionText?: string;
}

const VolunteerPage = ({ volunteer, descriptionText }: Props) => {
  const t = useTranslations();
  const { photo, name } = volunteer || {};

  if (!volunteer)
    return <NotFoundPage error={t('volunteer_page_does_not_exist')} />;

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

VolunteerPage.getInitialProps = async (context: NextPageContext) => {
  const { convert } = require('html-to-text');
  try {
    const id = context.query.slug;
    const [volunteerResponse, messages] = await Promise.all([
      api.get(`/volunteer/${id}`),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const volunteer = volunteerResponse?.data?.results;

    const options = {
      baseElements: { selectors: ['p', 'h2', 'span'] },
    };
    const descriptionText = convert(volunteer.description, options)
      .trim()
      .slice(0, 100);

    return {
      volunteer,
      descriptionText,
      messages,
    };
  } catch (error) {
    console.error(error);
    return {
      volunteer: null,
      descriptionText: null,
      messages: null,
    };
  }
};

export default VolunteerPage;
