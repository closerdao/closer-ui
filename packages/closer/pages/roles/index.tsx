import Head from 'next/head';
import { useEffect, useState } from 'react';

import PageError from 'closer/components/PageError';
import { Heading, LinkButton, Button } from 'closer/components/ui';

import { GeneralConfig, Role, api, getCachedConfig } from 'closer';
import { useConfig } from 'closer/hooks/useConfig';
import useRBAC from 'closer/hooks/useRBAC';
import { useAuth } from 'closer/contexts/auth';
import { parseMessageFromError } from 'closer/utils/common';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface Props {
  roles: Role[];
  error: string | null;
}

const RolesPage = ({ roles, error }: Props) => {
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);

  const defaultConfig = useConfig();
  const { hasAccess } = useRBAC();
  useAuth();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  useEffect(() => {
    setInitialRenderComplete(true);
  }, []);

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
    <div className="max-w-screen-lg mx-auto px-4 sm:px-6">
      <Head>
        <title>{`Available Roles - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pb-24">
        <section className="w-full flex justify-center min-h-[400px]">
          <div className="max-w-4xl w-full">
            <div className="flex flex-col gap-10 pt-6 sm:pt-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-4 min-w-0">
                  <Heading level={1} className="text-3xl font-bold tracking-tight md:text-4xl">
                    {t('roles_page_title')}
                  </Heading>
                  <div className="flex flex-col gap-3 text-complimentary-light leading-relaxed max-w-2xl">
                    <p>{t('roles_page_description_1')}</p>
                    <p>{t('roles_page_description_2')}</p>
                  </div>
                </div>
                {canCreateRole && (
                  <div className="w-full shrink-0 sm:w-[250px] sm:pt-1">
                    <LinkButton href="/roles/create">{t('roles_add_role_button')}</LinkButton>
                  </div>
                )}
              </div>

              {roles.length === 0 ? (
                <div className="rounded-xl border border-line bg-neutral-light px-6 py-14 text-center">
                  <p className="text-complimentary-light">{t('roles_no_roles_available')}</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-5 list-none p-0 m-0">
                  {roles.map((role) => (
                    <li key={role._id}>
                      <article className="group relative overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-shadow hover:shadow-md">
                        <div className="absolute left-0 top-0 h-full w-1 bg-accent" aria-hidden />
                        <div className="flex flex-col gap-6 p-6 pl-7 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                          <div className="flex min-w-0 flex-1 flex-col gap-5">
                            <div className="flex flex-col gap-2">
                              <h2 className="text-xl font-semibold text-complimentary-core sm:text-2xl">
                                {role.title}
                              </h2>
                              {initialRenderComplete && role.description && (
                                <div
                                  className="prose prose-sm max-w-none text-complimentary-light [&_a]:text-secondary [&_a]:underline"
                                  dangerouslySetInnerHTML={{ __html: role.description }}
                                />
                              )}
                            </div>

                            {(role.compensation ||
                              (role.hoursPerWeek && role.hoursPerWeek > 0)) && (
                              <dl className="grid grid-cols-1 gap-3 rounded-lg bg-neutral p-4 sm:grid-cols-2 sm:gap-4">
                                {role.compensation && (
                                  <div className="flex flex-col gap-1">
                                    <dt className="text-xs font-semibold uppercase tracking-wide text-line">
                                      {t('roles_compensation_label')}
                                    </dt>
                                    <dd className="text-sm text-complimentary-core">
                                      {role.compensation}
                                    </dd>
                                  </div>
                                )}
                                {role.hoursPerWeek && role.hoursPerWeek > 0 && (
                                  <div className="flex flex-col gap-1">
                                    <dt className="text-xs font-semibold uppercase tracking-wide text-line">
                                      {t('roles_hours_per_week_label')}
                                    </dt>
                                    <dd className="text-sm text-complimentary-core">
                                      {role.hoursPerWeek}
                                    </dd>
                                  </div>
                                )}
                              </dl>
                            )}

                            {role.skillsRequired && role.skillsRequired.length > 0 && (
                              <div className="flex flex-col gap-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-line">
                                  {t('roles_skills_required_label')}
                                </p>
                                <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                                  {role.skillsRequired.map((skill, index) => (
                                    <li key={index}>
                                      <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-secondary">
                                        {skill}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {role.responsibilities && role.responsibilities.length > 0 && (
                              <div className="flex flex-col gap-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-line">
                                  {t('roles_responsibilities_label')}
                                </p>
                                <ul className="m-0 list-disc space-y-1 pl-5 text-sm text-complimentary-light marker:text-line">
                                  {role.responsibilities.map((responsibility, index) => (
                                    <li key={index}>{responsibility}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-[250px] sm:shrink-0 sm:pt-1">
                            <Button onClick={() => handleApplyNow(role.title)}>
                              {t('roles_apply_now_button')}
                            </Button>
                            {canCreateRole && (
                              <LinkButton
                                href={`/roles/${role._id}/edit`}
                                variant="secondary"
                              >
                                {t('roles_edit_role_button')}
                              </LinkButton>
                            )}
                          </div>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

RolesPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const rolesRes = await api
      .get('/role')
      .catch(() => ({ data: { results: [] } }));

    const roles = rolesRes?.data?.results || [];

    return { roles };
  } catch (err: unknown) {
    return {
      roles: [],
      error: parseMessageFromError(err),
      };
  }
};

export default RolesPage; 