import type { SectionType } from '../../../types/page';
import type { ContentListInspectorConfig } from './ContentListInspector';

export const BLOCK_INSPECTOR_CONFIGS: Partial<
  Record<SectionType, ContentListInspectorConfig>
> = {
  pressStats: {
    listKey: 'items',
    listLabelKey: 'pages_editor_field_metrics',
    listAddLabelKey: 'pages_editor_add_metric',
    minItems: 1,
    defaultItem: { value: '0', label: '' },
    listItemFields: [
      { key: 'value', labelKey: 'pages_editor_field_value' },
      { key: 'label', labelKey: 'pages_editor_field_label' },
    ],
  },
  pressPublications: {
    fields: [{ key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' }],
    listKey: 'items',
    listLabelKey: 'pages_editor_field_publications',
    listAddLabelKey: 'pages_editor_add_publication',
    minItems: 1,
    defaultItem: { name: '' },
    listItemFields: [{ key: 'name', labelKey: 'pages_editor_field_name' }],
  },
  pressHighlights: {
    fields: [{ key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' }],
    listKey: 'items',
    listLabelKey: 'pages_editor_field_articles',
    listAddLabelKey: 'pages_editor_add_article',
    minItems: 1,
    defaultItem: { outlet: '', date: '', title: '', url: '' },
    listItemFields: [
      { key: 'outlet', labelKey: 'pages_editor_field_outlet' },
      { key: 'date', labelKey: 'pages_editor_field_date' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      { key: 'url', labelKey: 'pages_editor_field_url', type: 'url' },
    ],
  },
  pressPodcasts: {
    fields: [
      { key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
    ],
    listKey: 'items',
    listLabelKey: 'pages_editor_field_podcasts',
    listAddLabelKey: 'pages_editor_add_podcast',
    minItems: 1,
    defaultItem: {
      title: '',
      date: '',
      duration: '',
      host: '',
      speaker: '',
      url: '',
    },
    listItemFields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      { key: 'date', labelKey: 'pages_editor_field_date' },
      { key: 'duration', labelKey: 'pages_editor_field_duration' },
      { key: 'host', labelKey: 'pages_editor_field_host' },
      { key: 'speaker', labelKey: 'pages_editor_field_speaker' },
      { key: 'url', labelKey: 'pages_editor_field_url', type: 'url' },
    ],
  },
  pressContact: {
    fields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      { key: 'email', labelKey: 'pages_editor_field_email' },
    ],
  },
  teamStructure: {
    listKey: 'items',
    listLabelKey: 'pages_editor_field_items',
    listAddLabelKey: 'pages_editor_add_item',
    minItems: 1,
    defaultItem: { icon: 'users', title: '', description: '' },
    listItemFields: [
      { key: 'icon', labelKey: 'pages_editor_field_icon' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
    ],
  },
  teamMembers: {
    fields: [
      { key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
    ],
    listKey: 'members',
    listLabelKey: 'pages_editor_field_members',
    listAddLabelKey: 'pages_editor_add_member',
    minItems: 0,
    defaultItem: {
      name: '',
      role: '',
      bio: '',
      imageUrl: '',
      twitterUrl: '',
      linkedinUrl: '',
    },
    listItemFields: [
      { key: 'name', labelKey: 'pages_editor_field_name' },
      { key: 'role', labelKey: 'pages_editor_field_role' },
      { key: 'bio', labelKey: 'pages_editor_field_bio', type: 'textarea' },
      { key: 'imageUrl', labelKey: 'pages_editor_field_image_url', type: 'url' },
      {
        key: 'twitterUrl',
        labelKey: 'pages_editor_field_twitter_url',
        type: 'url',
      },
      {
        key: 'linkedinUrl',
        labelKey: 'pages_editor_field_linkedin_url',
        type: 'url',
      },
    ],
  },
  teamDepartments: {
    fields: [
      { key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
    ],
    listKey: 'departments',
    listLabelKey: 'pages_editor_field_departments',
    listAddLabelKey: 'pages_editor_add_department',
    minItems: 0,
    defaultItem: {
      title: '',
      subtitle: '',
      description: '',
      members: [],
    },
    listItemFields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      { key: 'subtitle', labelKey: 'pages_editor_field_subtitle' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
    ],
    nestedList: {
      key: 'members',
      labelKey: 'pages_editor_field_members',
      addLabelKey: 'pages_editor_add_member',
      minItems: 0,
      defaultItem: { name: '', role: '', isOpen: false },
      itemFields: [
        { key: 'name', labelKey: 'pages_editor_field_name' },
        { key: 'role', labelKey: 'pages_editor_field_role' },
        {
          key: 'isOpen',
          labelKey: 'pages_editor_field_position_open',
          type: 'checkbox',
        },
      ],
    },
  },
  teamPartners: {
    fields: [
      { key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
    ],
    listKey: 'partners',
    listLabelKey: 'pages_editor_field_partners',
    listAddLabelKey: 'pages_editor_add_partner',
    minItems: 0,
    defaultItem: { name: '', role: '' },
    listItemFields: [
      { key: 'name', labelKey: 'pages_editor_field_name' },
      { key: 'role', labelKey: 'pages_editor_field_role' },
    ],
  },
  teamGovernance: {
    fields: [
      { key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      { key: 'governsTitle', labelKey: 'pages_editor_field_governs_title' },
    ],
    listKey: 'items',
    listLabelKey: 'pages_editor_field_items',
    listAddLabelKey: 'pages_editor_add_item',
    minItems: 0,
    defaultItem: { title: '', description: '' },
    listItemFields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
    ],
    stringListKey: 'governsItems',
    stringListLabelKey: 'pages_editor_field_governs_items',
    stringListAddLabelKey: 'pages_editor_add_item',
  },
  teamJoinCta: {
    fields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      { key: 'primaryText', labelKey: 'pages_editor_field_primary_label' },
      { key: 'primaryLink', labelKey: 'pages_editor_field_primary_link' },
      { key: 'secondaryText', labelKey: 'pages_editor_field_secondary_label' },
      { key: 'secondaryLink', labelKey: 'pages_editor_field_secondary_link' },
    ],
  },
  fundraiser: {
    hint: 'pages_editor_fundraiser_hint',
    settingsFields: [
      {
        key: 'showTitle',
        labelKey: 'pages_editor_field_show_title',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
    fields: [
      { key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      { key: 'ctaText', labelKey: 'pages_editor_field_cta_text' },
      { key: 'ctaLink', labelKey: 'pages_editor_field_cta_url' },
    ],
  },
  fundraiserProgress: {
    hint: 'pages_editor_fundraiser_live_hint',
  },
  fundraiserMilestones: {
    hint: 'pages_editor_fundraiser_live_hint',
  },
  fundraiserRewards: {
    hint: 'pages_editor_fundraiser_live_hint',
  },
  volunteerCta: {
    fields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      { key: 'ctaText', labelKey: 'pages_editor_field_cta_text' },
      { key: 'ctaLink', labelKey: 'pages_editor_field_cta_url' },
    ],
  },
  projectList: {
    settingsFields: [
      {
        key: 'showInProgress',
        labelKey: 'pages_editor_field_show_in_progress_projects',
        type: 'checkbox',
        defaultValue: true,
      },
      {
        key: 'showCompleted',
        labelKey: 'pages_editor_field_show_completed_projects',
        type: 'checkbox',
        defaultValue: true,
      },
      {
        key: 'limit',
        labelKey: 'pages_editor_field_max_projects',
        type: 'number',
      },
    ],
    fields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'inProgressTitle',
        labelKey: 'pages_editor_field_in_progress_title',
      },
      { key: 'completedTitle', labelKey: 'pages_editor_field_completed_title' },
    ],
    hint: 'pages_editor_dynamic_block_hint',
  },
  dailyContribution: {
    hint: 'pages_editor_daily_contribution_utility_note_plain',
  },
  cohousingApplication: {
    fields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      { key: 'ctaText', labelKey: 'pages_editor_field_cta_text' },
      { key: 'ctaLink', labelKey: 'pages_editor_field_cta_url' },
    ],
  },
  citizenshipStatus: {
    hint: 'pages_editor_citizenship_status_hint',
    settingsFields: [
      {
        key: 'showBalances',
        labelKey: 'pages_editor_field_show_balances',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
    fields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      { key: 'ctaText', labelKey: 'pages_editor_field_cta_text' },
      { key: 'ctaLink', labelKey: 'pages_editor_field_cta_url' },
    ],
    stringListKey: 'items',
    stringListLabelKey: 'pages_editor_field_benefits',
    stringListAddLabelKey: 'pages_editor_add_item',
  },
  financedTokensStart: {
    fields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      { key: 'ctaText', labelKey: 'pages_editor_field_cta_text' },
      { key: 'ctaLink', labelKey: 'pages_editor_field_cta_url' },
    ],
    stringListKey: 'items',
    stringListLabelKey: 'pages_editor_field_items',
    stringListAddLabelKey: 'pages_editor_add_item',
  },
  citizenProgressBar: {
    settingsFields: [
      {
        key: 'citizenTarget',
        labelKey: 'pages_editor_field_citizen_target',
        type: 'number',
        defaultValue: 300,
      },
    ],
    fields: [{ key: 'title', labelKey: 'pages_editor_field_title' }],
  },
  floatingBuyTokens: {
    fields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      { key: 'ctaText', labelKey: 'pages_editor_field_cta_text' },
    ],
  },
  supplyGraph: {
    hint: 'pages_editor_dynamic_block_hint',
  },
  priceHistory: {
    hint: 'pages_editor_dynamic_block_hint',
  },
  listingsPreviews: {
    fields: [{ key: 'title', labelKey: 'pages_editor_field_title' }],
  },
  reviews: {
    settingsFields: [
      {
        key: 'shuffle',
        labelKey: 'pages_editor_field_shuffle',
        type: 'checkbox',
        defaultValue: true,
      },
      {
        key: 'limit',
        labelKey: 'pages_editor_field_limit',
        type: 'number',
        defaultValue: 3,
      },
    ],
    fields: [{ key: 'title', labelKey: 'pages_editor_field_title' }],
    listKey: 'items',
    listLabelKey: 'pages_editor_field_reviews',
    listAddLabelKey: 'pages_editor_add_review',
    minItems: 1,
    defaultItem: { name: '', content: '', photo: '' },
    listItemFields: [
      { key: 'name', labelKey: 'pages_editor_field_name' },
      {
        key: 'content',
        labelKey: 'pages_editor_field_content',
        type: 'textarea',
      },
      {
        key: 'photo',
        labelKey: 'pages_editor_field_photo_url',
        type: 'url',
      },
    ],
  },
  subscriptionPlans: {
    hint: 'pages_editor_dynamic_block_hint',
  },
  upcomingEvents: {
    hint: 'pages_editor_events_hint',
  },
  pastEvents: {
    hint: 'pages_editor_events_hint',
  },
  events: {
    hint: 'pages_editor_events_hint',
  },
  eventsCalendar: {
    hint: 'pages_editor_events_calendar_hint',
    settingsFields: [
      {
        key: 'showCreateCta',
        labelKey: 'pages_editor_field_show_create_cta',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
  },
  timeline: {
    fields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
    ],
    listKey: 'items',
    listLabelKey: 'pages_editor_field_timeline_steps',
    listAddLabelKey: 'pages_editor_add_timeline_step',
    minItems: 1,
    defaultItem: {
      phase: '',
      title: '',
      text: '',
      status: 'upcoming',
    },
    listItemFields: [
      { key: 'phase', labelKey: 'pages_editor_field_phase' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'text',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      {
        key: 'status',
        labelKey: 'pages_editor_field_status',
        type: 'select',
        options: [
          {
            value: 'current',
            labelKey: 'pages_editor_timeline_status_current',
          },
          {
            value: 'upcoming',
            labelKey: 'pages_editor_timeline_status_upcoming',
          },
          {
            value: 'future',
            labelKey: 'pages_editor_timeline_status_future',
          },
          {
            value: 'done',
            labelKey: 'pages_editor_timeline_status_done',
          },
        ],
      },
    ],
  },
  collapsibleFaq: {
    fields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
    ],
    listKey: 'items',
    listLabelKey: 'pages_editor_field_faq_items',
    listAddLabelKey: 'pages_editor_add_faq_item',
    minItems: 1,
    defaultItem: {
      title: '',
      text: '',
    },
    listItemFields: [
      { key: 'title', labelKey: 'pages_editor_field_question' },
      {
        key: 'text',
        labelKey: 'pages_editor_field_answer',
        type: 'textarea',
      },
    ],
  },
  emailGate: {
    hint: 'pages_editor_email_gate_hint',
    fields: [
      { key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      { key: 'ctaText', labelKey: 'pages_editor_field_cta_text' },
    ],
  },
  documents: {
    settingsFields: [
      {
        key: 'numColumns',
        labelKey: 'pages_editor_field_columns',
        type: 'number',
        defaultValue: 4,
      },
    ],
    fields: [
      { key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
    ],
    listKey: 'items',
    listLabelKey: 'pages_editor_field_documents',
    listAddLabelKey: 'pages_editor_add_document',
    minItems: 1,
    defaultItem: {
      title: '',
      href: '',
      downloadLabel: 'Download file →',
      icon: 'fileText',
    },
    listItemFields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      { key: 'href', labelKey: 'pages_editor_field_url', type: 'url' },
      { key: 'downloadLabel', labelKey: 'pages_editor_field_cta_text' },
      { key: 'icon', labelKey: 'pages_editor_field_icon' },
    ],
  },
  barChart: {
    fields: [
      { key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      { key: 'note', labelKey: 'pages_editor_field_note', type: 'textarea' },
    ],
    listKey: 'items',
    listLabelKey: 'pages_editor_field_bars',
    listAddLabelKey: 'pages_editor_add_bar',
    minItems: 1,
    defaultItem: { label: '', value: '', amount: '0' },
    listItemFields: [
      { key: 'label', labelKey: 'pages_editor_field_label' },
      { key: 'value', labelKey: 'pages_editor_field_value' },
      {
        key: 'amount',
        labelKey: 'pages_editor_field_amount',
        type: 'number',
      },
    ],
  },
  flowDiagram: {
    fields: [
      { key: 'eyebrow', labelKey: 'pages_editor_field_eyebrow' },
      { key: 'title', labelKey: 'pages_editor_field_title' },
      {
        key: 'description',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
      { key: 'note', labelKey: 'pages_editor_field_note', type: 'textarea' },
    ],
    listKey: 'nodes',
    listLabelKey: 'pages_editor_field_nodes',
    listAddLabelKey: 'pages_editor_add_node',
    minItems: 1,
    defaultItem: {
      title: '',
      subtitle: '',
      connectorLabel: '',
      icon: '',
      style: 'default',
    },
    listItemFields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      { key: 'subtitle', labelKey: 'pages_editor_field_subtitle' },
      {
        key: 'connectorLabel',
        labelKey: 'pages_editor_field_connector_label',
      },
      { key: 'icon', labelKey: 'pages_editor_field_icon' },
      {
        key: 'style',
        labelKey: 'pages_editor_field_style',
        type: 'select',
        options: [
          { value: 'default', labelKey: 'pages_editor_flow_style_default' },
          { value: 'dashed', labelKey: 'pages_editor_flow_style_dashed' },
          { value: 'dark', labelKey: 'pages_editor_flow_style_dark' },
          { value: 'accent', labelKey: 'pages_editor_flow_style_accent' },
        ],
      },
    ],
  },
  dataroom: {
    fields: [
      { key: 'heroEyebrow', labelKey: 'pages_editor_field_eyebrow' },
      { key: 'heroTitle', labelKey: 'pages_editor_field_title' },
      {
        key: 'heroDescription',
        labelKey: 'pages_editor_field_description',
        type: 'textarea',
      },
    ],
    listKey: 'documents',
    listLabelKey: 'pages_editor_field_documents',
    listAddLabelKey: 'pages_editor_add_document',
    minItems: 1,
    defaultItem: {
      title: '',
      href: '',
      downloadLabel: 'Download file →',
    },
    listItemFields: [
      { key: 'title', labelKey: 'pages_editor_field_title' },
      { key: 'href', labelKey: 'pages_editor_field_url', type: 'url' },
      { key: 'downloadLabel', labelKey: 'pages_editor_field_cta_text' },
    ],
  },
};
