import rbacDefaultConfig from '../../../admin/config/rbac';
import { useAuth } from '../contexts/auth';
import { useConfig } from '../hooks/useConfig';

/**
 * Hook to check if a user has access to a specific page based on their roles
 */
export const useRBAC = () => {
  const { user } = useAuth();
  const { rbacConfig } = useConfig();

  // Use the provided rbacConfig or fall back to the default config
  const config = rbacConfig || rbacDefaultConfig;

  /**
   * Check if the user has access to a specific page
   * @param page The page to check access for
   * @returns boolean indicating if the user has access
   */
  const hasAccess = (page: string): boolean => {
    // If no user or no roles, check default permissions
    if (!user || !user.roles || user.roles.length === 0) {
      // Return default permission if available, otherwise deny access
      return config.default && config.default[page] === true;
    }

    // Check each of the user's roles for access to the page
    const hasRoleAccess = user.roles.some((role) => {
      // If the role exists in the config and has access to the page
      return config[role] && config[role][page] === true;
    });

    // If no role grants access, fall back to default permissions
    if (!hasRoleAccess) {
      return config.default && config.default[page] === true;
    }

    return hasRoleAccess;
  };

  return {
    hasAccess,
  };
};

export default useRBAC;
