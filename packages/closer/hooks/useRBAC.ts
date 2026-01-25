import rbacDefaultConfig from '../constants/rbac';
import { useAuth } from '../contexts/auth';
import { useConfig } from '../hooks/useConfig';

/**
 * Deep merge helper function to merge default config with backend config
 */
const deepMerge = (target: any, source: any): any => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key]) && !Array.isArray(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

const isObject = (item: any): boolean => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Hook to check if a user has access to a specific page based on their roles
 */
export const useRBAC = () => {
  const { user } = useAuth();
  const { rbacConfig } = useConfig();

  // Merge the backend config with the default config
  // This ensures that defaults are preserved and backend overrides are applied
  // Same logic as used in the RBAC admin page
  const config = rbacConfig
    ? deepMerge(rbacDefaultConfig, rbacConfig)
    : rbacDefaultConfig;

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
