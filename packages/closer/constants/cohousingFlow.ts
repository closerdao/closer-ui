export type CohousingPhaseId = 'P1' | 'P2' | 'P3' | 'P4';

export type StepPanel =
  | 'quiz'
  | 'cosigner'
  | 'financing'
  | 'commitment'
  | 'unit'
  | 'citizen'
  | 'designlock'
  | 'stage'
  | 'keys';

export interface CohousingPhaseDef {
  id: CohousingPhaseId;
  num: string;
  titleKey: string;
  subKey: string;
  accentClass: string;
  ringClass: string;
  steps: number[];
}

export interface CohousingStepDef {
  n: number;
  phase: CohousingPhaseId;
  titleKey: string;
  shortKey: string;
  descKey: string;
  dateKey: string;
  owner: 'team' | 'participant';
  teamActionKey?: string;
  panel?: StepPanel;
  stagePct?: number;
}

export const COHOUSING_PHASES: CohousingPhaseDef[] = [
  {
    id: 'P1',
    num: 'I',
    titleKey: 'cohousing_flow_phase_p1_title',
    subKey: 'cohousing_flow_phase_p1_sub',
    accentClass: 'text-accent',
    ringClass: 'border-accent',
    steps: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  {
    id: 'P2',
    num: 'II',
    titleKey: 'cohousing_flow_phase_p2_title',
    subKey: 'cohousing_flow_phase_p2_sub',
    accentClass: 'text-amber-700',
    ringClass: 'border-amber-600',
    steps: [9],
  },
  {
    id: 'P3',
    num: 'III',
    titleKey: 'cohousing_flow_phase_p3_title',
    subKey: 'cohousing_flow_phase_p3_sub',
    accentClass: 'text-amber-800',
    ringClass: 'border-amber-700',
    steps: [10, 11, 12],
  },
  {
    id: 'P4',
    num: 'IV',
    titleKey: 'cohousing_flow_phase_p4_title',
    subKey: 'cohousing_flow_phase_p4_sub',
    accentClass: 'text-green-700',
    ringClass: 'border-green-600',
    steps: [13, 14],
  },
];

export const COHOUSING_STEPS: CohousingStepDef[] = [
  {
    n: 1,
    phase: 'P1',
    titleKey: 'cohousing_flow_step_1_title',
    shortKey: 'cohousing_flow_step_1_short',
    descKey: 'cohousing_flow_step_1_desc',
    dateKey: 'cohousing_flow_step_1_date',
    owner: 'team',
    teamActionKey: 'cohousing_flow_step_1_action',
  },
  {
    n: 2,
    phase: 'P1',
    titleKey: 'cohousing_flow_step_2_title',
    shortKey: 'cohousing_flow_step_2_short',
    descKey: 'cohousing_flow_step_2_desc',
    dateKey: 'cohousing_flow_step_2_date',
    owner: 'participant',
    panel: 'quiz',
  },
  {
    n: 3,
    phase: 'P1',
    titleKey: 'cohousing_flow_step_3_title',
    shortKey: 'cohousing_flow_step_3_short',
    descKey: 'cohousing_flow_step_3_desc',
    dateKey: 'cohousing_flow_step_3_date',
    owner: 'participant',
    panel: 'cosigner',
  },
  {
    n: 4,
    phase: 'P1',
    titleKey: 'cohousing_flow_step_4_title',
    shortKey: 'cohousing_flow_step_4_short',
    descKey: 'cohousing_flow_step_4_desc',
    dateKey: 'cohousing_flow_step_4_date',
    owner: 'participant',
    panel: 'financing',
  },
  {
    n: 5,
    phase: 'P1',
    titleKey: 'cohousing_flow_step_5_title',
    shortKey: 'cohousing_flow_step_5_short',
    descKey: 'cohousing_flow_step_5_desc',
    dateKey: 'cohousing_flow_step_5_date',
    owner: 'participant',
    panel: 'commitment',
  },
  {
    n: 6,
    phase: 'P1',
    titleKey: 'cohousing_flow_step_6_title',
    shortKey: 'cohousing_flow_step_6_short',
    descKey: 'cohousing_flow_step_6_desc',
    dateKey: 'cohousing_flow_step_6_date',
    owner: 'team',
    teamActionKey: 'cohousing_flow_step_6_action',
  },
  {
    n: 7,
    phase: 'P1',
    titleKey: 'cohousing_flow_step_7_title',
    shortKey: 'cohousing_flow_step_7_short',
    descKey: 'cohousing_flow_step_7_desc',
    dateKey: 'cohousing_flow_step_7_date',
    owner: 'participant',
    panel: 'citizen',
  },
  {
    n: 8,
    phase: 'P1',
    titleKey: 'cohousing_flow_step_8_title',
    shortKey: 'cohousing_flow_step_8_short',
    descKey: 'cohousing_flow_step_8_desc',
    dateKey: 'cohousing_flow_step_8_date',
    owner: 'participant',
    panel: 'unit',
  },
  {
    n: 9,
    phase: 'P2',
    titleKey: 'cohousing_flow_step_9_title',
    shortKey: 'cohousing_flow_step_9_short',
    descKey: 'cohousing_flow_step_9_desc',
    dateKey: 'cohousing_flow_step_9_date',
    owner: 'participant',
    panel: 'designlock',
  },
  {
    n: 10,
    phase: 'P3',
    titleKey: 'cohousing_flow_step_10_title',
    shortKey: 'cohousing_flow_step_10_short',
    descKey: 'cohousing_flow_step_10_desc',
    dateKey: 'cohousing_flow_step_10_date',
    owner: 'participant',
    panel: 'stage',
    stagePct: 50,
  },
  {
    n: 11,
    phase: 'P3',
    titleKey: 'cohousing_flow_step_11_title',
    shortKey: 'cohousing_flow_step_11_short',
    descKey: 'cohousing_flow_step_11_desc',
    dateKey: 'cohousing_flow_step_11_date',
    owner: 'participant',
    panel: 'stage',
    stagePct: 20,
  },
  {
    n: 12,
    phase: 'P3',
    titleKey: 'cohousing_flow_step_12_title',
    shortKey: 'cohousing_flow_step_12_short',
    descKey: 'cohousing_flow_step_12_desc',
    dateKey: 'cohousing_flow_step_12_date',
    owner: 'participant',
    panel: 'stage',
    stagePct: 20,
  },
  {
    n: 13,
    phase: 'P4',
    titleKey: 'cohousing_flow_step_13_title',
    shortKey: 'cohousing_flow_step_13_short',
    descKey: 'cohousing_flow_step_13_desc',
    dateKey: 'cohousing_flow_step_13_date',
    owner: 'team',
    teamActionKey: 'cohousing_flow_step_13_action',
  },
  {
    n: 14,
    phase: 'P4',
    titleKey: 'cohousing_flow_step_14_title',
    shortKey: 'cohousing_flow_step_14_short',
    descKey: 'cohousing_flow_step_14_desc',
    dateKey: 'cohousing_flow_step_14_date',
    owner: 'participant',
    panel: 'keys',
  },
];

export const COHOUSING_STEP_BY_N: Record<number, CohousingStepDef> =
  Object.fromEntries(COHOUSING_STEPS.map((s) => [s.n, s]));

export const COHOUSING_PHASE_BY_ID: Record<CohousingPhaseId, CohousingPhaseDef> =
  Object.fromEntries(COHOUSING_PHASES.map((p) => [p.id, p])) as Record<
    CohousingPhaseId,
    CohousingPhaseDef
  >;

export interface CohousingQuizQuestion {
  qKey: string;
  optKeys: [string, string, string, string];
  correct: number;
}

export const COHOUSING_QUIZ: CohousingQuizQuestion[] = [
  {
    qKey: 'cohousing_quiz_q1',
    optKeys: [
      'cohousing_quiz_q1_o0',
      'cohousing_quiz_q1_o1',
      'cohousing_quiz_q1_o2',
      'cohousing_quiz_q1_o3',
    ],
    correct: 1,
  },
  {
    qKey: 'cohousing_quiz_q2',
    optKeys: [
      'cohousing_quiz_q2_o0',
      'cohousing_quiz_q2_o1',
      'cohousing_quiz_q2_o2',
      'cohousing_quiz_q2_o3',
    ],
    correct: 1,
  },
  {
    qKey: 'cohousing_quiz_q3',
    optKeys: [
      'cohousing_quiz_q3_o0',
      'cohousing_quiz_q3_o1',
      'cohousing_quiz_q3_o2',
      'cohousing_quiz_q3_o3',
    ],
    correct: 2,
  },
  {
    qKey: 'cohousing_quiz_q4',
    optKeys: [
      'cohousing_quiz_q4_o0',
      'cohousing_quiz_q4_o1',
      'cohousing_quiz_q4_o2',
      'cohousing_quiz_q4_o3',
    ],
    correct: 0,
  },
  {
    qKey: 'cohousing_quiz_q5',
    optKeys: [
      'cohousing_quiz_q5_o0',
      'cohousing_quiz_q5_o1',
      'cohousing_quiz_q5_o2',
      'cohousing_quiz_q5_o3',
    ],
    correct: 2,
  },
  {
    qKey: 'cohousing_quiz_q6',
    optKeys: [
      'cohousing_quiz_q6_o0',
      'cohousing_quiz_q6_o1',
      'cohousing_quiz_q6_o2',
      'cohousing_quiz_q6_o3',
    ],
    correct: 1,
  },
];

export interface CohousingUnitOption {
  ref: string;
  type: string;
  size: number;
  status: 'available' | 'taken';
  noteKey: string;
}

export const COHOUSING_UNITS: CohousingUnitOption[] = [
  {
    ref: 'EP-01',
    type: 'Earthpod',
    size: 50,
    status: 'available',
    noteKey: 'cohousing_unit_ep01_note',
  },
  {
    ref: 'EP-02',
    type: 'Earthpod',
    size: 50,
    status: 'taken',
    noteKey: 'cohousing_unit_ep02_note',
  },
  {
    ref: 'EP-03',
    type: 'Earthpod',
    size: 50,
    status: 'available',
    noteKey: 'cohousing_unit_ep03_note',
  },
  {
    ref: 'EP-04',
    type: 'Earthpod',
    size: 50,
    status: 'available',
    noteKey: 'cohousing_unit_ep04_note',
  },
  {
    ref: 'EP-05',
    type: 'Earthpod',
    size: 50,
    status: 'taken',
    noteKey: 'cohousing_unit_ep05_note',
  },
  {
    ref: 'EP-06',
    type: 'Earthpod',
    size: 50,
    status: 'available',
    noteKey: 'cohousing_unit_ep06_note',
  },
  {
    ref: 'EP-07',
    type: 'Earthpod',
    size: 50,
    status: 'available',
    noteKey: 'cohousing_unit_ep07_note',
  },
  {
    ref: 'EP-08',
    type: 'Earthpod',
    size: 50,
    status: 'available',
    noteKey: 'cohousing_unit_ep08_note',
  },
  {
    ref: 'EP-09',
    type: 'Earthpod',
    size: 50,
    status: 'available',
    noteKey: 'cohousing_unit_ep09_note',
  },
  {
    ref: 'EP-10',
    type: 'Earthpod',
    size: 50,
    status: 'available',
    noteKey: 'cohousing_unit_ep10_note',
  },
];

export const COHOUSING_POOL_BASE = 220000;
export const COHOUSING_POOL_GOAL = 500000;
