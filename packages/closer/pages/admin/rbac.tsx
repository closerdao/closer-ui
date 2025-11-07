import Head from 'next/head';

import { useState } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import { Card, Checkbox, Heading } from '../../components/ui';

import deepmerge from 'deepmerge';
import { NextPageContext } from 'next';

import rbacDefaultConfig, {
  PagePermissions,
  RBACConfig,
} from 'closer/constants/rbac';
import { useAuth } from '../../contexts/auth';
import { BookingConfig } from '../../types/api';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface Props {
  loadConfig: RBACConfig;
  bookingConfig: BookingConfig;
  error?: string;
}

const RBACPage = ({ loadConfig, bookingConfig }: Props) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<RBACConfig>(
    deepmerge.all(
      [rbacDefaultConfig, loadConfig].filter(Boolean),
    ) as RBACConfig,
  );

  const [pages] = useState([
    'Dashboard',
    'Performance',
    'Bookings',
    'Listings',
    'Food',
    'UserManagement',
    'PlatformSettings',
    'RBAC',
    'LearningHub',
    'LearningHubCreate',
    'AffiliateSettings',
    'Invest',
    'Community',
    'Subscriptions',
    'Events',
    'Volunteer',
    'Residence',
    'Stay',
    'MyBookings',
    'FriendsBooking',
    'Referrals',
    'Governance',
    'EventCreation',
    'VolunteerCreation',
    'RoleCreation',
    'Resources',
    'SupportUs',
    'Token',
    'Blog',
    'TokenSales',
    'ExpenseTracking',
    'RoleCreation',
    'Roles',
    'Revenue',

  ]);
  const [roles] = useState([
    'default', // Add default as a "role" for the UI
    'steward',
    'space-host',
    'community-curator',
    'member',
    'content-creator',
    'admin',
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfigUpdated, setHasConfigUpdated] = useState(false);
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  // Only admin can access this page
  if (!user || !user.roles.includes('admin')) {
    return <PageNotFound error="User may not access" />;
  }

  const handleToggle = (role: string, page: string, value: boolean) => {
    // Create a deep copy of the current config
    const newConfig: RBACConfig = { ...config };

    // Ensure the role object exists
    if (!newConfig[role]) {
      newConfig[role] = {} as PagePermissions;
    }

    // Set the new value
    newConfig[role][page] = value;

    // Update the state
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  const saveConfig = async (config: object) => {
    try {
      setIsLoading(true);

      // Save the RBAC configuration to the server
      const res = await api.put('/config/rbac', {
        slug: 'rbac',
        value: config,
      });

      if (res.status === 200) {
        setHasConfigUpdated(true);
        setTimeout(() => {
          setHasConfigUpdated(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving RBAC config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Role Based Access Control</title>
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="flex justify-between items-center mb-6">
          <Heading level={1}>Role Based Access Control</Heading>
        </div>
        {hasConfigUpdated && (
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
            Configuration updated successfully!
          </div>
        )}

        <Card className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Page / Role</th>
                {roles.map((role) => (
                  <th
                    key={role}
                    className={`px-4 py-2 text-center ${
                      role === 'default' ? 'bg-blue-50' : ''
                    }`}
                  >
                    {role === 'default' ? 'Default' : role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                const isRBACRow = page === 'RBAC';
                return (
                  <tr
                    key={page}
                    className={`border-t${
                      isRBACRow
                        ? ' bg-gray-200 opacity-60 pointer-events-none'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-4 font-medium">{page}</td>
                    {roles.map((role) => (
                      <td
                        key={`${role}-${page}`}
                        className={`px-4 py-4 text-center ${
                          role === 'default' ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex justify-center">
                          <Checkbox
                            isChecked={Boolean(config[role]?.[page])}
                            onChange={() =>
                              handleToggle(
                                role,
                                page,
                                !Boolean(config[role]?.[page]),
                              )
                            }
                            isEnabled={!isRBACRow}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <div className="mt-6">
          <Heading level={3}>How to use RBAC</Heading>
          <p className="mt-2 text-gray-700">
            This configuration controls which roles have access to specific
            pages in the application. Toggle the switches to grant or revoke
            access for each role to each page.
          </p>
          <p className="mt-2 text-gray-700">
            The <span className="bg-blue-50 px-1">Default</span> column
            represents the permissions that apply before checking user roles.
            These default permissions are used when a user has no roles or when
            none of their roles grant access to a page.
          </p>
          <p className="mt-2 text-gray-700">
            To add more pages to the RBAC configuration, update the rbac.ts file
            in the admin/config directory.
          </p>
        </div>
      </AdminLayout>
    </>
  );
};

RBACPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [rbacConfigData, bookingRes, messages] = await Promise.all([
      api.get('/config/rbac').catch(() => {
        return null;
      }),
      api.get('/config/booking').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    // const loadConfig = deepmerge.all([rbacDefaultConfig, rbacConfigData?.data?.results?.value]);
    const loadConfig = rbacConfigData?.data?.results?.value;
    const bookingConfig = bookingRes?.data?.results?.value;

    return {
      loadConfig,
      bookingConfig,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      generalConfig: null,
      bookingConfig: null,
      messages: null,
    };
  }
};

export default RBACPage;
