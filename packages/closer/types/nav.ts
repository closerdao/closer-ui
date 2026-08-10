export interface NavigationLink {
  label: string;
  url: string;
  target?: string;
  enabled: boolean;
  roles?: string[];
  rbacPage?: string;
}
