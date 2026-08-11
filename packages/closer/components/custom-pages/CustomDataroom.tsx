import Link from 'next/link';

import { useEffect, useState } from 'react';

import {
  BarChart3,
  Building2,
  Check,
  Droplets,
  FileSpreadsheet,
  Landmark,
  Map,
  MapPin,
  Rocket,
  Sprout,
  Users,
  Wallet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { resolveBlockText } from '../../utils/blockI18n';
import Newsletter from '../Newsletter';
import { Card, Heading, LinkButton } from '../ui';
import Webinar from '../Webinar';

export interface DataroomDocument {
  title?: string;
  href?: string;
  downloadLabel?: string;
}

export interface DataroomPartner {
  name?: string;
  role?: string;
}

export interface DataroomContent {
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  stats?: { value?: string; label?: string }[];
  loanTerms?: { value?: string; label?: string }[];
  documents?: DataroomDocument[];
  partners?: DataroomPartner[];
  webinarTags?: string[];
  webinarAnalyticsCategory?: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content?: DataroomContent;
}

const DEFAULT_STATS = [
  { value: '€450K', label: '_i18n_dataroom_stat_total_funding' },
  { value: '€1.24M', label: '_i18n_dataroom_stat_construction_budget' },
  { value: '€653k', label: '_i18n_dataroom_stat_revenue_target' },
  { value: '25ha', label: '_i18n_dataroom_stat_land_stewardship' },
];

const DEFAULT_LOAN_TERMS = [
  { value: '€450K', label: '_i18n_dataroom_terms_amount' },
  { value: '5%', label: '_i18n_dataroom_terms_rate' },
  { value: '4 yr', label: '_i18n_dataroom_terms_term' },
  { value: '€50K', label: '_i18n_dataroom_terms_minimum' },
];

const DEFAULT_DOCUMENTS: DataroomDocument[] = [
  {
    title: '_i18n_dataroom_financial_plan_title',
    href: '/dataroom/tdf-financial-plan.xlsx',
    downloadLabel: '_i18n_dataroom_download_file',
  },
  {
    title: '_i18n_dataroom_area_map_title',
    href: '/dataroom/tdf-area-map.kml',
    downloadLabel: '_i18n_dataroom_download_file',
  },
  {
    title: '_i18n_dataroom_architecture_title',
    href: '/dataroom/tdf-architecture.pdf',
    downloadLabel: '_i18n_dataroom_download_pdf',
  },
  {
    title: '_i18n_dataroom_report_2021_title',
    href: '/pdf/2021-TDF-report.pdf',
    downloadLabel: '_i18n_dataroom_download_pdf',
  },
  {
    title: '_i18n_dataroom_report_2022_title',
    href: '/pdf/2022-TDF-report.pdf',
    downloadLabel: '_i18n_dataroom_download_pdf',
  },
  {
    title: '_i18n_dataroom_report_2024_title',
    href: '/pdf/2024-TDF-report.pdf',
    downloadLabel: '_i18n_dataroom_download_pdf',
  },
  {
    title: '_i18n_dataroom_report_2025_title',
    href: '/pdf/2025-TDF-report.pdf',
    downloadLabel: '_i18n_dataroom_download_pdf',
  },
];

const DEFAULT_PARTNERS: DataroomPartner[] = [
  { name: 'CRU Architecture', role: 'Architecture' },
  { name: 'SCARD', role: 'Engineering' },
  { name: 'Coin Finance', role: 'Token & Web3' },
  { name: 'CAAC', role: 'Accounting' },
  { name: 'Fieldfisher', role: 'Legal (PT)' },
  { name: 'Lars Schlichting', role: 'Legal (CH)' },
  { name: 'Start PME', role: 'Grant Support' },
  { name: 'Crédito Agrícola', role: 'Banking' },
  { name: 'White Rabbit', role: 'Marketing & PR' },
  { name: 'Kinterra', role: 'Regen Systems' },
];

const DOC_ICONS = [
  FileSpreadsheet,
  Map,
  Building2,
  BarChart3,
  Sprout,
  Droplets,
  Rocket,
];

const DOC_ICON_BG = [
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-slate-100 text-slate-700',
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-cyan-100 text-cyan-600',
  'bg-orange-100 text-orange-600',
];

const CustomDataroom = ({ content }: Props) => {
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const [isEmailUnlocked, setIsEmailUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unlocked = localStorage.getItem('signupCompleted') === 'true';
    setIsEmailUnlocked(unlocked);
  }, []);

  const isContentLocked = !isAuthenticated && !isEmailUnlocked;
  const pick = (raw: string | undefined, fallbackKey: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : t(fallbackKey);

  const heroEyebrow = pick(content?.heroEyebrow, 'dataroom_hero_label');
  const heroTitle = pick(content?.heroTitle, 'dataroom_hero_subtitle');
  const heroDescription = pick(
    content?.heroDescription,
    'dataroom_hero_description',
  );
  const stats =
    Array.isArray(content?.stats) && content.stats.length > 0
      ? content.stats
      : DEFAULT_STATS;
  const loanTerms =
    Array.isArray(content?.loanTerms) && content.loanTerms.length > 0
      ? content.loanTerms
      : DEFAULT_LOAN_TERMS;
  const documents =
    Array.isArray(content?.documents) && content.documents.length > 0
      ? content.documents
      : DEFAULT_DOCUMENTS;
  const partners =
    Array.isArray(content?.partners) && content.partners.length > 0
      ? content.partners
      : DEFAULT_PARTNERS;
  const webinarTags = content?.webinarTags ?? ['dataroom', 'investor-webinar'];
  const webinarAnalyticsCategory =
    content?.webinarAnalyticsCategory ?? 'Dataroom';

  return (
    <>
      <section className="bg-white">
        <div className="bg-gradient-to-br from-accent-light to-accent-alt-light border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-xs uppercase tracking-wider text-gray-600 mb-4 font-medium">
                {heroEyebrow}
              </p>
              <Heading
                className="mb-4 text-4xl md:text-6xl"
                data-testid="page-title"
                display
                level={1}
              >
                {heroTitle}
              </Heading>
              <p className="text-base text-gray-700 mb-12 leading-relaxed font-light max-w-2xl mx-auto">
                {heroDescription}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
                {stats.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="bg-white/90 rounded border border-gray-200 p-5 text-center"
                  >
                    <div className="text-2xl md:text-3xl font-normal text-gray-900 mb-2 font-serif">
                      {resolveBlockText(item.value, t)}
                    </div>
                    <div className="text-xs text-gray-600 font-light">
                      {resolveBlockText(item.label, t)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <LinkButton
                  href="#webinar"
                  variant="primary"
                  className="bg-gray-900 text-white hover:bg-gray-800 border-0"
                >
                  {t('dataroom_executive_cta_secondary_1')}
                </LinkButton>
              </div>
            </div>
          </div>
        </div>

        {!mounted ? (
          <div className="py-16 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <div className="h-32" />
              </div>
            </div>
          </div>
        ) : isContentLocked ? (
          <div className="py-16 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <Heading
                  level={2}
                  className="text-2xl md:text-3xl mb-4 text-gray-900 font-normal"
                >
                  {t('dataroom_gate_title')}
                </Heading>
                <p className="text-base text-gray-700 mb-8 leading-relaxed font-light">
                  {t('dataroom_gate_description')}
                </p>
                <div className="flex justify-center">
                  <Newsletter
                    placement="dataroom"
                    className="sm:w-[420px] bg-white border border-gray-200 rounded-lg px-6"
                    ctaText={t('dataroom_gate_cta')}
                    showTitle={false}
                    requireTurnstile
                    onSuccess={() => setIsEmailUnlocked(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="py-16 bg-white border-b border-gray-200">
              <div className="max-w-5xl mx-auto px-6">
                <div className="text-center mb-10">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                    {t('dataroom_loan_terms_label')}
                  </p>
                  <Heading
                    level={2}
                    className="text-3xl md:text-4xl mb-4 text-gray-900 font-normal"
                  >
                    {t('dataroom_loan_terms_title')}
                  </Heading>
                </div>

                <Card className="p-8 border-2 border-gray-900 rounded-lg bg-white mb-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    {loanTerms.map((item, index) => (
                      <div key={`${item.label}-${index}`} className="text-center">
                        <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-1">
                          {resolveBlockText(item.value, t)}
                        </div>
                        <div className="text-sm text-gray-600 font-light">
                          {resolveBlockText(item.label, t)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                    <div>
                      <div className="font-semibold text-gray-900 mb-2">
                        {t('dataroom_terms_security_label')}
                      </div>
                      <p className="text-sm text-gray-700 font-light">
                        {t('dataroom_terms_security_desc')}
                      </p>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-2">
                        {t('dataroom_terms_conversion_label')}
                      </div>
                      <p className="text-sm text-gray-700 font-light">
                        {t('dataroom_terms_conversion_desc')}
                      </p>
                    </div>
                  </div>
                </Card>

                <p className="text-sm text-gray-600 text-center font-light">
                  {t('dataroom_terms_note')}
                </p>
              </div>
            </div>
            <div className="py-10 bg-gray-50 border-b border-gray-200">
              <div className="max-w-3xl mx-auto px-6">
                <div className="text-center mb-6">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">
                    {t('dataroom_legal_structure_label')}
                  </p>
                  <Heading
                    level={2}
                    className="text-2xl md:text-3xl mb-2 text-gray-900 font-normal"
                  >
                    {t('dataroom_legal_structure_title')}
                  </Heading>
                </div>

                <div className="flex flex-col items-center gap-1 mb-6">
                  <div className="bg-white border border-gray-300 rounded-xl p-3 w-full max-w-[180px] text-center shadow-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Landmark className="w-4 h-4 text-blue-700" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900">
                      OASA Association
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      Non-Profit • Switzerland
                    </p>
                  </div>

                  <div className="flex flex-col items-center py-1">
                    <div className="w-0.5 h-3 bg-gray-300"></div>
                    <span className="text-[10px] text-gray-500 px-1">
                      holds equity in
                    </span>
                    <div className="w-0.5 h-3 bg-gray-300"></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-white border border-dashed border-emerald-400 rounded-xl p-3 w-[140px] text-center shadow-sm">
                      <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                      <h3 className="font-semibold text-xs text-gray-900">
                        Land + Buildings
                      </h3>
                      <p className="text-[9px] text-gray-500">25ha • Abela</p>
                    </div>

                    <div className="flex items-center">
                      <div className="w-4 h-0.5 bg-gray-300"></div>
                      <span className="text-[9px] text-gray-500 px-1">→</span>
                    </div>

                    <div className="bg-gray-900 text-white rounded-xl p-3 w-[160px] text-center shadow-md">
                      <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                        <Building2 className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h3 className="font-semibold text-xs">
                        Enseada Sonhadora S.A.
                      </h3>
                      <p className="text-[9px] text-gray-300">SPV • Portugal</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center py-1">
                    <div className="w-0.5 h-3 bg-gray-300"></div>
                    <span className="text-[10px] text-gray-500 px-1">
                      secures
                    </span>
                    <div className="w-0.5 h-3 bg-gray-300"></div>
                  </div>

                  <div className="bg-accent border border-accent-dark rounded-xl p-3 w-full max-w-[180px] text-center shadow-sm">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                      <Wallet className="w-4 h-4 text-gray-900" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900">
                      Private Debt
                    </h3>
                    <p className="text-[10px] text-gray-700">
                      Your Investment • €450K
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 font-light text-center max-w-xl mx-auto">
                  {t('dataroom_legal_structure_desc')}
                </p>
              </div>
            </div>
            <div className="py-24 bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                    {t('dataroom_investment_overview_label')}
                  </p>
                  <Heading
                    level={2}
                    className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal"
                  >
                    {t('dataroom_investment_highlights_title')}
                  </Heading>
                  <p className="text-base text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
                    {t('dataroom_investment_highlights_description')}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-xl font-semibold mb-6 text-gray-900">
                      {t('dataroom_collateral_title')}
                    </h3>
                    <div className="space-y-6">
                      <div className="border-l-4 border-gray-900 pl-5">
                        <div className="font-semibold text-sm text-gray-600 mb-2">
                          {t('dataroom_land_acquisition_title')}
                        </div>
                        <div className="text-3xl font-normal text-gray-900 mb-2">
                          {t('dataroom_land_acquisition_amount_550k')}
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed font-light">
                          {t('dataroom_collateral_land_desc')}
                        </div>
                      </div>
                      <div className="border-l-4 border-gray-900 pl-5">
                        <div className="font-semibold text-sm text-gray-600 mb-2">
                          {t('dataroom_buildings_portfolio_title')}
                        </div>
                        <div className="text-3xl font-normal text-gray-900 mb-2">
                          {t('dataroom_buildings_portfolio_amount')}
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed font-light">
                          {t('dataroom_collateral_buildings_desc')}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">
                          {t('dataroom_collateral_total')}
                        </span>
                        <span className="text-2xl font-semibold text-gray-900">
                          ~€1.0M+
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 font-light">
                        {t('dataroom_collateral_note')}
                      </p>
                    </div>
                  </Card>
                  <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-xl font-semibold mb-6 text-gray-900">
                      {t('dataroom_why_now_title')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                          <Check className="w-4 h-4 text-emerald-700" />
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                          {t('dataroom_why_now_1')}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                          <Landmark className="w-4 h-4 text-blue-700" />
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                          {t('dataroom_why_now_2')}
                        </p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                          <FileSpreadsheet className="w-4 h-4 text-amber-700" />
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                          {t('dataroom_why_now_3')}
                        </p>
                      </div>
                      <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                        <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center mb-2">
                          <Users className="w-4 h-4 text-violet-700" />
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                          {t('dataroom_why_now_4')}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
            <div className="py-24 bg-gray-50 border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                    {t('dataroom_track_record_label')}
                  </p>
                  <Heading
                    level={2}
                    className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal"
                  >
                    {t('dataroom_track_record_title')}
                  </Heading>
                  <p className="text-base text-gray-700 mb-8 leading-relaxed font-light">
                    {t('dataroom_track_record_subtitle')}{' '}
                    <Link
                      href="/roadmap"
                      className="text-gray-900 underline hover:text-gray-700 font-medium"
                    >
                      {t('dataroom_detailed_roadmap')}
                    </Link>
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-16 mb-12">
                  <div>
                    <Heading
                      level={3}
                      className="text-xl mb-8 text-gray-900 font-semibold"
                    >
                      {t('dataroom_completed_milestones_title')}
                    </Heading>
                    <ul className="space-y-5">
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                        <div>
                          <strong className="font-semibold text-gray-900">
                            {t('dataroom_milestone_1_title')}
                          </strong>{' '}
                          <span className="text-sm text-gray-700 leading-relaxed font-light">
                            {t('dataroom_milestone_1_content')}
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                        <div>
                          <strong className="font-semibold text-gray-900">
                            {t('dataroom_milestone_2_title')}
                          </strong>{' '}
                          <span className="text-sm text-gray-700 leading-relaxed font-light">
                            {t('dataroom_milestone_2_content')}
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                        <div>
                          <strong className="font-semibold text-gray-900">
                            {t('dataroom_milestone_3_title')}
                          </strong>{' '}
                          <span className="text-sm text-gray-700 leading-relaxed font-light">
                            {t('dataroom_milestone_3_content')}
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                        <div>
                          <strong className="font-semibold text-gray-900">
                            {t('dataroom_milestone_4_title')}
                          </strong>{' '}
                          <span className="text-sm text-gray-700 leading-relaxed font-light">
                            {t('dataroom_milestone_4_content')}
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <Heading
                      level={3}
                      className="text-xl mb-8 text-gray-900 font-semibold"
                    >
                      {t('dataroom_growth_opportunities_title')}
                    </Heading>
                    <ul className="space-y-5">
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                        <div>
                          <strong className="font-semibold text-gray-900">
                            {t('dataroom_opportunity_1_title')}
                          </strong>{' '}
                          <span className="text-sm text-gray-700 leading-relaxed font-light">
                            {t('dataroom_opportunity_1_content')}
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                        <div>
                          <strong className="font-semibold text-gray-900">
                            {t('dataroom_opportunity_2_title')}
                          </strong>{' '}
                          <span className="text-sm text-gray-700 leading-relaxed font-light">
                            {t('dataroom_opportunity_2_content')}
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                        <div>
                          <strong className="font-semibold text-gray-900">
                            {t('dataroom_opportunity_3_title')}
                          </strong>{' '}
                          <span className="text-sm text-gray-700 leading-relaxed font-light">
                            {t('dataroom_opportunity_3_content')}
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                        <div>
                          <strong className="font-semibold text-gray-900">
                            {t('dataroom_opportunity_4_title')}
                          </strong>{' '}
                          <span className="text-sm text-gray-700 leading-relaxed font-light">
                            {t('dataroom_opportunity_4_content')}
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">
                      {t('dataroom_building_permits_title')}
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {t('dataroom_building_permits_content')}
                    </p>
                  </Card>
                  <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">
                      {t('dataroom_zoning_phase_title')}
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {t('dataroom_zoning_phase_content')}
                    </p>
                  </Card>
                </div>
              </div>
            </div>
            <div className="py-24 bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                    {t('home_financial_section_label')}
                  </p>
                  <Heading
                    level={2}
                    className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal"
                  >
                    {t('home_financial_section_title')}
                  </Heading>
                  <p className="text-base text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
                    {t('home_financial_section_subtitle')}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 rounded-lg p-8 border border-gray-300">
                    <Heading
                      level={3}
                      className="mb-8 text-lg font-semibold text-gray-900"
                    >
                      {t('dataroom_revenue_composition_title')}
                    </Heading>
                    <div className="space-y-5">
                      <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                        <span className="text-sm text-gray-700 font-light">
                          {t('dataroom_revenue_stream_commercial')}
                        </span>
                        <span className="font-semibold text-gray-900">
                          €371,828
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                        <span className="text-sm text-gray-700 font-light">
                          {t('dataroom_revenue_stream_community')}
                        </span>
                        <span className="font-semibold text-gray-900">
                          €135,778
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                        <span className="text-sm text-gray-700 font-light">
                          {t('dataroom_revenue_stream_unique')}
                        </span>
                        <span className="font-semibold text-gray-900">
                          €115,260
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                        <span className="text-sm text-gray-700 font-light">
                          {t('dataroom_revenue_stream_events_other')}
                        </span>
                        <span className="font-semibold text-gray-900">
                          €30,000
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-5 border-t-2 border-gray-900">
                        <span className="font-semibold text-gray-900">
                          {t('dataroom_revenue_total')}
                        </span>
                        <span className="font-bold text-xl text-gray-900">
                          €652,866
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-8 border border-gray-300">
                    <Heading
                      level={3}
                      className="mb-8 text-lg font-semibold text-gray-900"
                    >
                      {t('dataroom_revenue_projection_title')}
                    </Heading>
                    <div className="flex items-end gap-4 h-44 mb-4">
                      <div className="flex-1 h-full flex items-end">
                        <div
                          className="w-full bg-gray-900 rounded-t"
                          style={{ height: '77%' }}
                        ></div>
                      </div>
                      <div className="flex-1 h-full flex items-end">
                        <div
                          className="w-full bg-gray-900 rounded-t"
                          style={{ height: '83%' }}
                        ></div>
                      </div>
                      <div className="flex-1 h-full flex items-end">
                        <div
                          className="w-full bg-gray-900 rounded-t"
                          style={{ height: '89%' }}
                        ></div>
                      </div>
                      <div className="flex-1 h-full flex items-end">
                        <div
                          className="w-full bg-gray-900 rounded-t"
                          style={{ height: '95%' }}
                        ></div>
                      </div>
                      <div className="flex-1 h-full flex items-end">
                        <div
                          className="w-full bg-gray-900 rounded-t"
                          style={{ height: '100%' }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 text-center">
                        <div className="text-xs font-semibold text-gray-900">
                          €653k
                        </div>
                        <div className="text-xs text-gray-600 font-light">
                          2028
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-xs font-semibold text-gray-900">
                          €701k
                        </div>
                        <div className="text-xs text-gray-600 font-light">
                          2029
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-xs font-semibold text-gray-900">
                          €752k
                        </div>
                        <div className="text-xs text-gray-600 font-light">
                          2030
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-xs font-semibold text-gray-900">
                          €801k
                        </div>
                        <div className="text-xs text-gray-600 font-light">
                          2031
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-xs font-semibold text-gray-900">
                          €843k
                        </div>
                        <div className="text-xs text-gray-600 font-light">
                          2032
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-center text-gray-700 font-light mt-6">
                      <strong className="text-gray-900 font-semibold">
                        {t('dataroom_revenue_projection_note')}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="py-24 bg-gray-50 border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                    {t('dataroom_financial_plan_label')}
                  </p>
                  <Heading
                    level={2}
                    className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal"
                  >
                    {t('dataroom_use_of_funds_title')}
                  </Heading>
                  <p className="text-base text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">
                    {t('dataroom_use_of_funds_description')}
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 mb-12">
                  <div>
                    <h3 className="text-xl font-semibold mb-8 text-gray-900">
                      {t('dataroom_sources_title')}
                    </h3>
                    <div className="bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                      <table className="w-full">
                        <thead className="bg-gray-900 text-white">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold">
                              {t('dataroom_source')}
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-semibold">
                              {t('dataroom_amount')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {t('dataroom_source_bank_loans')}
                              </div>
                              <div className="text-xs text-gray-600 mt-1.5 font-light">
                                {t('dataroom_bank_loans_note')}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                              €700,000
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {t('dataroom_source_private_loans')}
                              </div>
                              <div className="text-xs text-gray-600 mt-1.5 font-light">
                                {t('dataroom_private_loans_note')}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                              €450,000
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {t('dataroom_source_token_sales')}
                              </div>
                              <div className="text-xs text-gray-600 mt-1.5 font-light">
                                {t('dataroom_token_sales_note')}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                              €400,000
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {t('dataroom_source_current_cash')}
                              </div>
                              <div className="text-xs text-gray-600 mt-1.5 font-light">
                                {t('dataroom_current_cash_note')}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                              €160,000
                            </td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                          <tr>
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900">
                                {t('dataroom_total_sources')}
                              </div>
                              <div className="text-xs text-emerald-700 mt-1 font-medium">
                                {t('dataroom_grant_bonus')}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="font-bold text-lg text-gray-900">
                                €1,710,000
                              </div>
                              <div className="text-xs text-emerald-700 font-medium">
                                +€660K
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-8 text-gray-900">
                      {t('dataroom_uses_title')}
                    </h3>
                    <div className="bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                      <table className="w-full">
                        <thead className="bg-gray-900 text-white">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold">
                              {t('dataroom_use')}
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-semibold">
                              {t('dataroom_amount')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {t('dataroom_use_building_acquisition')}
                              </div>
                              <div className="text-xs text-gray-600 mt-1.5 font-light">
                                {t('dataroom_building_acquisition_note')}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                              €216,000
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {t('dataroom_use_construction')}
                              </div>
                              <div className="text-xs text-gray-600 mt-1.5 font-light">
                                {t('dataroom_construction_breakdown_note')}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                              €1,168,628
                            </td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                          <tr>
                            <td className="px-6 py-4 font-bold text-gray-900">
                              {t('dataroom_total_uses')}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-lg text-gray-900">
                              €1,384,628
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="py-24 bg-white border-b border-gray-200">
              <div className="max-w-5xl mx-auto px-6">
                <div className="text-center mb-12">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                    {t('dataroom_repayment_label')}
                  </p>
                  <Heading
                    level={2}
                    className="text-3xl md:text-4xl mb-4 text-gray-900 font-normal"
                  >
                    {t('dataroom_repayment_title')}
                  </Heading>
                  <p className="text-base text-gray-700 font-light">
                    {t('dataroom_repayment_subtitle')}
                  </p>
                </div>

                <div className="bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm mb-8">
                  <table className="w-full">
                    <thead className="bg-gray-900 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">
                          {t('dataroom_repayment_year')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">
                          {t('dataroom_repayment_activity')}
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold">
                          {t('dataroom_repayment_balance')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          2026
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-light">
                          {t('dataroom_repayment_2026')}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          €450,000
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          2027
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-light">
                          {t('dataroom_repayment_2027')}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          ~€400,000
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          2028
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-light">
                          {t('dataroom_repayment_2028')}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          ~€250,000
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          2029
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-light">
                          {t('dataroom_repayment_2029')}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          ~€100,000
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          2030
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-light">
                          {t('dataroom_repayment_2030')}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-green-700">
                          €0
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-sm text-gray-600 text-center font-light">
                  {t('dataroom_repayment_note')}
                </p>
              </div>
            </div>
            <div className="py-24 bg-gray-50 border-b border-gray-200">
              <div className="max-w-5xl mx-auto px-6">
                <div className="text-center mb-12">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                    {t('dataroom_risks_label')}
                  </p>
                  <Heading
                    level={2}
                    className="text-3xl md:text-4xl mb-4 text-gray-900 font-normal"
                  >
                    {t('dataroom_risks_title')}
                  </Heading>
                </div>

                <div className="bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-900 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">
                          {t('dataroom_risks_risk')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">
                          {t('dataroom_risks_mitigation')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {t('dataroom_risk_construction')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-light">
                          {t('dataroom_risk_construction_mitigation')}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {t('dataroom_risk_financing')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-light">
                          {t('dataroom_risk_financing_mitigation')}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {t('dataroom_risk_demand')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-light">
                          {t('dataroom_risk_demand_mitigation')}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {t('dataroom_risk_operational')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-light">
                          {t('dataroom_risk_operational_mitigation')}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {t('dataroom_risk_repayment')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-light">
                          {t('dataroom_risk_repayment_mitigation')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="py-24 bg-white border-b border-gray-200">
              <div className="max-w-5xl mx-auto px-6">
                <div className="text-center mb-12">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                    {t('dataroom_team_label')}
                  </p>
                  <Heading
                    level={2}
                    className="text-3xl md:text-4xl mb-4 text-gray-900 font-normal"
                  >
                    {t('dataroom_team_title')}
                  </Heading>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('dataroom_team_sam_name')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('dataroom_team_sam_role')}
                    </p>
                    <p className="text-sm text-gray-700 font-light">
                      {t('dataroom_team_sam_bio')}
                    </p>
                  </Card>
                  <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('dataroom_team_luna_name')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('dataroom_team_luna_role')}
                    </p>
                    <p className="text-sm text-gray-700 font-light">
                      {t('dataroom_team_luna_bio')}
                    </p>
                  </Card>
                  <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('dataroom_team_builders_name')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('dataroom_team_builders_role')}
                    </p>
                    <p className="text-sm text-gray-700 font-light">
                      {t('dataroom_team_builders_bio')}
                    </p>
                  </Card>
                  <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('dataroom_team_ofer_name')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('dataroom_team_ofer_role')}
                    </p>
                    <p className="text-sm text-gray-700 font-light">
                      {t('dataroom_team_ofer_bio')}
                    </p>
                  </Card>
                  <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('dataroom_team_joao_name')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('dataroom_team_joao_role')}
                    </p>
                    <p className="text-sm text-gray-700 font-light">
                      {t('dataroom_team_joao_bio')}
                    </p>
                  </Card>
                </div>

                <div className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                    {t('dataroom_team_partners_title')}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {partners.map((partner, index) => (
                      <div
                        key={`${partner.name}-${index}`}
                        className="p-3 bg-gray-50 rounded-lg text-center"
                      >
                        <p className="font-medium text-sm text-gray-900">
                          {resolveBlockText(partner.name, t)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {resolveBlockText(partner.role, t)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="py-24 bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                    {t('dataroom_investment_breakdown_label')}
                  </p>
                  <Heading
                    level={2}
                    className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal"
                  >
                    {t('dataroom_investment_map_title')}
                  </Heading>
                  <p className="text-base text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
                    {t('dataroom_investment_map_subtitle')}
                  </p>
                </div>

                <div className="bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900 text-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold">
                            {t('dataroom_investment_map_description')}
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            {t('dataroom_investment_map_total')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t('dataroom_map_fiscal')}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            €19,600
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t('dataroom_map_architecture')}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            €25,000
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t('dataroom_map_engineering')}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            €10,000
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t('dataroom_map_construction_rooms')}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            €767,242
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t('dataroom_map_kitchen')}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            €81,239
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t('dataroom_map_solar')}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            €52,065
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t('dataroom_map_smart_locks')}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            €22,902
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t('dataroom_map_heating')}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            €65,700
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t('dataroom_map_windows')}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            €22,200
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t('dataroom_map_greenhouse')}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            €17,680
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {t('dataroom_map_studios')}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            €85,000
                          </td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                        <tr>
                          <td className="px-6 py-5 font-bold text-gray-900 text-right">
                            {t('dataroom_investment_map_total')}:
                          </td>
                          <td className="px-6 py-5 text-right font-bold text-xl text-gray-900">
                            €1,168,628
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="py-24 bg-gray-50 border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                    {t('dataroom_documentation_label')}
                  </p>
                  <Heading
                    level={2}
                    className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal"
                  >
                    {t('dataroom_documents_title')}
                  </Heading>
                  <p className="text-base text-gray-700 leading-relaxed font-light">
                    {t('dataroom_documents_subtitle')}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {documents.map((doc, index) => {
                    const Icon = DOC_ICONS[index % DOC_ICONS.length];
                    const iconBg = DOC_ICON_BG[index % DOC_ICON_BG.length];
                    const [bg, color] = [
                      iconBg.split(' ')[0],
                      iconBg.split(' ').slice(1).join(' '),
                    ];
                    return (
                      <Card
                        key={`${doc.href}-${index}`}
                        className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow"
                      >
                        <Link
                          href={doc.href || '#'}
                          target="_blank"
                          className="block"
                        >
                          <div
                            className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center mb-4 mx-auto`}
                          >
                            <Icon className={`w-7 h-7 ${color}`} />
                          </div>
                          <h3 className="text-lg font-semibold mb-3 text-gray-900">
                            {resolveBlockText(doc.title, t)}
                          </h3>
                          <span className="text-gray-900 font-medium text-sm underline">
                            {resolveBlockText(
                              doc.downloadLabel ||
                                '_i18n_dataroom_download_file',
                              t,
                            )}
                          </span>
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>

            <Webinar
              id="webinar"
              tags={webinarTags}
              analyticsCategory={webinarAnalyticsCategory}
            />
            <div className="py-24 bg-gray-900 text-white">
              <div className="max-w-4xl mx-auto px-6 text-center">
                <Heading
                  level={2}
                  className="text-3xl md:text-4xl mb-6 font-normal"
                >
                  {t('dataroom_cta_title')}
                </Heading>
                <p className="text-lg mb-10 text-gray-300 leading-relaxed font-light">
                  {t('dataroom_cta_description')}
                </p>
                <div className="flex justify-center">
                  <LinkButton
                    href="#webinar"
                    variant="primary"
                    className="bg-white text-gray-900 hover:bg-gray-100 border-0"
                  >
                    {t('dataroom_executive_cta_secondary_1')}
                  </LinkButton>
                </div>
                <div className="mt-10 text-sm text-gray-400 font-light">
                  <p>{t('dataroom_cta_tagline')}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
};

export default CustomDataroom;
