/**
 * Who may create and edit build projects. `steward` has always had this; space
 * hosts, team members and admins were added so the crew running the build can
 * manage projects without going through a steward.
 */
export const PROJECT_MANAGER_ROLES = [
  'steward',
  'space-host',
  'team',
  'admin',
] as const;

export function userRolesCanManageProjects(
  roles: string[] | undefined,
): boolean {
  if (!roles?.length) {
    return false;
  }
  return roles.some((role) =>
    (PROJECT_MANAGER_ROLES as readonly string[]).includes(role),
  );
}
