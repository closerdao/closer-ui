import Link from 'next/link';

import { FC } from 'react';

import { useTranslations } from 'next-intl';

/**
 * Roles, explained once, with the two screens that manage them.
 *
 * Nothing here writes anything. Whether a village has invited co-founders is
 * not something the instance can observe — one person running it alone is a
 * legitimate end state — so this step completes by being skipped.
 */

const ROLES = [
  {
    role: 'admin',
    labelKey: 'first_steps_role_admin',
    description:
      'Everything, including settings, billing and roles. Keep this to the two or three people who genuinely need it.',
  },
  {
    role: 'space-host',
    labelKey: 'first_steps_role_space_host',
    description:
      'Bookings, listings and food. The person who knows which bed is free, without access to your settings.',
  },
  {
    role: 'community-curator',
    labelKey: 'first_steps_role_community_curator',
    description:
      'Applications, members and the citizen funnel. Whoever decides who joins.',
  },
  {
    role: 'team',
    labelKey: 'first_steps_role_team',
    description:
      'Read across the dashboards — revenue, bookings, metrics — without editing them.',
  },
  {
    role: 'accounting',
    labelKey: 'first_steps_role_accounting',
    description:
      'Expense tracking and the financial reports, and nothing else.',
  },
];

const TeamStep: FC = () => {
  const t = useTranslations();

  return (
    <>
      <ul className="flex flex-col gap-4">
        {ROLES.map(({ role, labelKey, description }) => (
          <li key={role} className="rounded-md border border-neutral-dark p-4">
            <p className="font-bold">{t(labelKey)}</p>
            <p className="text-sm">{description}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard/admin/manage-users" className="underline">
          {t('first_steps_link_users')}
        </Link>
        <Link href="/dashboard/admin/rbac" className="underline">
          {t('first_steps_link_rbac')}
        </Link>
      </div>
    </>
  );
};

export default TeamStep;
