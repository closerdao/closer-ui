export function userRolesCanAccessExpenseDashboard(
  roles: string[] | undefined,
): boolean {
  if (!roles?.length) {
    return false;
  }
  return (
    roles.includes('admin') ||
    roles.includes('team') ||
    roles.includes('accounting')
  );
}

export function userRolesCanCreateExpense(
  roles: string[] | undefined,
): boolean {
  if (!roles?.length) {
    return false;
  }
  return roles.includes('admin') || roles.includes('accounting');
}
