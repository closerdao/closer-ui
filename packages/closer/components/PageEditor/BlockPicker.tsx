import { useTranslations } from 'next-intl';

import Modal from '../Modal';
import { useConfig } from '../../hooks/useConfig';
import { getPageEditorFeatureFlags } from './featureFlags';

import type { SectionType } from '../../types/page';

type BlockCategory =
  | 'layout'
  | 'stay'
  | 'events'
  | 'token'
  | 'citizenship'
  | 'cohousing'
  | 'volunteering'
  | 'subscriptions'
  | 'fundraiser'
  | 'team'
  | 'press'
  | 'closer';

interface BlockTypeDef {
  type: SectionType;
  labelKey: string;
  descKey: string;
  category: BlockCategory;
  featureKey?: keyof ReturnType<typeof getPageEditorFeatureFlags>;
}

const BLOCK_TYPES: BlockTypeDef[] = [
  {
    type: 'hero',
    labelKey: 'pages_editor_block_hero',
    descKey: 'pages_editor_block_hero_desc',
    category: 'layout',
  },
  {
    type: 'gallery',
    labelKey: 'pages_editor_block_gallery',
    descKey: 'pages_editor_block_gallery_desc',
    category: 'layout',
  },
  {
    type: 'testimonials',
    labelKey: 'pages_editor_block_testimonials',
    descKey: 'pages_editor_block_testimonials_desc',
    category: 'layout',
  },
  {
    type: 'stats',
    labelKey: 'pages_editor_block_stats',
    descKey: 'pages_editor_block_stats_desc',
    category: 'layout',
  },
  {
    type: 'features',
    labelKey: 'pages_editor_block_features',
    descKey: 'pages_editor_block_features_desc',
    category: 'layout',
  },
  {
    type: 'timeline',
    labelKey: 'pages_editor_block_timeline',
    descKey: 'pages_editor_block_timeline_desc',
    category: 'layout',
  },
  {
    type: 'collapsibleFaq',
    labelKey: 'pages_editor_block_collapsible_faq',
    descKey: 'pages_editor_block_collapsible_faq_desc',
    category: 'layout',
  },
  {
    type: 'richText',
    labelKey: 'pages_editor_block_richtext',
    descKey: 'pages_editor_block_richtext_desc',
    category: 'layout',
  },
  {
    type: 'media',
    labelKey: 'pages_editor_block_media',
    descKey: 'pages_editor_block_media_desc',
    category: 'layout',
  },
  {
    type: 'textBlock',
    labelKey: 'pages_editor_block_text',
    descKey: 'pages_editor_block_text_desc',
    category: 'layout',
  },
  {
    type: 'cta',
    labelKey: 'pages_editor_block_cta',
    descKey: 'pages_editor_block_cta_desc',
    category: 'layout',
  },
  {
    type: 'dataTable',
    labelKey: 'pages_editor_block_data_table',
    descKey: 'pages_editor_block_data_table_desc',
    category: 'layout',
  },
  {
    type: 'barChart',
    labelKey: 'pages_editor_block_bar_chart',
    descKey: 'pages_editor_block_bar_chart_desc',
    category: 'layout',
  },
  {
    type: 'flowDiagram',
    labelKey: 'pages_editor_block_flow_diagram',
    descKey: 'pages_editor_block_flow_diagram_desc',
    category: 'layout',
  },
  {
    type: 'documents',
    labelKey: 'pages_editor_block_documents',
    descKey: 'pages_editor_block_documents_desc',
    category: 'layout',
  },
  {
    type: 'emailGate',
    labelKey: 'pages_editor_block_email_gate',
    descKey: 'pages_editor_block_email_gate_desc',
    category: 'layout',
  },
  {
    type: 'bookAStay',
    labelKey: 'pages_editor_block_book_a_stay',
    descKey: 'pages_editor_block_book_a_stay_desc',
    category: 'stay',
    featureKey: 'booking',
  },
  {
    type: 'listingsPreviews',
    labelKey: 'pages_editor_block_listings_previews',
    descKey: 'pages_editor_block_listings_previews_desc',
    category: 'stay',
    featureKey: 'booking',
  },
  {
    type: 'reviews',
    labelKey: 'pages_editor_block_reviews',
    descKey: 'pages_editor_block_reviews_desc',
    category: 'stay',
    featureKey: 'booking',
  },
  {
    type: 'eventsCalendar',
    labelKey: 'pages_editor_block_events_calendar',
    descKey: 'pages_editor_block_events_calendar_desc',
    category: 'events',
    featureKey: 'events',
  },
  {
    type: 'upcomingEvents',
    labelKey: 'pages_editor_block_upcoming_events',
    descKey: 'pages_editor_block_upcoming_events_desc',
    category: 'events',
    featureKey: 'events',
  },
  {
    type: 'pastEvents',
    labelKey: 'pages_editor_block_past_events',
    descKey: 'pages_editor_block_past_events_desc',
    category: 'events',
    featureKey: 'events',
  },
  {
    type: 'tokenStats',
    labelKey: 'pages_editor_block_token_stats',
    descKey: 'pages_editor_block_token_stats_desc',
    category: 'token',
    featureKey: 'token',
  },
  {
    type: 'floatingBuyTokens',
    labelKey: 'pages_editor_block_floating_buy_tokens',
    descKey: 'pages_editor_block_floating_buy_tokens_desc',
    category: 'token',
    featureKey: 'token',
  },
  {
    type: 'supplyGraph',
    labelKey: 'pages_editor_block_supply_graph',
    descKey: 'pages_editor_block_supply_graph_desc',
    category: 'token',
    featureKey: 'token',
  },
  {
    type: 'priceHistory',
    labelKey: 'pages_editor_block_price_history',
    descKey: 'pages_editor_block_price_history_desc',
    category: 'token',
    featureKey: 'token',
  },
  {
    type: 'citizenProgressBar',
    labelKey: 'pages_editor_block_citizen_progress',
    descKey: 'pages_editor_block_citizen_progress_desc',
    category: 'citizenship',
    featureKey: 'citizenship',
  },
  {
    type: 'citizenshipStatus',
    labelKey: 'pages_editor_block_citizenship_status',
    descKey: 'pages_editor_block_citizenship_status_desc',
    category: 'citizenship',
    featureKey: 'citizenship',
  },
  {
    type: 'financedTokensStart',
    labelKey: 'pages_editor_block_financed_tokens',
    descKey: 'pages_editor_block_financed_tokens_desc',
    category: 'citizenship',
    featureKey: 'citizenship',
  },
  {
    type: 'cohousingApplication',
    labelKey: 'pages_editor_block_cohousing_application',
    descKey: 'pages_editor_block_cohousing_application_desc',
    category: 'cohousing',
    featureKey: 'cohousing',
  },
  {
    type: 'volunteerCta',
    labelKey: 'pages_editor_block_volunteer_cta',
    descKey: 'pages_editor_block_volunteer_cta_desc',
    category: 'volunteering',
    featureKey: 'volunteering',
  },
  {
    type: 'projectList',
    labelKey: 'pages_editor_block_project_list',
    descKey: 'pages_editor_block_project_list_desc',
    category: 'volunteering',
    featureKey: 'volunteering',
  },
  {
    type: 'dailyContribution',
    labelKey: 'pages_editor_block_daily_contribution',
    descKey: 'pages_editor_block_daily_contribution_desc',
    category: 'volunteering',
    featureKey: 'volunteering',
  },
  {
    type: 'subscriptionPlans',
    labelKey: 'pages_editor_block_subscription_plans',
    descKey: 'pages_editor_block_subscription_plans_desc',
    category: 'subscriptions',
    featureKey: 'subscriptions',
  },
  {
    type: 'fundraiser',
    labelKey: 'pages_editor_block_fundraiser',
    descKey: 'pages_editor_block_fundraiser_desc',
    category: 'fundraiser',
    featureKey: 'fundraiser',
  },
  {
    type: 'fundraiserProgress',
    labelKey: 'pages_editor_block_fundraiser_progress',
    descKey: 'pages_editor_block_fundraiser_progress_desc',
    category: 'fundraiser',
    featureKey: 'fundraiser',
  },
  {
    type: 'fundraiserMilestones',
    labelKey: 'pages_editor_block_fundraiser_milestones',
    descKey: 'pages_editor_block_fundraiser_milestones_desc',
    category: 'fundraiser',
    featureKey: 'fundraiser',
  },
  {
    type: 'fundraiserRewards',
    labelKey: 'pages_editor_block_fundraiser_rewards',
    descKey: 'pages_editor_block_fundraiser_rewards_desc',
    category: 'fundraiser',
    featureKey: 'fundraiser',
  },
  {
    type: 'teamStructure',
    labelKey: 'pages_editor_block_team_structure',
    descKey: 'pages_editor_block_team_structure_desc',
    category: 'team',
    featureKey: 'team',
  },
  {
    type: 'teamMembers',
    labelKey: 'pages_editor_block_team_members',
    descKey: 'pages_editor_block_team_members_desc',
    category: 'team',
    featureKey: 'team',
  },
  {
    type: 'teamDirectory',
    labelKey: 'pages_editor_block_team_directory',
    descKey: 'pages_editor_block_team_directory_desc',
    category: 'team',
    featureKey: 'team',
  },
  {
    type: 'teamDepartments',
    labelKey: 'pages_editor_block_team_departments',
    descKey: 'pages_editor_block_team_departments_desc',
    category: 'team',
    featureKey: 'team',
  },
  {
    type: 'teamPartners',
    labelKey: 'pages_editor_block_team_partners',
    descKey: 'pages_editor_block_team_partners_desc',
    category: 'team',
    featureKey: 'team',
  },
  {
    type: 'teamGovernance',
    labelKey: 'pages_editor_block_team_governance',
    descKey: 'pages_editor_block_team_governance_desc',
    category: 'team',
    featureKey: 'team',
  },
  {
    type: 'teamJoinCta',
    labelKey: 'pages_editor_block_team_join_cta',
    descKey: 'pages_editor_block_team_join_cta_desc',
    category: 'team',
    featureKey: 'team',
  },
  {
    type: 'pressStats',
    labelKey: 'pages_editor_block_press_stats',
    descKey: 'pages_editor_block_press_stats_desc',
    category: 'press',
    featureKey: 'press',
  },
  {
    type: 'pressPublications',
    labelKey: 'pages_editor_block_press_publications',
    descKey: 'pages_editor_block_press_publications_desc',
    category: 'press',
    featureKey: 'press',
  },
  {
    type: 'pressHighlights',
    labelKey: 'pages_editor_block_press_highlights',
    descKey: 'pages_editor_block_press_highlights_desc',
    category: 'press',
    featureKey: 'press',
  },
  {
    type: 'pressPodcasts',
    labelKey: 'pages_editor_block_press_podcasts',
    descKey: 'pages_editor_block_press_podcasts_desc',
    category: 'press',
    featureKey: 'press',
  },
  {
    type: 'pressContact',
    labelKey: 'pages_editor_block_press_contact',
    descKey: 'pages_editor_block_press_contact_desc',
    category: 'press',
    featureKey: 'press',
  },
  {
    type: 'webinar',
    labelKey: 'pages_editor_block_webinar',
    descKey: 'pages_editor_block_webinar_desc',
    category: 'closer',
    featureKey: 'webinar',
  },
];

const CATEGORY_ORDER: BlockCategory[] = [
  'layout',
  'stay',
  'events',
  'token',
  'citizenship',
  'cohousing',
  'volunteering',
  'subscriptions',
  'fundraiser',
  'team',
  'press',
  'closer',
];

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (type: SectionType) => void;
}

const BlockPicker = ({ open, onClose, onPick }: Props) => {
  const t = useTranslations();
  const config = useConfig();
  const flags = getPageEditorFeatureFlags(config);

  if (!open) return null;

  const visibleBlocks = BLOCK_TYPES.filter(
    (b) => !b.featureKey || flags[b.featureKey],
  );

  const renderBlock = ({ type, labelKey, descKey }: BlockTypeDef) => (
    <button
      key={type}
      type="button"
      className="text-left border border-gray-200 rounded-lg p-4 hover:border-accent hover:bg-accent-light/30 transition-colors flex flex-col gap-1"
      onClick={() => {
        onPick(type);
        onClose();
      }}
    >
      <span className="font-medium text-gray-900">{t(labelKey)}</span>
      <span className="text-xs text-gray-500">{t(descKey)}</span>
    </button>
  );

  return (
    <Modal closeModal={() => onClose()}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('pages_editor_picker_title')}
        </h2>
        <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
          {CATEGORY_ORDER.map((category) => {
            const blocks = visibleBlocks.filter((b) => b.category === category);
            if (blocks.length === 0) return null;
            return (
              <div key={category} className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t(`pages_editor_picker_category_${category}`)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {blocks.map(renderBlock)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default BlockPicker;
