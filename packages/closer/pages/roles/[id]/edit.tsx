import Head from 'next/head';

import CreateRoleView from '../../../components/CreateRoleView';
import { Heading } from '../../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Page401 from '../../401';
import { useAuth } from '../../../contexts/auth';
import { loadLocaleData } from '../../../utils/locale.helpers';
import { api, Role } from 'closer';
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
      <div>
        <Heading level={2} className="mb-2">
          {t('roles_edit_page_title')}
        </Heading>
        <CreateRoleView isEditMode data={role} />
      </div>
    </>
  );
};

EditRole.getInitialProps = async (context: NextPageContext) => {
  try {
    const { id } = context.query;
    const [messages, roleRes] = await Promise.all([
      loadLocaleData(
        context?.locale,
        process.env.NEXT_PUBLIC_APP_NAME,
      ),
      api.get(`/role/${id}`).catch(() => null),
    ]);

    const role = roleRes?.data?.results;

    return { messages, role };
  } catch (err: unknown) {
    return {
      role: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default EditRole; 