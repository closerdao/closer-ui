import { useRouter } from 'next/router';

import { FC } from 'react';

import { useTranslations } from 'next-intl';

import models from '../../models';
import { VolunteerOpportunity } from '../../types';
import EditModel from '../EditModel';

type EditProps = {
  isEditMode: true;
  data: VolunteerOpportunity;
};

type CreateProps = {
  isEditMode?: false;
  data?: never;
};

const CreateVolunteerView: FC<CreateProps | EditProps> = ({
  isEditMode,
  data,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const redirectToVolunteerList = () => {
    router.push('/volunteer');
  };

  if (isEditMode) {
    return (
      <EditModel
        id={data._id}
        fields={models.volunteer}
        initialData={data}
        endpoint={'/volunteer'}
        onSave={redirectToVolunteerList}
        allowDelete
        deleteButton={t('volunteer_edit_page_delete')}
        onDelete={() => router.push('/volunteer')}
      />
    );
  }

  return (
    <EditModel
      fields={models.volunteer}
      endpoint={'/volunteer'}
      onSave={redirectToVolunteerList}
    />
  );
};

export default CreateVolunteerView;
