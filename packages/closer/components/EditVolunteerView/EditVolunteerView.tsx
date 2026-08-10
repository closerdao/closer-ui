import { useRouter } from 'next/router';

import { FC } from 'react';

import { useTranslations } from 'next-intl';

import models from '../../models';
import { VolunteerOpportunity } from '../../types';
import EditModel from '../EditModel';

type Props = {
  data: VolunteerOpportunity;
};

const EditVolunteerView: FC<Props> = ({ data }) => {
  const t = useTranslations();
  const router = useRouter();
  const redirectToVolunteerList = () => {
    router.push('/volunteer');
  };

  return (
    <EditModel
      id={data._id}
      fields={models.volunteer}
      initialData={data}
      endpoint={'/volunteer'}
      onSave={redirectToVolunteerList}
      allowDelete
      deleteButton={t('volunteer_edit_page_delete')}
      onDelete={redirectToVolunteerList}
    />
  );
};

export default EditVolunteerView;
