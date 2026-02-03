import Head from 'next/head';
import Link from 'next/link';

import { Heading, LinkButton } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import {
  ArrowRight,
  Award,
  Beaker,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  CircleDot,
  Container,
  Droplet,
  FlaskConical,
  Home,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Microscope,
  Mountain,
  Sparkles,
  Sprout,
  Sun,
  ThermometerSun,
  Trees,
  TrendingUp,
  Users,
  Wind,
} from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const MushroomFarmPage = () => {
  const t = useTranslations();

  const products = [
    {
      icon: <CircleDot className="w-6 h-6" />,
      name: t('mushroom_product_oyster_name'),
      desc: t('mushroom_product_oyster_desc'),
      price: '€15 / kg',
      category: 'fresh',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      name: t('mushroom_product_lions_mane_name'),
      desc: t('mushroom_product_lions_mane_desc'),
      price: '€30 / kg',
      category: 'fresh',
    },
    {
      icon: <Sun className="w-6 h-6" />,
      name: t('mushroom_product_shiitake_name'),
      desc: t('mushroom_product_shiitake_desc'),
      price: '€30 / kg',
      category: 'fresh',
    },
    {
      icon: <Droplet className="w-6 h-6" />,
      name: t('mushroom_product_lions_tincture_name'),
      desc: t('mushroom_product_lions_tincture_desc'),
      price: '€25 / 30ml',
      category: 'tincture',
    },
    {
      icon: <FlaskConical className="w-6 h-6" />,
      name: t('mushroom_product_reishi_tincture_name'),
      desc: t('mushroom_product_reishi_tincture_desc'),
      price: '€25 / 30ml',
      category: 'tincture',
    },
    {
      icon: <Beaker className="w-6 h-6" />,
      name: t('mushroom_product_turkey_tail_name'),
      desc: t('mushroom_product_turkey_tail_desc'),
      price: '€25 / 30ml',
      category: 'tincture',
    },
  ];

  const curriculum = [
    {
      icon: <Microscope className="w-5 h-5" />,
      title: t('mushroom_curriculum_sterile_title'),
      desc: t('mushroom_curriculum_sterile_desc'),
    },
    {
      icon: <Sprout className="w-5 h-5" />,
      title: t('mushroom_curriculum_substrate_title'),
      desc: t('mushroom_curriculum_substrate_desc'),
    },
    {
      icon: <Container className="w-5 h-5" />,
      title: t('mushroom_curriculum_grow_room_title'),
      desc: t('mushroom_curriculum_grow_room_desc'),
    },
    {
      icon: <ThermometerSun className="w-5 h-5" />,
      title: t('mushroom_curriculum_climate_title'),
      desc: t('mushroom_curriculum_climate_desc'),
    },
    {
      icon: <Trees className="w-5 h-5" />,
      title: t('mushroom_curriculum_outdoor_title'),
      desc: t('mushroom_curriculum_outdoor_desc'),
    },
    {
      icon: <FlaskConical className="w-5 h-5" />,
      title: t('mushroom_curriculum_tincture_title'),
      desc: t('mushroom_curriculum_tincture_desc'),
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: t('mushroom_curriculum_economics_title'),
      desc: t('mushroom_curriculum_economics_desc'),
    },
    {
      icon: <Leaf className="w-5 h-5" />,
      title: t('mushroom_curriculum_regenerative_title'),
      desc: t('mushroom_curriculum_regenerative_desc'),
    },
  ];

  const team = [
    {
      name: t('mushroom_team_tonya_name'),
      role: t('mushroom_team_tonya_role'),
      bio: t('mushroom_team_tonya_bio'),
      icon: <Sprout className="w-8 h-8" />,
    },
    {
      name: t('mushroom_team_peter_name'),
      role: t('mushroom_team_peter_role'),
      bio: t('mushroom_team_peter_bio'),
      icon: <Leaf className="w-8 h-8" />,
    },
    {
      name: t('mushroom_team_richard_name'),
      role: t('mushroom_team_richard_role'),
      bio: t('mushroom_team_richard_bio'),
      icon: <Microscope className="w-8 h-8" />,
    },
  ];

  return (
    <>
      <Head>
        <title>{t('mushroom_page_title')}</title>
        <meta name="description" content={t('mushroom_page_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/mushroom-farm"
          key="canonical"
        />
      </Head>

      <main>
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Sprout className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  TDF Mushroom Farm
                </span>
              </div>

              <Heading
                className="mb-6 text-4xl md:text-5xl lg:text-6xl font-normal text-gray-900 tracking-tight leading-[1.1]"
                display
                level={1}
              >
                {t('mushroom_hero_title')}
              </Heading>

              <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl">
                {t('mushroom_hero_subtitle')}
              </p>

              <div className="flex flex-wrap gap-3 mb-12">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                  <CircleDot className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-gray-700">4 {t('mushroom_stat_species')}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-gray-700">3,000+ {t('mushroom_stat_capacity')}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                  <Mountain className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-gray-700">25ha {t('mushroom_stat_land')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <LinkButton
                  href="#products"
                  variant="primary"
                  className="bg-gray-900 text-white hover:bg-gray-800 border-gray-900"
                >
                  {t('mushroom_hero_cta_products')}
                </LinkButton>
                <Link
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-gray-700 font-medium hover:text-gray-900 transition-colors"
                >
                  {t('mushroom_course_cta_question')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  {t('mushroom_about_label')}
                </span>
                <Heading
                  level={2}
                  className="text-3xl md:text-4xl mt-3 mb-6"
                >
                  {t('mushroom_about_title')}
                </Heading>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {t('mushroom_about_desc_1')}
                </p>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {t('mushroom_about_desc_2')}
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent-alt/10 flex items-center justify-center flex-shrink-0">
                      <Wind className="w-5 h-5 text-accent-alt" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{t('mushroom_feature_ventilation_title')}</h4>
                      <p className="text-sm text-gray-600">{t('mushroom_feature_ventilation_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent-alt/10 flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-5 h-5 text-accent-alt" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{t('mushroom_feature_substrate_title')}</h4>
                      <p className="text-sm text-gray-600">{t('mushroom_feature_substrate_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent-alt/10 flex items-center justify-center flex-shrink-0">
                      <Trees className="w-5 h-5 text-accent-alt" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{t('mushroom_feature_waste_title')}</h4>
                      <p className="text-sm text-gray-600">{t('mushroom_feature_waste_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent-alt/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-accent-alt" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{t('mushroom_feature_production_title')}</h4>
                      <p className="text-sm text-gray-600">{t('mushroom_feature_production_desc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 flex items-center justify-center">
                      <Container className="w-16 h-16 text-accent/60" />
                    </div>
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-accent-alt/5 to-accent-alt/10 flex items-center justify-center">
                      <Sprout className="w-16 h-16 text-accent-alt/60" />
                    </div>
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-accent-alt/5 to-accent-alt/10 flex items-center justify-center">
                      <Microscope className="w-16 h-16 text-accent-alt/60" />
                    </div>
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 flex items-center justify-center">
                      <FlaskConical className="w-16 h-16 text-accent/60" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="products" className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                {t('mushroom_products_label')}
              </span>
              <Heading level={2} className="text-3xl md:text-4xl mt-3 mb-4">
                {t('mushroom_products_title')}
              </Heading>
              <p className="text-gray-600">
                {t('mushroom_products_subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="group p-6 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                      {product.icon}
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">{product.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      {product.price}
                    </span>
                    <Link
                      href="#contact"
                      className="text-sm font-medium text-accent hover:text-accent-dark transition-colors"
                    >
                      {t('mushroom_products_order')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="courses" className="py-20 px-6 bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  {t('mushroom_course_label')}
                </span>
                <Heading level={2} className="text-3xl md:text-4xl mt-3 mb-4 text-white">
                  {t('mushroom_course_title')}
                </Heading>
                <p className="text-gray-400 mb-8">
                  {t('mushroom_course_subtitle')}
                </p>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="px-3 py-1 bg-accent rounded-full text-xs font-semibold uppercase tracking-wide">
                      {t('mushroom_course_duration')}
                    </div>
                    <span className="text-gray-400 text-sm">
                      {t('mushroom_course_date_month')} {t('mushroom_course_date_days')}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {t('mushroom_course_name')}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    {t('mushroom_course_description')}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">{t('mushroom_course_detail_location_value')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">{t('mushroom_course_detail_group_value')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">{t('mushroom_course_detail_certificate_value')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Home className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">{t('mushroom_course_price_note')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <span className="text-3xl font-semibold">€599</span>
                    </div>
                    <LinkButton
                      href="/events"
                      variant="primary"
                      className="bg-white text-gray-900 hover:bg-gray-100 border-white"
                    >
                      {t('mushroom_course_cta_reserve')}
                    </LinkButton>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
                  {t('mushroom_curriculum_label')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {curriculum.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-3 text-accent">
                        {item.icon}
                      </div>
                      <h5 className="font-medium text-sm mb-1">{item.title}</h5>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="team" className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                {t('mushroom_team_label')}
              </span>
              <Heading level={2} className="text-3xl md:text-4xl mt-3 mb-4">
                {t('mushroom_team_title')}
              </Heading>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {team.map((member, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-accent-alt/10 flex items-center justify-center mb-4 text-accent">
                    {member.icon}
                  </div>
                  <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">
                    {member.role}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {member.name}
                  </h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="volunteer" className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                {t('mushroom_volunteer_label')}
              </span>
              <Heading level={2} className="text-3xl md:text-4xl mt-3 mb-4">
                {t('mushroom_volunteer_title')}
              </Heading>
              <p className="text-gray-600">
                {t('mushroom_volunteer_subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="w-12 h-12 rounded-xl bg-accent-alt/10 flex items-center justify-center mb-4">
                  <Leaf className="w-6 h-6 text-accent-alt" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {t('mushroom_volunteer_farm_title')}
                </h3>
                <p className="text-sm text-accent font-medium mb-3">
                  {t('mushroom_volunteer_farm_duration')}
                </p>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  {t('mushroom_volunteer_farm_desc')}
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-accent-alt flex-shrink-0" />
                    {t('mushroom_volunteer_farm_perk_1')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-accent-alt flex-shrink-0" />
                    {t('mushroom_volunteer_farm_perk_2')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-accent-alt flex-shrink-0" />
                    {t('mushroom_volunteer_farm_perk_3')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-accent-alt flex-shrink-0" />
                    {t('mushroom_volunteer_farm_perk_4')}
                  </li>
                </ul>
                <LinkButton
                  href="/volunteer"
                  variant="secondary"
                  className="w-full justify-center"
                >
                  {t('mushroom_volunteer_farm_cta')}
                </LinkButton>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-accent shadow-sm relative">
                <div className="absolute -top-3 left-6 bg-accent text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {t('mushroom_volunteer_apprentice_badge')}
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Microscope className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {t('mushroom_volunteer_apprentice_title')}
                </h3>
                <p className="text-sm text-accent font-medium mb-3">
                  {t('mushroom_volunteer_apprentice_duration')}
                </p>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  {t('mushroom_volunteer_apprentice_desc')}
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    {t('mushroom_volunteer_apprentice_perk_1')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    {t('mushroom_volunteer_apprentice_perk_2')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    {t('mushroom_volunteer_apprentice_perk_3')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    {t('mushroom_volunteer_apprentice_perk_4')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    {t('mushroom_volunteer_apprentice_perk_5')}
                  </li>
                </ul>
                <LinkButton
                  href="/volunteer"
                  variant="primary"
                  className="w-full justify-center"
                >
                  {t('mushroom_volunteer_apprentice_cta')}
                </LinkButton>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {t('mushroom_volunteer_paid_title')}
                </h3>
                <p className="text-sm text-accent font-medium mb-3">
                  {t('mushroom_volunteer_paid_duration')}
                </p>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  {t('mushroom_volunteer_paid_desc')}
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {t('mushroom_volunteer_paid_perk_1')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {t('mushroom_volunteer_paid_perk_2')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {t('mushroom_volunteer_paid_perk_3')}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {t('mushroom_volunteer_paid_perk_4')}
                  </li>
                </ul>
                <Link
                  href="#contact"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-200 text-gray-700 rounded-full font-medium hover:border-gray-300 transition-colors"
                >
                  {t('mushroom_volunteer_paid_cta')}
                </Link>
              </div>
            </div>

            <div className="mt-8 p-6 bg-white rounded-xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-600 text-center sm:text-left">
                {t('mushroom_volunteer_cta_text')}
              </p>
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 text-accent font-medium hover:gap-3 transition-all whitespace-nowrap"
              >
                {t('mushroom_volunteer_cta_link')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-accent">
          <div className="max-w-4xl mx-auto text-center">
            <Heading level={2} className="text-2xl md:text-3xl mb-4 text-white">
              {t('mushroom_community_title')}
            </Heading>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              {t('mushroom_community_subtitle')}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white text-sm">
                <MessageCircle className="w-4 h-4" />
                {t('mushroom_community_feature_1')}
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white text-sm">
                <BookOpen className="w-4 h-4" />
                {t('mushroom_community_feature_2')}
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white text-sm">
                <Calendar className="w-4 h-4" />
                {t('mushroom_community_feature_3')}
              </div>
            </div>

            <a
              href="https://t.me/+TDF-mushroom-farm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              {t('mushroom_community_cta')}
            </a>
          </div>
        </section>

        <section id="contact" className="py-20 px-6 bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <Heading level={2} className="text-3xl md:text-4xl mb-4 text-white">
                  {t('mushroom_contact_title')}
                </Heading>
                <p className="text-gray-400 mb-8">
                  {t('mushroom_contact_subtitle')}
                </p>

                <div className="space-y-4">
                  <a
                    href="mailto:mushrooms@traditionaldreamfactory.com"
                    className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-gray-300">mushrooms@traditionaldreamfactory.com</span>
                  </a>
                  <a
                    href="https://t.me/+TDF-mushroom-farm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-gray-300">@TDFMushroomFarm on Telegram</span>
                  </a>
                  <a
                    href="https://maps.google.com/?q=Abela,Santiago+do+Cacém,Portugal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-gray-300">Abela, Santiago do Cacém, Portugal</span>
                  </a>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="font-semibold text-lg mb-6">
                  {t('mushroom_contact_form_title')}
                </h3>
                <form
                  action="https://formspree.io/f/mushroom-form"
                  method="POST"
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t('mushroom_contact_form_name')}
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t('mushroom_contact_form_email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t('mushroom_contact_form_interest')}
                    </label>
                    <select
                      name="interest"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="fresh-mushrooms" className="bg-gray-900">
                        {t('mushroom_contact_interest_fresh')}
                      </option>
                      <option value="tinctures" className="bg-gray-900">
                        {t('mushroom_contact_interest_tinctures')}
                      </option>
                      <option value="course" className="bg-gray-900">
                        {t('mushroom_contact_interest_course')}
                      </option>
                      <option value="volunteer" className="bg-gray-900">
                        {t('mushroom_contact_interest_volunteer')}
                      </option>
                      <option value="wholesale" className="bg-gray-900">
                        {t('mushroom_contact_interest_wholesale')}
                      </option>
                      <option value="other" className="bg-gray-900">
                        {t('mushroom_contact_interest_other')}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t('mushroom_contact_form_message')}
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark transition-colors"
                  >
                    {t('mushroom_contact_form_submit')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

MushroomFarmPage.getInitialProps = async (context: NextPageContext) => {
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

export default MushroomFarmPage;
