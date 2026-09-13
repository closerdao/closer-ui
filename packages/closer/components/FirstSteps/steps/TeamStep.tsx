import Link from 'next/link';

import { FC } from 'react';

import { useTranslations } from 'next-intl';

import { FirstStepsTeamUser } from '../../../hooks/useFirstStepsStatus';
import ProfilePhoto from '../../ProfilePhoto';

/**
 * Roles, explained once, with the two screens that manage them.
 *
 * Nothing here writes anything: people are invited on the users screen. Each
 * role shows who holds it now, so the admin can see at a glance which seats
 * are still empty. The step completes on its own once enough people other
 * than the viewer hold a role, and stays skippable for the village one person
 * runs alone.
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

export interface TeamStepProps {
  users: FirstStepsTeamUser[];
  viewerId?: string;
}

const TeamStep: FC<TeamStepProps> = ({ users, viewerId }) => {
  const t = useTranslations();

  return (
    <>
      <ul className="flex flex-col gap-4">
        {ROLES.map(({ role, labelKey, description }) => {
          const holders = users.filter((member) => member.roles.includes(role));
          return (
            <li
              key={role}
              className="flex flex-col gap-3 rounded-md border border-neutral-dark p-4"
              data-testid={`first-steps-role-${role}`}
            >
              <div>
                <p className="font-bold">{t(labelKey)}</p>
                <p className="text-sm">{description}</p>
              </div>

              {holders.length === 0 ? (
                <p className="text-sm text-foreground/60">
                  {t('first_steps_team_nobody')}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-x-4 gap-y-2">
                  {holders.map((member) => (
                    <li
                      key={member._id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <ProfilePhoto user={member} size="6" stack={false} />
                      <span>
                        {member.screenname || member._id}
                        {member._id === viewerId && (
                          <span className="text-foreground/60">
                            {' '}
                            · {t('first_steps_team_you')}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
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
