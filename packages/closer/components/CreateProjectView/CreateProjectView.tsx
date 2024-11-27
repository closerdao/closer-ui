import { useRouter } from 'next/router';

import { FC } from 'react';

import { useTranslations } from 'next-intl';

import models from '../../models';
import { DynamicField, VolunteerOpportunity } from '../../types';
import EditModel from '../EditModel';

type EditProps = {
  isEditMode: true;
  data: VolunteerOpportunity;
  dynamicField?: DynamicField;
};

type CreateProps = {
  isEditMode?: false;
  data?: never;
  dynamicField?: DynamicField;
};

const CreateProjectView: FC<CreateProps | EditProps> = ({
  isEditMode,
  data,
  dynamicField,
}) => {
  const t = useTranslations();
  const router = useRouter();

  const redirectToProjectsList = () => {
    router.push('/projects');
  };

  if (isEditMode) {
    return (
      <EditModel
        dynamicField={dynamicField}
        id={data._id}
        fields={models.project}
        initialData={data}
        endpoint={'/project'}
        onSave={redirectToProjectsList}
        allowDelete
        deleteButton={t('projects_edit_page_delete')}
        onDelete={() => router.push('/projects')}
      />
    );
  }

  return (
    <EditModel
      dynamicField={dynamicField}
      fields={models.project}
      endpoint={'/project'}
      onSave={redirectToProjectsList}
    />
  );
};

export default CreateProjectView;
