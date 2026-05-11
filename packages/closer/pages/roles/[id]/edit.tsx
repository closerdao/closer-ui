import Head from 'next/head';

import CreateRoleView from '../../../components/CreateRoleView';
import { EditModelPageLayout } from '../../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Page401 from '../../401';
import { useAuth } from '../../../contexts/auth';
import { Role } from '../../../types/api';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';

interface Props {
  role: Role | null;
  error: string | null;
}

const EditRole = ({ role, error }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const hasSpaceHostRole = user?.roles?.includes('space-host');

  if (!hasSpaceHostRole) return <Page401 />;

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!role) {
    return <div>Role not found</div>;
  }

  return (
    <>
      <Head>
        <title>{t('roles_edit_page_title')}</title>
      </Head>
      <EditModelPageLayout
        title={t('roles_edit_page_title')}
        backHref="/roles"
        isEdit
      >
        <CreateRoleView isEditMode data={role} />
      </EditModelPageLayout>
    </>
  );
};

EditRole.getInitialProps = async (context: NextPageContext) => {
  try {
    const { id } = context.query;
    const roleRes = await api.get(`/role/${id}`).catch(() => null);

    const role = roleRes?.data?.results;

    return { role };
  } catch (err: unknown) {
    return {
      role: null,
      error: parseMessageFromError(err),
    };
  }
};

export default EditRole;
