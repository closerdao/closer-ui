import { Building2, Droplets, Sprout, Users } from 'lucide-react';

interface InvestStatsRowProps {
  t: (key: string) => string;
}

const stats = [
  { icon: Sprout, titleKey: 'invest_built_land_title', valueKey: 'invest_stat_land_value' },
  { icon: Droplets, titleKey: 'invest_built_water_title', valueKey: 'invest_stat_water_value' },
  { icon: Building2, titleKey: 'invest_built_infra_title', valueKey: 'invest_stat_infra_value' },
  { icon: Users, titleKey: 'invest_built_community_title', valueKey: 'invest_stat_community_value' },
];

const InvestStatsRow = ({ t }: InvestStatsRowProps) => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">
        {t('invest_story_label')}
      </p>
      <h2 className="font-bold text-3xl text-gray-900 mb-3">
        {t('invest_story_title')}
      </h2>
      <p className="text-base text-gray-600 max-w-xl mb-10">
        {t('invest_story_subtitle')}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, titleKey, valueKey }) => (
          <div
            key={titleKey}
            className="bg-white border border-gray-100 rounded-2xl p-6 text-center"
          >
            <div className="w-11 h-11 bg-accent-light rounded-xl flex items-center justify-center mx-auto mb-3">
              <Icon className="w-5 h-5 text-accent" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{t(valueKey)}</div>
            <div className="text-xs text-gray-500 mt-1">{t(titleKey)}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default InvestStatsRow;
