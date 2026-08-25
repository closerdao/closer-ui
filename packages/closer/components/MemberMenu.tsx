import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { useBuyTokens } from '../hooks/useBuyTokens';
import { usePageMenuSections } from '../hooks/usePageMenuSections';
import useRBAC from '../hooks/useRBAC';
import { NavigationLink } from '../types/nav';
import api, { formatSearch } from '../utils/api';
import { getCurrentUnitPrice } from '../utils/bondingCurve';
import type { MemberMenuFeatureFlags } from '../utils/memberMenuFeatureFlags';
import { toNavigationSections } from '../utils/pageMenu';
import FinancedTokenMenuWidget from './FinancedTokenMenuWidget';
import Profile from './Profile';
import ReportABug from './ReportABug';
import Wallet from './Wallet';

interface MenuSection {
  label: string;
  isOpen: boolean;
  items: NavigationLink[];
  /**
   * `account` sections (dashboard, bookings, admin) are always rendered.
   * `content` sections describe the website itself and are replaced by the
   * page-driven menu as soon as any page is flagged with `showInMenu`.
   */
  kind?: 'content' | 'account';
}

const MemberMenu = ({
  ready,
  appName,
  reserveToken,
  isBookingEnabled,
  areSubscriptionsEnabled,
  isVolunteeringEnabled,
  isEventsEnabled,
  isCommunityEnabled,
  isGovernanceEnabled,
  isLearningHubEnabled,
  isBlogEnabled,
  isCitizenshipEnabled,
  isRolesEnabled,
  isFaqEnabled,
  isAffiliateEnabled,
  isCohousingEnabled,
  isApplicationsEnabled,
}: MemberMenuFeatureFlags) => {
  const t = useTranslations();
  const APP_NAME = appName;
  const { hasAccess, rbacLiveRevision } = useRBAC();
  const router = useRouter();
  const { getCurrentSupplyWithoutWallet } = useBuyTokens();
  const pageMenuSections = usePageMenuSections();

  const { user, logout } = useAuth();
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [currentSupply, setCurrentSupply] = useState<number | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [isLoadingTokenData, setIsLoadingTokenData] = useState(false);
  const [socialUnreadCount, setSocialUnreadCount] = useState(0);

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

  /**
   * The guest's own things — their stays, their tickets. Everything here is
   * about the signed-in person rather than about running the place, which is
   * what keeps it out of the (largely role-gated) dashboard section.
   */
  const getMyStaysSection = (isBookingEnabled: boolean): MenuSection => ({
    label: t('menu_section_my_stays'),
    kind: 'account' as const,
    isOpen: false,
    items: [
      {
        label: t('navigation_my_bookings'),
        url: '/stay/upcoming',
        enabled: isBookingEnabled,
        rbacPage: 'MyBookings',
      },
      {
        label: t('navigation_past_bookings'),
        url: '/stay/past',
        enabled: isBookingEnabled,
        rbacPage: 'MyBookings',
      },
      {
        label: t('navigation_my_tickets'),
        url: '/tickets',
        enabled: isEventsEnabled,
      },
      {
        label: t('navigation_book_friend'),
        url: '/bookings/friends',
        enabled: isBookingEnabled,
        rbacPage: 'FriendsBooking',
      },
    ],
  });

  /**
   * Every dashboard page, grouped into categories. Both the TDF menu and the
   * generic one render this same section so the two never drift apart.
   */
  const getDashboardSection = ({
    isBookingEnabled,
    isGovernanceEnabled,
    isLearningHubEnabled,
    isAffiliateEnabled,
    isApplicationsEnabled,
    isTokenEnabled,
  }: {
    isBookingEnabled: boolean;
    isGovernanceEnabled: boolean;
    isLearningHubEnabled: boolean;
    isAffiliateEnabled: boolean;
    isApplicationsEnabled: boolean;
    isTokenEnabled: boolean;
  }): MenuSection => {
    const overview = t('menu_group_overview');
    const finance = t('menu_group_finance');
    const community = t('menu_group_community');
    const bookings = t('menu_section_bookings');
    const settings = t('menu_group_settings');

    return {
      label: t('menu_section_dashboard'),
      kind: 'account' as const,
      isOpen: false,
      items: [
        {
          group: overview,
          label: t('navigation_dashboard'),
          url: '/dashboard',
          enabled: true,
          roles: ['admin', 'team'],
          rbacPage: 'Dashboard',
        },
        {
          group: overview,
          label: t('navigation_performance'),
          url: '/dashboard/performance',
          enabled: true,
          roles: ['admin', 'team'],
          rbacPage: 'Performance',
        },
        {
          group: overview,
          label: t('navigation_metrics'),
          url: '/dashboard/metrics',
          enabled: true,
          roles: ['admin', 'team', 'space-host'],
          rbacPage: 'MetricsDashboard',
        },
        {
          group: finance,
          label: t('navigation_revenue'),
          url: '/dashboard/revenue',
          enabled: true,
          roles: ['admin', 'team'],
          rbacPage: 'Revenue',
        },
        {
          group: finance,
          label: t('navigation_sales'),
          url: '/dashboard/sales',
          enabled: isTokenEnabled,
          roles: ['admin', 'team', 'space-host'],
          rbacPage: 'TokenSales',
        },
        {
          group: finance,
          label: t('navigation_expense_tracking'),
          url: '/dashboard/expense-tracking',
          enabled: true,
          roles: ['admin', 'team', 'accounting'],
          rbacPage: 'ExpenseTracking',
        },
        {
          group: community,
          label: t('navigation_engagement'),
          url: '/dashboard/engagement',
          enabled: true,
          roles: ['admin', 'community-curator', 'space-host', 'team'],
          rbacPage: 'Engagement',
        },
        {
          group: community,
          label: t('navigation_applications'),
          url: '/dashboard/applications',
          enabled: isApplicationsEnabled,
          roles: ['admin', 'community-curator', 'team'],
          rbacPage: 'Applications',
        },
        {
          group: community,
          label: t('navigation_cohousing'),
          url: '/dashboard/cohousing',
          enabled: true,
          roles: ['admin', 'community-curator', 'team'],
          rbacPage: 'Dashboard',
        },
        {
          group: community,
          label: t('navigation_user_list'),
          url: '/dashboard/admin/manage-users',
          enabled: true,
          roles: ['admin', 'team'],
          rbacPage: 'UserManagement',
        },
        {
          group: community,
          label: t('navigation_governance'),
          url: '/governance',
          enabled: isGovernanceEnabled,
          roles: ['member'],
          rbacPage: 'Governance',
        },
        {
          group: bookings,
          label: t('navigation_booking_requests'),
          url: '/bookings/requests',
          enabled: isBookingEnabled,
          roles: ['admin', 'team', 'space-host'],
          rbacPage: 'Bookings',
        },
        {
          group: bookings,
          label: t('navigation_all_bookings'),
          url: '/bookings/all',
          enabled: isBookingEnabled,
          roles: ['admin', 'team', 'space-host'],
          rbacPage: 'Bookings',
        },
        {
          group: bookings,
          label: t('navigation_edit_listings'),
          url: '/listings',
          enabled: isBookingEnabled,
          roles: ['admin', 'team', 'space-host'],
          rbacPage: 'Listings',
        },
        {
          group: bookings,
          label: t('navigation_food'),
          url: '/food',
          enabled: isBookingEnabled,
          roles: ['admin', 'team', 'space-host'],
          rbacPage: 'Food',
        },
        {
          group: settings,
          label: t('navigation_platform_settings'),
          url: '/dashboard/admin/config',
          enabled: true,
          roles: ['admin'],
          rbacPage: 'PlatformSettings',
        },
        {
          group: settings,
          label: t('navigation_email_templates'),
          url: '/dashboard/admin/emails',
          enabled: true,
          roles: ['admin'],
          rbacPage: 'PlatformSettings',
        },
        {
          group: settings,
          label: t('navigation_pages'),
          url: '/dashboard/pages',
          enabled: true,
          roles: ['admin'],
          rbacPage: 'PlatformSettings',
        },
        {
          group: settings,
          label: t('navigation_theming'),
          url: '/dashboard/theming',
          enabled: true,
          roles: ['admin'],
          rbacPage: 'PlatformSettings',
        },
        {
          group: settings,
          label: t('navigation_rbac'),
          url: '/dashboard/admin/rbac',
          enabled: true,
          roles: ['admin'],
          rbacPage: 'RBAC',
        },
        {
          group: settings,
          label: t('navigation_learn_settings'),
          url: '/dashboard/admin/learn',
          enabled: isLearningHubEnabled,
          roles: ['admin'],
          rbacPage: 'LearnSettings',
        },
        {
          group: settings,
          label: t('navigation_affiliate_settings'),
          url: '/dashboard/affiliate',
          enabled: isAffiliateEnabled,
          roles: ['admin', 'team'],
          rbacPage: 'AffiliateSettings',
        },
        {
          group: settings,
          label: t('navigation_deploy_queue'),
          url: '/dashboard/deploy-queue',
          enabled: process.env.NEXT_PUBLIC_FEATURE_FEDERATION === 'true',
          roles: ['admin', 'affiliate-manager'],
          rbacPage: 'AffiliateSettings',
        },
      ],
    };
  };

  const getMenuSections = (
    isBookingEnabled: boolean,
    areSubscriptionsEnabled: boolean,
    isVolunteeringEnabled: boolean,
    isEventsEnabled: boolean,
    isCommunityEnabled: boolean,
    isGovernanceEnabled: boolean,
    isLearningHubEnabled: boolean,
    isBlogEnabled: boolean,
    isCitizenshipEnabled: boolean,
    isRolesEnabled: boolean,
    isFaqEnabled: boolean,
    isAffiliateEnabled: boolean,
    isCohousingEnabled: boolean,
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
              label: t('menu_cohousing'),
              url: '/cohousing',
              enabled: isCohousingEnabled,
            },
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
            {
              label: t('menu_artists_in_residence'),
              url: '/artists',
              enabled: true,
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
            {
              label: t('navigation_financed_tokens'),
              url: '/token/financed',
              enabled: process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true',
            },
          ],
        },
        {
          label: t('menu_community'),
          isOpen: false,
          items: [
            {
              label: t('menu_social'),
              url: '/social',
              enabled: isCommunityEnabled,
              rbacPage: 'Community',
            },
            {
              label: t('navigation_subscriptions'),
              url: '/subscriptions',
              enabled: areSubscriptionsEnabled,
              rbacPage: 'Subscriptions',
            },
            {
              label: t('menu_become_citizen'),
              url: '/citizenship',
              enabled: isCitizenshipEnabled,
            },
            {
              label: t('menu_governance_dao'),
              url: '/governance',
              enabled: isGovernanceEnabled,
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
              label: t('navigation_learning_hub'),
              url: '/learn/category/all',
              enabled: isLearningHubEnabled,
            },
            {
              label: t('menu_faq'),
              url: '/resources',
              enabled: isFaqEnabled,
              rbacPage: 'Resources',
            },
          ],
        },
        getMyStaysSection(isBookingEnabled),
        getDashboardSection({
          isBookingEnabled,
          isGovernanceEnabled,
          isLearningHubEnabled,
          isAffiliateEnabled,
          isApplicationsEnabled,
          isTokenEnabled: isWalletEnabled,
        }),
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
                },
                {
                  label: t('header_nav_stay'),
                  url: '/stay',
                  enabled: isBookingEnabled,
                },
                {
                  label: t('header_nav_community'),
                  url: '/pages/community',
                  enabled: true,
                },
                {
                  label: t('header_nav_events'),
                  url: '/pages/events',
                  enabled: true,
                },
              ]
            : []),
          {
            label: 'Learn about the $TDF token',
            url: '/token',
            enabled: process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true',
          },
          {
            label: t('navigation_financed_tokens'),
            url: '/token/financed',
            enabled: process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true',
          },
          {
            label: 'Become a Citizen',
            url: '/citizenship',
            enabled: isCitizenshipEnabled,
          },
          {
            label: t('navigation_work_with_us'),
            url: '/roles',
            enabled: isRolesEnabled,
            rbacPage: 'Roles',
          },
        ],
      },
      ...(APP_NAME?.toLowerCase().includes('earthbound')
        ? []
        : [
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
                  enabled:
                    isVolunteeringEnabled && APP_NAME?.toLowerCase() === 'tdf',
                  rbacPage: 'Residence',
                },
              ],
            },
          ]),

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
              APP_NAME?.toLowerCase() !== 'earthbound',
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
            enabled: isBlogEnabled,
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
            enabled: isLearningHubEnabled,
          },
        ],
      },

      ...(APP_NAME?.toLowerCase().includes('earthbound')
        ? []
        : [
            {
              label: t('navigation_faq'),
              isOpen: false,
              items: [
                {
                  label: t('navigation_faq'),
                  url: '/resources',
                  enabled: isFaqEnabled,
                  rbacPage: 'Resources',
                },
              ],
            },
          ]),
      {
        label: t('menu_section_other'),
        kind: 'account' as const,
        isOpen: false,
        items: [
          ...(isAffiliateEnabled && user?.affiliate
            ? [
                {
                  label: t('navigation_affiliate_dashboard'),
                  url: '/dashboard/affiliate',
                  enabled: isAffiliateEnabled && !!user?.affiliate,
                },
              ]
            : []),
        ],
      },
      getMyStaysSection(isBookingEnabled),
      getDashboardSection({
        isBookingEnabled,
        isGovernanceEnabled,
        isLearningHubEnabled,
        isAffiliateEnabled,
        isApplicationsEnabled,
        isTokenEnabled: isWalletEnabled,
      }),
    ];

    // Bookings section (only if booking is enabled)
    if (isBookingEnabled) {
      sections.push({
        label: t('menu_section_bookings'),
        kind: 'account' as const,
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
        ],
      });
    }

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
    if (!ready) return;

    const builtInSections = getMenuSections(
      isBookingEnabled,
      areSubscriptionsEnabled,
      isVolunteeringEnabled,
      isEventsEnabled,
      isCommunityEnabled,
      isGovernanceEnabled,
      isLearningHubEnabled,
      isBlogEnabled,
      isCitizenshipEnabled,
      isRolesEnabled,
      isFaqEnabled,
      isAffiliateEnabled,
      isCohousingEnabled,
    );
    // Pages flagged with `showInMenu` replace the hand-written content
    // sections; dashboard and booking sections always stay.
    const sections =
      pageMenuSections.length > 0
        ? [
            ...toNavigationSections(pageMenuSections),
            ...builtInSections.filter((section) => section.kind === 'account'),
          ]
        : builtInSections;
    const filteredSections = filterMenuSections(sections, user?.roles || []);
    setMenuSections(filteredSections);
  }, [
    pageMenuSections,
    ready,
    isBookingEnabled,
    areSubscriptionsEnabled,
    isVolunteeringEnabled,
    isEventsEnabled,
    isCommunityEnabled,
    isGovernanceEnabled,
    isLearningHubEnabled,
    isBlogEnabled,
    isCitizenshipEnabled,
    isRolesEnabled,
    isFaqEnabled,
    isAffiliateEnabled,
    isCohousingEnabled,
    user,
    router.locale,
    rbacLiveRevision,
  ]);

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

  // Fetch total unread social posts count
  useEffect(() => {
    if (!user) return;

    const fetchSocialUnread = async () => {
      try {
        const { data: channelData } = await api.get('/channel', {
          params: { limit: 200, sort_by: 'name' },
        });
        const channels = channelData.results || [];
        const joinedChannels = channels.filter((ch: any) =>
          ch.visibleBy?.includes(user._id),
        );
        if (joinedChannels.length === 0) return;

        const socialSettings = (user.settings?.social ?? {}) as Record<
          string,
          unknown
        >;
        let total = 0;

        await Promise.all(
          joinedChannels.map(async (ch: any) => {
            try {
              const entry = socialSettings[ch._id];
              const lastFetched =
                (typeof entry === 'object' &&
                entry !== null &&
                'lastFetched' in entry
                  ? (entry as { lastFetched?: string }).lastFetched
                  : null) ??
                (typeof socialSettings[ch.slug] === 'string'
                  ? socialSettings[ch.slug]
                  : null);
              const where: Record<string, any> = { channel: ch._id };
              if (lastFetched) {
                where.created = { $gt: lastFetched };
              }
              const { data } = await api.get('/count/post', {
                params: { where: formatSearch(where) },
              });
              const count = data?.count ?? data?.results ?? 0;
              if (count > 0) total += count;
            } catch {
              // ignore individual channel errors
            }
          }),
        );

        setSocialUnreadCount(total);
      } catch {
        // ignore
      }
    };

    fetchSocialUnread();
  }, [user?._id]);

  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  return (
    <nav className="flex flex-col gap-4">
      <Profile isMenu={true} isDemo={false} onLogout={logout} />

      {/* Render menu items */}
      {menuSections.map((section, index) => (
        <div key={section.label} className="mb-1">
          {/* For sections with only one item, display the item directly */}
          {section.items.length === 1 ? (
            <Link
              href={section.items[0].url || ''}
              target={section.items[0].target}
              className="flex items-center justify-between py-1 hover:bg-accent-light px-2 rounded text-black"
            >
              <span>{section.items[0].label}</span>
              {section.items[0].url === '/social' && socialUnreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-accent rounded-full">
                  {socialUnreadCount > 99 ? '99+' : socialUnreadCount}
                </span>
              )}
            </Link>
          ) : (
            <>
              {/* Section header (clickable to toggle) */}
              <div
                className="flex items-center justify-between py-1 px-2 cursor-pointer font-medium select-none"
                onClick={() => toggleSection(index)}
              >
                <span>{section.label}</span>
                <div className="flex items-center gap-1.5">
                  {section.items.some((item) => item.url === '/social') &&
                    socialUnreadCount > 0 &&
                    !section.isOpen && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-accent rounded-full">
                        {socialUnreadCount > 99 ? '99+' : socialUnreadCount}
                      </span>
                    )}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      section.isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Section items (only shown if section is open) */}
              {section.isOpen && (
                <div className="pl-2 border-l border-gray-200 ml-2 overflow-hidden transition-all duration-200 ease-out animate-in slide-in-from-top-2">
                  {section.items.map((item: NavigationLink, itemIndex) => {
                    // A category heading is drawn by the first item that
                    // survived filtering in each group, so groups emptied by
                    // RBAC or feature flags leave no orphan heading behind.
                    const isNewGroup =
                      item.group &&
                      item.group !== section.items[itemIndex - 1]?.group;

                    return (
                      <div key={item.url}>
                        {isNewGroup && (
                          <div className="px-2 pt-2 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            {item.group}
                          </div>
                        )}
                        <Link
                          href={item.url || ''}
                          target={item.target}
                          className="flex items-center justify-between py-1 hover:bg-accent-light px-2 rounded text-black"
                        >
                          <span>{item.label}</span>
                          {item.url === '/social' && socialUnreadCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-accent rounded-full">
                              {socialUnreadCount > 99
                                ? '99+'
                                : socialUnreadCount}
                            </span>
                          )}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {isWalletEnabled && <Wallet />}

      {APP_NAME?.toLowerCase() === 'tdf' &&
        isWalletEnabled &&
        process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true' && (
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
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
                className="block w-full py-2 px-3 bg-accent hover:bg-accent-dark text-white text-center text-sm font-medium rounded-full uppercase tracking-wide transition-colors hover:scale-105 duration-150"
              >
                {t('navigation_buy_tokens')}
              </Link>
            </div>
          </div>
        )}

      {APP_NAME?.toLowerCase() === 'tdf' &&
        process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true' &&
        user && <FinancedTokenMenuWidget />}

      <ReportABug />
    </nav>
  );
};

export default MemberMenu;
