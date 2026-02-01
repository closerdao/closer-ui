import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import { Heading } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { 
  Droplets,
  Leaf,
  TreePine,
  Car,
  Recycle,
  Building2,
  Zap,
  Heart,
  Users,
  Coins,
  Link2,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface ImpactItem {
  type: 'action' | 'indicator';
  text: string;
  metric?: string;
}

interface ImpactDomain {
  icon: React.ReactNode;
  title: string;
  category: 'sustainability' | 'culture';
  items: ImpactItem[];
  link?: string;
}

const ImpactMapPage = () => {
  const t = useTranslations();

  const impactDomains: ImpactDomain[] = [
    {
      icon: <Droplets className="w-5 h-5" />,
      title: t('impact_domain_water_title'),
      category: 'sustainability',
      link: '/pages/ecology',
      items: [
        { type: 'action', text: t('impact_water_action_1') },
        { type: 'indicator', text: t('impact_water_indicator_1'), metric: t('impact_metric_monthly') },
        { type: 'action', text: t('impact_water_action_2') },
        { type: 'action', text: t('impact_water_action_3') },
      ]
    },
    {
      icon: <Leaf className="w-5 h-5" />,
      title: t('impact_domain_food_title'),
      category: 'sustainability',
      link: '/pages/regenerative-agriculture',
      items: [
        { type: 'action', text: t('impact_food_action_1') },
        { type: 'action', text: t('impact_food_action_2') },
        { type: 'action', text: t('impact_food_action_3') },
        { type: 'indicator', text: t('impact_food_indicator_1'), metric: t('impact_metric_target_60') },
      ]
    },
    {
      icon: <TreePine className="w-5 h-5" />,
      title: t('impact_domain_land_title'),
      category: 'sustainability',
      link: '/pages/ecology',
      items: [
        { type: 'action', text: t('impact_land_action_1') },
        { type: 'indicator', text: t('impact_land_indicator_1'), metric: t('impact_metric_annual') },
        { type: 'action', text: t('impact_land_action_2') },
        { type: 'action', text: t('impact_land_action_3') },
        { type: 'action', text: t('impact_land_action_4') },
      ]
    },
    {
      icon: <Car className="w-5 h-5" />,
      title: t('impact_domain_transport_title'),
      category: 'sustainability',
      items: [
        { type: 'action', text: t('impact_transport_action_1') },
        { type: 'indicator', text: t('impact_transport_indicator_1'), metric: t('impact_metric_monthly') },
        { type: 'action', text: t('impact_transport_action_2') },
        { type: 'indicator', text: t('impact_transport_indicator_2'), metric: t('impact_metric_quarterly') },
      ]
    },
    {
      icon: <Recycle className="w-5 h-5" />,
      title: t('impact_domain_waste_title'),
      category: 'sustainability',
      items: [
        { type: 'action', text: t('impact_waste_action_1') },
        { type: 'action', text: t('impact_waste_action_2') },
        { type: 'action', text: t('impact_waste_action_3') },
        { type: 'indicator', text: t('impact_waste_indicator_1'), metric: t('impact_metric_annual') },
      ]
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      title: t('impact_domain_materials_title'),
      category: 'sustainability',
      items: [
        { type: 'action', text: t('impact_materials_action_1') },
        { type: 'action', text: t('impact_materials_action_2') },
        { type: 'indicator', text: t('impact_materials_indicator_1'), metric: t('impact_metric_per_project') },
        { type: 'action', text: t('impact_materials_action_3') },
      ]
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: t('impact_domain_energy_title'),
      category: 'sustainability',
      items: [
        { type: 'action', text: t('impact_energy_action_1') },
        { type: 'action', text: t('impact_energy_action_2') },
        { type: 'action', text: t('impact_energy_action_3') },
        { type: 'indicator', text: t('impact_energy_indicator_1'), metric: t('impact_metric_goal_100') },
        { type: 'action', text: t('impact_energy_action_4') },
      ]
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: t('impact_domain_health_title'),
      category: 'culture',
      items: [
        { type: 'action', text: t('impact_health_action_1') },
        { type: 'indicator', text: t('impact_health_indicator_1'), metric: t('impact_metric_per_booking') },
        { type: 'action', text: t('impact_health_action_2') },
      ]
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: t('impact_domain_community_title'),
      category: 'culture',
      link: '/citizenship',
      items: [
        { type: 'action', text: t('impact_community_action_1') },
        { type: 'action', text: t('impact_community_action_2') },
        { type: 'action', text: t('impact_community_action_3') },
        { type: 'indicator', text: t('impact_community_indicator_1'), metric: t('impact_metric_per_vote') },
      ]
    },
    {
      icon: <Coins className="w-5 h-5" />,
      title: t('impact_domain_equity_title'),
      category: 'culture',
      items: [
        { type: 'action', text: t('impact_equity_action_1') },
        { type: 'indicator', text: t('impact_equity_indicator_1'), metric: t('impact_metric_quarterly') },
        { type: 'action', text: t('impact_equity_action_2') },
        { type: 'action', text: t('impact_equity_action_3') },
      ]
    },
    {
      icon: <Link2 className="w-5 h-5" />,
      title: t('impact_domain_governance_title'),
      category: 'culture',
      link: '/governance',
      items: [
        { type: 'action', text: t('impact_governance_action_1') },
        { type: 'action', text: t('impact_governance_action_2') },
        { type: 'action', text: t('impact_governance_action_3') },
        { type: 'action', text: t('impact_governance_action_4') },
        { type: 'indicator', text: t('impact_governance_indicator_1'), metric: t('impact_metric_continuous') },
      ]
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: t('impact_domain_transparency_title'),
      category: 'culture',
      link: '/dataroom',
      items: [
        { type: 'action', text: t('impact_transparency_action_1') },
        { type: 'action', text: t('impact_transparency_action_2') },
        { type: 'indicator', text: t('impact_transparency_indicator_1'), metric: t('impact_metric_quarterly') },
        { type: 'action', text: t('impact_transparency_action_3') },
      ]
    },
  ];

  const sustainabilityDomains = impactDomains.filter(d => d.category === 'sustainability');
  const cultureDomains = impactDomains.filter(d => d.category === 'culture');

  return (
    <>
      <Head>
        <title>{t('impact_map_title')}</title>
        <meta name="description" content={t('impact_map_meta_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/impact-map"
          key="canonical"
        />
      </Head>

      <main className="min-h-screen bg-background">
        <section className="max-w-6xl mx-auto px-6 py-16">
          <header className="text-center mb-12">
            <Heading level={1} display className="text-4xl md:text-5xl mb-4">
              {t('impact_map_heading')}
            </Heading>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              {t('impact_map_subtitle')}
            </p>
            <div className="bg-accent-alt-light border border-accent-alt rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-sm text-foreground">
                <strong>{t('impact_map_note_label')}:</strong> {t('impact_map_note_text')}
              </p>
            </div>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">25</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('impact_stat_hectares')}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">4,000+</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('impact_stat_trees')}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">280+</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('impact_stat_holders')}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">1000</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('impact_stat_horizon')}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-8 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-alt flex items-center justify-center text-white text-lg">
                🌱
              </div>
              <span className="font-semibold uppercase tracking-wide text-sm">{t('impact_pillar_sustainability')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white text-lg">
                🤝
              </div>
              <span className="font-semibold uppercase tracking-wide text-sm">{t('impact_pillar_culture')}</span>
            </div>
          </div>

          <Heading level={2} className="text-2xl mb-6">{t('impact_pillar_sustainability')}</Heading>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {sustainabilityDomains.map((domain, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-accent-alt-light p-4 flex items-center gap-3 border-b border-gray-200">
                  <div className="w-10 h-10 bg-accent-alt rounded-lg flex items-center justify-center text-white">
                    {domain.icon}
                  </div>
                  <span className="font-semibold text-foreground">{domain.title}</span>
                  {domain.link && (
                    <Link href={domain.link} className="ml-auto text-gray-400 hover:text-accent-alt transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
                <div className="p-4">
                  {domain.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex gap-3 py-2 border-b border-gray-100 last:border-0 items-start">
                      <div className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${item.type === 'action' ? 'bg-accent-alt' : 'bg-accent'}`}>
                        {item.type === 'action' ? 'A' : 'I'}
                      </div>
                      <span className="text-sm text-gray-700 flex-1">{item.text}</span>
                      {item.metric && (
                        <span className="text-xs text-gray-500 flex-shrink-0">{item.metric}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Heading level={2} className="text-2xl mb-6">{t('impact_pillar_culture')}</Heading>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {cultureDomains.map((domain, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-accent-light p-4 flex items-center gap-3 border-b border-gray-200">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white">
                    {domain.icon}
                  </div>
                  <span className="font-semibold text-foreground">{domain.title}</span>
                  {domain.link && (
                    <Link href={domain.link} className="ml-auto text-gray-400 hover:text-accent transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
                <div className="p-4">
                  {domain.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex gap-3 py-2 border-b border-gray-100 last:border-0 items-start">
                      <div className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${item.type === 'action' ? 'bg-accent-alt' : 'bg-accent'}`}>
                        {item.type === 'action' ? 'A' : 'I'}
                      </div>
                      <span className="text-sm text-gray-700 flex-1">{item.text}</span>
                      {item.metric && (
                        <span className="text-xs text-gray-500 flex-shrink-0">{item.metric}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-8 py-8 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 rounded bg-accent-alt flex items-center justify-center text-xs font-bold text-white">A</div>
              <span>{t('impact_legend_action')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-xs font-bold text-white">I</div>
              <span>{t('impact_legend_indicator')}</span>
            </div>
          </div>

          <Heading level={2} className="text-2xl mb-6 mt-12">{t('impact_how_we_deliver_title')}</Heading>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-accent-alt-light p-4 flex items-center gap-3 border-b border-gray-200">
                <div className="w-10 h-10 bg-accent-alt rounded-lg flex items-center justify-center text-white">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="font-semibold text-foreground">{t('impact_section_ecology_title')}</span>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-4">{t('impact_section_ecology_desc')}</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">40+</div>
                    <div className="text-xs text-gray-500">{t('impact_section_ecology_birds')}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">65+</div>
                    <div className="text-xs text-gray-500">{t('impact_section_ecology_tree_species')}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">50%</div>
                    <div className="text-xs text-gray-500">{t('impact_section_ecology_wild')}</div>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• {t('impact_section_ecology_point_1')}</li>
                  <li>• {t('impact_section_ecology_point_2')}</li>
                  <li>• {t('impact_section_ecology_point_3')}</li>
                </ul>
                <Link href="/pages/ecology" className="inline-flex items-center gap-2 text-sm text-accent-alt hover:underline font-medium">
                  {t('impact_section_ecology_cta')} <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-accent-alt-light p-4 flex items-center gap-3 border-b border-gray-200">
                <div className="w-10 h-10 bg-accent-alt rounded-lg flex items-center justify-center text-white">
                  <TreePine className="w-5 h-5" />
                </div>
                <span className="font-semibold text-foreground">{t('impact_section_agriculture_title')}</span>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-4">{t('impact_section_agriculture_desc')}</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">4,000+</div>
                    <div className="text-xs text-gray-500">{t('impact_section_agriculture_trees')}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">1.2M</div>
                    <div className="text-xs text-gray-500">{t('impact_section_agriculture_water')}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">80%</div>
                    <div className="text-xs text-gray-500">{t('impact_section_agriculture_target')}</div>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• {t('impact_section_agriculture_point_1')}</li>
                  <li>• {t('impact_section_agriculture_point_2')}</li>
                  <li>• {t('impact_section_agriculture_point_3')}</li>
                </ul>
                <Link href="/pages/regenerative-agriculture" className="inline-flex items-center gap-2 text-sm text-accent-alt hover:underline font-medium">
                  {t('impact_section_agriculture_cta')} <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-accent-light p-4 flex items-center gap-3 border-b border-gray-200">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white">
                  <Link2 className="w-5 h-5" />
                </div>
                <span className="font-semibold text-foreground">{t('impact_section_governance_title')}</span>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-4">{t('impact_section_governance_desc')}</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">280+</div>
                    <div className="text-xs text-gray-500">{t('impact_section_governance_holders')}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">30+</div>
                    <div className="text-xs text-gray-500">{t('impact_section_governance_countries')}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">1:1</div>
                    <div className="text-xs text-gray-500">{t('impact_section_governance_voting')}</div>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• {t('impact_section_governance_point_1')}</li>
                  <li>• {t('impact_section_governance_point_2')}</li>
                  <li>• {t('impact_section_governance_point_3')}</li>
                </ul>
                <div className="flex flex-wrap gap-4">
                  <Link href="/governance" className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-medium">
                    {t('impact_section_governance_cta')} <ExternalLink className="w-3 h-3" />
                  </Link>
                  <a href="https://oasa.earth" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-medium">
                    {t('impact_section_oasa_cta')} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-accent-light p-4 flex items-center gap-3 border-b border-gray-200">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="font-semibold text-foreground">{t('impact_section_dataroom_title')}</span>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-4">{t('impact_section_dataroom_desc')}</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">€1.2M+</div>
                    <div className="text-xs text-gray-500">{t('impact_section_dataroom_raised')}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">4</div>
                    <div className="text-xs text-gray-500">{t('impact_section_dataroom_reports')}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-foreground">2021</div>
                    <div className="text-xs text-gray-500">{t('impact_section_dataroom_since')}</div>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• {t('impact_section_dataroom_point_1')}</li>
                  <li>• {t('impact_section_dataroom_point_2')}</li>
                  <li>• {t('impact_section_dataroom_point_3')}</li>
                </ul>
                <Link href="/dataroom" className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-medium">
                  {t('impact_section_dataroom_cta')} <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

ImpactMapPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default ImpactMapPage;
