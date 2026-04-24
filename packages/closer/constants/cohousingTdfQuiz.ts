export type TdfQuizQuestionType = 'single' | 'boolean' | 'text' | 'scale';

export interface TdfQuizOption {
  id: string;
  label: string;
}

export interface TdfQuizQuestion {
  id: string;
  section: string;
  title: string;
  type: TdfQuizQuestionType;
  options?: TdfQuizOption[];
  correctOptionId?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

const tfOptions: TdfQuizOption[] = [
  { id: 'true', label: 'True' },
  { id: 'false', label: 'False' },
];

export const TDF_QUIZ_INTRO = `This quiz is for people considering joining the TDF co-housing neighborhoods as long-term residents. It is not a test you need to pass to be welcomed. It is a mirror.

The questions cover four pillars: economics, ecology, social fabric, and governance. Honest answers are more useful than "perfect" ones.`;

export const TDF_QUIZ_QUESTIONS: TdfQuizQuestion[] = [
  {
    id: 'q1',
    section: 'Economics',
    title: 'What is the primary function of the $TDF token?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'A security that pays dividends from village revenue' },
      {
        id: 'b',
        label: 'A utility token for stay rights and governance participation',
      },
      { id: 'c', label: 'A euro-pegged stablecoin for village payments' },
      { id: 'd', label: 'A tradable real-estate share in land' },
    ],
  },
  {
    id: 'q2',
    section: 'Economics',
    title: 'Roughly, one $TDF token corresponds to:',
    type: 'single',
    correctOptionId: 'd',
    options: [
      { id: 'a', label: 'One square meter of land' },
      { id: 'b', label: 'One euro of equity' },
      { id: 'c', label: 'One vote regardless of count' },
      { id: 'd', label: 'One night of stay per year' },
    ],
  },
  {
    id: 'q3',
    section: 'Economics',
    title: 'What are $Presence and $Sweat?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'Competing tokens that replace $TDF' },
      { id: 'b', label: 'Reputation tokens for time on land and contribution' },
      { id: 'c', label: 'Fiat-pegged payment methods' },
      { id: 'd', label: 'NFTs for the village art program' },
    ],
  },
  {
    id: 'q4',
    section: 'Economics',
    title: 'Why does TDF token issuance use a one-way bonding curve?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'To maximize short-term speculation' },
      {
        id: 'b',
        label:
          'To guarantee a fair token price distribution over the total supply',
      },
      { id: 'c', label: "To mirror Bitcoin's halving schedule" },
      { id: 'd', label: 'Because of Portuguese regulation requirements' },
    ],
  },
  {
    id: 'q5',
    section: 'Economics',
    title: 'You can sell your $TDF today on open exchange',
    type: 'boolean',
    correctOptionId: 'false',
    options: tfOptions,
  },
  {
    id: 'q6',
    section: 'Economics',
    title: "A resident's monthly commitment is split into which three streams?",
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'Mortgage, taxes, insurance' },
      {
        id: 'b',
        label: 'Access fee, utilities cash fee, and food participation',
      },
      { id: 'c', label: 'Rent, deposit, community fund' },
      { id: 'd', label: 'Membership, timeshare, resort fees' },
    ],
  },
  {
    id: 'q7',
    section: 'Economics',
    title: 'Approximate monthly utilities for Earthpod and Townhouse?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'EUR50 and EUR100' },
      { id: 'b', label: 'EUR150 and EUR250' },
      { id: 'c', label: 'EUR500 and EUR800' },
      { id: 'd', label: 'EUR1000 and EUR1500' },
    ],
  },
  {
    id: 'q8',
    section: 'Economics',
    title:
      'Typical minimum physical presence requirement for co-housing residents?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'No minimum' },
      { id: 'b', label: '3 months over 2 years' },
      { id: 'c', label: 'Full-time residency only' },
      { id: 'd', label: '6 months per year' },
    ],
  },
  {
    id: 'q9',
    section: 'Economics',
    title: 'How many hours per week are residents expected to contribute?',
    type: 'single',
    correctOptionId: 'c',
    options: [
      { id: 'a', label: 'None' },
      { id: 'b', label: '1 hour' },
      { id: 'c', label: '4 hours' },
      { id: 'd', label: '20 hours' },
    ],
  },
  {
    id: 'q10',
    section: 'Economics',
    title: 'Typical lock and renewal structure in co-housing contract?',
    type: 'single',
    correctOptionId: 'c',
    options: [
      { id: 'a', label: 'Month-to-month no lock' },
      { id: 'b', label: 'Freehold purchase forever' },
      { id: 'c', label: '$TDF locked for a 7-year renewable contract' },
      { id: 'd', label: '99-year euro lease' },
    ],
  },
  {
    id: 'q11',
    section: 'Economics',
    title: 'What does "Exit to the Commons" mean?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'Founder IPO cashout strategy' },
      {
        id: 'b',
        label: 'Land removed from speculation in perpetual stewardship',
      },
      { id: 'c', label: 'Tax loophole' },
      { id: 'd', label: 'Liquidity event for holders' },
    ],
  },
  {
    id: 'q12',
    section: 'Economics',
    title: 'OASA is:',
    type: 'single',
    correctOptionId: 'c',
    options: [
      { id: 'a', label: 'A technical protocol acronym' },
      { id: 'b', label: 'A for-profit Portuguese corporation' },
      {
        id: 'c',
        label: 'A Swiss non-profit Verein holding stewardship/IP framework',
      },
      { id: 'd', label: 'A US 501(c)(3)' },
    ],
  },
  {
    id: 'q13',
    section: 'Economics',
    title: 'Which legal entity operates TDF locally in Portugal?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'OASA Lda' },
      { id: 'b', label: 'Enseada Sonhadora S.A.' },
      { id: 'c', label: 'TDF Holdings LLC' },
      { id: 'd', label: 'Closer Commons SGPS' },
    ],
  },
  {
    id: 'q14',
    section: 'Economics',
    title: 'What is the Commons Pot?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'Shared account for personal expenses' },
      {
        id: 'b',
        label: 'Approx 30% resident overlay for shared infrastructure',
      },
      { id: 'c', label: 'Cannabis garden' },
      { id: 'd', label: 'Token airdrop for newcomers' },
    ],
  },
  {
    id: 'q15',
    section: 'Economics',
    title: 'Which are the core pillars of the TDF economy?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'Rent, food, utilities' },
      {
        id: 'b',
        label: 'Accomodations, restaurant, events, retail products',
      },
      { id: 'c', label: 'Tokens, NFTs, carrots, crypto' },
      { id: 'd', label: 'Mushrooms, carbon credits, seedlings' },
    ],
  },
  {
    id: 'q17',
    section: 'Economics',
    title:
      'Typical loan-to-value for a mortgage for non-residents in Portuguese banks?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: '10-20%' },
      { id: 'b', label: '60-70%' },
      { id: 'c', label: '95-100%' },
      { id: 'd', label: '0%' },
    ],
  },
  {
    id: 'q18',
    section: 'Economics',
    title: 'Approximate target build cost per sqm and expected range?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: '€1,000 expected, with €800-€1,200 range' },
      { id: 'b', label: '€2,000 expected, with €1,500-€3,000 range' },
      { id: 'c', label: '€4,500 expected, with €4,000-€5,000 range' },
      { id: 'd', label: '€6,000 expected, with €5,500-€7,000 range' },
    ],
  },
  {
    id: 'q21',
    section: 'Economics',
    title:
      'Explain what you understand by Stewardship, and what duties you have as a resident within an OASA project',
    type: 'text',
    placeholder: 'Your reflection',
  },
  {
    id: 'q22',
    section: 'Economics',
    title:
      'If the village faced a 12-month cash crunch, how could you help concretely?',
    type: 'text',
    placeholder: 'Bridge loan, labor, skills, spending cuts, etc.',
  },
  {
    id: 'q23',
    section: 'Ecology',
    title: 'What is the approximate total size of TDF land?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: '5 hectares' },
      { id: 'b', label: '20 hectares' },
      { id: 'c', label: '25 hectares' },
      { id: 'd', label: '30 hectares' },
    ],
  },
  {
    id: 'q24',
    section: 'Ecology',
    title: 'What is the core OASA land-use ratio?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: '90% wild, 10% houses' },
      {
        id: 'b',
        label: '50% wild, 45% productive, under 5% infrastructure',
      },
      { id: 'c', label: '50% wild 50% built' },
      { id: 'd', label: 'No fixed ratio' },
    ],
  },
  {
    id: 'q25',
    section: 'Ecology',
    title: 'Approximately how many trees have been planted at TDF so far?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: '1,000' },
      { id: 'b', label: '4,000' },
      { id: 'c', label: '8,000' },
      { id: 'd', label: '18,000' },
    ],
  },
  {
    id: 'q26',
    section: 'Ecology',
    title: 'What are the main crops planned for the commercial orchard at TDF?',
    type: 'single',
    correctOptionId: 'd',
    options: [
      { id: 'a', label: 'Rubber plantation' },
      { id: 'b', label: 'Pears, avocados, citrus, peach' },
      { id: 'c', label: 'Cork oaks, eucalyptus, pine, poplar' },
      { id: 'd', label: 'Olives, almonds, figs, carobs, walnuts' },
    ],
  },
  {
    id: 'q27',
    section: 'Ecology',
    title:
      'Approximately how much annual rainwater is stored by the current TDF lakes, ponds & biopool?',
    type: 'single',
    correctOptionId: 'c',
    options: [
      { id: 'a', label: '15,000 liters' },
      { id: 'b', label: '150,000 liters' },
      { id: 'c', label: '1.5 million liters' },
      { id: 'd', label: '15 million liters' },
    ],
  },
  {
    id: 'q28',
    section: 'Ecology',
    title: "Alentejo's key climate challenges for a permaculture project are:",
    type: 'single',
    correctOptionId: 'd',
    options: [
      { id: 'a', label: 'Floods and heavy rainfall' },
      { id: 'b', label: 'Drought and extreme summer heat' },
      { id: 'c', label: 'Occasional frost' },
      { id: 'd', label: 'All of the above' },
    ],
  },
  {
    id: 'q30',
    section: 'Ecology',
    title:
      'TDF monitors biodiversity, carbon sequestration and water retention to ensure ecological health. As a resident, you are expected to contribute to positively impact these metrics. Negative impact could lead to termination of your residency.',
    type: 'boolean',
    correctOptionId: 'true',
    options: tfOptions,
  },
  {
    id: 'q31',
    section: 'Ecology',
    title: 'Syntropic agroforestry is:',
    type: 'single',
    correctOptionId: 'a',
    options: [
      {
        id: 'a',
        label: 'A regenerative multi-species successional food-forest method',
      },
      {
        id: 'b',
        label:
          'An agricultural method synergizing genetically optimized crops with native species',
      },
      {
        id: 'c',
        label:
          'A water-efficient method that maximizes crop yield per unit of labour',
      },
      {
        id: 'd',
        label: 'An aquaponic system that recycles water and nutrients',
      },
    ],
  },
  {
    id: 'q32',
    section: 'Ecology',
    title: 'The current TDF humanure system is primarily:',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'Municipal sewage connected' },
      { id: 'b', label: 'Composting toilets with multi-month curing' },
      {
        id: 'c',
        label: 'An anaerobic digester that converts human waste into biogas',
      },
    ],
  },
  {
    id: 'q34',
    section: 'Ecology',
    title:
      'TDF is planning to implement a closed-loop garden for each residential unit that cycles humanure into vegetables.',
    type: 'boolean',
    correctOptionId: 'true',
    options: tfOptions,
  },
  {
    id: 'q35',
    section: 'Ecology',
    title: 'When are open fires and bonfires on the land allowed?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'Never' },
      {
        id: 'b',
        label: 'In designated fire pits, November to April',
      },
      {
        id: 'c',
        label: 'Any time in the co-housing private fire pits',
      },
      {
        id: 'd',
        label: 'Anywhere, as long as the fire is monitored and water is nearby',
      },
    ],
  },
  {
    id: 'q37',
    section: 'Ecology',
    title:
      'Residents have the freedom to plant new trees and plants anywhere on the land.',
    type: 'boolean',
    correctOptionId: 'false',
    options: tfOptions,
  },
  {
    id: 'q38',
    section: 'Ecology',
    title:
      'What land-care skills do you already have, and what do you want to learn?',
    type: 'text',
    placeholder: 'Specific skills and learning goals',
  },
  {
    id: 'q39',
    section: 'Ecology',
    title:
      'How would you respond during a 6-week heatwave with fire risk and stressed trees nearby?',
    type: 'text',
    placeholder: 'Actions and coordination plan',
  },
  {
    id: 'q41',
    section: 'Social fabric',
    title: 'Typical current on-site and historical visitor numbers are:',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: '1-2 residents, 50 visitors' },
      {
        id: 'b',
        label: '10-30 on-site, up to 100 at events',
      },
      { id: 'c', label: '50 residents, 10 visitors' },
      { id: 'd', label: 'Unknown' },
    ],
  },
  {
    id: 'q43',
    section: 'Social fabric',
    title: 'A TDF Citizen is:',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'Anyone spending time on the land' },
      { id: 'b', label: 'A member the OASA Association' },
      { id: 'c', label: 'A token-holder participating in the TDF governance' },
      {
        id: 'd',
        label: 'A community member with governance rights and responsibilities',
      },
    ],
  },
  {
    id: 'q44',
    section: 'Social fabric',
    title: 'What is the token holdin requirement to become Citizen?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: '1 token' },
      { id: 'b', label: '10 tokens' },
      { id: 'c', label: '30 tokens' },
      { id: 'd', label: 'No threshold' },
    ],
  },
  {
    id: 'q46',
    section: 'Social fabric',
    title: 'TDF is a utopia with no conflict or difficulty.',
    type: 'boolean',
    correctOptionId: 'false',
    options: tfOptions,
  },
  {
    id: 'q46b',
    section: 'Social fabric',
    title: 'What TDF values are you most aligned with and why?',
    type: 'text',
    placeholder: '...',
  },
  {
    id: 'q47',
    section: 'Social fabric',
    title: 'What do you see as the biggest risks for co-housing residents?',
    type: 'text',
    placeholder:
      'Burnout, conflict, transitions, financial strain, and Web3 learning load',
  },
  {
    id: 'q49',
    section: 'Social fabric',
    title:
      'Childcare is arranged by TDF for residents children and included in monthly utility costs.',
    type: 'boolean',
    correctOptionId: 'false',
    options: tfOptions,
  },
  {
    id: 'q50',
    section: 'Social fabric',
    title: 'What do you bring to community, and what do you need to thrive?',
    type: 'text',
    placeholder: 'Gifts, roles, needs',
  },
  {
    id: 'q51',
    section: 'Social fabric',
    title:
      'Describe a real conflict you navigated and what you would do differently now.',
    type: 'text',
    placeholder: 'Situation, your role, learning',
  },
  {
    id: 'q52',
    section: 'Social fabric',
    title:
      'How do you handle collective decisions that do not go your way? Give an example.',
    type: 'text',
    placeholder: 'Example and reflection',
  },
  {
    id: 'q53',
    section: 'Governance',
    title: 'TDF governance has which three layers?',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'Federal, state, local' },
      {
        id: 'b',
        label: 'Constitutional layer, DAO, Executive team',
      },
      { id: 'c', label: 'CEO, CFO, COO' },
      { id: 'd', label: 'Judicial, parliamentary, ministerial' },
    ],
  },
  {
    id: 'q54',
    section: 'Governance',
    title: 'Who make decisions for day-to-day operations?',
    type: 'single',
    correctOptionId: 'c',
    options: [
      { id: 'a', label: 'Citizen' },
      { id: 'b', label: 'DAO' },
      { id: 'c', label: 'Executive team' },
      { id: 'd', label: 'All equally' },
    ],
  },
  {
    id: 'q55',
    section: 'Governance',
    title: 'The Constitution can be changed by DAO members.',
    type: 'boolean',
    correctOptionId: 'false',
    options: tfOptions,
  },
  {
    id: 'q56',
    section: 'Governance',
    title: 'Closer is:',
    type: 'single',
    correctOptionId: 'a',
    options: [
      { id: 'a', label: "TDF's operating and governance protocol" },
      { id: 'b', label: 'A sales and marketing process' },
      { id: 'c', label: 'A closed-loop garden system' },
      { id: 'd', label: 'Meditation app' },
    ],
  },
  {
    id: 'q57',
    section: 'Governance',
    title: 'DAO influence is determined by:',
    type: 'single',
    correctOptionId: 'c',
    options: [
      { id: 'a', label: '$TDF holdings' },
      { id: 'b', label: '1x for citizen, 2x for residents, 5x for team' },
      { id: 'c', label: '$TDF + $Presence + $Sweat weighting' },
    ],
  },
  {
    id: 'q58',
    section: 'Governance',
    title: 'What are the main categories of decisions made by the DAO?',
    type: 'single',
    correctOptionId: 'c',
    options: [
      { id: 'a', label: 'Masterplan, executive hiring, budgets,' },
      { id: 'b', label: 'Constitution, Game Guide, executive hiring' },
      { id: 'c', label: 'Game Guide, Masterplan, executive hiring' },
      { id: 'd', label: 'Game Gauide, budgets, profit distributions' },
    ],
  },
  {
    id: 'q59',
    section: 'Governance',
    title: 'The Guardian Council functions is designed to:',
    type: 'single',
    correctOptionId: 'b',
    options: [
      { id: 'a', label: 'Protect the residents from the Executive team' },
      {
        id: 'b',
        label: 'Preserve the ecological principles and long-term interests',
      },
      { id: 'c', label: 'Debate and vote on community proposals' },
      { id: 'd', label: 'Represent the project in Swiss courts' },
    ],
  },
  {
    id: 'q61',
    section: 'Governance',
    title: 'If a resident exits, the land can be sold on the open market.',
    type: 'boolean',
    correctOptionId: 'false',
    options: tfOptions,
  },
  {
    id: 'q62',
    section: 'Governance',
    title: 'TDF is:',
    type: 'single',
    correctOptionId: 'd',
    options: [
      { id: 'a', label: 'A rural tourism project' },
      {
        id: 'b',
        label: 'A prototype in a wider OASA network',
      },
      { id: 'c', label: 'A co-living & co-housing community' },
      { id: 'd', label: 'All of it' },
    ],
  },
  {
    id: 'q63',
    section: 'Governance',
    title:
      'Why does it matter that land stewardship is Constitutional, not Legislative?',
    type: 'text',
    placeholder: 'Problem this structure solves',
  },
  {
    id: 'q64',
    section: 'Governance',
    title:
      'What governance experience and governance growth goals do you bring?',
    type: 'text',
    placeholder: 'Experience and learning goals',
  },
  {
    id: 'alignment',
    section: 'Self-assessment',
    title:
      "On a scale of 1-10, how aligned are you with OASA's regenerative commons vision? Name one excitement and one pause.",
    type: 'scale',
    min: 1,
    max: 10,
    placeholder: 'Add one excitement and one pause',
  },
  {
    id: 'capacity',
    section: 'Self-assessment',
    title:
      'Assess your capacity for 4h/week contribution, 3 months/2 years presence, and governance participation. What makes this hard or easier?',
    type: 'text',
    placeholder: 'Capacity reflection',
  },
  {
    id: 'exit',
    section: 'Self-assessment',
    title:
      'If in 3 years you needed to leave TDF, how would you do it and what support would you want?',
    type: 'text',
    placeholder: 'Exit reflection',
  },
];
