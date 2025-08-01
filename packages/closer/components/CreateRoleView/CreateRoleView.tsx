import { useRouter } from 'next/router';

import { FC } from 'react';

import { useTranslations } from 'next-intl';

import models from '../../models';
import { Role } from '../../types';
import EditModel from '../EditModel';

type EditProps = {
  isEditMode: true;
  data: Role;
};

type CreateProps = {
  isEditMode?: false;
  data?: never;
};

const CreateRoleView: FC<CreateProps | EditProps> = ({
  isEditMode,
  data,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const redirectToRoleList = () => {
    router.push('/roles');
  };

  if (isEditMode) {
    return (
      <EditModel
        id={data._id}
        fields={models.role}
        initialData={data}
        endpoint={'/role'}
        onSave={redirectToRoleList}
        allowDelete
        deleteButton={t('roles_delete_role_button')}
        onDelete={() => router.push('/roles')}
      />
    );
  }

  return (
    <EditModel
      fields={models.role}
      endpoint={'/role'}
      onSave={redirectToRoleList}
    />
  );
};

export default CreateRoleView; 