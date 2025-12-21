import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useConfig } from '../hooks/useConfig';
import useRBAC from '../hooks/useRBAC';
import api from '../utils/api';
import ReportABug from './ReportABug';
import NavLink from './ui/NavLink';

interface MenuSection {
  label: string;
  isOpen: boolean;
  items: {
    label: string;
    url: string;
    target?: string;
    enabled: boolean;
    rbacPage?: string;
  }[];
}

const GuestMenu = () => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();
  const { hasAccess } = useRBAC();
  const router = useRouter();

  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);

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
    isVolunteeringEnabled: boolean,
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
              url: 'https://oasa.earth',
              target: '_blank',
              enabled: true,
            },
            {
              label: t('menu_press'),
              url: '/press',
              enabled: true,
            },
          ],
        },
        {
          label: t('menu_the_village'),
          isOpen: false,
          items: [
            {
              label: t('menu_master_plan'),
              url: '/dataroom#master-plan',
              enabled: true,
              rbacPage: 'Dataroom',
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
              label: t('menu_events_programs'),
              url: '/events',
              enabled: true,
              rbacPage: 'Events',
            },
          ],
        },
        {
          label: t('menu_investors'),
          isOpen: false,
          items: [
            {
              label: t('menu_token_economics'),
              url: '/token',
              enabled: process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true' && APP_NAME?.toLowerCase() === 'tdf',
              rbacPage: 'Token',
            },
            {
              label: t('menu_data_room'),
              url: '/dataroom',
              enabled: APP_NAME?.toLowerCase() === 'tdf',
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
              enabled: APP_NAME?.toLowerCase() === 'tdf',
            },
            {
              label: t('menu_governance_dao'),
              url: '/governance',
              enabled: APP_NAME?.toLowerCase() === 'tdf',
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
      ];
    }

    // Create all menu sections with their items for other apps
    const sections: MenuSection[] = [
      // Stay section (open by default)
      {
        label: t('menu_section_stay'),
        isOpen: true,
        items: [
          {
            label: t('navigation_stay'),
            url: '/stay',
            enabled: isBookingEnabled && APP_NAME?.toLowerCase() !== 'tdf',
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
            enabled: process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true',
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
            label: t('navigation_join_program'),
            url: '/events',
            enabled:
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

      // Learn more section
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
                  enabled: true,
                  rbacPage: 'Events',
                },
              ]
            : []),
          {
            label: t('navigation_invest'),
            url: '/dataroom',
            enabled: true,
            rbacPage: 'Dataroom',
          },
          {
            label: t('navigation_buy_tokens'),
            url: '/token',
            enabled: process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true',
            rbacPage: 'Token',
          },
          {
            label: 'Become a Citizen',
            url: '/citizenship',
            enabled: APP_NAME?.toLowerCase() === 'tdf',
          },
        ],
      },

      // FAQ section (lowest item)
      {
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
      },
    ];

    return sections;
  };

  // Filter menu items based on RBAC permissions
  const filterMenuSections = (sections: MenuSection[]) => {
    return sections
      .map((section) => {
        // Filter items in this section
        const filteredItems = section.items.filter((item) => {
          // Check if the item is enabled and the user has RBAC access
          if (!item.enabled || (item.rbacPage && !hasAccess(item.rbacPage))) {
            return false;
          }

          // If no RBAC page specified, show to everyone
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
        const [volunteerRes, bookingRes] = await Promise.all([
          api.get('config/volunteering').catch((err) => {
            console.error('Error fetching volunteering config:', err);
            return null;
          }),
          api.get('config/booking').catch((err) => {
            console.error('Error fetching booking config:', err);
            return null;
          }),
        ]);

        const isVolunteeringEnabled =
          volunteerRes?.data.results.value.enabled === true &&
          process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING === 'true';
        const isBookingEnabled =
          bookingRes?.data.results.value.enabled === true;

        // Get menu sections with all items
        const sections = getMenuSections(
          isBookingEnabled,
          isVolunteeringEnabled,
        );

        // Filter sections based on RBAC permissions
        const filteredSections = filterMenuSections(sections);

        setMenuSections(filteredSections);
      } catch (err) {
        console.log('error');
      }
    })();
  }, [router.locale]);

  return (
    <nav>
      {/* Login/Signup buttons - keep as pink buttons */}
      <div className="pt-4 pb-6 relative rounded-lg border-3 flex flex-col gap-3">
        <p className="mb-4 text-center">{t('navigation_sign_in_cta')}</p>

        <NavLink href="/signup">{t('navigation_signup')}</NavLink>
        <Link
          href="/login"
          className="block py-1 hover:bg-accent-light px-2 rounded text-black text-center"
        >
          {t('navigation_sign_in')}
        </Link>
      </div>

      {/* Render menu items with the same styling as MemberMenu */}
      <div className="flex flex-col gap-4 mt-4">
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
                  className="flex items-center justify-between py-1 px-2 cursor-pointer font-medium"
                  onClick={() => toggleSection(index)}
                >
                  <span>{section.label}</span>
                  <span>{section.isOpen ? '▼' : '►'}</span>
                </div>

                {/* Section items (only shown if section is open) */}
                {section.isOpen && (
                  <div className="pl-2 border-l border-gray-200 ml-2">
                    {section.items.map((item) => (
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

        <ReportABug />
      </div>
    </nav>
  );
};

export default GuestMenu;
