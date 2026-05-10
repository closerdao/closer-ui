import Head from 'next/head';

import { useEffect, useState } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import { Card, Checkbox, Heading, Spinner } from '../../components/ui';

import deepmerge from 'deepmerge';

import rbacDefaultConfig, {
  PagePermissions,
  RBACConfig,
} from 'closer/constants/rbac';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { BookingConfig } from '../../types/api';
import PageNotFound from '../not-found';

const RBACPage = () => {
  const { platform } = usePlatform() as { platform: any };
  const { user } = useAuth();
  const [config, setConfig] = useState<RBACConfig>(rbacDefaultConfig);
  const [bookingConfig, setBookingConfig] = useState<BookingConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await platform.config.get({ force: true });
      } catch {
        return;
      }
      await platform.config.getOne('booking', { force: true }).catch(() => {});
      try {
        await platform.config.getOne('rbac', { force: true });
      } catch {
        // no rbac doc yet — defaults only
      }
      if (cancelled) return;
      const rbacDoc = platform.config.findOne('rbac');
      const rbacValue = rbacDoc?.get?.('value')?.toJS?.() ?? null;
      setConfig(
        deepmerge.all(
          [rbacDefaultConfig, ...(rbacValue ? [rbacValue] : [])],
        ) as RBACConfig,
      );
      const bookingDoc = platform.config.findOne('booking');
      const bookingValue = bookingDoc?.get?.('value')?.toJS?.() ?? null;
      setBookingConfig(bookingValue);
    })();
    return () => {
      cancelled = true;
    };
  }, [platform]);

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
    'Roles',
    'Revenue',
    'Engagement',

  ]);
  const [roles] = useState([
    'default',
    'steward',
    'space-host',
    'community-curator',
    'member',
    'content-creator',
    'team',
    'accounting',
    'admin',
  ]);
  const [isSaving, setIsSaving] = useState(false);
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

  const saveConfig = async (nextConfig: RBACConfig) => {
    try {
      setIsSaving(true);

      const listRaw = platform.config.find()?.toJS?.() ?? [];
      const rbacExists = Array.isArray(listRaw)
        ? listRaw.some((c: { slug?: string }) => c.slug === 'rbac')
        : false;

      if (rbacExists) {
        await platform.config.patch('rbac', {
          slug: 'rbac',
          value: nextConfig,
        });
      } else {
        await platform.config.post({
          slug: 'rbac',
          value: nextConfig,
        });
      }

      await platform.config.getOne('rbac', { force: true });

      setHasConfigUpdated(true);
      setTimeout(() => {
        setHasConfigUpdated(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving RBAC config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Role Based Access Control</title>
      </Head>
      <AdminLayout>
        <div className="mb-6">
          <Heading level={1}>Role Based Access Control</Heading>
        </div>
        {isSaving && (
          <div
            className="mb-4 p-3 bg-neutral-light border border-line rounded-md flex items-center gap-3 text-sm text-foreground"
            role="status"
            aria-live="polite"
          >
            <Spinner />
            <span>Saving RBAC configuration to the server. Please wait.</span>
          </div>
        )}
        {hasConfigUpdated && !isSaving && (
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
            Configuration updated successfully!
          </div>
        )}

        <Card className={`overflow-x-auto relative ${isSaving ? 'opacity-70 pointer-events-none' : ''}`}>
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
                            isEnabled={!isRBACRow && !isSaving}
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

export default RBACPage;
