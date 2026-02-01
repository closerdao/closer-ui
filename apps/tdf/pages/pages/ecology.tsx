import Head from 'next/head';

import { Heading, Card, LinkButton } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { 
  Bird, 
  Check,
  Dna,
  Droplets, 
  ExternalLink,
  FlaskConical, 
  Leaf, 
  Mountain, 
  Satellite,
  Shield,
  Shrub, 
  TreeDeciduous, 
  TreePine,
  Trees,
  Users,
  Waves,
  Wind
} from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const BIRD_SPECIES = [
  { name: 'Red Kite', latin: 'Milvus milvus', category: 'raptor' },
  { name: 'Black-winged Kite', latin: 'Elanus caeruleus', category: 'raptor' },
  { name: 'Kestrel', latin: 'Falco tinnunculus', category: 'raptor' },
  { name: 'Little Owl', latin: 'Athene noctua', category: 'raptor' },
  { name: 'Tawny Owl', latin: 'Strix aluco', category: 'raptor' },
  { name: 'European Goldfinch', latin: 'Carduelis carduelis', category: 'songbird' },
  { name: 'Common Chaffinch', latin: 'Fringilla coelebs', category: 'songbird' },
  { name: 'Greenfinch', latin: 'Chloris chloris', category: 'songbird' },
  { name: 'Common Linnet', latin: 'Linaria cannabina', category: 'songbird' },
  { name: 'Robin', latin: 'Erithacus rubecula', category: 'songbird' },
  { name: 'Stonechat', latin: 'Saxicola rubicola', category: 'songbird' },
  { name: 'Black Redstart', latin: 'Phoenicurus ochruros', category: 'songbird' },
  { name: 'Crested Lark', latin: 'Galerida cristata', category: 'lark' },
  { name: 'Skylark', latin: 'Alauda arvensis', category: 'lark' },
  { name: 'Wood Lark', latin: 'Lullula arborea', category: 'lark' },
  { name: 'Meadow Pipit', latin: 'Anthus pratensis', category: 'lark' },
  { name: 'Grey Wagtail', latin: 'Motacilla cinerea', category: 'lark' },
  { name: 'White Wagtail', latin: 'Motacilla alba', category: 'lark' },
  { name: 'Sardinian Warbler', latin: 'Curruca melanocephala', category: 'warbler' },
  { name: 'Chiffchaff', latin: 'Phylloscopus collybita', category: 'warbler' },
  { name: 'Zitting Cisticola', latin: 'Cisticola juncidis', category: 'warbler' },
  { name: 'Great Tit', latin: 'Parus major', category: 'warbler' },
  { name: 'Blue Tit', latin: 'Cyanistes caeruleus', category: 'warbler' },
  { name: 'Crested Tit', latin: 'Lophophanes cristatus', category: 'warbler' },
  { name: 'Nuthatch', latin: 'Sitta europaea', category: 'warbler' },
  { name: 'Treecreeper', latin: 'Certhia brachydactyla', category: 'warbler' },
  { name: 'Azure-winged Magpie', latin: 'Cyanopica cyanus', category: 'corvid' },
  { name: 'Jay', latin: 'Garrulus glandarius', category: 'corvid' },
  { name: 'Raven', latin: 'Corvus corax', category: 'corvid' },
  { name: 'Carrion Crow', latin: 'Corvus corone', category: 'corvid' },
  { name: 'Common Starling', latin: 'Sturnus vulgaris', category: 'corvid' },
  { name: 'House Sparrow', latin: 'Passer domesticus', category: 'corvid' },
  { name: 'Common Kingfisher', latin: 'Alcedo atthis', category: 'water' },
  { name: 'Cattle Egret', latin: 'Bubulcus ibis', category: 'water' },
  { name: 'Hoopoe', latin: 'Upupa epops', category: 'water' },
  { name: 'Collared Dove', latin: 'Streptopelia decaocto', category: 'water' },
  { name: 'Wood Pigeon', latin: 'Columba palumbus', category: 'water' },
  { name: 'Barn Swallow', latin: 'Hirundo rustica', category: 'water' },
  { name: 'House Martin', latin: 'Delichon urbicum', category: 'water' },
];

const EDNA_SPECIES = [
  { name: 'Iberian Water Frog', latin: 'Pelophylax perezi', taxonomy: 'Class: Amphibia, Family: Ranidae', desc: 'Native Iberian amphibian indicating healthy wetland habitat.' },
  { name: 'Iberian Ribbed Newt', latin: 'Pleurodeles waltl', taxonomy: 'Class: Amphibia, Family: Salamandridae', desc: 'Europe\'s largest newt species, endemic to the Iberian Peninsula.' },
  { name: 'Mosquitofish', latin: 'Gambusia affinis', taxonomy: 'Class: Actinopterygii, Family: Poeciliidae', desc: 'Helps control mosquito larvae populations naturally.' },
  { name: 'Green Hydra', latin: 'Hydra viridissima', taxonomy: 'Class: Hydrozoa, Family: Hydridae', desc: 'Freshwater polyp with symbiotic algae, indicating clean water.' },
  { name: 'Diatom Algae', latin: 'Nitzschia palea', taxonomy: 'Class: Bacillariophyceae', desc: 'Single-celled algae forming the base of aquatic food webs.' },
];

const OASA_PRINCIPLES = [
  { 
    id: 1, 
    title: 'Soil: Life-filled and Fertile',
    points: [
      'Maintain living plant cover year-round',
      'Limit mechanical soil disturbance; use no-till',
      'Prohibit synthetic fertilizers and pesticides',
      'Return at least 30% of pruned biomass to soil'
    ]
  },
  { 
    id: 2, 
    title: 'Water: Healthy Systems and Cycles',
    points: [
      'Capture rainfall through swales, ponds, terraces',
      'Prioritise rainwater harvesting and greywater reuse',
      'Treat greywater biologically for reuse',
      'Protect and restore natural water bodies'
    ]
  },
  { 
    id: 3, 
    title: 'Air: Clean and Restorative',
    points: [
      'Ban open burning of toxic materials',
      'Encourage carbon sequestration through reforestation',
      'Promote biochar production to lock carbon'
    ]
  },
  { 
    id: 4, 
    title: 'Waste: A Non-Waste Mentality',
    points: [
      'Reduce waste; avoid single-use plastics',
      'Upcycle materials creatively',
      'Recover waste streams (compost, mulching, biogas)',
      'Remove all hazardous materials'
    ]
  },
  { 
    id: 5, 
    title: 'Rewilding and Biodiversity',
    points: [
      'Keep at least 50% of land as wild or rewilded',
      'Plant diverse crops (min 5 species per 10m²)',
      'Conserve existing forests and ancient trees',
      'Remove invasive species; support native flora'
    ]
  },
  { 
    id: 6, 
    title: 'Resources: Renewable and Sustainable',
    points: [
      'Use renewable energy where possible',
      'Limit built structures to 5% of land',
      'Choose local, natural materials',
      'Emphasize plant-based diets; reduce food waste'
    ]
  },
  { 
    id: 7, 
    title: 'Community: Equitable and Open',
    points: [
      'Voice based on Presence, Sweat, and participation',
      'Transparent governance with clear accountability',
      'Share knowledge and creations openly',
      'Build strong relationships with local communities'
    ]
  },
];

const EcologyPage = () => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>{t('ecology_page_title')}</title>
        <meta name="description" content={t('ecology_page_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/pages/ecology"
          key="canonical"
        />
      </Head>

      <section className="min-h-[60vh] flex items-center bg-gradient-to-br from-accent-light to-accent-alt-light">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest mb-4 font-medium text-accent-dark">
              {t('ecology_hero_label')}
            </p>
            <Heading
              className="text-4xl md:text-6xl mb-6"
              display
              level={1}
            >
              {t('ecology_hero_title')}
            </Heading>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed mb-12 text-gray-700">
              {t('ecology_hero_subtitle')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4 max-w-5xl mx-auto">
              <div className="bg-white/60 backdrop-blur rounded-lg p-3 sm:p-4 border border-accent/20">
                <div className="text-lg sm:text-2xl font-semibold text-accent-dark">25<span className="text-sm sm:text-base">ha</span></div>
                <div className="text-[10px] sm:text-xs text-gray-600">{t('ecology_metric_land')}</div>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-lg p-3 sm:p-4 border border-accent/20">
                <div className="text-lg sm:text-2xl font-semibold text-accent-dark">50%</div>
                <div className="text-[10px] sm:text-xs text-gray-600">{t('ecology_metric_wild')}</div>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-lg p-3 sm:p-4 border border-accent/20">
                <div className="text-lg sm:text-2xl font-semibold text-accent-dark">40+</div>
                <div className="text-[10px] sm:text-xs text-gray-600">{t('ecology_metric_birds')}</div>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-lg p-3 sm:p-4 border border-accent/20">
                <div className="text-lg sm:text-2xl font-semibold text-accent-dark">65+</div>
                <div className="text-[10px] sm:text-xs text-gray-600">{t('ecology_metric_tree_species')}</div>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-lg p-3 sm:p-4 col-span-2 md:col-span-1 border border-accent/20">
                <div className="text-lg sm:text-2xl font-semibold text-accent-dark">1.2M<span className="text-sm sm:text-base">L</span></div>
                <div className="text-[10px] sm:text-xs text-gray-600">{t('ecology_metric_water')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Heading level={2} className="mb-6 text-3xl">
              {t('ecology_intro_title')}
            </Heading>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              {t('ecology_intro_desc')}
            </p>
            <blockquote className="text-lg italic text-gray-600 border-l-4 pl-6 text-left" style={{ borderColor: 'rgb(77, 219, 159)' }}>
              {t('ecology_intro_quote')}
              <cite className="block mt-2 text-sm not-italic text-gray-500">— {t('ecology_intro_quote_source')}</cite>
            </blockquote>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg border border-gray-200 border-t-4 border-t-[#4DDB9F]">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-[#4DDB9F]/15">
                <Trees className="w-6 h-6 text-[#32A078]" />
              </div>
              <Heading level={3} className="mb-3 text-lg">
                {t('ecology_practice_rewilding_title')}
              </Heading>
              <p className="text-sm text-gray-600">
                {t('ecology_practice_rewilding_desc')}
              </p>
            </div>

            <Card className="p-6 border-t-4 border-blue-500">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Droplets className="w-6 h-6 text-blue-600" />
              </div>
              <Heading level={3} className="mb-3 text-lg">
                {t('ecology_practice_water_title')}
              </Heading>
              <p className="text-sm text-gray-600">
                {t('ecology_practice_water_desc')}
              </p>
            </Card>

            <Card className="p-6 border-t-4 border-amber-500">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Mountain className="w-6 h-6 text-amber-600" />
              </div>
              <Heading level={3} className="mb-3 text-lg">
                {t('ecology_practice_soil_title')}
              </Heading>
              <p className="text-sm text-gray-600">
                {t('ecology_practice_soil_desc')}
              </p>
            </Card>

            <div className="p-6 bg-white rounded-lg border border-gray-200 border-t-4 border-t-[#3CB482]">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-[#4DDB9F]/15">
                <TreePine className="w-6 h-6 text-[#32A078]" />
              </div>
              <Heading level={3} className="mb-3 text-lg">
                {t('ecology_practice_agroforestry_title')}
              </Heading>
              <p className="text-sm text-gray-600">
                {t('ecology_practice_agroforestry_desc')}
              </p>
            </div>

            <Card className="p-6 border-t-4 border-cyan-500">
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mb-4">
                <Wind className="w-6 h-6 text-cyan-600" />
              </div>
              <Heading level={3} className="mb-3 text-lg">
                {t('ecology_practice_fire_title')}
              </Heading>
              <p className="text-sm text-gray-600">
                {t('ecology_practice_fire_desc')}
              </p>
            </Card>

            <div className="p-6 bg-white rounded-lg border border-gray-200 border-t-4 border-t-[#4DDB9F]">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-[#4DDB9F]/15">
                <Leaf className="w-6 h-6 text-[#32A078]" />
              </div>
              <Heading level={3} className="mb-3 text-lg">
                {t('ecology_practice_biodiversity_title')}
              </Heading>
              <p className="text-sm text-gray-600">
                {t('ecology_practice_biodiversity_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-[#4DDB9F] to-[#3BC78A]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Heading level={2} className="mb-4 text-3xl text-gray-900">
              {t('ecology_ofp_title')}
            </Heading>
            <p className="max-w-2xl mx-auto text-gray-800">
              {t('ecology_ofp_desc')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-12">
            <div className="backdrop-blur rounded-xl p-4 sm:p-6 text-center">
              <div className="text-lg sm:text-2xl font-semibold text-gray-900">65+</div>
              <div className="text-[10px] sm:text-xs mt-1 text-gray-700">{t('ecology_ofp_stat_species')}</div>
            </div>
            <div className="backdrop-blur rounded-xl p-4 sm:p-6 text-center">
              <div className="text-lg sm:text-2xl font-semibold text-gray-900">0.85<span className="text-sm sm:text-base">ha</span></div>
              <div className="text-[10px] sm:text-xs mt-1 text-gray-700">{t('ecology_ofp_stat_monitored')}</div>
            </div>
            <div className="backdrop-blur rounded-xl p-4 sm:p-6 text-center col-span-2 md:col-span-1">
              <div className="text-lg sm:text-2xl font-semibold flex items-center justify-center text-gray-900">
                <Check className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-[10px] sm:text-xs mt-1 text-gray-700">{t('ecology_ofp_stat_validated')}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 backdrop-blur border-0">
              <div className="flex items-center gap-3 mb-4">
                <TreeDeciduous className="w-6 h-6 text-gray-700" />
                <Heading level={3} className="text-lg text-gray-900">{t('ecology_ofp_zone1_title')}</Heading>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('ecology_ofp_size')}:</span>
                  <span className="text-gray-900 ml-2">0.47 ha</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('ecology_ofp_density')}:</span>
                  <span className="text-gray-900 ml-2">3,000/ha</span>
                </div>
              </div>
              <p className="text-sm mb-4 text-gray-700">
                {t('ecology_ofp_zone1_species')}
              </p>
              <a 
                href="https://atlas.openforestprotocol.org/1660749236393" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('ecology_ofp_view_atlas')} <ExternalLink className="w-4 h-4" />
              </a>
            </Card>

            <Card className="p-6 backdrop-blur border-0">
              <div className="flex items-center gap-3 mb-4">
                <Shrub className="w-6 h-6 text-amber-600" />
                <Heading level={3} className="text-lg text-gray-900">{t('ecology_ofp_zone2_title')}</Heading>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('ecology_ofp_size')}:</span>
                  <span className="text-gray-900 ml-2">0.38 ha</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('ecology_ofp_density')}:</span>
                  <span className="text-gray-900 ml-2">2,000/ha</span>
                </div>
              </div>
              <p className="text-sm mb-4 text-gray-700">
                {t('ecology_ofp_zone2_species')}
              </p>
              <a 
                href="https://atlas.openforestprotocol.org/1746539547000" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900 transition-colors"
              >
                {t('ecology_ofp_view_atlas')} <ExternalLink className="w-4 h-4" />
              </a>
            </Card>
          </div>

          <div className="mt-12 rounded-xl p-8" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
            <Heading level={3} className="mb-6 text-xl text-gray-900 text-center">
              {t('ecology_ofp_cobenefits_title')}
            </Heading>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Leaf className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                <Heading level={4} className="text-gray-900 mb-2">{t('ecology_ofp_ecological')}</Heading>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>{t('ecology_ofp_eco_1')}</li>
                  <li>{t('ecology_ofp_eco_2')}</li>
                  <li>{t('ecology_ofp_eco_3')}</li>
                </ul>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                <Heading level={4} className="text-gray-900 mb-2">{t('ecology_ofp_social')}</Heading>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>{t('ecology_ofp_social_1')}</li>
                  <li>{t('ecology_ofp_social_2')}</li>
                  <li>{t('ecology_ofp_social_3')}</li>
                </ul>
              </div>
              <div className="text-center">
                <Satellite className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                <Heading level={4} className="text-gray-900 mb-2">{t('ecology_ofp_governance')}</Heading>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>{t('ecology_ofp_gov_1')}</li>
                  <li>{t('ecology_ofp_gov_2')}</li>
                  <li>{t('ecology_ofp_gov_3')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-6 mx-auto">
              <Bird className="w-7 h-7 text-orange-600" />
            </div>
            <Heading level={2} className="mb-4 text-3xl">
              {t('ecology_birds_title')}
            </Heading>
            <p className="text-gray-700 max-w-2xl mx-auto">
              {t('ecology_birds_desc')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
            <div className="bg-orange-50 rounded-xl p-3 sm:p-6 text-center border border-orange-100">
              <div className="text-lg sm:text-2xl font-semibold text-orange-900 mb-1">5+</div>
              <div className="text-[10px] sm:text-xs text-orange-700">{t('ecology_birds_raptors')}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 sm:p-6 text-center border border-blue-100">
              <div className="text-lg sm:text-2xl font-semibold text-blue-900 mb-1">2</div>
              <div className="text-[10px] sm:text-xs text-blue-700">{t('ecology_birds_owls')}</div>
            </div>
            <div className="rounded-xl p-3 sm:p-6 text-center border">
              <div className="text-lg sm:text-2xl font-semibold mb-1" style={{ color: 'rgb(30, 100, 70)' }}>15+</div>
              <div className="text-[10px] sm:text-xs" style={{ color: 'rgb(50, 140, 100)' }}>{t('ecology_birds_songbirds')}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BIRD_SPECIES.map((bird, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-sm">{bird.name}</span>
                  <span className="text-xs text-gray-500 italic">{bird.latin}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-purple-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                <Dna className="w-7 h-7 text-purple-600" />
              </div>
              <Heading level={2} className="mb-6 text-3xl">
                {t('ecology_edna_title')}
              </Heading>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {t('ecology_edna_desc')}
              </p>
              <blockquote className="text-sm italic text-gray-600 border-l-4 border-purple-300 pl-4 mb-6">
                {t('ecology_edna_quote')}
                <cite className="block mt-2 not-italic text-purple-600">— SimplexDNA</cite>
              </blockquote>

              <div className="bg-white rounded-xl p-4 sm:p-6 border border-purple-200">
                <Heading level={3} className="mb-4 text-base sm:text-lg text-purple-900">
                  {t('ecology_edna_results_title')}
                </Heading>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-semibold text-purple-900">13</div>
                    <div className="text-[10px] sm:text-xs text-purple-600">{t('ecology_edna_phyla')}</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-semibold text-purple-900">14</div>
                    <div className="text-[10px] sm:text-xs text-purple-600">{t('ecology_edna_classes')}</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-semibold text-purple-900">16</div>
                    <div className="text-[10px] sm:text-xs text-purple-600">{t('ecology_edna_families')}</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-semibold text-purple-900">80</div>
                    <div className="text-[10px] sm:text-xs text-purple-600">{t('ecology_edna_sequences')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Heading level={3} className="text-lg text-purple-900 mb-4">
                {t('ecology_edna_species_title')}
              </Heading>
              {EDNA_SPECIES.map((species, index) => (
                <div key={index} className="bg-white rounded-lg p-5 border-l-4 border-purple-400 shadow-sm">
                  <Heading level={4} className="text-base text-purple-900 mb-1">{species.name}</Heading>
                  <p className="text-xs text-purple-600 italic mb-2">{species.latin} — {species.taxonomy}</p>
                  <p className="text-sm text-gray-600">{species.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <Waves className="w-7 h-7 text-blue-600" />
              </div>
              <Heading level={2} className="mb-6 text-3xl">
                {t('ecology_water_title')}
              </Heading>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {t('ecology_water_desc')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="font-medium text-gray-900 mb-1">{t('ecology_water_lake')}</div>
                  <div className="text-sm text-gray-600">{t('ecology_water_lake_desc')}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="font-medium text-gray-900 mb-1">{t('ecology_water_biopool')}</div>
                  <div className="text-sm text-gray-600">{t('ecology_water_biopool_desc')}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="font-medium text-gray-900 mb-1">{t('ecology_water_infiltration')}</div>
                  <div className="text-sm text-gray-600">{t('ecology_water_infiltration_desc')}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="font-medium text-gray-900 mb-1">{t('ecology_water_swales')}</div>
                  <div className="text-sm text-gray-600">{t('ecology_water_swales_desc')}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="font-medium text-gray-900 mb-1">{t('ecology_water_tank')}</div>
                  <div className="text-sm text-gray-600">{t('ecology_water_tank_desc')}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="font-medium text-gray-900 mb-1">{t('ecology_water_greywater')}</div>
                  <div className="text-sm text-gray-600">{t('ecology_water_greywater_desc')}</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 sm:p-8 text-center text-white">
                <div className="text-2xl sm:text-3xl font-semibold mb-2">1.2M</div>
                <div className="text-sm sm:text-base mb-2">{t('ecology_water_liters')}</div>
                <p className="text-xs sm:text-sm text-blue-100">{t('ecology_water_impact')}</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm font-medium text-cyan-100">{t('ecology_water_table_title')}</span>
                  <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded">2024 → 2025</span>
                </div>
                <div className="flex items-end justify-center gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-semibold">20m</div>
                    <div className="text-[10px] sm:text-xs text-cyan-200">{t('ecology_water_table_before')}</div>
                  </div>
                  <div className="text-base sm:text-xl mb-1">→</div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-semibold text-cyan-100">3m</div>
                    <div className="text-[10px] sm:text-xs text-cyan-200">{t('ecology_water_table_after')}</div>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-cyan-100 mt-3 text-center">{t('ecology_water_table_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center mb-6 mx-auto">
              <FlaskConical className="w-7 h-7 text-cyan-600" />
            </div>
            <Heading level={2} className="mb-4 text-3xl">
              {t('ecology_monitoring_title')}
            </Heading>
            <p className="text-gray-700 max-w-2xl mx-auto">
              {t('ecology_monitoring_desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 text-center">
              <Dna className="w-8 h-8 text-purple-600 mx-auto mb-4" />
              <Heading level={4} className="mb-2">{t('ecology_monitor_edna')}</Heading>
              <p className="text-sm text-gray-600">{t('ecology_monitor_edna_desc')}</p>
            </Card>
            <Card className="p-6 text-center">
              <Satellite className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <Heading level={4} className="mb-2">{t('ecology_monitor_satellite')}</Heading>
              <p className="text-sm text-gray-600">{t('ecology_monitor_satellite_desc')}</p>
            </Card>
            <Card className="p-6 text-center">
              <FlaskConical className="w-8 h-8 text-amber-600 mx-auto mb-4" />
              <Heading level={4} className="mb-2">{t('ecology_monitor_sensors')}</Heading>
              <p className="text-sm text-gray-600">{t('ecology_monitor_sensors_desc')}</p>
            </Card>
            <Card className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-4" style={{ color: 'rgb(50, 160, 120)' }} />
              <Heading level={4} className="mb-2">{t('ecology_monitor_community')}</Heading>
              <p className="text-sm text-gray-600">{t('ecology_monitor_community_desc')}</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6 mx-auto" style={{ backgroundColor: 'rgba(77, 219, 159, 0.2)' }}>
              <Shield className="w-7 h-7" style={{ color: 'rgb(77, 219, 159)' }} />
            </div>
            <Heading level={2} className="mb-4 text-3xl text-white">
              {t('ecology_principles_title')}
            </Heading>
            <p className="text-gray-300 max-w-2xl mx-auto mb-4">
              {t('ecology_principles_desc')}
            </p>
            <a 
              href="https://oasa.earth" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm transition-colors"
              style={{ color: 'rgb(77, 219, 159)' }}
            >
              {t('ecology_principles_link')} <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OASA_PRINCIPLES.map((principle) => (
              <div key={principle.id} className="bg-white/5 rounded-lg p-5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <span 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: 'rgba(77, 219, 159, 0.2)', color: 'rgb(77, 219, 159)' }}
                  >
                    {principle.id}
                  </span>
                  <Heading level={4} className="text-white text-sm">{principle.title}</Heading>
                </div>
                <ul className="text-xs text-gray-400 space-y-1 pl-11">
                  {principle.points.map((point, idx) => (
                    <li key={idx}>• {point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20" style={{ background: 'linear-gradient(135deg, rgba(77, 219, 159, 0.1) 0%, rgba(77, 219, 159, 0.05) 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Heading level={2} className="mb-4 text-3xl">
            {t('ecology_cta_title')}
          </Heading>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
            {t('ecology_cta_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LinkButton
              href="/pages/regenerative-agriculture"
              variant="primary"
            >
              {t('ecology_cta_regen')}
            </LinkButton>
            <LinkButton
              href="/dataroom"
              variant="secondary"
            >
              {t('ecology_cta_dataroom')}
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
};

EcologyPage.getInitialProps = async (context: NextPageContext) => {
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

export default EcologyPage;
