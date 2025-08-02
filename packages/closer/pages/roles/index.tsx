import Head from 'next/head';

import PageError from 'closer/components/PageError';
import { Heading, LinkButton, Button } from 'closer/components/ui';

import { GeneralConfig, api, Role } from 'closer';
import { useConfig } from 'closer/hooks/useConfig';
import useRBAC from 'closer/hooks/useRBAC';
import { useAuth } from 'closer/contexts/auth';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface Props {
  generalConfig: GeneralConfig | null;
  roles: Role[];
  error: string | null;
}

const RolesPage = ({ generalConfig, roles, error }: Props) => {
  const t = useTranslations();

  const defaultConfig = useConfig();
  const { hasAccess } = useRBAC();
  const { user } = useAuth();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  // Check if user has permission to create roles
  const canCreateRole = hasAccess('RoleCreation');

  if (error) {
    return <PageError error={error} />;
  }

  const handleApplyNow = (roleTitle: string) => {
    const subject = encodeURIComponent(`Application for ${roleTitle} role`);
    const body = encodeURIComponent(
      `Hello,\n\nI am interested in applying for the ${roleTitle} role.\n\nPlease provide more information about the application process.\n\nBest regards,`
    );
    const adminEmail = generalConfig?.teamEmail || 'admin@example.com';
    window.open(`mailto:${adminEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="max-w-screen-lg mx-auto">
      <Head>
        <title>{`Available Roles - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pb-24">
        <section className="w-full flex justify-center min-h-[400px]">
          <div className="max-w-4xl w-full">
            <div className="flex flex-col sm:flex-row">
              <div className="flex items-start justify-between gap-6 w-full">
                <div className="flex flex-col gap-6 w-full">
                  <div className="flex flex-col sm:flex-row justify-between gap-4 items-center pt-4">
                    <Heading level={1} className="md:text-4xl font-bold">
                      {t('roles_page_title')}
                    </Heading>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {canCreateRole && (
                        <div className="w-full sm:w-[250px]">
                          <LinkButton href="/roles/create">
                            {t('roles_add_role_button')}
                          </LinkButton>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <p className="text-gray-700 leading-relaxed">
                      {t('roles_page_description_1')}
                    </p>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      {t('roles_page_description_2')}
                    </p>
                  </div>
                  
                  {roles.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600">{t('roles_no_roles_available')}</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {roles.map((role) => (
                        <div
                          key={role._id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold mb-2">
                                {role.title}
                              </h3>
                              <p className="text-gray-600 mb-4">
                                <span dangerouslySetInnerHTML={{ __html: role.description || '' }} />
                              </p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {role.compensation && (
                                  <div>
                                    <strong className="text-sm uppercase text-gray-500">
                                      {t('roles_compensation_label')}
                                    </strong>
                                    <p className="text-sm">{role.compensation}</p>
                                  </div>
                                )}
                                {role.hoursPerWeek && role.hoursPerWeek > 0 && (
                                  <div>
                                    <strong className="text-sm uppercase text-gray-500">
                                      {t('roles_hours_per_week_label')}
                                    </strong>
                                    <p className="text-sm">{role.hoursPerWeek}</p>
                                  </div>
                                )}
                              </div>
                              
                              {role.skillsRequired && role.skillsRequired.length > 0 && (
                                <div className="mb-4">
                                  <strong className="text-sm uppercase text-gray-500">
                                    {t('roles_skills_required_label')}
                                  </strong>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {role.skillsRequired.map((skill, index) => (
                                      <span
                                        key={index}
                                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {role.responsibilities && role.responsibilities.length > 0 && (
                                <div className="mb-4">
                                  <strong className="text-sm uppercase text-gray-500">
                                    {t('roles_responsibilities_label')}
                                  </strong>
                                  <ul className="list-disc list-inside text-sm mt-1">
                                    {role.responsibilities.map((responsibility, index) => (
                                      <li key={index}>{responsibility}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => handleApplyNow(role.title)}
                              >
                                {t('roles_apply_now_button')}
                              </Button>
                              {canCreateRole && (
                                <LinkButton 
                                  href={`/roles/${role._id}/edit`}
                                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                                >
                                  {t('roles_edit_role_button')}
                                </LinkButton>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

RolesPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [messages, generalRes, rolesRes] = await Promise.all([
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      api.get('/config/general').catch(() => null),
      api.get('/role').catch(() => ({ data: { results: [] } })),
    ]);

    const generalConfig = generalRes?.data?.results?.value;
    const roles = rolesRes?.data?.results || [];

    return { messages, generalConfig, roles };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      roles: [],
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default RolesPage; 