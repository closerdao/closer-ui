export interface NavigationLink {
  label: string;
  url: string;
  target?: string;
  enabled: boolean;
  roles?: string[];
  rbacPage?: string;
  /**
   * Optional category heading. Consecutive items sharing a `group` are
   * rendered under a single heading inside their menu section.
   */
  group?: string;
}
