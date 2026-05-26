export function userRolesCanAccessMetricsDashboard(
  roles: string[] | undefined,
): boolean {
  if (!roles?.length) {
    return false;
  }
  return (
    roles.includes('admin') ||
    roles.includes('team') ||
    roles.includes('space-host')
  );
}
