import Head from 'next/head';

import CreateVolunteerView from '../../../components/CreateVolunteerView';
import { EditModelPageLayout } from '../../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { Page401 } from '../../..';
import { useAuth } from '../../../contexts/auth';
import { VolunteerOpportunity } from '../../../types';
import api from '../../../utils/api';
import { loadLocaleData } from '../../../utils/locale.helpers';

interface Props {
  volunteer: VolunteerOpportunity;
}

const EditVolunteerOportunity = ({ volunteer }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  if (!hasStewardRole) return <Page401 />;
  return (
    <>
      <Head>
        <title>{t('volunteer_edit_page_title')}</title>
      </Head>
      <EditModelPageLayout
        title={t('volunteer_edit_page_title')}
        backHref={`/volunteer/${volunteer.slug}`}
        isEdit
      >
        <CreateVolunteerView isEditMode={true} data={volunteer} />
      </EditModelPageLayout>
    </>
  );
};

EditVolunteerOportunity.getInitialProps = async (context: NextPageContext) => {
  try {
    const id = context.query.slug;
    const [volunteerResponse, messages] = await Promise.all([
      api.get(`/volunteer/${id}`),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const {
      data: { results: volunteer },
    } = volunteerResponse;
    return {
      volunteer,
      messages,
    };
  } catch (error) {
    console.error(error);
    return {
      volunteer: null,
      messages: null,
    };
  }
};

export default EditVolunteerOportunity;
