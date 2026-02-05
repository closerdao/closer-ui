import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

import { useAuth } from '../contexts/auth';
import { useConfig } from '../hooks/useConfig';
import { getReserveTokenDisplay } from '../utils/config.utils';
import useRBAC from '../hooks/useRBAC';
import { useBuyTokens } from '../hooks/useBuyTokens';
import { NavigationLink } from '../types/nav';
import api from '../utils/api';
import { getCurrentUnitPrice } from '../utils/bondingCurve';
import Profile from './Profile';
import ReportABug from './ReportABug';
import Wallet from './Wallet';
import Button from './ui/Button';

interface MenuSection {
  label: string;
  isOpen: boolean;
  items: NavigationLink[];
}

const MemberMenu = () => {
  const t = useTranslations();
  const config = useConfig();
  const { APP_NAME } = config || {};
  const reserveToken = getReserveTokenDisplay(config);
  const { hasAccess } = useRBAC();
  const router = useRouter();
  const { getCurrentSupplyWithoutWallet } = useBuyTokens();

  const { user, logout } = useAuth();
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [currentSupply, setCurrentSupply] = useState<number | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [isLoadingTokenData, setIsLoadingTokenData] = useState(false);

  // Toggle a section's open/closed state
  const toggleSection = (sectionIndex: number) => {
    setMenuSections((prevSections) =>
      prevSections.map((section, index) =>
        index === sectionIndex
          ? { ...section, isOpen: !section.isOpen }
          : section,
      ),
    );
  };

  const getMenuSections = (
    isBookingEnabled: boolean,
    areSubscriptionsEnabled: boolean,
    isVolunteeringEnabled: boolean,
    isEventsEnabled: boolean,
  ): MenuSection[] => {
    // TDF-specific navigation structure
    if (APP_NAME?.toLowerCase() === 'tdf') {
      return [
        {
          label: t('menu_about'),
          isOpen: false,
          items: [
            {
              label: t('menu_team'),
              url: '/team',
              enabled: true,
            },
            {
              label: t('menu_oasa_network_vision'),
              url: '/pages/oasa-network',
              enabled: true,
            },
          ],
        },
        {
          label: t('menu_the_village'),
          isOpen: false,
          items: [
            {
              label: t('menu_regenerative_agriculture'),
              url: '/pages/regenerative-agriculture',
              enabled: true,
            },
            {
              label: t('menu_accommodations'),
              url: '/stay',
              enabled: isBookingEnabled,
              rbacPage: 'Stay',
            },
            {
              label: t('menu_restaurant'),
              url: '/pages/restaurant',
              enabled: APP_NAME?.toLowerCase() === 'tdf',
            },
            {
              label: t('menu_events_programs'),
              url: '/events',
              enabled: isEventsEnabled,
              rbacPage: 'Events',
            },
          ],
        },
        {
          label: t('menu_investors'),
          isOpen: false,
          items: [
            {
              label: t('menu_data_room'),
              url: '/dataroom',
              enabled: APP_NAME?.toLowerCase() === 'tdf',
            },
            {
              label: t('menu_ecology'),
              url: '/pages/ecology',
              enabled: APP_NAME?.toLowerCase() === 'tdf',
            },
            {
              label: t('menu_token_economics'),
              url: '/token',
              enabled: process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true',
            },
          ],
        },
        {
          label: t('menu_community'),
          isOpen: false,
          items: [
            {
              label: t('menu_become_citizen'),
              url: '/citizenship',
              enabled: process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true',
            },
            {
              label: t('menu_governance_dao'),
              url: '/governance',
              enabled: true,
            },
            {
              label: t('navigation_volunteer'),
              url: '/volunteer',
              enabled: true,
              rbacPage: 'Volunteer',
            },
            {
              label: t('menu_member_stories'),
              url: '/members',
              enabled: true,
            },
            {
              label: t('menu_faq'),
              url: '/resources',
              enabled: true,
              rbacPage: 'Resources',
            },
          ],
        },
        {
          label: t('menu_section_dashboard'),
          isOpen: false,
          items: [
            {
              label: t('navigation_dashboard'),
              url: '/dashboard',
              enabled: true,
              roles: ['admin', 'team'],
              rbacPage: 'Dashboard',
            },
            {
              label: t('navigation_performance'),
              url: '/dashboard/performance',
              enabled: true,
              roles: ['admin', 'team'],
              rbacPage: 'Performance',
            },
            {
              label: t('navigation_revenue'),
              url: '/dashboard/revenue',
              enabled: true,
              roles: ['admin', 'team'],
              rbacPage: 'Revenue',
            },
            {
              label: t('navigation_governance'),
              url: '/governance',
              enabled: true,
              roles: ['member'],
              rbacPage: 'Governance',
            },
            {
              label: t('navigation_token_sales'),
              url: '/dashboard/token-sales',
              enabled: true,
              roles: ['admin', 'team'],
              rbacPage: 'TokenSales',
            },
            {
              label: t('navigation_expense_tracking'),
              url: '/dashboard/expense-tracking',
              enabled: true,
              roles: ['admin', 'team'],
              rbacPage: 'ExpenseTracking',
            },
            {
              label: t('navigation_booking_requests'),
              url: '/bookings/requests',
              enabled: true,
              roles: ['admin', 'team', 'space-host'],
              rbacPage: 'Bookings',
            },
            {
              label: t('navigation_all_bookings'),
              url: '/bookings/all',
              enabled: true,
              roles: ['admin', 'team', 'space-host'],
              rbacPage: 'Bookings',
            },
            {
              label: t('navigation_edit_listings'),
              url: '/listings',
              enabled: true,
              roles: ['admin', 'team', 'space-host'],
              rbacPage: 'Listings',
            },
            {
              label: t('navigation_user_list'),
              url: '/admin/manage-users',
              enabled: true,
              roles: ['admin', 'team'],
              rbacPage: 'UserManagement',
            },
            {
              label: t('navigation_platform_settings'),
              url: '/admin/config',
              enabled: true,
              roles: ['admin'],
              rbacPage: 'PlatformSettings',
            },
          ],
        },
      ];
    }

    // Create all menu sections with their items for other apps
    const sections: MenuSection[] = [
      // General section
      {
        label: 'General',
        isOpen: true,
        items: [
          ...(APP_NAME && APP_NAME?.toLowerCase().includes('earthbound')
            ? [
                {
                  label: t('header_nav_home'),
                  url: '/',
                  enabled: true,
                },
                {
                  label: t('header_nav_invest'),
                  url: '/pages/invest',
                  enabled: true,
                  rbacPage: 'Invest',
                },
                {
                  label: t('header_nav_stay'),
                  url: '/stay',
                  enabled: true,
                },
                {
                  label: t('header_nav_community'),
                  url: '/pages/community',
                  enabled: true,
                  rbacPage: 'Community',
                },
                {
                  label: t('header_nav_events'),
                  url: '/pages/events',
                  enabled: isEventsEnabled,
                  rbacPage: 'Events',
                },
              ]
            : []),
          {
            label: 'Learn about the $TDF token',
            url: '/token',
            enabled: process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true',
          },
          {
            label: 'Become a Citizen',
            url: '/citizenship',
            enabled:
              process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true' &&
              APP_NAME?.toLowerCase() === 'tdf',
          },
          {
            label: t('navigation_work_with_us'),
            url: '/roles',
            enabled: process.env.NEXT_PUBLIC_FEATURE_ROLES === 'true',
            rbacPage: 'Roles',
          },
        ],
      },
      // Stay section (open by default)
      {
        label: t('menu_section_stay'),
        isOpen: true,
        items: [
          {
            label: t('navigation_stay'),
            url: '/stay',
            enabled: isBookingEnabled,
            rbacPage: 'Stay',
          },
          {
            label: t('navigation_volunteer'),
            url: '/volunteer',
            enabled: isVolunteeringEnabled,
            rbacPage: 'Volunteer',
          },
          {
            label: t('navigation_residence'),
            url: '/projects',
            enabled: isVolunteeringEnabled && APP_NAME?.toLowerCase() === 'tdf',
            rbacPage: 'Residence',
          },
        ],
      },

      // Subscriptions section (standalone)
      {
        label: t('navigation_subscriptions'),
        isOpen: false,
        items: [
          {
            label: t('navigation_subscriptions'),
            url: '/subscriptions',
            enabled: areSubscriptionsEnabled,
            rbacPage: 'Subscriptions',
          },
        ],
      },

      // Events section
      {
        label: t('menu_section_events'),
        isOpen: false,
        items: [
          {
            label: t('navigation_events'),
            url: '/events',
            enabled:
              isEventsEnabled &&
              APP_NAME?.toLowerCase() !== 'lios' &&
              APP_NAME?.toLowerCase() !== 'earthbound' &&
              APP_NAME?.toLowerCase() !== 'closer',
            rbacPage: 'Events',
          },
        ],
      },

      // Blog section
      {
        label: t('menu_section_blog'),
        isOpen: false,
        items: [
          {
            label: t('navigation_blog'),
            url: '/blog',
            enabled: process.env.NEXT_PUBLIC_FEATURE_BLOG === 'true',
            rbacPage: 'Blog',
          },
        ],
      },

      // Learning Hub section
      {
        label: t('menu_section_learning_hub'),
        isOpen: false,
        items: [
          {
            label: t('navigation_learning_hub'),
            url: '/learn/category/all',
            enabled: process.env.NEXT_PUBLIC_FEATURE_COURSES === 'true',
            rbacPage: 'LearningHub',
          },
        ],
      },

      // Closer app navigation items (top-level buttons)
      ...(APP_NAME && APP_NAME?.toLowerCase() === 'closer'
        ? [
            {
              label: t('header_nav_features'),
              isOpen: false,
              items: [
                {
                  label: t('header_nav_features'),
                  url: '/#features',
                  enabled: true,
                },
              ],
            },
            {
              label: t('header_nav_communities'),
              isOpen: false,
              items: [
                {
                  label: t('header_nav_communities'),
                  url: '/#communities',
                  enabled: true,
                },
              ],
            },
            {
              label: t('header_nav_governance'),
              isOpen: false,
              items: [
                {
                  label: t('header_nav_governance'),
                  url: '/#governance',
                  enabled: true,
                },
              ],
            },
            {
              label: t('header_nav_agent'),
              isOpen: false,
              items: [
                {
                  label: t('header_nav_agent'),
                  url: '/agent',
                  enabled: true,
                },
              ],
            },
            {
              label: t('header_nav_pricing'),
              isOpen: false,
              items: [
                {
                  label: t('header_nav_pricing'),
                  url: '/pricing',
                  enabled: true,
                },
              ],
            },
            {
              label: t('header_nav_docs'),
              isOpen: false,
              items: [
                {
                  label: t('header_nav_docs'),
                  url: 'https://closer.gitbook.io/documentation',
                  target: '_blank',
                  enabled: true,
                },
              ],
            },
          ]
        : []),

      // Dashboard section
      {
        label: t('menu_section_dashboard'),
        isOpen: false,
        items: [
          {
            label: t('navigation_dashboard'),
            url: '/dashboard',
            enabled: true,
            roles: ['admin', 'team'],
            rbacPage: 'Dashboard',
          },
          {
            label: t('navigation_performance'),
            url: '/dashboard/performance',
            enabled: true,
            roles: ['admin', 'team'],
            rbacPage: 'Performance',
          },
          {
            label: t('navigation_revenue'),
            url: '/dashboard/revenue',
            enabled: true,
            roles: ['admin', 'team'],
            rbacPage: 'Revenue',
          },
          {
            label: t('navigation_governance'),
            url: '/governance',
            enabled: true,
            roles: ['member'],
            rbacPage: 'Governance',
          },
          {
            label: t('navigation_token_sales'),
            url: '/dashboard/token-sales',
            enabled: true,
            roles: ['admin', 'team'],
            rbacPage: 'TokenSales',
          },
          {
            label: t('navigation_expense_tracking'),
            url: '/dashboard/expense-tracking',
            enabled: true,
            roles: ['admin', 'team'],
            rbacPage: 'ExpenseTracking',
          },
          {
            label: t('navigation_booking_requests'),
            url: '/bookings/requests',
            enabled: true,
            roles: ['admin', 'team', 'space-host'],
            rbacPage: 'Bookings',
          },
          {
            label: t('navigation_all_bookings'),
            url: '/bookings/all',
            enabled: true,
            roles: ['admin', 'team', 'space-host'],
            rbacPage: 'Bookings',
          },
          {
            label: t('navigation_edit_listings'),
            url: '/listings',
            enabled: true,
            roles: ['admin', 'team', 'space-host'],
            rbacPage: 'Listings',
          },
          {
            label: t('navigation_user_list'),
            url: '/admin/manage-users',
            enabled: true,
            roles: ['admin', 'team'],
            rbacPage: 'UserManagement',
          },
          {
            label: t('navigation_platform_settings'),
            url: '/admin/config',
            enabled: true,
            roles: ['admin'],
            rbacPage: 'PlatformSettings',
          },
        ],
      },
    ];



    // Bookings section (only if booking is enabled)
    if (isBookingEnabled) {
      sections.push({
        label: t('menu_section_bookings'),
        isOpen: false,
        items: [
          {
            label: t('navigation_booking_requests'),
            url: '/bookings/requests',
            enabled: isBookingEnabled,
            roles: ['space-host'],
            rbacPage: 'Bookings',
          },
          {
            label: t('navigation_current_bookings'),
            url: '/bookings/current',
            enabled: isBookingEnabled,
            roles: ['space-host'],
            rbacPage: 'Bookings',
          },
          {
            label: t('navigation_booking_calendar'),
            url: '/bookings/calendar',
            enabled: isBookingEnabled,
            roles: ['space-host'],
            rbacPage: 'Bookings',
          },
          {
            label: t('navigation_all_bookings'),
            url: '/bookings/all',
            enabled: isBookingEnabled,
            roles: ['space-host'],
            rbacPage: 'Bookings',
          },
          {
            label: t('navigation_edit_listings'),
            url: '/listings',
            enabled: isBookingEnabled,
            roles: ['space-host'],
            rbacPage: 'Listings',
          },
          {
            label: t('navigation_edit_food'),
            url: '/food',
            enabled: isBookingEnabled,
            roles: ['space-host'],
            rbacPage: 'Food',
          },
          {
            label: t('navigation_my_bookings'),
            url: '/bookings',
            enabled: isBookingEnabled,
            rbacPage: 'MyBookings',
          },
          {
            label: t('navigation_book_friend'),
            url: '/bookings/friends',
            enabled: isBookingEnabled,
            rbacPage: 'FriendsBooking',
          },
        ],
      });
    }

    // User Management section
    sections.push({
      label: t('menu_section_user_management'),
      isOpen: false,
      items: [
        {
          label: t('navigation_user_list'),
          url: '/admin/manage-users',
          enabled: true,
          roles: ['admin'],
          rbacPage: 'UserManagement',
        },
      ],
    });

    // FAQ section (standalone)

    sections.push({
      label: t('navigation_faq'),
      isOpen: false,
      items: [
        {
          label: t('navigation_faq'),
          url: '/resources',
          enabled:
            APP_NAME?.toLowerCase() !== 'lios' &&
            APP_NAME !== 'foz' &&
            APP_NAME !== 'earthbound' &&
            APP_NAME?.toLowerCase() !== 'closer',
          rbacPage: 'Resources',
        },
      ],
    });

    // Other sections
    sections.push({
      label: t('menu_section_other'),
      isOpen: false,
      items: [
        ...(process.env.NEXT_PUBLIC_FEATURE_AFFILIATE === 'true' &&
        user?.affiliate
          ? [
              {
                label: t('navigation_affiliate_dashboard'),
                url: '/settings/affiliate',
                enabled: true
              },
            ]
          : []),
      ],
    });

    // Settings section
    sections.push({
      label: t('menu_section_settings'),
      isOpen: false,
      items: [
        {
          label: t('navigation_platform_settings'),
          url: '/admin/config',
          enabled: true,
          roles: ['admin'],
          rbacPage: 'PlatformSettings',
        },
        {
          label: t('navigation_rbac'),
          url: '/admin/rbac',
          enabled: true,
          roles: ['admin'],
          rbacPage: 'RBAC',
        },
      ],
    });

    return sections;
  };

  // Filter menu items based on RBAC permissions
  const filterMenuSections = (sections: MenuSection[], roles: string[]) => {
    return sections
      .map((section) => {
        // Filter items in this section
        const filteredItems = section.items.filter((item: NavigationLink) => {
          // Check if the item is enabled and the user has RBAC access
          if (!item.enabled || (item.rbacPage && !hasAccess(item.rbacPage))) {
            return false;
          }

          // If the item has specific roles, check if the user has one of those roles
          if (item.roles && item.roles.length > 0) {
            return item.roles.some((role) => roles.includes(role));
          }

          // If no roles specified, show to everyone
          return true;
        });

        // Return the section with filtered items
        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter((section) => section.items.length > 0); // Only keep sections with at least one item
  };

  useEffect(() => {
    (async () => {
      try {
        const [bookingRes, subscriptionsRes, volunteerRes, eventsRes] = await Promise.all([
          api.get('config/booking').catch((err) => {
            console.error('Error fetching booking config:', err);
            return null;
          }),
          api.get('config/subscriptions').catch((err) => {
            console.error('Error fetching subscriptions config:', err);
            return null;
          }),
          api.get('config/volunteering').catch((err) => {
            console.error('Error fetching volunteering config:', err);
            return null;
          }),
          api.get('config/events').catch((err) => {
            console.error('Error fetching events config:', err);
            return null;
          }),
        ]);

        const areSubscriptionsEnabled =
          subscriptionsRes &&
          subscriptionsRes?.data.results.value.enabled &&
          process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';
        const isBookingEnabled =
          bookingRes &&
          bookingRes?.data.results.value.enabled &&
          process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

        const isVolunteeringEnabled =
          volunteerRes?.data.results.value.enabled === true &&
          process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING === 'true';

        const isEventsEnabled =
          eventsRes?.data?.results?.value?.enabled !== false;

        // Get menu sections with all items
        const sections = getMenuSections(
          isBookingEnabled,
          areSubscriptionsEnabled,
          isVolunteeringEnabled,
          isEventsEnabled,
        );

        // Filter sections based on user roles and permissions
        const filteredSections = filterMenuSections(
          sections,
          user?.roles || [],
        );

        setMenuSections(filteredSections);
      } catch (err) {
        console.log('error');
      }
    })();
  }, [user, router.locale]);

  useEffect(() => {
    if (
      APP_NAME?.toLowerCase() === 'tdf' &&
      process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true'
    ) {
      setIsLoadingTokenData(true);
      (async () => {
        try {
          const supply = await getCurrentSupplyWithoutWallet();
          if (supply && supply > 0) {
            setCurrentSupply(supply);
            const price = getCurrentUnitPrice(supply);
            setTokenPrice(price);
          }
        } catch (error) {
          console.error('Error fetching token data:', error);
        } finally {
          setIsLoadingTokenData(false);
        }
      })();
    }
  }, [APP_NAME, getCurrentSupplyWithoutWallet]);

  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const isTokenSaleEnabled =
    process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true';
  return (
    <nav className="flex flex-col gap-4">
      <Profile isMenu={true} isDemo={false} onLogout={logout} />
      {isWalletEnabled && <Wallet />}
      {isTokenSaleEnabled && (
        <Button
          variant="primary"
          onClick={() => (window.location.href = '/token')}
        >
          {t('navigation_buy_token')}
        </Button>
      )}

      {/* Render menu items */}
      {menuSections.map((section, index) => (
        <div key={section.label} className="mb-1">
          {/* For sections with only one item, display the item directly */}
          {section.items.length === 1 ? (
            <Link
              href={section.items[0].url || ''}
              target={section.items[0].target}
              className="block py-1 hover:bg-accent-light px-2 rounded text-black"
            >
              {section.items[0].label}
            </Link>
          ) : (
            <>
              {/* Section header (clickable to toggle) */}
              <div
                className="flex items-center justify-between py-1 px-2 cursor-pointer font-medium select-none"
                onClick={() => toggleSection(index)}
              >
                <span>{section.label}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    section.isOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Section items (only shown if section is open) */}
              {section.isOpen && (
                <div className="pl-2 border-l border-gray-200 ml-2 overflow-hidden transition-all duration-200 ease-out animate-in slide-in-from-top-2">
                  {section.items.map((item: NavigationLink) => (
                    <Link
                      key={item.url}
                      href={item.url || ''}
                      target={item.target}
                      className="block py-1 hover:bg-accent-light px-2 rounded text-black"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {APP_NAME?.toLowerCase() === 'tdf' &&
        process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true' && (
          <div className="mt-3 mb-2 rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="p-3 bg-gradient-to-br from-accent/5 to-accent-light/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                    TDF
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    $TDF
                  </span>
                </div>
                {isLoadingTokenData ? (
                  <div className="text-xs text-gray-400">...</div>
                ) : tokenPrice ? (
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {tokenPrice.toFixed(2)} {reserveToken}
                    </div>
                    <div className="text-xs text-gray-500">per token</div>
                  </div>
                ) : null}
              </div>
              {currentSupply && (
                <div className="text-xs text-gray-500 mb-2">
                  Supply: {currentSupply.toLocaleString()} $TDF
                </div>
              )}
              <Link
                href="/token"
                className="block w-full py-2 px-3 bg-accent hover:bg-accent-dark text-white text-center text-sm font-medium rounded-md transition-colors"
              >
                {t('navigation_buy_tokens')}
              </Link>
            </div>
          </div>
        )}

      <ReportABug />
    </nav>
  );
};

export default MemberMenu;
