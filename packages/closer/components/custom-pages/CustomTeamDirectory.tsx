import Link from 'next/link';

import React, { useEffect, useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { resolveBlockText } from '../../utils/blockI18n';
import UserPreview from '../UserPreview';
import { Heading } from '../ui';

const DEFAULT_LIMIT = 24;

interface RoleItem {
  role?: string;
}

interface Props {
  settings?: {
    limit?: number | string;
  };
  content?: {
    title?: string;
    description?: string;
    roles?: RoleItem[];
    ctaText?: string;
    email?: string;
  };
}

const CustomTeamDirectory = ({ settings, content }: Props) => {
  const t = useTranslations();
  const config = useConfig();
  const { TEAM_EMAIL } = config || {};
  const { platform }: { platform?: any } = usePlatform() as { platform?: any };

  const roles = useMemo(() => {
    const picked = (content?.roles ?? [])
      .map((item) => item?.role?.trim())
      .filter((role): role is string => Boolean(role));
    return picked.length > 0 ? picked : ['team'];
  }, [content?.roles]);

  const limit = Number(settings?.limit) || DEFAULT_LIMIT;

  const debugEmail = process.env.NEXT_PUBLIC_DEBUG_EMAIL;
  const membersFilter = useMemo(
    () => ({
      where: {
        roles: { $in: roles },
        ...(debugEmail ? { email: { $ne: debugEmail } } : {}),
      },
      limit,
    }),
    [roles, limit, debugEmail],
  );

  useEffect(() => {
    if (!platform?.user) return;
    void platform.user.get(membersFilter);
  }, [platform, membersFilter]);

  const members = platform?.user?.find?.(membersFilter);
  const hasMembers = members && members.count && members.count() > 0;

  const title = content?.title?.trim()
    ? resolveBlockText(content.title, t)
    : t('team_directory_title');
  const description = content?.description?.trim()
    ? resolveBlockText(content.description, t)
    : '';
  const ctaText = content?.ctaText?.trim()
    ? resolveBlockText(content.ctaText, t)
    : '';
  const email = content?.email?.trim() || TEAM_EMAIL;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-prose">
          {title ? (
            <Heading level={2} className="text-2xl pb-2 mb-4">
              {title}
            </Heading>
          ) : null}
          {description ? <p className="mb-8">{description}</p> : null}
        </div>
        {hasMembers ? (
          <div className="grid md:grid-cols-3 gap-x-4 gap-y-4">
            {members.map((member: any) => (
              <UserPreview key={member.get('_id')} user={member} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t('team_directory_empty')}</p>
        )}
        {ctaText && email ? (
          <Link href={`mailto:${email}`} className="btn my-8 inline-block">
            {ctaText}
          </Link>
        ) : null}
      </div>
    </section>
  );
};

export default CustomTeamDirectory;
